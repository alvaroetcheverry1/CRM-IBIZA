const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

function calcularScoreIA(cliente, properties = []) {
  let score = 0;

  // 1. Budget vs Properties (up to 40 points)
  if (cliente.presupuesto) {
    const presupuestoVal = Number(cliente.presupuesto);
    let matched = false;
    
    if (cliente.tipo === 'COMPRADOR' || cliente.tipo === 'AMBOS') {
      const hasVentaMatch = properties.some(p => {
        if (p.tipo === 'VENTA' && p.venta?.precioVenta) {
          const pVenta = Number(p.venta.precioVenta);
          return pVenta <= presupuestoVal * 1.15;
        }
        return false;
      });
      if (hasVentaMatch) matched = true;
    }
    
    if (!matched && (cliente.tipo === 'INQUILINO' || cliente.tipo === 'AMBOS')) {
      const hasAlquilerMatch = properties.some(p => {
        if (p.tipo === 'LARGA_DURACION' && p.alquilerLargaDuracion?.rentaMensual) {
          return Number(p.alquilerLargaDuracion.rentaMensual) <= presupuestoVal * 1.15;
        }
        if (p.tipo === 'VACACIONAL' && p.alquilerVacacional?.precioTemporadaAlta) {
          return Number(p.alquilerVacacional.precioTemporadaAlta) <= presupuestoVal * 1.15;
        }
        return false;
      });
      if (hasAlquilerMatch) matched = true;
    }

    if (matched) {
      score += 40;
    } else {
      score += 20;
    }
  }

  // 2. Origin (up to 30 points)
  const origenPoints = {
    REFERIDO: 30,
    WHATSAPP: 30,
    LLAMADA: 25,
    WEB: 25,
    EMAIL: 20,
    PORTAL: 20,
    REDES_SOCIALES: 15,
    OTRO: 10
  };
  score += origenPoints[cliente.origen] || 10;

  // 3. Completeness (up to 30 points)
  const notasLength = cliente.notas ? cliente.notas.trim().length : 0;
  if (notasLength > 100) score += 15;
  else if (notasLength > 20) score += 10;
  else if (notasLength > 0) score += 5;

  if (cliente.email && cliente.telefono) {
    score += 15;
  } else if (cliente.email || cliente.telefono) {
    score += 8;
  }

  return Math.min(100, Math.max(0, score));
}

// GET /api/clientes
router.get('/', authenticate, async (req, res) => {
  const { search, estado, tipo, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { activo: true };

  // ─── Multi-tenant: solo clientes de esta agencia ─────────────────
  if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { apellidos: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search } },
    ];
  }
  if (estado) where.estado = estado;
  if (tipo) where.tipo = tipo;

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where, skip, take: Number(limit), orderBy: { creadoEn: 'desc' },
      include: { _count: { select: { actividades: true } } },
    }),
    prisma.cliente.count({ where }),
  ]);

  res.json({ data: clientes, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
});

// GET /api/clientes/:id
router.get('/:id', authenticate, async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;

  const cliente = await prisma.cliente.findFirst({
    where,
    include: {
      actividades: { orderBy: { fecha: 'desc' } },
      documentos: { orderBy: { creadoEn: 'desc' } },
    },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
});

// POST /api/clientes
router.post('/', authenticate, [
  body('nombre').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const properties = await prisma.propiedad.findMany({
      where: { activo: true, agenciaId: req.user.agenciaId || null },
      include: { venta: true, alquilerVacacional: true, alquilerLargaDuracion: true }
    });
    const scoreIA = calcularScoreIA(req.body, properties);

    const cliente = await prisma.cliente.create({
      data: {
        ...req.body,
        scoreIA,
        fechaPrimerContacto: req.body.fechaPrimerContacto ? new Date(req.body.fechaPrimerContacto) : new Date(),
        agenciaId: req.user.agenciaId || null,
      }
    });
    const { sheetsService } = require('../services/sheetsService');
    sheetsService.sincronizarCliente(cliente).catch(() => {});

    // Crear notificación persistente
    const { createNotification } = require('../services/notificationService');
    createNotification(
      req.user.agenciaId || null,
      'NUEVO_LEAD',
      'Nuevo Lead Captado',
      `Se ha registrado el lead "${cliente.nombre} ${cliente.apellidos || ''}"`,
      '/clientes'
    ).catch(() => {});

    // Enviar correo de bienvenida al lead recién registrado
    if (cliente.email) {
      const { emailService } = require('../services/emailService');
      emailService.sendWelcomeEmail(cliente.email, cliente.nombre, cliente).catch((e) => {
        console.error('[WelcomeEmail] Error sending email:', e.message);
      });
    }

    res.status(201).json(cliente);
  } catch (err) {
    console.error('Error creando lead:', err);
    res.status(500).json({ error: err.message || 'Error desconocido' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;
    
    const clienteExistente = await prisma.cliente.findFirst({ where });
    if (!clienteExistente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const properties = await prisma.propiedad.findMany({
      where: { activo: true, agenciaId: req.user.agenciaId || null },
      include: { venta: true, alquilerVacacional: true, alquilerLargaDuracion: true }
    });

    const datosMezclados = { ...clienteExistente, ...req.body };
    const scoreIA = calcularScoreIA(datosMezclados, properties);

    const updateData = { ...req.body };
    if (updateData.fechaPrimerContacto) {
      updateData.fechaPrimerContacto = new Date(updateData.fechaPrimerContacto);
    }

    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        scoreIA
      },
    });
    const { sheetsService } = require('../services/sheetsService');
    sheetsService.sincronizarCliente(cliente).catch(() => {});
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clientes/:id/actividades
router.post('/:id/actividades', authenticate, [
  body('tipo').isIn(['LLAMADA', 'EMAIL', 'VISITA', 'NOTA', 'TAREA']),
  body('descripcion').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const actividad = await prisma.actividad.create({
    data: {
      ...req.body,
      clienteId: req.params.id,
      usuarioId: req.user.id,
      agenciaId: req.user.agenciaId || null,
    },
  });
  res.status(201).json(actividad);
});

// DELETE /api/clientes/:id
router.delete('/:id', authenticate, async (req, res) => {
  await prisma.cliente.update({ where: { id: req.params.id }, data: { activo: false } });
  res.json({ message: 'Cliente eliminado' });
});

module.exports = router;
