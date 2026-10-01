/**
 * stripeService.js — Integración con Stripe para suscripciones SaaS.
 * Se inicializa solo si STRIPE_SECRET_KEY está configurada; si no, queda en modo
 * deshabilitado (las rutas devuelven 503) para no romper el arranque sin claves.
 */
const { logger } = require('../utils/logger');

const secretKey = process.env.STRIPE_SECRET_KEY || null;
let stripe = null;
if (secretKey) {
  // eslint-disable-next-line global-require
  stripe = require('stripe')(secretKey);
  logger.info('[Stripe] Cliente inicializado.');
} else {
  logger.info('[Stripe] STRIPE_SECRET_KEY no configurada; pagos deshabilitados.');
}

const stripeService = {
  get enabled() {
    return !!stripe;
  },
  client: stripe,

  /**
   * Crea (o reutiliza) una sesión de Checkout para suscribir a una agencia a un plan.
   * @param {object} opts { priceId, agenciaId, email, successUrl, cancelUrl, customerId }
   * @returns {Promise<{url: string, id: string}>}
   */
  async crearCheckoutSuscripcion({ priceId, agenciaId, email, successUrl, cancelUrl, customerId }) {
    if (!stripe) throw new Error('Stripe no está configurado');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId || undefined,
      customer_email: customerId ? undefined : email,
      client_reference_id: agenciaId,
      metadata: { agenciaId },
      subscription_data: { metadata: { agenciaId } },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    return { url: session.url, id: session.id };
  },

  /**
   * Crea una sesión del portal de cliente de Stripe (gestionar/cancelar suscripción).
   */
  async crearPortalCliente(customerId, returnUrl) {
    if (!stripe) throw new Error('Stripe no está configurado');
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },

  /**
   * Verifica y construye el evento del webhook a partir del cuerpo crudo y la firma.
   */
  construirEvento(rawBody, signature) {
    if (!stripe) throw new Error('Stripe no está configurado');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET no configurado');
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  },
};

module.exports = { stripeService };
