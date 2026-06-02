const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const OpenAI = require('openai').default;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Funciones utilitarias
function detectarEmailYTelefono(mensaje) {
  const email = mensaje.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const telefono = mensaje.match(/\+?[\d\s\-/.]{9,15}/)?.[0]?.replace(/\s/g, '');
  return { email, telefono };
}

async function procesarMensajeConIA(mensaje, propiedades, history = []) {
  if (!openai) {
    return "Lo siento, el asistente inteligente está desactivado por falta de configuración (OpenAI Key).";
  }

  const contextData = propiedades.map(p => 
    `- ${p.nombre} (${p.zona}): ${p.habitaciones} hab. Temp Alta: ${p.alquilerVacacional?.precioTemporadaAlta}€, Baja: ${p.alquilerVacacional?.precioTemporadaBaja}€`
  ).join('\n');

  const systemPrompt = `Eres Sofía, asistente inteligente de Ibiza Luxury Dreams.
Tu objetivo es ayudar a clientes de lujo a encontrar su villa ideal. Responde con elegancia, cordialidad y exclusividad.
Usa emojis sutiles. NUNCA inventes villas ni des precios falsos.
Si te piden disponibilidad o opciones, ofréceles basándote en este inventario actual:
${contextData}

Importante:
- Si el cliente te pide detalles o quiere avanzar, pídele SIEMPRE su email o teléfono para que un agente humano le contacte.
- Mantén respuestas relativamente cortas y directas, fáciles de leer en WhatsApp.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: mensaje }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.5,
      max_tokens: 400,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error en OpenAI:', error);
    return "Disculpe, en este momento estamos teniendo un alto volumen de consultas. Por favor, facilíteme su correo electrónico y un asesor le contactará en breve.";
  }
}

async function guardarLeadAutomatico(nombre, email, telefono, mensaje) {
  if (!email && !telefono) return null;
  
  const existe = await prisma.cliente.findFirst({
    where: { OR: [email ? { email } : {}, telefono ? { telefono } : {}] },
  });

  if (existe) return existe;

  return await prisma.cliente.create({
    data: {
      nombre: nombre || 'Lead WhatsApp',
      apellidos: '',
      email: email || null,
      telefono: telefono || null,
      tipo: 'INQUILINO',
      estado: 'NUEVO',
      notas: `Lead capturado automáticamente desde WhatsApp Bot.\n${mensaje ? `Mensaje: "${mensaje}"` : ''}`,
      activo: true,
    },
  });
}

// ---------------------------------------------------------
// RUTAS PARA EL SIMULADOR DEL FRONTEND (Local)
// ---------------------------------------------------------

// POST /api/whatsapp/message — Respuesta IA con contexto del CRM
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message requerido' });

    const propiedades = await prisma.propiedad.findMany({
      where: { tipo: 'VACACIONAL', estado: 'DISPONIBLE', activo: true },
      include: { alquilerVacacional: { select: { precioTemporadaAlta: true, precioTemporadaBaja: true } } },
      take: 10,
    });

    const respuesta = await procesarMensajeConIA(message, propiedades, conversationHistory);
    const { email, telefono } = detectarEmailYTelefono(message);

    res.json({
      respuesta,
      intencion: 'generado-ia',
      datosDetectados: { email, telefono },
      tieneContacto: !!(email || telefono),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generando respuesta IA', detail: err.message });
  }
});

// POST /api/whatsapp/guardar-lead — Auto-crear lead desde conversación WhatsApp
router.post('/guardar-lead', authenticate, async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;
    const lead = await guardarLeadAutomatico(nombre, email, telefono, mensaje);
    if (!lead) return res.status(400).json({ error: 'Faltan datos de contacto' });
    res.json({ ok: true, lead, nuevo: true, mensaje: 'Lead procesado' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando lead', detail: err.message });
  }
});

// GET /api/whatsapp/leads-recientes
router.get('/leads-recientes', authenticate, async (req, res) => {
  try {
    const leads = await prisma.cliente.findMany({
      where: { notas: { contains: 'Lead capturado automáticamente desde WhatsApp' }, activo: true },
      orderBy: { creadoEn: 'desc' },
      take: 20,
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo leads', detail: err.message });
  }
});

// ---------------------------------------------------------
// RUTAS PARA META GRAPH API (WEBHOOK REAL)
// ---------------------------------------------------------

// GET /api/whatsapp/webhook — Verificación de Meta
router.get('/webhook', (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// POST /api/whatsapp/webhook — Recepción de Mensajes de Meta
router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      const waId = body.entry[0].changes[0].value.contacts[0].wa_id;
      const contactName = body.entry[0].changes[0].value.contacts[0].profile.name;
      const messageObj = body.entry[0].changes[0].value.messages[0];
      
      // Responder a Facebook inmediatamente (Requerido 200 OK)
      res.sendStatus(200);

      if (messageObj.type === 'text') {
        const messageText = messageObj.text.body;
        console.log(`Mensaje recibido de ${contactName} (${waId}): ${messageText}`);

        try {
          // 1. Asegurar la creación del lead para tener un clienteId
          const { email, telefono } = detectarEmailYTelefono(messageText);
          const cliente = await guardarLeadAutomatico(contactName, email, telefono || waId, messageText);

          let history = [];
          
          if (cliente) {
            // Guardar el mensaje entrante
            await prisma.mensajeWhatsApp.create({
              data: { clienteId: cliente.id, rol: 'user', contenido: messageText }
            });

            // Cargar los últimos 6 mensajes para construir el contexto
            const ultimosMensajes = await prisma.mensajeWhatsApp.findMany({
              where: { clienteId: cliente.id },
              orderBy: { creadoEn: 'desc' },
              take: 6
            });
            
            // Ordenar cronológicamente (ascendente)
            history = ultimosMensajes.reverse().map(m => ({
              role: m.rol,
              content: m.contenido
            }));
            
            // Eliminar el último (el actual) porque procesarMensajeConIA lo añade al final
            history.pop();
          }

          // 2. Cargar propiedades
          const propiedades = await prisma.propiedad.findMany({
            where: { tipo: 'VACACIONAL', estado: 'DISPONIBLE', activo: true },
            include: { alquilerVacacional: { select: { precioTemporadaAlta: true, precioTemporadaBaja: true } } },
            take: 10,
          });

          // 3. Procesar IA
          const respuesta = await procesarMensajeConIA(messageText, propiedades, history);

          // 4. Guardar respuesta de IA
          if (cliente && respuesta) {
            await prisma.mensajeWhatsApp.create({
              data: { clienteId: cliente.id, rol: 'assistant', contenido: respuesta }
            });
          }

          // 5. Enviar respuesta vía Meta API
          if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
            const fetch = require('node-fetch');
            await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: waId,
                type: "text",
                text: { body: respuesta }
              })
            });
          } else {
            console.warn('WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados. No se envió respuesta real.');
          }

        } catch (error) {
          console.error('Error procesando webhook interno:', error);
        }
      }
    } else {
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
