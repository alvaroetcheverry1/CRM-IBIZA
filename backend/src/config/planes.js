/**
 * Catálogo de planes de SYNNER CRM — fuente de verdad del backend.
 * Precios en EUR/mes + IVA, cargo mensual, sin permanencia.
 * Los `stripePriceId` se rellenan con variables de entorno (se crean en Stripe).
 */

// Descuento aplicado al pago anual (15%).
const DESCUENTO_ANUAL = 0.15;

const PLANES = {
  CORE: {
    id: 'CORE',
    nivel: 'NIVEL I',
    nombre: 'Core',
    descripcion: 'Para agencias boutique que inician su automatización',
    precioMensual: 199, // EUR, + IVA
    precioAnual: 2030,  // 199 x 12 x 0,85 ≈ 2030 EUR/año (~169/mes), + IVA
    moneda: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_CORE || null,
    stripePriceIdAnual: process.env.STRIPE_PRICE_CORE_ANUAL || null,
    limites: {
      referenciasActivas: 50,
      dossiersIAmes: 20,
      icalPropiedades: 5,
      catalogosMes: 20,
      usuarios: 2,
    },
    caracteristicas: [
      '50 referencias activas',
      '20 dossiers IA al mes',
      'Channel Manager iCal (5 propiedades)',
      'Catálogos con tracking (20 al mes)',
      'Portal del propietario básico',
      '2 usuarios incluidos',
    ],
  },
  INTELLIGENCE: {
    id: 'INTELLIGENCE',
    nivel: 'NIVEL II',
    nombre: 'Intelligence',
    descripcion: 'Para agencias en crecimiento con operación continua',
    precioMensual: 399,
    precioAnual: 4070, // 399 x 12 x 0,85 ≈ 4070 EUR/año (~339/mes), + IVA
    moneda: 'EUR',
    recomendado: true,
    stripePriceId: process.env.STRIPE_PRICE_INTELLIGENCE || null,
    stripePriceIdAnual: process.env.STRIPE_PRICE_INTELLIGENCE_ANUAL || null,
    limites: {
      referenciasActivas: null, // ilimitado
      dossiersIAmes: null,
      icalPropiedades: null,
      catalogosMes: null,
      usuarios: 5,
    },
    caracteristicas: [
      'Referencias ilimitadas',
      'Ingesta documental IA ilimitada',
      'Channel Manager iCal ilimitado',
      'Matchmaking 0–100 con argumento IA',
      'Agente conversacional 24/7',
      'Catálogos con tracking ilimitados',
      'Sindicación a portales masivos',
      '5 usuarios con roles RBAC',
    ],
  },
  AUTONOMOUS: {
    id: 'AUTONOMOUS',
    nivel: 'NIVEL III',
    nombre: 'Autonomous',
    descripcion: 'Para redes y grupos que automatizan toda la cadena',
    precioMensual: 599,
    precioAnual: 6110, // 599 x 12 x 0,85 ≈ 6110 EUR/año (~509/mes), + IVA
    moneda: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_AUTONOMOUS || null,
    stripePriceIdAnual: process.env.STRIPE_PRICE_AUTONOMOUS_ANUAL || null,
    usuarioAdicional: 29, // EUR/mes por usuario extra
    limites: {
      referenciasActivas: null,
      dossiersIAmes: null,
      icalPropiedades: null,
      catalogosMes: null,
      usuarios: 10,
    },
    caracteristicas: [
      'Todo lo incluido en Intelligence',
      'Marca blanca integral con dominio propio',
      'Agentes legal y de captación',
      'Sindicación JamesEdition ultra-lujo',
      'Migración masiva desde Drive',
      'API abierta y webhooks a medida',
      '10 usuarios incluidos · adicional +29 €/mes',
      'Implantación dedicada y SLA 99,9%',
    ],
  },
};

const PLAN_IDS = Object.keys(PLANES);

// Devuelve el plan (y el periodo) a partir de un stripePriceId. Usado por el webhook.
function planPorPriceId(priceId) {
  if (!priceId) return null;
  for (const p of Object.values(PLANES)) {
    if (p.stripePriceId === priceId) return { ...p, periodo: 'mensual' };
    if (p.stripePriceIdAnual === priceId) return { ...p, periodo: 'anual' };
  }
  return null;
}

// Devuelve el stripePriceId según plan y periodo ('mensual' | 'anual').
function priceIdDe(plan, periodo) {
  if (!plan) return null;
  return periodo === 'anual' ? plan.stripePriceIdAnual : plan.stripePriceId;
}

module.exports = { PLANES, PLAN_IDS, DESCUENTO_ANUAL, planPorPriceId, priceIdDe };
