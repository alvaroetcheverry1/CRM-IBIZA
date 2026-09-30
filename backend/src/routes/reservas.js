const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

/**
 * Devuelve la agenciaId del usuario, o null si es SUPERADMIN (acceso global).
 * Multi-tenant: toda consulta de reservas debe acotarse a la agencia del usuario.
 * Las reservas no tienen agenciaId directa; se filtra a través de la propiedad.
 */
function scopeAgencia(req) {
  if (req.user?.rol === 'SUPERADMIN') return null; // SUPERADMIN ve todas las agencias
  return req.user?.agenciaId || null;
}

/**
 * Verifica que una propiedad pertenece a la agencia indicada (o que el usuario es
 * SUPERADMIN). Devuelve true si el acceso está permitido.
 */
async function propiedadEnAgencia(propiedadId, agenciaId) {
  if (!propiedadId) return false;
  const propiedad = await prisma.propiedad.findUnique({
    where: { id: propiedadId },
    select: { agenciaId: true },
  });
  if (!propiedad) return false;
  if (agenciaId === null) return true; // SUPERADMIN
  return propiedad.agenciaId === agenciaId;
}

// ─── GET /api/reservas ───────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { propiedadId, propiedadesIds, desde, hasta } = req.query;
    const agenciaId = scopeAgencia(req);

    let idsArray = [];
    if (propiedadesIds) {
      idsArray = propiedadesIds.split(',');
    } else if (propiedadId) {
      idsArray = [propiedadId];
    }

    // Filtros de fecha
    const parsedDesde = desde ? new Date(desde) : null;
    const parsedHasta = hasta ? new Date(hasta) : null;

    // ─── 1. Reservas directas (prisma.reserva) ───
    // Se acotan a la agencia a través de: reserva → alquilerVacacional → propiedad.agenciaId
    const whereReserva = {};
    const propiedadFiltro = {};
    if (idsArray.length > 0) {
      propiedadFiltro.propiedadId = { in: idsArray };
    }
    if (agenciaId !== null) {
      propiedadFiltro.propiedad = { agenciaId };
    }
    if (Object.keys(propiedadFiltro).length > 0) {
      whereReserva.alquilerVacacional = propiedadFiltro;
    }
    if (parsedDesde || parsedHasta) {
      // Overlap checking: reserva.fechaEntrada <= hasta AND reserva.fechaSalida >= desde
      whereReserva.AND = [];
      if (parsedDesde) {
        whereReserva.AND.push({ fechaSalida: { gte: parsedDesde } });
      }
      if (parsedHasta) {
        whereReserva.AND.push({ fechaEntrada: { lte: parsedHasta } });
      }
    }

    const reservasDirectas = await prisma.reserva.findMany({
      where: whereReserva,
      orderBy: { fechaEntrada: 'asc' },
      include: {
        alquilerVacacional: true,
      },
    });

    // ─── 2. Reservas externas (prisma.reservaExterna) ───
    // Se acotan a la agencia a través de: reservaExterna → propiedad.agenciaId
    const whereExterna = {};
    if (idsArray.length > 0) {
      whereExterna.propiedadId = { in: idsArray };
    }
    if (agenciaId !== null) {
      whereExterna.propiedad = { agenciaId };
    }
    if (parsedDesde || parsedHasta) {
      // Overlap checking: externa.fechaInicio <= hasta AND externa.fechaFin >= desde
      whereExterna.AND = [];
      if (parsedDesde) {
        whereExterna.AND.push({ fechaFin: { gte: parsedDesde } });
      }
      if (parsedHasta) {
        whereExterna.AND.push({ fechaInicio: { lte: parsedHasta } });
      }
    }

    const reservasExternas = await prisma.reservaExterna.findMany({
      where: whereExterna,
      orderBy: { fechaInicio: 'asc' },
    });

    // ─── 3. Combinar y mapear a formato uniforme ───
    const combinadas = [
      ...reservasDirectas.map((r) => ({
        id: r.id,
        propiedadId: r.alquilerVacacional?.propiedadId,
        fechaEntrada: r.fechaEntrada,
        fechaSalida: r.fechaSalida,
        clienteNombre: r.clienteNombre,
        origen: r.origen || 'DIRECTO',
      })),
      ...reservasExternas.map((r) => ({
        id: r.id,
        propiedadId: r.propiedadId,
        fechaEntrada: r.fechaInicio,
        fechaSalida: r.fechaFin,
        clienteNombre: r.titulo || 'Reserva Externa',
        origen: r.origen || 'ICAL',
      })),
    ];

    res.json({ data: combinadas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/reservas ──────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const agenciaId = scopeAgencia(req);
    const { alquilerVacacionalId } = req.body;

    if (!alquilerVacacionalId) {
      return res.status(400).json({ error: 'alquilerVacacionalId es requerido' });
    }

    // Validar que el alquiler vacacional (y su propiedad) pertenece a la agencia
    const alquiler = await prisma.alquilerVacacional.findUnique({
      where: { id: alquilerVacacionalId },
      select: { propiedadId: true },
    });
    if (!alquiler) {
      return res.status(404).json({ error: 'Alquiler vacacional no encontrado' });
    }
    if (!(await propiedadEnAgencia(alquiler.propiedadId, agenciaId))) {
      return res.status(403).json({ error: 'No tienes acceso a esta propiedad' });
    }

    const reserva = await prisma.reserva.create({ data: req.body });
    res.status(201).json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/reservas/:id ───────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const agenciaId = scopeAgencia(req);

    // Verificar que la reserva existe y pertenece a la agencia del usuario
    const existente = await prisma.reserva.findUnique({
      where: { id: req.params.id },
      select: { alquilerVacacional: { select: { propiedadId: true } } },
    });
    if (!existente) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    if (!(await propiedadEnAgencia(existente.alquilerVacacional?.propiedadId, agenciaId))) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva' });
    }

    const reserva = await prisma.reserva.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reservas/:id ────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const agenciaId = scopeAgencia(req);

    const existente = await prisma.reserva.findUnique({
      where: { id: req.params.id },
      select: { alquilerVacacional: { select: { propiedadId: true } } },
    });
    if (!existente) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    if (!(await propiedadEnAgencia(existente.alquilerVacacional?.propiedadId, agenciaId))) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva' });
    }

    await prisma.reserva.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reserva eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
