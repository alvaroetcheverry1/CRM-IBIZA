const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma');

/**
 * Middleware de autenticación JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.user = usuario;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
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
