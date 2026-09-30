/**
 * WhatsApp Cloud API Webhook Handler
 * Meta for Developers - WhatsApp Business Platform
 * 
 * Endpoints:
 * - GET /api/whatsapp/webhook (verify webhook)
 * - POST /api/whatsapp/webhook (recibir mensajes)
 */

const express = require('express');
const crypto = require('crypto');
const { iaService } = require('../services/iaService');
const { prisma } = require('../utils/prisma');

// Agencia por defecto para los leads entrantes de WhatsApp (multi-tenant).
// El webhook público de Meta no identifica la agencia, así que se asocia mediante
// esta variable de entorno. Si no está configurada, el lead queda sin agencia.
const DEFAULT_AGENCIA_ID = process.env.WHATSAPP_DEFAULT_AGENCIA_ID || null;

async function getPropiedadesPorZona(tipo, agenciaId = DEFAULT_AGENCIA_ID) {
  const where = { tipo, activo: true };
  if (agenciaId) where.agenciaId = agenciaId;
  return await prisma.propiedad.findMany({
    where,
    take: 5,
    orderBy: { creadoEn: 'desc' }
  });
}

async function updateClienteEstado(clienteId, estado) {
  return await prisma.cliente.update({
    where: { id: clienteId },
    data: { estado }
  });
}

const router = express.Router();
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'crm_ibiza_whatsapp_2024';

// Guarda el cuerpo crudo del webhook para poder verificar la firma HMAC después,
// una vez resuelta la agencia (cada agencia puede tener su propio app secret).
// Se registra en express.json({ verify }).
function verifySignature(req, res, buf) {
  req.rawBody = buf;
}

/**
 * Resuelve la configuración de WhatsApp de una agencia a partir del phone_number_id
 * que Meta incluye en el webhook. Cada agencia guarda sus credenciales en
 * ConfiguracionAgencia. Si no se encuentra, cae a las variables de entorno globales
 * (compatibilidad hacia atrás / entorno de desarrollo).
 * @param {string} phoneNumberId
 * @returns {Promise<{agenciaId: string|null, phoneId: string, token: string, appSecret: string, verifyToken: string}>}
 */
async function resolverConfigWhatsApp(phoneNumberId) {
  const globalCfg = {
    agenciaId: DEFAULT_AGENCIA_ID,
    phoneId: process.env.WHATSAPP_PHONE_ID || '',
    token: process.env.WHATSAPP_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || VERIFY_TOKEN,
  };
  if (!phoneNumberId) return globalCfg;

  try {
    const cfg = await prisma.configuracionAgencia.findFirst({
      where: { whatsappPhoneId: phoneNumberId },
    });
    if (cfg) {
      return {
        agenciaId: cfg.agenciaId || DEFAULT_AGENCIA_ID,
        phoneId: cfg.whatsappPhoneId || globalCfg.phoneId,
        token: cfg.whatsappToken || globalCfg.token,
        appSecret: cfg.whatsappAppSecret || globalCfg.appSecret,
        verifyToken: cfg.whatsappVerifyToken || globalCfg.verifyToken,
      };
    }
  } catch (err) {
    console.error('Error resolviendo config WhatsApp por agencia:', err.message);
  }
  return globalCfg;
}

// Verifica la firma HMAC del webhook con el app secret indicado.
function firmaValida(rawBody, signature, appSecret) {
  if (!appSecret || !signature || !rawBody) return false;
  try {
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// GET: Webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.status(403).send('Verification failed');
  }
});

// POST: Recibir mensajes entrantes
router.post('/webhook', express.json({ verify: verifySignature }), async (req, res) => {
  const body = req.body;

  // Extraer el phone_number_id para resolver la agencia y sus credenciales.
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  const cfg = await resolverConfigWhatsApp(phoneNumberId);

  // Si la agencia (o el entorno) tiene app secret, exigimos firma válida.
  const signature = req.headers['x-hub-signature-256'];
  if (cfg.appSecret) {
    if (!firmaValida(req.rawBody, signature, cfg.appSecret)) {
      console.error('❌ WhatsApp webhook: firma HMAC inválida');
      return res.status(401).send('Invalid signature');
    }
  }

  // Check if it's a message
  if (body.object && body.entry && body.entry[0]?.changes) {
    for (const change of body.entry[0].changes) {
      if (change.value?.messages) {
        for (const message of change.value.messages) {
          try {
            await handleIncomingMessage(message, cfg);
          } catch (err) {
            console.error('❌ Error procesando mensaje WhatsApp:', err.message);
          }
        }
      }
    }
  }

  res.status(200).send('OK');
});

// Manejar mensaje entrante
async function handleIncomingMessage(message, cfg = {}) {
  const from = message.from; // Número del cliente
  const text = message.text?.body;

  if (!text) return;

  const agenciaId = cfg.agenciaId || DEFAULT_AGENCIA_ID;
  console.log(`💬 Mensaje de ${from}: ${text}`);

  // 1. Guardar o actualizar cliente (en la agencia dueña de este número)
  let cliente = await getOrCreateCliente(from, text, agenciaId);

  // 2. Determinar intención del mensaje
  const intento = detectarIntencion(text);

  // 3. Generar respuesta con IA
  let respuesta = '';

  switch (intento) {
    case 'VACACIONAL':
      respuesta = await generarRespuestaVacacional(cliente, text, agenciaId);
      break;
    case 'LARGA_DURACION':
      respuesta = await generarRespuestaLargaDuracion(cliente, text, agenciaId);
      break;
    case 'COMPRA':
      respuesta = await generarRespuestaCompra(cliente, text, agenciaId);
      break;
    case 'PRECIO':
      respuesta = await generarRespuestaPrecio(cliente);
      break;
    case 'AGENDAR_VISITA':
      respuesta = await agendarVisita(cliente);
      break;
    default:
      respuesta = await generarRespuestaDefault(cliente, text);
  }

  // 4. Enviar respuesta con las credenciales de la agencia
  await enviarMensajeWhatsApp(from, respuesta, cfg);
}

// Obtener o crear cliente
async function getOrCreateCliente(phone, mensaje, agenciaId = DEFAULT_AGENCIA_ID) {
  // Buscar por teléfono (acotado a la agencia dueña del número si se conoce)
  const whereCliente = { telefono: phone };
  if (agenciaId) whereCliente.agenciaId = agenciaId;
  const clientes = await prisma.cliente.findMany({ where: whereCliente });

  if (clientes.length > 0) {
    return clientes[0];
  }

  // Crear nuevo cliente (asignado a la agencia dueña del número)
  return await prisma.cliente.create({
    data: {
      nombre: `Lead ${phone}`,
      apellidos: 'WhatsApp',
      telefono: phone,
      tipo: 'AMBOS',
      estado: 'NUEVO',
      origen: 'WHATSAPP',
      notas: `Mensaje inicial: ${mensaje}`,
      whatsappContactado: true,
      ...(agenciaId ? { agenciaId } : {}),
    }
  });
}

// Detectar intención del mensaje
function detectarIntencion(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('vacacional') || lower.includes('villa') || lower.includes('verano')) {
    return 'VACACIONAL';
  }
  if (lower.includes('larga') || lower.includes('mensual') || lower.includes('alquiler')) {
    return 'LARGA_DURACION';
  }
  if (lower.includes('comprar') || lower.includes('venta') || lower.includes('compra')) {
    return 'COMPRA';
  }
  if (lower.includes('precio') || lower.includes('coste') || lower.includes('cuánto')) {
    return 'PRECIO';
  }
  if (lower.includes('visita') || lower.includes('cita') || lower.includes('ver')) {
    return 'AGENDAR_VISITA';
  }
  
  return 'DEFAULT';
}

// Generar respuesta según intención
async function generarRespuestaVacacional(cliente, text, agenciaId = DEFAULT_AGENCIA_ID) {
  // Buscar villas vacacionales
  const villas = await getPropiedadesPorZona('VACACIONAL', agenciaId);
  
  if (villas.length === 0) {
    return "Por el momento no tenemos villas vacacionales disponibles. ¿Te interesa que te avise cuando aparezcan nuevas? 🏖️";
  }

  // Top 3 villas
  const topVillas = villas.slice(0, 3);
  
  let respuesta = "🏖️ ¡Tenemos villas vacacionales disponibles! Aquí tienes algunas opciones:\n\n";
  
  for (const villa of topVillas) {
    respuesta += `✨ *${villa.nombre}*\n`;
    respuesta += `📍 ${villa.zona}\n`;
    respuesta += `🛏️ ${villa.habitaciones} habitaciones | 🚿 ${villa.banos} baños\n`;
    respuesta += `📐 ${villa.metros}m²\n`;
    respuesta += `💰 Desde ${villa.precio}€/semana\n`;
    respuesta += `🔗 Ver ficha: ${process.env.FRONTEND_URL}/propiedad/${villa.id}\n\n`;
  }

  respuesta += "¿Te gustaría que te enviara más información o agendemos una llamada para darte detalles? 📞";

  // Guardar interacción
  await prisma.actividad.create({
    data: {
      clienteId: cliente.id,
      tipo: 'WHATSAPP',
      contenido: `Consultó villas vacacionales: ${text}`,
      resultado: 'RESPUESTA_ENVIADA'
    }
  });

  return respuesta;
}

async function generarRespuestaLargaDuracion(cliente, text, agenciaId = DEFAULT_AGENCIA_ID) {
  const pisos = await getPropiedadesPorZona('LARGA_DURACION', agenciaId);
  
  if (pisos.length === 0) {
    return "Por el momento no tenemos pisos para alquiler de larga duración. ¿Te interesa que te avise cuando aparezcan nuevas? 🏡";
  }

  const topPisos = pisos.slice(0, 3);
  
  let respuesta = "🏠 ¡Tenemos opciones para larga duración! Aquí tienes algunas:\n\n";
  
  for (const piso of topPisos) {
    respuesta += `✨ *${piso.nombre}*\n`;
    respuesta += `📍 ${piso.zona}\n`;
    respuesta += `🛏️ ${piso.habitaciones} habitaciones | 🚿 ${piso.banos} baños\n`;
    respuesta += `💰 Alquiler: ${piso.precio}€/mes\n`;
    respuesta += `🔗 Ver ficha: ${process.env.FRONTEND_URL}/propiedad/${piso.id}\n\n`;
  }

  respuesta += "¿Te gustaría agendar una llamada para ver disponibilidad? 📞";

  return respuesta;
}

async function generarRespuestaCompra(cliente, text, agenciaId = DEFAULT_AGENCIA_ID) {
  const ventas = await getPropiedadesPorZona('VENTA', agenciaId);
  
  if (ventas.length === 0) {
    return "Por el momento no tenemos propiedades en venta. ¿Te interesa que te avise cuando aparezcan nuevas? 🏛️";
  }

  const topVentas = ventas.slice(0, 3);
  
  let respuesta = "🏛️ ¡Tenemos propiedades en venta! Aquí tienes algunas:\n\n";
  
  for (const venta of topVentas) {
    respuesta += `✨ *${venta.nombre}*\n`;
    respuesta += `📍 ${venta.zona}\n`;
    respuesta += `🛏️ ${venta.habitaciones} habitaciones | 🚿 ${venta.banos} baños\n`;
    respuesta += `📐 ${venta.metros}m²\n`;
    respuesta += `💰 ${venta.precio}€\n`;
    respuesta += `🔗 Ver ficha: ${process.env.FRONTEND_URL}/propiedad/${venta.id}\n\n`;
  }

  respuesta += "¿Cuál es tu presupuesto aproximado para poder recomendarte mejor? 💰";

  return respuesta;
}

async function generarRespuestaPrecio(cliente) {
  let respuesta = "💰 Aquí tienes nuestras tarifas estimadas:\n\n";
  respuesta += "🌴 *Alquiler Vacacional*: desde 2.100€/semana (baja) hasta 8.500€+ (alta)\n";
  respuesta += "🏠 *Alquiler Larga Duración*: desde 1.400€/mes\n";
  respuesta += "🏛️ *Venta*: desde 350.000€ hasta 6.000.000€\n\n";
  respuesta += "¿Quieres que te enviemos el catálogo completo con todas las propiedades disponibles? 📄";

  return respuesta;
}

async function agendarVisita(cliente) {
  await updateClienteEstado(cliente.id, 'VISITA_AGENDADA');

  return "📅 ¡Perfecto! He agendado tu visita. Un agente te contactará en breve para coordinar la fecha y hora. 😊";
}

async function generarRespuestaDefault(cliente, text) {
  // Usar IA para generar respuesta personalizada (con fallback si no hay IA)
  const prompt = `Responde como agente inmobiliario de lujo en Ibiza, de forma amable y profesional, a la consulta de un cliente interesado en propiedades en Ibiza.\n\nConsulta del cliente: "${text}"\n\nResponde en máximo 100 caracteres, de forma concisa y útil.`;

  const respuestaIA = await iaService.generarRespuestaChat(prompt, { maxTokens: 120 });

  return respuestaIA || "Gracias por tu mensaje. Un agente se pondrá en contacto contigo en breve para ayudarte. 😊";
}

// Enviar mensaje WhatsApp usando las credenciales de la agencia (o el env global).
async function enviarMensajeWhatsApp(to, message, cfg = {}) {
  const phoneNumberId = cfg.phoneId || process.env.WHATSAPP_PHONE_ID;
  const accessToken = cfg.token || process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error('❌ WhatsApp credentials not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    );

    const data = await response.json();
    console.log('✅ WhatsApp message sent:', data);
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
  }
}

module.exports = router;
