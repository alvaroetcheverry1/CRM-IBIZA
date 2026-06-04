const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/configuracion
// Devuelve la configuración de la agencia (siempre devuelve el primer registro o null)
router.get('/', async (req, res) => {
  try {
    const config = await prisma.configuracionAgencia.findFirst();
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
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Buscar si ya existe una configuración
    const configExistente = await prisma.configuracionAgencia.findFirst();
    
    let config;
    if (configExistente) {
      // Actualizar la existente
      config = await prisma.configuracionAgencia.update({
        where: { id: configExistente.id },
        data: {
          ...data
        }
      });
    } else {
      // Crear nueva
      config = await prisma.configuracionAgencia.create({
        data: {
          ...data
        }
      });
    }

    return res.status(200).json({ data: config, message: 'Configuración guardada correctamente.' });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return res.status(500).json({ error: 'Error del servidor al guardar la configuración' });
  }
});

module.exports = router;
