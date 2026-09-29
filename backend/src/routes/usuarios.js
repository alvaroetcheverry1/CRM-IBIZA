const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// Middleware para validar roles
const isDirectorOrAdmin = requireRole('DIRECTOR', 'SUPERADMIN');

// ─── GET /api/usuarios ───────────────────────────────────────────────────────
// Lista todos los usuarios de la agencia (solo DIRECTOR o SUPERADMIN)
router.get('/', authenticate, isDirectorOrAdmin, async (req, res) => {
  try {
    const where = {};
    // Si no es SUPERADMIN global, solo ve los de su agencia
    if (req.user.rol !== 'SUPERADMIN' || req.user.agenciaId) {
      where.agenciaId = req.user.agenciaId;
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
        activo: true,
        ultimoAcceso: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.json({ data: usuarios });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error del servidor al obtener usuarios' });
  }
});

// ─── POST /api/usuarios ──────────────────────────────────────────────────────
// Invitar a un nuevo usuario (Agente/Director) a la agencia
router.post('/', authenticate, isDirectorOrAdmin, [
  body('email').isEmail().withMessage('Email no válido'),
  body('nombre').trim().notEmpty().withMessage('Nombre obligatorio'),
  body('rol').isIn(['AGENTE', 'DIRECTOR']).withMessage('Rol no válido'),
  body('password').isLength({ min: 8 }).withMessage('Contraseña mínima de 8 caracteres'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, nombre, apellidos, rol, password } = req.body;

  try {
    // 1. Verificar si el email ya existe en todo el sistema
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado en el sistema' });
    }

    // 2. Hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        nombre,
        apellidos: apellidos || '',
        rol,
        passwordHash,
        agenciaId: req.user.agenciaId,
        activo: true,
      },
      select: { id: true, nombre: true, apellidos: true, email: true, rol: true, activo: true }
    });

    // Enviar email de bienvenida e invitación con credenciales
    try {
      const { emailService } = require('../services/emailService');
      await emailService.sendUserInviteEmail(email, nombre, password, req.user.agencia?.nombre || 'la agencia');
    } catch (emailErr) {
      console.error('Error enviando email de invitación (el usuario se creó de todos modos):', emailErr);
    }

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    console.error('Error al invitar usuario:', err);
    res.status(500).json({ error: 'Error del servidor al invitar usuario' });
  }
});

// ─── PUT /api/usuarios/:id ───────────────────────────────────────────────────
// Actualizar rol o datos básicos
router.put('/:id', authenticate, isDirectorOrAdmin, async (req, res) => {
  try {
    const { rol, activo, nombre, apellidos } = req.body;
    
    // Verificar que el usuario pertenece a la misma agencia
    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    if (req.user.rol !== 'SUPERADMIN' && usuario.agenciaId !== req.user.agenciaId) {
      return res.status(403).json({ error: 'No tienes permiso para editar a este usuario' });
    }

    // No permitir cambiar el rol a SUPERADMIN si no lo eres
    if (rol === 'SUPERADMIN' && req.user.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'No puedes asignar el rol SUPERADMIN' });
    }

    const dataToUpdate = {};
    if (rol) dataToUpdate.rol = rol;
    if (activo !== undefined) dataToUpdate.activo = activo;
    if (nombre) dataToUpdate.nombre = nombre;
    if (apellidos !== undefined) dataToUpdate.apellidos = apellidos;

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: { id: true, nombre: true, apellidos: true, email: true, rol: true, activo: true }
    });

    res.json(usuarioActualizado);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error del servidor al actualizar usuario' });
  }
});

// ─── DELETE /api/usuarios/:id ────────────────────────────────────────────────
// Soft-delete (suspender usuario)
router.delete('/:id', authenticate, isDirectorOrAdmin, async (req, res) => {
  try {
    // Evitar suicidio (suspenderse a sí mismo)
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes suspenderte a ti mismo' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    if (req.user.rol !== 'SUPERADMIN' && usuario.agenciaId !== req.user.agenciaId) {
      return res.status(403).json({ error: 'No tienes permiso para suspender a este usuario' });
    }

    await prisma.usuario.update({
      where: { id: req.params.id },
      data: { activo: false },
    });

    res.json({ ok: true, message: 'Usuario suspendido correctamente' });
  } catch (err) {
    console.error('Error al suspender usuario:', err);
    res.status(500).json({ error: 'Error del servidor al suspender usuario' });
  }
});

module.exports = router;
