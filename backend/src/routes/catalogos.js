const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 1. OBTENER catálogo PÚBLICO (No requiere token)
// Incrementa visualizaciones
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const catalogo = await prisma.catalogo.findUnique({
      where: { token },
      include: {
        agencia: {
          include: { configuracion: true }
        },
        propiedades: {
          include: {
            propiedad: {
              include: {
                alquilerVacacional: true,
                venta: true,
                alquilerLargaDuracion: true
              }
            }
          }
        }
      }
    });

    if (!catalogo) {
      return res.status(404).json({ error: 'Catálogo no encontrado' });
    }

    // Verificar expiración
    if (catalogo.expiraEn && new Date() > new Date(catalogo.expiraEn)) {
      return res.status(410).json({ error: 'Este catálogo ha expirado' });
    }

    // Actualizar estadísticas (asíncrono)
    prisma.catalogo.update({
      where: { id: catalogo.id },
      data: {
        vistas: { increment: 1 },
        ultimoAcceso: new Date()
      }
    }).then(updated => {
      // Crear notificación persistente de visualización de catálogo
      const { createNotification } = require('../services/notificationService');
      createNotification(
        catalogo.agenciaId,
        'INFO',
        'Catálogo Visitado',
        `El catálogo "${catalogo.nombre}" ha sido visualizado (${updated.vistas} visitas totales)`,
        '/catalogos'
      ).catch(() => {});
    }).catch(e => console.error("Error al actualizar estadísticas del catálogo:", e));

    res.json(catalogo);
  } catch (error) {
    console.error('Error al obtener catálogo público:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// A partir de aquí, las rutas requieren autenticación
router.use(authenticate);

// 2. CREAR nuevo catálogo
router.post('/', async (req, res) => {
  try {
    const { nombre, propiedadesIds, expiraEnDias } = req.body;
    const agenciaId = req.user.agenciaId;

    if (!nombre || !propiedadesIds || propiedadesIds.length === 0) {
      return res.status(400).json({ error: 'Nombre y propiedades son requeridos' });
    }

    // Generar un token único y amigable (ej: 8 caracteres aleatorios en hex)
    const token = crypto.randomBytes(4).toString('hex');

    // Calcular expiración si aplica
    let expiraEn = null;
    if (expiraEnDias) {
      expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + parseInt(expiraEnDias));
    }

    const nuevoCatalogo = await prisma.catalogo.create({
      data: {
        nombre,
        token,
        agenciaId,
        expiraEn,
        propiedades: {
          create: propiedadesIds.map(id => ({
            propiedadId: id
          }))
        }
      },
      include: {
        propiedades: true
      }
    });

    res.status(201).json(nuevoCatalogo);
  } catch (error) {
    console.error('Error al crear catálogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 3. OBTENER catálogos de la agencia
router.get('/', async (req, res) => {
  try {
    const agenciaId = req.user.agenciaId;

    const catalogos = await prisma.catalogo.findMany({
      where: { agenciaId },
      include: {
        _count: {
          select: { propiedades: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(catalogos);
  } catch (error) {
    console.error('Error al obtener catálogos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4. ELIMINAR catálogo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agenciaId = req.user.agenciaId;

    const catalogo = await prisma.catalogo.findUnique({ where: { id } });

    if (!catalogo || catalogo.agenciaId !== agenciaId) {
      return res.status(404).json({ error: 'Catálogo no encontrado' });
    }

    await prisma.catalogo.delete({ where: { id } });

    res.json({ success: true, message: 'Catálogo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar catálogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
