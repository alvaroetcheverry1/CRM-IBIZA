const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticate, requireRole, isDirectivo } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { auditLog } = require('../utils/audit');
const { sheetsService } = require('../services/sheetsService');
const { driveService } = require('../services/driveService');

// Helper de errores de validación
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// Contadores para referencias automáticas
const PREFIJOS = { VACACIONAL: 'ALQ', LARGA_DURACION: 'ALD', VENTA: 'VTA' };

async function generarReferencia(tipo) {
  const prefijo = PREFIJOS[tipo];
  const count = await prisma.propiedad.count({ where: { tipo } });
  return `${prefijo}-${String(count + 1).padStart(3, '0')}`;
}

// ─── GET /api/propiedades ───────────────────────────────────
router.get('/', authenticate, [
  query('tipo').optional().isIn(['VACACIONAL', 'LARGA_DURACION', 'VENTA']),
  query('estado').optional().isString(),
  query('zona').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], async (req, res) => {
  if (handleValidation(req, res)) return;

  const { tipo, estado, zona, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const where = { activo: true };
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
  if (zona) where.zona = { contains: zona, mode: 'insensitive' };

  try {
    const [propiedades, total] = await Promise.all([
      prisma.propiedad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          propietario: { select: { id: true, nombre: true, apellidos: true, telefono: true } },
          agente: { select: { id: true, nombre: true } },
          alquilerVacacional: { select: { precioTemporadaAlta: true, licenciaETV: true } },
          alquilerLargaDuracion: { select: { rentaMensual: true, inquilinoNombre: true } },
          venta: { select: { precioVenta: true, etapaPipeline: true } },
          _count: { select: { documentos: true } },
          documentos: { where: { tipo: 'FOTO' }, take: 1, select: { urlDrive: true } },
        },
      }),
      prisma.propiedad.count({ where }),
    ]);

    // Ocultar precio mínimo a no-directivos
    const propiedadesPublicas = propiedades.map(p => {
      if (p.venta && !isDirectivo(req)) {
        p.venta.precioMinimo = undefined;
      }
      return p;
    });

    res.json({
      data: propiedadesPublicas,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener propiedades', detail: err.message });
  }
});

// ─── GET /api/propiedades/:id ───────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: req.params.id, activo: true },
      include: {
        propietario: true,
        agente: { select: { id: true, nombre: true, email: true } },
        alquilerVacacional: { include: { reservas: { orderBy: { fechaEntrada: 'asc' } } } },
        alquilerLargaDuracion: { include: { pagos: { orderBy: { mes: 'desc' } } } },
        venta: true,
        documentos: { orderBy: { creadoEn: 'desc' } },
        actividades: { orderBy: { fecha: 'desc' }, take: 20 },
      },
    });

    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    // Ocultar precio mínimo
    if (propiedad.venta && !isDirectivo(req)) {
      propiedad.venta.precioMinimo = undefined;
    }

    res.json(propiedad);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener propiedad', detail: err.message });
  }
});

// ─── POST /api/propiedades ──────────────────────────────────
router.post('/', authenticate, requireRole('AGENTE', 'AGENTE_SENIOR', 'BACKOFFICE', 'DIRECTOR', 'SUPERADMIN'), [
  body('nombre').trim().notEmpty().withMessage('Nombre obligatorio'),
  body('tipo').isIn(['VACACIONAL', 'LARGA_DURACION', 'VENTA']).withMessage('Tipo inválido'),
  body('zona').trim().notEmpty().withMessage('Zona obligatoria'),
  body('propietarioId').optional({ nullable: true, checkFalsy: true }).isString(),
  body('habitaciones').isInt({ min: 0 }).withMessage('Habitaciones debe ser número entero'),
  body('banos').isInt({ min: 0 }).withMessage('Baños debe ser número entero'),
  body('metrosConstruidos').isFloat({ min: 0 }).withMessage('m² obligatorio'),
], async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { alquilerVacacional, alquilerLargaDuracion, venta, ...propiedadData } = req.body;

    const referencia = await generarReferencia(propiedadData.tipo);

    const propiedad = await prisma.propiedad.create({
      data: {
        ...propiedadData,
        referencia,
        agenteId: req.user.id,
        fotos: '[]',
        alquilerVacacional: alquilerVacacional ? { create: alquilerVacacional } : undefined,
        alquilerLargaDuracion: alquilerLargaDuracion ? { create: alquilerLargaDuracion } : undefined,
        venta: venta ? { create: venta } : undefined,
      },
      include: {
        propietario: true,
        alquilerVacacional: true,
        alquilerLargaDuracion: true,
        venta: true,
      },
    });

    // Crear estructura de carpetas en Drive (async, sin bloquear)
    driveService.crearEstructuraCarpetas(propiedad).then(url => {
      if (url) prisma.propiedad.update({ where: { id: propiedad.id }, data: { urlDriveCarpeta: url } });
    }).catch(() => {});

    // Sincronizar con Google Sheets (async)
    sheetsService.sincronizarPropiedad(propiedad).catch(() => {});

    await auditLog(req.user.id, 'CREATE', 'Propiedad', propiedad.id, null, propiedad);

    res.status(201).json(propiedad);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear propiedad', detail: err.message });
  }
});

// ─── PUT /api/propiedades/:id ───────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const antes = await prisma.propiedad.findUnique({ where: { id: req.params.id } });
    if (!antes) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const { alquilerVacacional, alquilerLargaDuracion, venta, ...datos } = req.body;
    // Evitar sobreescribir referencia y tipo
    delete datos.referencia;

    const propiedad = await prisma.propiedad.update({
      where: { id: req.params.id },
      data: {
        ...datos,
        alquilerVacacional: alquilerVacacional
          ? { upsert: { create: alquilerVacacional, update: alquilerVacacional } }
          : undefined,
        alquilerLargaDuracion: alquilerLargaDuracion
          ? { upsert: { create: alquilerLargaDuracion, update: alquilerLargaDuracion } }
          : undefined,
        venta: venta
          ? { upsert: { create: venta, update: venta } }
          : undefined,
      },
      include: { propietario: true, alquilerVacacional: true, alquilerLargaDuracion: true, venta: true },
    });

    sheetsService.sincronizarPropiedad(propiedad).catch(() => {});
    await auditLog(req.user.id, 'UPDATE', 'Propiedad', propiedad.id, antes, propiedad);

    res.json(propiedad);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar propiedad', detail: err.message });
  }
});

// ─── DELETE /api/propiedades/:id ────────────────────────────
router.delete('/:id', authenticate, requireRole('DIRECTOR', 'SUPERADMIN'), async (req, res) => {
  try {
    // Soft delete
    await prisma.propiedad.update({
      where: { id: req.params.id },
      data: { activo: false },
    });

    await auditLog(req.user.id, 'DELETE', 'Propiedad', req.params.id, null, null);
    res.json({ message: 'Propiedad eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar propiedad', detail: err.message });
  }
});

module.exports = router;
