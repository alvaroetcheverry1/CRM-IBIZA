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
      include: {
        alquilerLargaDuracion: {
          include: {
            propiedad: { select: { nombre: true } }
          }
        }
      }
    });

    if (req.body.estado === 'RETRASO') {
      const { createNotification } = require('../services/notificationService');
      createNotification(
        req.user.agenciaId || null,
        'IMPAGO',
        'Pago en Retraso',
        `Se ha detectado un retraso de pago en la propiedad "${pago.alquilerLargaDuracion?.propiedad?.nombre || 'Alquiler Larga Duración'}"`,
        '/facturacion'
      ).catch((err) => console.error('[Impago Notification Error]', err.message));
    }

    res.json(pago);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
