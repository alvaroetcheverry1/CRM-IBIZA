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
    const isImage = file.mimetype.startsWith('image/') || file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/);
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isDoc = file.mimetype.startsWith('application/vnd') || file.originalname.toLowerCase().match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/);
    if (isImage || isPDF || isDoc || file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Recibido: ${file.mimetype} - ${file.originalname}`), false);
    }
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
  const fs = require('fs');
  const path = require('path');

  try {
    // 1. Crear registro inicial en BD
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

    // 2. Intentar subir a Google Drive; si falla, guardar localmente
    let finalUrl = null;
    let finalFileId = null;

    try {
      const { url, fileId } = await driveService.subirDocumento(req.file, propiedadId, tipo);
      finalUrl = url;
      finalFileId = fileId;
    } catch (driveErr) {
      // Drive no disponible (sin credenciales en dev) — guardar localmente
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      // Nombre de archivo único para evitar colisiones
      const ext = path.extname(req.file.originalname) || '.bin';
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, safeName);

      fs.writeFileSync(filePath, req.file.buffer);
      // URL pública servida por Express
      finalUrl = `/api/uploads/${safeName}`;
      console.log(`[upload] Drive no disponible, guardado localmente: ${finalUrl}`);
    }

    // 3. Actualizar documento con la URL final
    const finalDoc = await prisma.documento.update({
      where: { id: documento.id },
      data: {
        urlDrive: finalUrl,
        driveFileId: finalFileId,
        estadoProcesamiento: 'COMPLETADO',
      },
    });

    // 4. Si es FOTO, actualizar campos fotos/fotoPrincipal de la propiedad
    if (tipo === 'FOTO' && propiedadId && finalUrl) {
      try {
        const prop = await prisma.propiedad.findUnique({ where: { id: propiedadId } });
        if (prop) {
          let fotosArr = [];
          try { fotosArr = JSON.parse(prop.fotos || '[]'); } catch { fotosArr = []; }
          if (!Array.isArray(fotosArr)) fotosArr = [];
          fotosArr.push(finalUrl);

          await prisma.propiedad.update({
            where: { id: propiedadId },
            data: {
              fotos: JSON.stringify(fotosArr),
              fotoPrincipal: prop.fotoPrincipal || finalUrl,
            },
          });
        }
      } catch (err) {
        console.warn('[upload] Error actualizando fotoPrincipal:', err.message);
      }
    }

    // 5. Procesar PDF con IA si aplica (async, no bloquea)
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
    }

    res.status(201).json(finalDoc);
  } catch (err) {
    console.error('[upload] Error:', err.message);
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

