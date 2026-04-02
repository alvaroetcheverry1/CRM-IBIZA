const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// GET /api/pagos
router.get('/', authenticate, async (req, res) => {
  const { estado, propiedadId } = req.query;
  const where = {};
  if (estado) where.estado = estado;
  if (propiedadId) {
    where.alquilerLargaDuracion = { propiedadId };
  }

  const pagos = await prisma.pagoRenta.findMany({
    where,
    orderBy: { mes: 'desc' },
    include: {
      alquilerLargaDuracion: {
        include: { propiedad: { select: { nombre: true, referencia: true } } },
      },
    },
  });
  res.json({ data: pagos });
});

// PUT /api/pagos/:id — marcar como cobrado/pendiente/retraso
router.put('/:id', authenticate, async (req, res) => {
  try {
    const pago = await prisma.pagoRenta.update({
      where: { id: req.params.id },
      data: {
        estado: req.body.estado,
        fechaCobro: req.body.estado === 'COBRADO' ? new Date() : null,
        notas: req.body.notas,
      },
    });
    res.json(pago);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
