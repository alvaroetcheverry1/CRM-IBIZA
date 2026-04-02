const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// Reservas - GET /api/reservas
router.get('/', authenticate, async (req, res) => {
  const { propiedadId, desde, hasta } = req.query;
  const where = {};
  if (propiedadId) {
    where.alquilerVacacional = { propiedadId };
  }
  if (desde || hasta) {
    where.fechaEntrada = {};
    if (desde) where.fechaEntrada.gte = new Date(desde);
    if (hasta) where.fechaEntrada.lte = new Date(hasta);
  }

  const reservas = await prisma.reserva.findMany({
    where,
    orderBy: { fechaEntrada: 'asc' },
    include: {
      alquilerVacacional: {
        include: { propiedad: { select: { nombre: true, referencia: true, fotoPrincipal: true } } },
      },
    },
  });
  res.json({ data: reservas });
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
