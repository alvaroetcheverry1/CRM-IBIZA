const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

/**
 * GET /api/search?q=<query>
 * Búsqueda global multi-entidad con filtro por agencia
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ propiedades: [], clientes: [], documentos: [] });
    }

    const search = q.trim();
    const agenciaId = req.user.agenciaId;
    const agenciaFilter = agenciaId ? { agenciaId } : {};

    const [propiedades, clientes, documentos] = await Promise.all([
      prisma.propiedad.findMany({
        where: {
          ...agenciaFilter,
          activo: true,
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { zona: { contains: search, mode: 'insensitive' } },
            { referencia: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true, zona: true, tipo: true, estado: true, fotoPrincipal: true },
        take: 5,
      }),

      prisma.cliente.findMany({
        where: {
          ...agenciaFilter,
          activo: true,
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellidos: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { telefono: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true, apellidos: true, email: true, telefono: true, estado: true, tipo: true },
        take: 5,
      }),

      prisma.documento.findMany({
        where: {
          ...agenciaFilter,
          OR: [
            { titulo: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true, titulo: true, tipo: true, creadoEn: true },
        take: 4,
      }).catch(() => []), // silencioso si no existe la tabla
    ]);

    res.json({ propiedades, clientes, documentos });
  } catch (error) {
    console.error('[Search] Error:', error);
    res.status(500).json({ error: 'Error en búsqueda global' });
  }
});

module.exports = router;
