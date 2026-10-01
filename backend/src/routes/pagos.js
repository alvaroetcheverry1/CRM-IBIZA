const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// Alcance de agencia: null para SUPERADMIN (ve todo).
function agenciaScope(req) {
  return req.user?.rol === 'SUPERADMIN' ? null : (req.user?.agenciaId || null);
}

// GET /api/pagos
router.get('/', authenticate, async (req, res) => {
  const { estado, propiedadId } = req.query;
  const agenciaId = agenciaScope(req);
  const where = {};
  if (estado) where.estado = estado;

  // Multi-tenant: PagoRenta no tiene agenciaId; se filtra por la propiedad.
  const propFiltro = {};
  if (propiedadId) propFiltro.propiedadId = propiedadId;
  if (agenciaId !== null) propFiltro.propiedad = { agenciaId };
  if (Object.keys(propFiltro).length > 0) {
    where.alquilerLargaDuracion = propFiltro;
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
    const agenciaId = agenciaScope(req);

    // Validar que el pago pertenece a la agencia del usuario (vía propiedad).
    const existente = await prisma.pagoRenta.findUnique({
      where: { id: req.params.id },
      select: { alquilerLargaDuracion: { select: { propiedad: { select: { agenciaId: true } } } } },
    });
    if (!existente) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    if (agenciaId !== null && existente.alquilerLargaDuracion?.propiedad?.agenciaId !== agenciaId) {
      return res.status(403).json({ error: 'No tienes acceso a este pago' });
    }

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
