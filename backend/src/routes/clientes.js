const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// GET /api/clientes
router.get('/', authenticate, async (req, res) => {
  const { search, estado, tipo, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { activo: true };

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

  res.json({ data: clientes, meta: { total, page: Number(page), limit: Number(limit) } });
});

// GET /api/clientes/:id
router.get('/:id', authenticate, async (req, res) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: req.params.id },
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
    const cliente = await prisma.cliente.create({ data: req.body });
    res.status(201).json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clientes/:id — también para cambiar estado del pipeline
router.put('/:id', authenticate, async (req, res) => {
  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: req.body,
    });
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
