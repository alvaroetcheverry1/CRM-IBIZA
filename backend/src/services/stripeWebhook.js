/**
 * stripeWebhook.js — Procesa los eventos del webhook de Stripe y mantiene
 * sincronizados el modelo Suscripcion y el estado de la Agencia.
 *
 * Regla de negocio (Fase 6):
 *  - Suscripción activa/trial  → agencia ACTIVA
 *  - Impago / cancelación      → agencia SUSPENDIDA
 */
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { stripeService } = require('./stripeService');
const { planPorPriceId } = require('../config/planes');

// Mapea el estado de Stripe al estado de la agencia.
function estadoAgenciaDesdeStripe(estadoStripe) {
  switch (estadoStripe) {
    case 'active':
    case 'trialing':
      return 'ACTIVA';
    case 'past_due':
    case 'unpaid':
    case 'canceled':
    case 'incomplete_expired':
      return 'SUSPENDIDA';
    default:
      return null; // incomplete / otros: no cambiar el estado de la agencia
  }
}

async function upsertSuscripcion(sub) {
  const agenciaId = sub.metadata?.agenciaId || null;
  if (!agenciaId) {
    logger.warn('[Stripe webhook] Suscripción sin agenciaId en metadata; se ignora.');
    return;
  }

  const priceId = sub.items?.data?.[0]?.price?.id || null;
  const plan = planPorPriceId(priceId);
  const periodoFin = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  await prisma.suscripcion.upsert({
    where: { agenciaId },
    create: {
      agenciaId,
      plan: plan?.id || 'SILVER',
      estado: sub.status,
      stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      periodoActualFin: periodoFin,
      cancelaAlFinalPeriodo: !!sub.cancel_at_period_end,
    },
    update: {
      plan: plan?.id || undefined,
      estado: sub.status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      periodoActualFin: periodoFin,
      cancelaAlFinalPeriodo: !!sub.cancel_at_period_end,
    },
  });

  // Sincronizar el estado de la agencia según el estado de la suscripción.
  const nuevoEstado = estadoAgenciaDesdeStripe(sub.status);
  if (nuevoEstado) {
    const data = { estado: nuevoEstado };
    if (nuevoEstado === 'ACTIVA') {
      data.activadaEn = new Date();
      if (plan?.id) data.plan = plan.id;
    }
    await prisma.agencia.update({ where: { id: agenciaId }, data }).catch((e) =>
      logger.error('[Stripe webhook] Error actualizando agencia:', e.message)
    );
  }
  logger.info(`[Stripe webhook] Suscripción ${sub.status} para agencia ${agenciaId}`);
}

async function manejarWebhookStripe(req, res) {
  if (!stripeService.enabled) {
    return res.status(503).send('Stripe no configurado');
  }

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripeService.construirEvento(req.body, signature);
  } catch (err) {
    logger.error('[Stripe webhook] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertSuscripcion(event.data.object);
        break;
      case 'invoice.payment_failed': {
        // Marcar agencia como suspendida ante impago.
        const sub = event.data.object;
        const agenciaId = sub.subscription_details?.metadata?.agenciaId;
        if (agenciaId) {
          await prisma.agencia.update({ where: { id: agenciaId }, data: { estado: 'SUSPENDIDA' } })
            .catch(() => {});
          logger.warn(`[Stripe webhook] Impago: agencia ${agenciaId} suspendida.`);
        }
        break;
      }
      default:
        // Otros eventos: ignorar silenciosamente.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error('[Stripe webhook] Error procesando evento:', err.message);
    res.status(500).send('Error procesando webhook');
  }
}

module.exports = { manejarWebhookStripe };
