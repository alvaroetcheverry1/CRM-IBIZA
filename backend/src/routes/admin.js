/**
 * admin.js — Panel de superadministrador
 * Base: /api/admin
 * Acceso exclusivo para rol SUPERADMIN
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

// Todas las rutas requieren SUPERADMIN
router.use(authenticate, requireRole('SUPERADMIN'));

// ─── POST /api/admin/agencias ────────────────────────────────────────────────
// Crea una nueva agencia y su usuario director
router.post('/agencias', async (req, res) => {
  try {
    const { nombre, email, telefono, plan, password, crearDirector } = req.body;
    
    // Verificar que el email de la agencia no exista
    const existente = await prisma.agencia.findUnique({ where: { email } });
    if (existente) return res.status(400).json({ error: 'Ya existe una agencia con ese email' });

    // 1. Crear Agencia
    const agencia = await prisma.agencia.create({
      data: {
        nombre,
        email,
        telefono,
        plan: plan || 'STARTER',
        estado: 'ACTIVA',
        activadaEn: new Date(),
      }
    });

    // 2. Opcional: Crear usuario Director
    let usuario = null;
    if (crearDirector && password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      usuario = await prisma.usuario.create({
        data: {
          email,
          nombre: 'Director ' + nombre,
          passwordHash,
          rol: 'DIRECTOR',
          agenciaId: agencia.id,
          activo: true
        }
      });
    }

    res.status(201).json({ ok: true, agencia, usuario });
  } catch (err) {
    logger.error('Error creando agencia manual:', err);
    res.status(500).json({ error: 'Error interno', detail: err.message });
  }
});

// ─── GET /api/admin/agencias ─────────────────────────────────────────────────
// Lista todas las agencias con métricas de uso
router.get('/agencias', async (req, res) => {
  try {
    const agencias = await prisma.agencia.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        _count: {
          select: { 
            usuarios: { where: { activo: true } }, 
            propiedades: { where: { activo: true } }, 
            clientes: { where: { activo: true } } 
          },
        },
      },
    });

    res.json({ data: agencias });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener agencias', detail: err.message });
  }
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
// Estadísticas globales para el superadmin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalAgencias,
      agenciasActivas,
      agenciasPendientes,
      totalPropiedades,
      totalClientes,
      agenciasPorPlan,
    ] = await Promise.all([
      prisma.agencia.count(),
      prisma.agencia.count({ where: { estado: 'ACTIVA' } }),
      prisma.agencia.count({ where: { estado: 'PENDIENTE' } }),
      prisma.propiedad.count({ where: { activo: true } }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.agencia.groupBy({ by: ['plan'], _count: { plan: true } }),
    ]);

    res.json({
      agencias: { total: totalAgencias, activas: agenciasActivas, pendientes: agenciasPendientes },
      propiedades: totalPropiedades,
      clientes: totalClientes,
      distribucionPlan: agenciasPorPlan,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas', detail: err.message });
  }
});

// ─── PUT /api/admin/agencias/:id/activar ─────────────────────────────────────
// Activa una agencia pendiente de activación manual
router.put('/agencias/:id/activar', async (req, res) => {
  try {
    const { plan } = req.body;
    const agencia = await prisma.agencia.update({
      where: { id: req.params.id },
      data: {
        estado: 'ACTIVA',
        activadaEn: new Date(),
        plan: plan || 'STARTER',
      },
    });
    logger.info(`Agencia activada: ${agencia.nombre} (${agencia.id}) por SUPERADMIN ${req.user.id}`);
    res.json({ ok: true, agencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al activar la agencia', detail: err.message });
  }
});

// ─── PUT /api/admin/agencias/:id/suspender ───────────────────────────────────
router.put('/agencias/:id/suspender', async (req, res) => {
  try {
    const { motivo } = req.body;
    const agencia = await prisma.agencia.update({
      where: { id: req.params.id },
      data: { estado: 'SUSPENDIDA', notas: motivo || null },
    });
    logger.info(`Agencia suspendida: ${agencia.nombre}`);
    res.json({ ok: true, agencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al suspender la agencia', detail: err.message });
  }
});

// ─── PUT /api/admin/agencias/:id/plan ────────────────────────────────────────
router.put('/agencias/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['TRIAL', 'STARTER', 'PRO', 'ELITE'].includes(plan)) {
      return res.status(400).json({ error: 'Plan no válido' });
    }
    const agencia = await prisma.agencia.update({
      where: { id: req.params.id },
      data: { plan },
    });
    res.json({ ok: true, agencia });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar el plan', detail: err.message });
  }
});

// ─── GET /api/admin/agencias/:id ─────────────────────────────────────────────
router.get('/agencias/:id', async (req, res) => {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: req.params.id },
      include: {
        usuarios: { select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAcceso: true } },
        _count: { 
          select: { 
            propiedades: { where: { activo: true } }, 
            clientes: { where: { activo: true } }, 
            propietarios: { where: { activo: true } } 
          } 
        },
      },
    });
    if (!agencia) return res.status(404).json({ error: 'Agencia no encontrada' });
    res.json(agencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la agencia', detail: err.message });
  }
});

// ─── DELETE /api/admin/agencias/:id ──────────────────────────────────────────
router.delete('/agencias/:id', async (req, res) => {
  try {
    await prisma.agencia.delete({ where: { id: req.params.id } });
    logger.warn(`Agencia eliminada: ${req.params.id} por SUPERADMIN ${req.user.id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la agencia', detail: err.message });
  }
});

module.exports = router;
