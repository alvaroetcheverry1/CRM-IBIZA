const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/google — Login con token de Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Credencial de Google requerida' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Buscar o crear usuario
    let usuario = await prisma.usuario.findUnique({ where: { googleId } });
    if (!usuario) {
      usuario = await prisma.usuario.findUnique({ where: { email } });
      if (usuario) {
        // Vincular Google ID al usuario existente
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { googleId, avatar: picture },
        });
      } else {
        // Nuevo usuario — por defecto rol AGENTE
        const [nombre, ...apellidosParts] = name.split(' ');
        usuario = await prisma.usuario.create({
          data: { googleId, email, nombre, apellidos: apellidosParts.join(' '), avatar: picture, rol: 'AGENTE' },
        });
      }
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacta con el administrador.' });
    }

    // Actualizar último acceso
    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } });

    const tokens = generateTokens(usuario.id);
    logger.info(`Login Google: ${email}`);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        avatar: usuario.avatar,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    logger.error('Error en auth Google:', err.message);
    res.status(401).json({ error: 'Token de Google inválido' });
  }
});

// POST /api/auth/refresh — Renovar access token
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

// GET /api/auth/me — Perfil del usuario actual
router.get('/me', async (req, res) => {
  const { authenticate } = require('../middleware/auth');
  authenticate(req, res, async () => {
    res.json(req.user);
  });
});

// POST /api/auth/dev-login — Solo en development: login sin Google
router.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Crear o encontrar usuario de desarrollo
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
