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
const { sendToOpenAI } = require('../services/iaService');
const { prisma } = require('../utils/prisma');

async function getPropiedadesPorZona(tipo) {
  return await prisma.propiedad.findMany({
    where: { tipo, activo: true },
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

// Helper: Verificar firma HMAC (recomendado por Meta)
function verifySignature(req, res, buf) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
    .update(buf)
    .digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
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

  // Log para debugging
  console.log('📩 WhatsApp webhook received:', JSON.stringify(body, null, 2));

  // Check if it's a message
  if (body.object && body.entry && body.entry[0].changes) {
    for (const change of body.entry[0].changes) {
      if (change.value.messages) {
        for (const message of change.value.messages) {
          await handleIncomingMessage(message);
        }
      }
    }
  }

  res.status(200).send('OK');
});

// Manejar mensaje entrante
async function handleIncomingMessage(message) {
  const from = message.from; // Número del cliente
  const text = message.text?.body;

  if (!text) return;

  console.log(`💬 Mensaje de ${from}: ${text}`);

  // 1. Guardar o actualizar cliente
  let cliente = await getOrCreateCliente(from, text);

  // 2. Determinar intención del mensaje
  const intento = detectarIntencion(text);

  // 3. Generar respuesta con IA
  let respuesta = '';

  switch (intento) {
    case 'VACACIONAL':
      respuesta = await generarRespuestaVacacional(cliente, text);
      break;
    case 'LARGA_DURACION':
      respuesta = await generarRespuestaLargaDuracion(cliente, text);
      break;
    case 'COMPRA':
      respuesta = await generarRespuestaCompra(cliente, text);
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

  // 4. Enviar respuesta
  await enviarMensajeWhatsApp(from, respuesta);
}

// Obtener o crear cliente
async function getOrCreateCliente(phone, mensaje) {
  // Buscar por teléfono
  const clientes = await prisma.cliente.findMany({
    where: { telefono: phone }
  });

  if (clientes.length > 0) {
    return clientes[0];
  }

  // Crear nuevo cliente
  return await prisma.cliente.create({
    data: {
      nombre: `Lead ${phone}`,
      apellidos: 'WhatsApp',
      telefono: phone,
      tipo: 'AMBOS',
      estado: 'NUEVO',
      origen: 'WHATSAPP',
      notas: `Mensaje inicial: ${mensaje}`,
      whatsappContactado: true
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
async function generarRespuestaVacacional(cliente, text) {
  // Buscar villas vacacionales
  const villas = await getPropiedadesPorZona('VACACIONAL');
  
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

async function generarRespuestaLargaDuracion(cliente, text) {
  const pisos = await getPropiedadesPorZona('LARGA_DURACION');
  
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

async function generarRespuestaCompra(cliente, text) {
  const ventas = await getPropiedadesPorZona('VENTA');
  
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

  return respuesta;
}

async function generarRespuestaDefault(cliente, text) {
  // Usar IA para generar respuesta personalizada
  const prompt = `Responde como agente inmobiliario de Ibiza Luxury Dreams, de forma amable y profesional, a la consulta de un cliente interesado en propiedades en Ibiza.\n\nConsulta del cliente: "${text}"\n\nResponde en máximo 100 caracteres, de forma concisa y útil.`;

  const respuestaIA = await sendToOpenAI(prompt, 'RESPONSE_GEN');

  return respuestaIA || "Gracias por tu mensaje. Un agente se pondrá en contacto contigo en breve para ayudarte. 😊";

  return respuesta;
}

// Enviar mensaje WhatsApp
async function enviarMensajeWhatsApp(to, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_TOKEN;

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
