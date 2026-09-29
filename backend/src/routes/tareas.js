const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// GET /api/tareas — Obtener todas las tareas de la agencia
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;
    
    // Filtrar opcionalmente por estado completada
    if (req.query.completada !== undefined) {
      where.completada = req.query.completada === 'true';
    }

    const tareas = await prisma.tarea.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        cliente: { select: { id: true, nombre: true, apellidos: true } },
        propiedad: { select: { id: true, nombre: true, referencia: true } },
        usuario: { select: { id: true, nombre: true } }
      }
    });

    res.json(tareas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tareas', detail: error.message });
  }
});

// POST /api/tareas — Crear una nueva tarea
router.post('/', authenticate, async (req, res) => {
  try {
    const { titulo, descripcion, fechaVencimiento, tipo, prioridad, clienteId, propiedadId } = req.body;
    if (!titulo || !fechaVencimiento) {
      return res.status(400).json({ error: 'El título y la fecha de vencimiento son obligatorios.' });
    }

    const nuevaTarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        fechaVencimiento: new Date(fechaVencimiento),
        tipo: tipo || 'VISITA',
        prioridad: prioridad || 'MEDIA',
        completada: false,
        agenciaId: req.user.agenciaId || null,
        clienteId: clienteId || null,
        propiedadId: propiedadId || null,
        usuarioId: req.user.id
      },
      include: {
        cliente: { select: { id: true, nombre: true, apellidos: true } },
        propiedad: { select: { id: true, nombre: true, referencia: true } },
        usuario: { select: { id: true, nombre: true } }
      }
    });

    res.status(201).json(nuevaTarea);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarea', detail: error.message });
  }
});

// PUT /api/tareas/:id — Actualizar una tarea (marcar completada o cambiar datos)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { titulo, descripcion, fechaVencimiento, tipo, prioridad, completada } = req.body;

    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (fechaVencimiento !== undefined) data.fechaVencimiento = new Date(fechaVencimiento);
    if (tipo !== undefined) data.tipo = tipo;
    if (prioridad !== undefined) data.prioridad = prioridad;
    if (completada !== undefined) data.completada = completada;

    const tareaActualizada = await prisma.tarea.update({
      where: { id: req.params.id },
      data,
      include: {
        cliente: { select: { id: true, nombre: true, apellidos: true } },
        propiedad: { select: { id: true, nombre: true, referencia: true } },
        usuario: { select: { id: true, nombre: true } }
      }
    });

    res.json(tareaActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarea', detail: error.message });
  }
});

// DELETE /api/tareas/:id — Eliminar una tarea
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.tarea.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Tarea eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea', detail: error.message });
  }
});

module.exports = router;
