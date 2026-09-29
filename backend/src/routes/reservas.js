const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// Reservas - GET /api/reservas
router.get('/', authenticate, async (req, res) => {
  try {
    const { propiedadId, propiedadesIds, desde, hasta } = req.query;
    
    let idsArray = [];
    if (propiedadesIds) {
      idsArray = propiedadesIds.split(',');
    } else if (propiedadId) {
      idsArray = [propiedadId];
    }

    // Filtros de fecha
    const parsedDesde = desde ? new Date(desde) : null;
    const parsedHasta = hasta ? new Date(hasta) : null;

    // 1. Reservas directas (prisma.reserva)
    const whereReserva = {};
    if (idsArray.length > 0) {
      whereReserva.alquilerVacacional = { propiedadId: { in: idsArray } };
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
        alquilerVacacional: true
      }
    });

    // 2. Reservas externas (prisma.reservaExterna)
    const whereExterna = {};
    if (idsArray.length > 0) {
      whereExterna.propiedadId = { in: idsArray };
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
      orderBy: { fechaInicio: 'asc' }
    });

    // 3. Combinar y mapear a formato uniforme
    const combinadas = [
      ...reservasDirectas.map(r => ({
        id: r.id,
        propiedadId: r.alquilerVacacional?.propiedadId,
        fechaEntrada: r.fechaEntrada,
        fechaSalida: r.fechaSalida,
        clienteNombre: r.clienteNombre,
        origen: r.origen || 'DIRECTO'
      })),
      ...reservasExternas.map(r => ({
        id: r.id,
        propiedadId: r.propiedadId,
        fechaEntrada: r.fechaInicio,
        fechaSalida: r.fechaFin,
        clienteNombre: r.titulo || 'Reserva Externa',
        origen: r.origen || 'ICAl'
      }))
    ];

    res.json({ data: combinadas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reservas
router.post('/', authenticate, async (req, res) => {
  try {
    const reserva = await prisma.reserva.create({ data: req.body });
    res.status(201).json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reservas/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const reserva = await prisma.reserva.update({ where: { id: req.params.id }, data: req.body });
    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reservas/:id
router.delete('/:id', authenticate, async (req, res) => {
  await prisma.reserva.delete({ where: { id: req.params.id } });
  res.json({ message: 'Reserva eliminada' });
});

module.exports = router;
