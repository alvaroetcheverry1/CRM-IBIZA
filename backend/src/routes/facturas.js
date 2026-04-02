const express = require('express');
const router = express.Router();
const multer = require('multer');
const driveService = require('../services/driveService');
const { logger } = require('../utils/logger');

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
router.post('/upload', upload.single('factura'), async (req, res) => {
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
