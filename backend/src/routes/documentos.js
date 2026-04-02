const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { driveService } = require('../services/driveService');
const { iaService } = require('../services/iaService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'), false);
  },
});

// GET /api/documentos — listar documentos
router.get('/', authenticate, async (req, res) => {
  const { propiedadId, propietarioId, clienteId, page = 1, limit = 30 } = req.query;
  const where = {};
  if (propiedadId) where.propiedadId = propiedadId;
  if (propietarioId) where.propietarioId = propietarioId;
  if (clienteId) where.clienteId = clienteId;

  const documentos = await prisma.documento.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { creadoEn: 'desc' },
    include: {
      subidoPor: { select: { nombre: true } },
      propiedad: { select: { nombre: true, referencia: true } },
    },
  });
  res.json({ data: documentos });
});

// POST /api/documentos/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se ha enviado ningún archivo' });

  const { propiedadId, propietarioId, clienteId, tipo } = req.body;

  try {
    // 1. Crear registro en BD
    const documento = await prisma.documento.create({
      data: {
        nombre: req.file.originalname,
        mimeType: req.file.mimetype,
        tamanoBytes: req.file.size,
        tipo: tipo || 'OTRO',
        estadoProcesamiento: 'PROCESANDO',
        propiedadId: propiedadId || null,
        propietarioId: propietarioId || null,
        clienteId: clienteId || null,
        subidoPorId: req.user.id,
      },
    });

    // 2. Subir a Google Drive (await to ensure it returns populated data)
    let finalDoc = documento;
    try {
      const { url, fileId } = await driveService.subirDocumento(req.file, propiedadId, tipo);
      finalDoc = await prisma.documento.update({
        where: { id: documento.id },
        data: { urlDrive: url, driveFileId: fileId },
      });

      // Actualizar fotoPrincipal de la propiedad si aplica
      if (tipo === 'FOTO' && propiedadId) {
        const prop = await prisma.propiedad.findUnique({ where: { id: propiedadId } });
        if (prop) {
          const updates = {};
          if (!prop.fotoPrincipal) {
            updates.fotoPrincipal = url;
          }
          // Intentar añadir la nueva URL al string de fotos
          let fotosArr = [];
          try { 
            fotosArr = JSON.parse(prop.fotos || '[]'); 
            if (!Array.isArray(fotosArr)) fotosArr = typeof prop.fotos === 'string' && prop.fotos ? prop.fotos.split(',') : [];
          } catch { 
            fotosArr = typeof prop.fotos === 'string' && prop.fotos ? prop.fotos.split(',') : []; 
          }
          fotosArr.push(url);
          updates.fotos = JSON.stringify(fotosArr);

          await prisma.propiedad.update({
            where: { id: propiedadId },
            data: updates
          });
        }
      }
    } catch (err) {
      console.error('Error uploading to drive:', err);
    }

    // 3. Procesar con IA si es PDF (async)
    if (req.file.mimetype === 'application/pdf' && propiedadId) {
      iaService.procesarDocumento(req.file.buffer, propiedadId, documento.id)
        .then(async (datosExtraidos) => {
          await prisma.documento.update({
            where: { id: documento.id },
            data: { datosExtraidos, estadoProcesamiento: 'COMPLETADO' },
          });
        })
        .catch(async (err) => {
          await prisma.documento.update({
            where: { id: documento.id },
            data: { estadoProcesamiento: 'ERROR', errorProcesamiento: err.message },
          });
        });
    } else {
      await prisma.documento.update({
        where: { id: documento.id },
        data: { estadoProcesamiento: 'COMPLETADO' },
      });
    }

    res.status(201).json(finalDoc);
  } catch (err) {
    res.status(500).json({ error: 'Error al subir documento', detail: err.message });
  }
});

// POST /api/documentos/dossier — Sube un Dossier generado a la carpeta Marketing de la Propiedad en Drive
router.post('/dossier', authenticate, upload.single('file'), async (req, res) => {
  const { propiedadId } = req.body;
  if (!propiedadId || !req.file) {
    return res.status(400).json({ error: 'PropiedadID y archivo (file) son obligatorios' });
  }

  try {
    const propiedad = await prisma.propiedad.findUnique({ where: { id: propiedadId } });
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const filename = `Dossier_${propiedad.referencia}_${Date.now()}.pdf`;

    const documento = await prisma.documento.create({
      data: {
        nombre: filename,
        tipo: 'DOSSIER',
        mimeType: 'application/pdf',
        tamanoBytes: req.file.size,
        propiedadId,
        subidoPorId: req.user.id,
      }
    });

    const { url, fileId } = await driveService.subirDossier(req.file.buffer, propiedad, filename);

    const docFinal = await prisma.documento.update({
      where: { id: documento.id },
      data: { urlDrive: url, driveFileId: fileId, estadoProcesamiento: 'COMPLETADO' }
    });

    const { sheetsService } = require('../services/sheetsService');
    const propiedadActualizada = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      include: {
        propietario: true,
        agente: true,
        alquilerVacacional: true,
        alquilerLargaDuracion: true,
        venta: true,
        documentos: { orderBy: { creadoEn: 'desc' } }
      }
    });

    sheetsService.sincronizarPropiedad(propiedadActualizada).catch(err => console.error(err));

    res.status(201).json(docFinal);
  } catch (err) {
    res.status(500).json({ error: 'Error procesando dossier', detail: err.message });
  }
});

// POST /api/documentos/nota — crear nota de texto
router.post('/nota', authenticate, async (req, res) => {
  const { titulo, contenido, propiedadId, propietarioId, clienteId, tipo, regenDesc } = req.body;

  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  try {
    // 1. Crear registro en BD
    const documento = await prisma.documento.create({
      data: {
        nombre: titulo,
        mimeType: 'text/plain',
        tamanoBytes: Buffer.byteLength(contenido, 'utf8'),
        tipo: tipo || 'OTRO',
        estadoProcesamiento: 'PROCESANDO',
        propiedadId: propiedadId || null,
        propietarioId: propietarioId || null,
        clienteId: clienteId || null,
        subidoPorId: req.user.id,
      },
    });

    // 2. Subir texto a Google Drive (async, no bloquea la respuesta)
    const buffer = Buffer.from(contenido, 'utf8');
    const fileObj = {
      originalname: `${titulo}.txt`,
      mimetype: 'text/plain',
      buffer,
      size: buffer.length,
    };
    driveService.subirDocumento(fileObj, propiedadId, tipo)
      .then(async ({ url, fileId }) => {
        await prisma.documento.update({
          where: { id: documento.id },
          data: { urlDrive: url, driveFileId: fileId, estadoProcesamiento: 'COMPLETADO' },
        });
      })
      .catch(async () => {
        await prisma.documento.update({
          where: { id: documento.id },
          data: { estadoProcesamiento: 'COMPLETADO' }, // guardado en BD aunque falle Drive
        });
      });

    // 3. Procesar texto con IA si hay propiedad asociada (async)
    if (propiedadId) {
      iaService.procesarTextoBruto(contenido, propiedadId, documento.id)
        .then(async (datosExtraidos) => {
          await prisma.documento.update({
            where: { id: documento.id },
            data: { datosExtraidos, estadoProcesamiento: 'COMPLETADO' },
          });
        })
        .catch(async (err) => {
          await prisma.documento.update({
            where: { id: documento.id },
            data: { estadoProcesamiento: 'ERROR', errorProcesamiento: err.message },
          });
        });

      // 4. Si el usuario pide re-generar descripción comercial con fotos
      if (regenDesc) {
        // En producción real, sacar los URLs de la propiedad:
        // const propInfo = await prisma.propiedad.findUnique({ where: { id: propiedadId } });
        // const urlsFotos = propInfo.fotos || [];
        
        // Simulación de fotos (o llamada con las reales):
        const urlsFotosMock = ['https://picsum.photos/800/600', 'https://picsum.photos/800/601'];
        
        iaService.generarDescripcionConFotos(contenido, urlsFotosMock, propiedadId)
          .catch(err => console.error('Error generando desc: ', err));
      }
    }

    res.status(201).json(documento);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la nota', detail: err.message });
  }
});

// DELETE /api/documentos/:id
router.delete('/:id', authenticate, async (req, res) => {
  const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  if (doc.driveFileId) {
    driveService.eliminarArchivo(doc.driveFileId).catch(() => {});
  }
  await prisma.documento.delete({ where: { id: req.params.id } });
  res.json({ message: 'Documento eliminado' });
});

module.exports = router;

