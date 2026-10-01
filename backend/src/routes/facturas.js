const express = require('express');
const router = express.Router();
const multer = require('multer');
const driveService = require('../services/driveService');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

// Alcance de agencia: null para SUPERADMIN (ve todo).
function agenciaScope(req) {
  return req.user?.rol === 'SUPERADMIN' ? null : (req.user?.agenciaId || null);
}

// Normaliza una factura de la BD al formato que espera el frontend.
function serializarFactura(f) {
  let conceptos = [];
  try { conceptos = JSON.parse(f.conceptos || '[]'); } catch { conceptos = []; }
  return {
    id: f.id,
    numero: f.numero,
    fechaEmision: f.fechaEmision,
    fechaVencimiento: f.fechaVencimiento,
    estado: f.estado,
    cliente: f.clienteId ? { id: f.clienteId, nombre: f.clienteNombre } : (f.clienteNombre ? { nombre: f.clienteNombre } : null),
    propiedad: f.propiedadId || f.propiedadNombre ? { id: f.propiedadId, nombre: f.propiedadNombre } : null,
    conceptos,
    subtotal: Number(f.subtotal),
    totalImpuestos: Number(f.totalImpuestos),
    total: Number(f.total),
    notas: f.notas,
    urlPdf: f.urlPdf,
    creadoEn: f.creadoEn,
  };
}

// Calcula los totales a partir de los conceptos.
function calcularTotales(conceptos = []) {
  let subtotal = 0;
  let totalImpuestos = 0;
  for (const c of conceptos) {
    const base = (Number(c.cantidad) || 0) * (Number(c.precioUnitario) || 0);
    subtotal += base;
    totalImpuestos += base * ((Number(c.impuestoPorcentaje) || 0) / 100);
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalImpuestos: Math.round(totalImpuestos * 100) / 100,
    total: Math.round((subtotal + totalImpuestos) * 100) / 100,
  };
}

// ─── GET /api/facturas ────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const agenciaId = agenciaScope(req);
    const where = {};
    if (agenciaId !== null) where.agenciaId = agenciaId;
    const facturas = await prisma.factura.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
    });
    res.json({ data: facturas.map(serializarFactura) });
  } catch (err) {
    logger.error('Error listando facturas:', err.message);
    res.status(500).json({ error: 'Error al obtener las facturas' });
  }
});

// ─── POST /api/facturas ───────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const agenciaId = req.user.agenciaId || null;
    const { numero, fechaEmision, fechaVencimiento, estado, cliente, propiedad, conceptos = [], notas } = req.body;

    const totales = calcularTotales(conceptos);

    // Número automático si no se envía: F-<año>-<correlativo por agencia>
    let numeroFactura = numero;
    if (!numeroFactura) {
      const anio = new Date().getFullYear();
      const count = await prisma.factura.count({
        where: { ...(agenciaId ? { agenciaId } : {}), numero: { startsWith: `F-${anio}-` } },
      });
      numeroFactura = `F-${anio}-${String(count + 1).padStart(3, '0')}`;
    }

    const factura = await prisma.factura.create({
      data: {
        numero: numeroFactura,
        fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date(),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        estado: estado || 'PENDIENTE',
        clienteId: cliente?.id || null,
        clienteNombre: cliente ? `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim() || null : null,
        propiedadId: propiedad?.id || null,
        propiedadNombre: propiedad?.nombre || null,
        conceptos: JSON.stringify(conceptos),
        subtotal: totales.subtotal,
        totalImpuestos: totales.totalImpuestos,
        total: totales.total,
        notas: notas || null,
        agenciaId,
      },
    });
    res.status(201).json(serializarFactura(factura));
  } catch (err) {
    logger.error('Error creando factura:', err.message);
    res.status(500).json({ error: 'Error al crear la factura' });
  }
});

// ─── PUT /api/facturas/:id ────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const agenciaId = agenciaScope(req);
    const existente = await prisma.factura.findUnique({ where: { id: req.params.id }, select: { agenciaId: true } });
    if (!existente) return res.status(404).json({ error: 'Factura no encontrada' });
    if (agenciaId !== null && existente.agenciaId !== agenciaId) {
      return res.status(403).json({ error: 'No tienes acceso a esta factura' });
    }

    const { numero, fechaEmision, fechaVencimiento, estado, cliente, propiedad, conceptos, notas, urlPdf } = req.body;
    const data = {};
    if (numero !== undefined) data.numero = numero;
    if (fechaEmision !== undefined) data.fechaEmision = new Date(fechaEmision);
    if (fechaVencimiento !== undefined) data.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    if (estado !== undefined) data.estado = estado;
    if (cliente !== undefined) {
      data.clienteId = cliente?.id || null;
      data.clienteNombre = cliente ? `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim() || null : null;
    }
    if (propiedad !== undefined) {
      data.propiedadId = propiedad?.id || null;
      data.propiedadNombre = propiedad?.nombre || null;
    }
    if (conceptos !== undefined) {
      data.conceptos = JSON.stringify(conceptos);
      const totales = calcularTotales(conceptos);
      data.subtotal = totales.subtotal;
      data.totalImpuestos = totales.totalImpuestos;
      data.total = totales.total;
    }
    if (notas !== undefined) data.notas = notas;
    if (urlPdf !== undefined) data.urlPdf = urlPdf;

    const factura = await prisma.factura.update({ where: { id: req.params.id }, data });
    res.json(serializarFactura(factura));
  } catch (err) {
    logger.error('Error actualizando factura:', err.message);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
});

// ─── DELETE /api/facturas/:id ─────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const agenciaId = agenciaScope(req);
    const where = { id: req.params.id };
    if (agenciaId !== null) where.agenciaId = agenciaId;
    const result = await prisma.factura.deleteMany({ where });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Factura no encontrada o sin acceso' });
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('Error eliminando factura:', err.message);
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
});

// Setup multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF para las facturas.'), false);
    }
  }
});

/**
 * @route   POST /api/facturas/upload
 * @desc    Sube una factura en PDF a Google Drive (Carpeta 04_Facturas)
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('factura'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha adjuntado ningún archivo PDF.' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const cleanFilename = originalname || `Factura_${Date.now()}.pdf`;

    logger.info(`Iniciando subida de factura a Drive: ${cleanFilename}`);
    
    const driveResult = await driveService.subirFactura(buffer, cleanFilename, mimetype);

    if (!driveResult.url) {
      return res.status(500).json({ error: 'Hubo un error al subir la factura a Google Drive.' });
    }

    // Retorna exitosamente la URL del visor de Google Drive
    res.json({
      success: true,
      message: 'Factura subida exitosamente a Google Drive.',
      url: driveResult.url,
      fileId: driveResult.fileId
    });

  } catch (error) {
    logger.error(`Error en /api/facturas/upload: ${error.message}`);
    res.status(500).json({ error: error.message || 'Error procesando la subida de la factura' });
  }
});

module.exports = router;
