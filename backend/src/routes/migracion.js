const express = require('express');
const router = express.Router();
const { driveService } = require('../services/driveService');
const { iaService } = require('../services/iaService');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/migracion/drive
 * Migra propiedades desde una estructura de carpetas de Google Drive.
 * Cada subcarpeta es una propiedad.
 */
router.post('/drive', authenticate, async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) return res.status(400).json({ error: 'Folder ID es requerido' });

  try {
    const estructura = await driveService.listarContenidoRecursivo(folderId);
    let processed = 0;
    let errors = 0;

    // Procesamos de forma secuencial para no saturar la IA/Drive
    for (const item of estructura) {
      try {
        logger.info(`Migración: Procesando carpeta Drive "${item.nombre}"`);
        
        // 1. Identificar dossier (PDF)
        const dossierFile = item.archivos.find(f => f.mimeType === 'application/pdf');
        let propertyData = { 
          nombre: item.nombre, 
          tipo: 'VENTA',
          fotos: '[]',
          estado: 'DISPONIBLE'
        };

        // 2. Analizar dossier con IA
        if (dossierFile) {
          const buffer = await driveService.descargarArchivo(dossierFile.id);
          if (buffer) {
            const { datos } = await iaService.analizarPDFCompleto(buffer, dossierFile.name);
            propertyData = { ...propertyData, ...datos };
          }
        }

        // 3. Crear propiedad en DB
        const property = await prisma.propiedad.create({
          data: {
            ...propertyData,
            referencia: await generarReferencia(propertyData.tipo),
            fotos: '[]' // Se llenará después
          }
        });

        // 4. Procesar fotos
        const fotosFiles = item.archivos.filter(f => f.mimeType.startsWith('image/'));
        const fotosUrls = [];

        for (const fotoFile of fotosFiles) {
          const fotoBuffer = await driveService.descargarArchivo(fotoFile.id);
          if (fotoBuffer) {
            // Guardar localmente
            const result = driveService._guardarLocal({
              buffer: fotoBuffer,
              originalname: fotoFile.name,
              mimetype: fotoFile.mimeType
            });
            fotosUrls.push(result.url);
          }
        }

        // Actualizar fotos en la propiedad
        await prisma.propiedad.update({
          where: { id: property.id },
          data: { fotos: JSON.stringify(fotosUrls) }
        });

        processed++;
      } catch (err) {
        logger.error(`Migración: Error en carpeta "${item.nombre}": ${err.message}`);
        errors++;
      }
    }

    res.json({ ok: true, processed, errors });
  } catch (err) {
    logger.error(`Migración Drive fallida: ${err.message}`);
    res.status(500).json({ error: 'Error procesando la migración de Drive' });
  }
});

// Helper para generar referencias (duplicado de propiedades.js para simplicidad)
async function generarReferencia(tipo) {
  const prefix = tipo === 'VENTA' ? 'VTA' : tipo === 'VACACIONAL' ? 'VAC' : 'ALQ';
  const count = await prisma.propiedad.count({ where: { tipo } });
  return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
}

module.exports = router;
