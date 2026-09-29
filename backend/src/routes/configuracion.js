const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/configuracion
// Devuelve la configuración de la agencia del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;
    
    const config = await prisma.configuracionAgencia.findFirst({ where });
    if (!config) {
      return res.status(200).json({ data: null, message: "No hay configuración activa." });
    }
    return res.status(200).json({ data: config });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener la configuración' });
  }
});

// POST /api/configuracion
// Crea o actualiza la configuración de la agencia
router.post('/', authenticate, async (req, res) => {
  try {
    const data = req.body;
    const where = {};
    if (req.user.agenciaId) where.agenciaId = req.user.agenciaId;
    
    // Buscar si ya existe una configuración para esta agencia
    const configExistente = await prisma.configuracionAgencia.findFirst({ where });
    
    let config;
    if (configExistente) {
      config = await prisma.configuracionAgencia.update({
        where: { id: configExistente.id },
        data
      });
    } else {
      config = await prisma.configuracionAgencia.create({
        data: {
          ...data,
          agenciaId: req.user.agenciaId || null
        }
      });
    }

    return res.status(200).json({ data: config, message: 'Configuración guardada correctamente.' });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return res.status(500).json({ error: 'Error del servidor al guardar la configuración' });
  }
});

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// POST /api/configuracion/upload
// Sube un logo o firma y devuelve la URL
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' });
  
  try {
    const { uploadFile } = require('../services/supabaseStorageService');
    const ext = require('path').extname(req.file.originalname) || '.png';
    const safeName = `config_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const url = await uploadFile(req.file.buffer, safeName, req.file.mimetype);
    
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Error subiendo imagen de configuración:', error);
    return res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

module.exports = router;
