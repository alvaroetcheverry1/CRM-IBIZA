const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};

// GET /api/propietarios
router.get('/', authenticate, async (req, res) => {
  const { search, categoria, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { activo: true };

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { apellidos: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoria) where.categoria = categoria;

  const [propietarios, total] = await Promise.all([
    prisma.propietario.findMany({
      where, skip, take: Number(limit), orderBy: { nombre: 'asc' },
      include: { _count: { select: { propiedades: true } } },
    }),
    prisma.propietario.count({ where }),
  ]);

  res.json({ data: propietarios, meta: { total, page: Number(page), limit: Number(limit) } });
});

// GET /api/propietarios/:id
router.get('/:id', authenticate, async (req, res) => {
  const propietario = await prisma.propietario.findUnique({
    where: { id: req.params.id },
    include: {
      propiedades: { where: { activo: true }, include: { venta: true, alquilerVacacional: true, alquilerLargaDuracion: true } },
      contratos: { orderBy: { fechaFirma: 'desc' } },
      documentos: { orderBy: { creadoEn: 'desc' } },
    },
  });
  if (!propietario) return res.status(404).json({ error: 'Propietario no encontrado' });
  res.json(propietario);
});

// POST /api/propietarios
router.post('/', authenticate, [
  body('nombre').trim().notEmpty(),
  body('apellidos').trim().notEmpty(),
  body('email').isEmail(),
  body('telefono').notEmpty(),
  body('nif').notEmpty(),
], async (req, res) => {
  if (validate(req, res)) return;
  try {
    const propietario = await prisma.propietario.create({ data: req.body });
    res.status(201).json(propietario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/propietarios/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const propietario = await prisma.propietario.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(propietario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/propietarios/:id
router.delete('/:id', authenticate, requireRole('DIRECTOR', 'SUPERADMIN'), async (req, res) => {
  await prisma.propietario.update({ where: { id: req.params.id }, data: { activo: false } });
  res.json({ message: 'Propietario eliminado' });
});

module.exports = router;
