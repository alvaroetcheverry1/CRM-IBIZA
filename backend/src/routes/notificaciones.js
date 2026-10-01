const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// GET /api/notificaciones/stream — Conexión SSE para notificaciones en tiempo real
router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const token = req.query.token;
  let user = null;
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
        select: { id: true, rol: true, activo: true, agenciaId: true }
      });
    } catch (err) {
      console.error('[SSE Auth Error]', err.message);
    }
  }

  if (!user || !user.activo) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'No autorizado' })}\n\n`);
    res.end();
    return;
  }

  const { addClient, removeClient } = require('../services/notificationService');
  addClient(user.agenciaId || null, res);

  // Enviar un ping inicial para mantener viva la conexión
  res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);

  req.on('close', () => {
    removeClient(res);
  });
});

// GET /api/notificaciones — Obtener las últimas 20 notificaciones
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;

    // Ejecutar chequeo de contratos vencidos de forma asíncrona
    const { checkExpiringContractsAndLatePayments } = require('../services/notificationService');
    await checkExpiringContractsAndLatePayments(req.user.agenciaId || null);

    const notifs = await prisma.notificacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: 20
    });
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones', detail: error.message });
  }
});

// PUT /api/notificaciones/read-all — Marcar todas como leídas
// NOTA: Debe colocarse ANTES de la ruta con :id para evitar colisiones
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;

    await prisma.notificacion.updateMany({
      where: { ...where, leida: false },
      data: { leida: true }
    });
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar todas las notificaciones', detail: error.message });
  }
});

// PUT /api/notificaciones/:id/read — Marcar una notificación como leída
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    // Multi-tenant: solo marca si la notificación es de la agencia del usuario.
    const agenciaId = req.user.rol === 'SUPERADMIN' ? null : (req.user.agenciaId || null);
    const where = { id: req.params.id };
    if (agenciaId !== null) where.agenciaId = agenciaId;

    const result = await prisma.notificacion.updateMany({ where, data: { leida: true } });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada o sin acceso' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificación', detail: error.message });
  }
});

module.exports = router;
