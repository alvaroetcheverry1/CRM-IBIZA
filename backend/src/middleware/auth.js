const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma');

/**
 * Middleware de autenticación JWT
 * Carga usuario + agenciaId en req.user para aislamiento multi-tenant
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true, agenciaId: true },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    // SUPERADMIN no pertenece a ninguna agencia (gestiona todas)
    if (usuario.agenciaId && usuario.rol !== 'SUPERADMIN') {
      const agencia = await prisma.agencia.findUnique({
        where: { id: usuario.agenciaId },
        select: { estado: true },
      });
      if (!agencia || agencia.estado === 'SUSPENDIDA') {
        return res.status(403).json({ error: 'Cuenta suspendida. Contacta con soporte.' });
      }
      if (agencia.estado === 'PENDIENTE') {
        return res.status(403).json({ 
          error: 'Tu cuenta está pendiente de activación. Te avisaremos por email en breve.',
          code: 'PENDING_ACTIVATION'
        });
      }
    }

    req.user = usuario;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * Middleware de roles (RBAC)
 * Uso: requireRole('DIRECTOR', 'SUPERADMIN')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({
      error: 'No tienes permisos para realizar esta acción',
      requiredRoles: roles,
      currentRole: req.user.rol,
    });
  }
  next();
};

/**
 * Roles con acceso a datos confidenciales (precios mínimos, etc.)
 */
const isDirectivo = (req) =>
  ['SUPERADMIN', 'DIRECTOR'].includes(req.user?.rol);

module.exports = { authenticate, requireRole, isDirectivo };
