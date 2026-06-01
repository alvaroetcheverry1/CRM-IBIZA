const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

const TIPOS_VALIDOS = ['LLAMADA', 'EMAIL', 'VISITA', 'NOTA', 'TAREA', 'OFERTA'];

// ─── GET /api/actividades ─────────────────────────────────────
// ?propiedadId=X &clienteId=Y &limit=N
router.get('/', authenticate, async (req, res) => {
  const { propiedadId, clienteId, limit = 30 } = req.query;

  const where = {};
  if (propiedadId) where.propiedadId = propiedadId;
  if (clienteId)   where.clienteId   = clienteId;

  try {
    const actividades = await prisma.actividad.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: Number(limit),
      include: {
        usuario: { select: { id: true, nombre: true, apellidos: true, avatar: true } },
      },
    });
    res.json({ data: actividades });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener actividades', detail: err.message });
  }
});

// ─── POST /api/actividades ────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { tipo, descripcion, propiedadId, clienteId, fecha } = req.body;

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido', validos: TIPOS_VALIDOS });
  }
  if (!descripcion?.trim()) {
    return res.status(400).json({ error: 'Descripción obligatoria' });
  }

  try {
    const actividad = await prisma.actividad.create({
      data: {
        tipo,
        descripcion: descripcion.trim(),
        fecha:       fecha ? new Date(fecha) : new Date(),
        propiedadId: propiedadId || null,
        clienteId:   clienteId   || null,
        usuarioId:   req.user.id,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellidos: true, avatar: true } },
      },
    });
    res.status(201).json(actividad);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear actividad', detail: err.message });
  }
});

// ─── DELETE /api/actividades/:id ──────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const actividad = await prisma.actividad.findUnique({ where: { id: req.params.id } });
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });

    // Solo el autor o un admin puede borrar
    if (actividad.usuarioId !== req.user.id && !['DIRECTOR', 'SUPERADMIN'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permiso para eliminar esta actividad' });
    }

    await prisma.actividad.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar actividad', detail: err.message });
  }
});

module.exports = router;
