/**
 * portales.js - Rutas de publicación en portales inmobiliarios
 * Base: /api/portales
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const {
  publicarEnPortales,
  despublicarDePortales,
  obtenerEstadoPublicacion,
  generarFeedXML,
  PORTALES_CONFIG,
} = require('../services/portalesService');

// ─── GET /api/portales/config ────────────────────────────────────────────────
// Devuelve la configuración de los portales disponibles (sin credenciales)
router.get('/config', authenticate, (req, res) => {
  const config = Object.entries(PORTALES_CONFIG).map(([id, p]) => ({
    id,
    nombre: p.nombre,
    logo: p.logo,
    tipo: p.tipo,
    baseUrl: p.baseUrl,
    configurado: p.tipo === 'api_rest'
      ? !!p.apiKey
      : true, // Los feeds XML siempre están "configurados" (son URLs propias)
  }));
  res.json(config);
});

// ─── GET /api/portales/:propiedadId/estado ───────────────────────────────────
// Devuelve el estado de publicación de una propiedad en todos los portales
router.get('/:propiedadId/estado', authenticate, async (req, res) => {
  try {
    const estado = await obtenerEstadoPublicacion(req.params.propiedadId);
    res.json(estado);
  } catch (err) {
    console.error('[ERROR] portales estado:', err.message);
    res.status(500).json({ error: 'Error al obtener estado de publicación', detail: err.message });
  }
});

// ─── POST /api/portales/publicar ─────────────────────────────────────────────
// Publica (o actualiza) una propiedad en los portales indicados
router.post('/publicar', authenticate, async (req, res) => {
  const { propiedadId, portales } = req.body;

  if (!propiedadId || typeof propiedadId !== 'string') {
    return res.status(400).json({ error: 'propiedadId es obligatorio' });
  }

  if (!Array.isArray(portales) || portales.length === 0) {
    return res.status(400).json({ error: 'portales debe ser un array no vacío' });
  }

  const portalesValidos = Object.keys(PORTALES_CONFIG);
  const portalesInvalidos = portales.filter(p => !portalesValidos.includes(p));
  if (portalesInvalidos.length > 0) {
    return res.status(400).json({
      error: `Portales no válidos: ${portalesInvalidos.join(', ')}`,
      validos: portalesValidos,
    });
  }

  try {
    // Obtener URL base del servidor para construir URLs de fotos
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const serverBaseUrl = process.env.PUBLIC_SERVER_URL || `${protocol}://${host}`;

    // Ejecutar publicación en segundo plano (no bloqueamos la respuesta)
    // Respondemos inmediatamente con estado PUBLICANDO
    res.json({
      ok: true,
      mensaje: 'Publicación iniciada. El estado se actualizará en segundos.',
      propiedadId,
      portales,
    });

    // Publicar en background
    publicarEnPortales(propiedadId, portales, serverBaseUrl)
      .then(resultados => {
        console.log(`[PORTALES] Publicación completada para ${propiedadId}:`, resultados);
      })
      .catch(err => {
        console.error(`[PORTALES] Error publicando ${propiedadId}:`, err.message);
      });

  } catch (err) {
    console.error('[ERROR] portales publicar:', err.message);
    res.status(500).json({ error: 'Error al iniciar publicación', detail: err.message });
  }
});

// ─── POST /api/portales/despublicar ──────────────────────────────────────────
// Despublica una propiedad de los portales indicados
router.post('/despublicar', authenticate, async (req, res) => {
  const { propiedadId, portales } = req.body;

  if (!propiedadId) return res.status(400).json({ error: 'propiedadId obligatorio' });
  if (!Array.isArray(portales) || portales.length === 0) {
    return res.status(400).json({ error: 'portales debe ser array no vacío' });
  }

  try {
    await despublicarDePortales(propiedadId, portales);
    res.json({ ok: true, mensaje: `Propiedad despublicada de: ${portales.join(', ')}` });
  } catch (err) {
    console.error('[ERROR] portales despublicar:', err.message);
    res.status(500).json({ error: 'Error al despublicar', detail: err.message });
  }
});

// ─── GET /api/portales/feed ───────────────────────────────────────────────────
// Feed XML público para que los portales (Idealista, Fotocasa, Kyero) lo consuman.
// Parámetros: ?portal=idealista|fotocasa|kyero
// Nota: Este endpoint puede requerir un token de feed para seguridad básica.
router.get('/feed', async (req, res) => {
  const { portal, token } = req.query;

  // Validar portal
  const portalesXML = ['idealista', 'fotocasa', 'kyero'];
  if (!portal || !portalesXML.includes(portal)) {
    return res.status(400).json({
      error: 'portal requerido',
      validos: portalesXML,
    });
  }

  // Validación básica por token (opcional, para no exponer datos sin control)
  const feedToken = process.env.PORTALES_FEED_TOKEN;
  if (feedToken && token !== feedToken) {
    return res.status(401).json({ error: 'Token de feed inválido' });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const serverBaseUrl = process.env.PUBLIC_SERVER_URL || `${protocol}://${host}`;

    const xml = await generarFeedXML(portal, serverBaseUrl);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1h
    res.send(xml);
  } catch (err) {
    console.error('[ERROR] portales feed:', err.message);
    res.status(500).json({ error: 'Error al generar feed', detail: err.message });
  }
});

// ─── GET /api/portales/feed/preview/:propiedadId ─────────────────────────────
// Preview del XML generado para una sola propiedad (útil para debug/verificación)
router.get('/feed/preview/:propiedadId', authenticate, async (req, res) => {
  const { portal = 'kyero' } = req.query;

  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: req.params.propiedadId, activo: true },
      include: {
        alquilerVacacional: true,
        alquilerLargaDuracion: true,
        venta: true,
        documentos: { where: { tipo: 'FOTO' }, orderBy: { creadoEn: 'asc' } },
      },
    });

    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const serverBaseUrl = process.env.PUBLIC_SERVER_URL || `${protocol}://${host}`;

    // Importar adaptadores específicos
    const { generarFeedXMLUnaPropiedad } = require('../services/portalesService');

    // Forzar publicación temporal para preview
    const origPublicaciones = await prisma.publicacionPortal.findMany({
      where: { propiedadId: req.params.propiedadId },
    });

    // Crear temp record si no existe
    await prisma.publicacionPortal.upsert({
      where: { propiedadId_portal: { propiedadId: req.params.propiedadId, portal } },
      create: { propiedadId: req.params.propiedadId, portal, estado: 'PUBLICADO' },
      update: {},
    });

    const xml = await generarFeedXML(portal, serverBaseUrl);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('[ERROR] feed preview:', err.message);
    res.status(500).json({ error: 'Error al generar preview del feed', detail: err.message });
  }
});

module.exports = router;
