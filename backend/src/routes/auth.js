/**
 * auth.js — Rutas de autenticación
 * 
 * Soporta:
 *  - Login con Google OAuth
 *  - Login con email + contraseña
 *  - Registro de nueva agencia con email + contraseña
 *  - Refresh token
 *  - Dev login (solo desarrollo)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Generar tokens JWT ──────────────────────────────────────────────────────
const generateTokens = (userId) => {
  // Access token de vida corta (1h); el frontend lo renueva con el refresh token
  // de forma transparente, así que el usuario no percibe deslogueos.
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

const usuarioPublico = (u) => ({
  id: u.id,
  email: u.email,
  nombre: u.nombre,
  apellidos: u.apellidos,
  avatar: u.avatar,
  rol: u.rol,
  agenciaId: u.agenciaId,
});

// ─── POST /api/auth/google ───────────────────────────────────────────────────
// Login con token de Google. SOLO se permite el acceso a usuarios que YA existen
// y pertenecen a una agencia. NO se crean usuarios sueltos sin agencia (evita
// cuentas huérfanas fuera del modelo multi-tenant). Para entrar, el usuario debe
// haber registrado su agencia o haber sido invitado por su director.
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Credencial de Google requerida' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, picture } = ticket.getPayload();

    // Buscar por googleId o, si es la primera vez con Google, por email existente.
    let usuario = await prisma.usuario.findUnique({ where: { googleId } });
    if (!usuario) {
      const porEmail = await prisma.usuario.findUnique({ where: { email } });
      if (!porEmail) {
        // Usuario no registrado: no creamos cuenta huérfana.
        return res.status(403).json({
          error: 'Este correo no está dado de alta. Registra tu agencia o pide a tu director que te invite.',
          code: 'NO_ACCOUNT',
        });
      }
      // Vincular el googleId a la cuenta existente.
      usuario = await prisma.usuario.update({
        where: { id: porEmail.id },
        data: { googleId, avatar: picture },
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacta con el administrador.' });
    }

    // Verificar estado de la agencia (igual que en el login por email).
    if (usuario.agenciaId && usuario.rol !== 'SUPERADMIN') {
      const agencia = await prisma.agencia.findUnique({
        where: { id: usuario.agenciaId },
        select: { estado: true },
      });
      if (agencia?.estado === 'PENDIENTE') {
        return res.status(403).json({ error: 'Tu cuenta está pendiente de activación.', code: 'PENDING_ACTIVATION' });
      }
      if (agencia?.estado === 'SUSPENDIDA') {
        return res.status(403).json({ error: 'Cuenta suspendida. Contacta con soporte.' });
      }
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } });

    const tokens = generateTokens(usuario.id);
    logger.info(`Login Google: ${email}`);
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, usuario: usuarioPublico(usuario) });
  } catch (err) {
    logger.error('Error en auth Google:', err.message);
    res.status(401).json({ error: 'Token de Google inválido' });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Registro de NUEVA AGENCIA con email + contraseña
// Crea la Agencia + un Usuario DIRECTOR para esa agencia
router.post('/register', async (req, res) => {
  const { nombreAgencia, email, password, nombre, apellidos, telefono } = req.body;

  if (!nombreAgencia || !email || !password || !nombre) {
    return res.status(400).json({ error: 'Campos requeridos: nombreAgencia, email, password, nombre' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    // Verificar que el email no esté ya registrado
    const emailExiste = await prisma.usuario.findUnique({ where: { email } });
    if (emailExiste) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const agenciaExiste = await prisma.agencia.findUnique({ where: { email } });
    if (agenciaExiste) {
      return res.status(409).json({ error: 'Esta agencia ya está registrada' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Crear Agencia + Usuario DIRECTOR en una transacción
    const { agencia, usuario } = await prisma.$transaction(async (tx) => {
      const agencia = await tx.agencia.create({
        data: {
          nombre: nombreAgencia,
          email,
          passwordHash,
          telefono: telefono || null,
          estado: 'PENDIENTE', // Requiere activación manual del superadmin
          plan: 'TRIAL',
        },
      });

      // Crear ConfiguracionAgencia vacía
      await tx.configuracionAgencia.create({
        data: { agenciaId: agencia.id, nombreComercial: nombreAgencia },
      });

      const usuario = await tx.usuario.create({
        data: {
          email,
          passwordHash,
          nombre,
          apellidos: apellidos || null,
          rol: 'DIRECTOR',
          agenciaId: agencia.id,
        },
      });

      return { agencia, usuario };
    });

    logger.info(`Nueva agencia registrada: ${nombreAgencia} (${email})`);

    // Avisar al superadmin (best-effort, no bloquea el registro)
    try {
      const { emailService } = require('../services/emailService');
      emailService.sendAdminNuevaAgencia(agencia);
    } catch (e) {
      logger.warn('No se pudo avisar al superadmin de la nueva agencia:', e.message);
    }

    // No generamos token hasta que el superadmin active la cuenta
    res.status(201).json({
      ok: true,
      mensaje: 'Registro completado. Tu cuenta está pendiente de activación. Te avisaremos por email en breve.',
      agenciaId: agencia.id,
    });
  } catch (err) {
    logger.error('Error en register:', err.message);
    res.status(500).json({ error: 'Error al registrar la agencia', detail: err.message });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
// Login con email + contraseña
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, nombre: true, apellidos: true, avatar: true, rol: true, activo: true, agenciaId: true, passwordHash: true },
    });

    if (!usuario || !usuario.passwordHash) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacta con el administrador.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Verificar estado de la agencia
    if (usuario.agenciaId && usuario.rol !== 'SUPERADMIN') {
      const agencia = await prisma.agencia.findUnique({
        where: { id: usuario.agenciaId },
        select: { estado: true },
      });
      if (agencia?.estado === 'PENDIENTE') {
        return res.status(403).json({ 
          error: 'Tu cuenta está pendiente de activación. Te avisaremos por email en breve.',
          code: 'PENDING_ACTIVATION'
        });
      }
      if (agencia?.estado === 'SUSPENDIDA') {
        return res.status(403).json({ error: 'Cuenta suspendida. Contacta con soporte.' });
      }
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } });

    const tokens = generateTokens(usuario.id);
    logger.info(`Login email: ${email}`);

    const { passwordHash: _, ...usuarioSinHash } = usuario;
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, usuario: usuarioSinHash });
  } catch (err) {
    logger.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token requerido' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh');
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, activo: true },
    });
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Usuario no válido' });

    const tokens = generateTokens(usuario.id);
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch {
    res.status(401).json({ error: 'Refresh token expirado o inválido', code: 'REFRESH_EXPIRED' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const { authenticate } = require('../middleware/auth');
  authenticate(req, res, async () => {
    res.json(req.user);
  });
});

// ─── POST /api/auth/dev-login ────────────────────────────────────────────────
// Solo para desarrollo — crea/retorna el usuario SUPERADMIN
router.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Ruta deshabilitada en producción' });
  }
  let usuario = await prisma.usuario.findFirst({ where: { email: 'admin@crm-dev.com' } });
  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        email: 'admin@crm-dev.com',
        nombre: 'Administrador',
        apellidos: 'Dev',
        rol: 'SUPERADMIN',
      },
    });
  }

  const tokens = generateTokens(usuario.id);
  res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, usuario });
});

module.exports = router;
