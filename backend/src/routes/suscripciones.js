/**
 * suscripciones.js — Planes y suscripciones (Stripe).
 * Base: /api/suscripciones
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { PLANES, planPorPriceId, priceIdDe } = require('../config/planes');
const { stripeService } = require('../services/stripeService');

// ─── GET /api/suscripciones/planes ───────────────────────────
// Catálogo público de planes (para la página de precios).
router.get('/planes', (req, res) => {
  // No exponer los stripePriceId internos.
  const publicos = Object.values(PLANES).map(({ stripePriceId, stripePriceIdAnual, ...resto }) => resto);
  res.json({ data: publicos });
});

// ─── GET /api/suscripciones/mi ───────────────────────────────
// Suscripción de la agencia del usuario.
router.get('/mi', authenticate, async (req, res) => {
  try {
    if (!req.user.agenciaId) return res.json({ data: null });
    const sub = await prisma.suscripcion.findUnique({ where: { agenciaId: req.user.agenciaId } });
    res.json({ data: sub });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la suscripción' });
  }
});

// ─── POST /api/suscripciones/checkout ────────────────────────
// Inicia el checkout de Stripe para un plan. Solo DIRECTOR/SUPERADMIN.
router.post('/checkout', authenticate, requireRole('DIRECTOR', 'SUPERADMIN'), async (req, res) => {
  try {
    if (!stripeService.enabled) {
      return res.status(503).json({ error: 'Pagos no disponibles temporalmente' });
    }
    const { planId, periodo = 'mensual' } = req.body;
    const plan = PLANES[planId];
    if (!plan) return res.status(400).json({ error: 'Plan no válido' });
    const priceId = priceIdDe(plan, periodo);
    if (!priceId) {
      return res.status(503).json({ error: `El plan ${plan.nombre} (${periodo}) no está configurado en Stripe` });
    }

    const agenciaId = req.user.agenciaId;
    if (!agenciaId) return res.status(400).json({ error: 'Tu usuario no pertenece a ninguna agencia' });

    const subExistente = await prisma.suscripcion.findUnique({ where: { agenciaId } });
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    const { url } = await stripeService.crearCheckoutSuscripcion({
      priceId,
      agenciaId,
      email: req.user.email,
      customerId: subExistente?.stripeCustomerId || null,
      successUrl: `${frontend}/configuracion?suscripcion=ok`,
      cancelUrl: `${frontend}/configuracion?suscripcion=cancelado`,
    });
    res.json({ url });
  } catch (err) {
    logger.error('[Stripe] Error en checkout:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
});

// ─── POST /api/suscripciones/portal ──────────────────────────
// Portal de cliente de Stripe para gestionar/cancelar. Solo DIRECTOR/SUPERADMIN.
router.post('/portal', authenticate, requireRole('DIRECTOR', 'SUPERADMIN'), async (req, res) => {
  try {
    if (!stripeService.enabled) {
      return res.status(503).json({ error: 'Pagos no disponibles temporalmente' });
    }
    const sub = await prisma.suscripcion.findUnique({ where: { agenciaId: req.user.agenciaId } });
    if (!sub?.stripeCustomerId) {
      return res.status(400).json({ error: 'No hay una suscripción activa' });
    }
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const { url } = await stripeService.crearPortalCliente(sub.stripeCustomerId, `${frontend}/configuracion`);
    res.json({ url });
  } catch (err) {
    logger.error('[Stripe] Error en portal:', err.message);
    res.status(500).json({ error: 'No se pudo abrir el portal de gestión' });
  }
});

module.exports = router;
