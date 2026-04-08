const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// Banco de frases por intención para simular IA (sin clave de OpenAI)
const RESPUESTAS_IA = {
  disponibilidad: (props) =>
    `¡Hola! Soy Sofía, asistente de Ibiza Luxury Dreams 🌴 Permítame consultar nuestra disponibilidad. Actualmente tenemos ${props.length > 0 ? props.slice(0, 2).map(p => `«${p.nombre}» en ${p.zona}`).join(' y ') : 'varias villas disponibles en Ibiza'} que podrían encajar con lo que busca. ¿Me puede indicar las fechas exactas de su estancia?`,
  precio: (props) =>
    props.length > 0
      ? `Por supuesto. Las villas disponibles oscilan entre ${Math.min(...props.map(p => p.alquilerVacacional?.precioTemporadaBaja || 5000)).toLocaleString('es-ES')}€ y ${Math.max(...props.map(p => p.alquilerVacacional?.precioTemporadaAlta || 20000)).toLocaleString('es-ES')}€ por semana según temporada. ¿Le gustaría que le envíe el dossier completo de alguna?`
      : `Nuestras villas en Ibiza tienen precios adaptados a cada temporada. ¿Le gustaría que le indique los precios para fechas concretas?`,
  contacto: () =>
    `Para atenderle personalmente, le recomiendo que me facilite su correo electrónico y le prepararemos una propuesta personalizada en menos de 24 horas. También puede llamarnos directamente. ¿Prefiere que le tengamos localizado por email o por teléfono?`,
  saludo: () =>
    `¡Hola! Soy Sofía, la asistente virtual de Ibiza Luxury Dreams ✨ Estoy aquí para ayudarle a encontrar su villa perfecta en Ibiza. ¿Está buscando para alquiler vacacional o le interesa una propiedad de compra?`,
  default: (props) =>
    props.length > 0
      ? `Entendido. Tenemos un portfolio de más de ${props.length} propiedades exclusivas en Ibiza. ¿Qué zona le atrae más? Sant Josep, Talamanca, Jesus, Sant Antoni o Las Salinas son zonas muy solicitadas.`
      : `Ibiza Luxury Dreams le ofrece una selección exclusiva de propiedades de lujo en Ibiza. ¿Podría contarme más sobre lo que está buscando?`,
};

function detectarIntencion(mensaje) {
  const m = mensaje.toLowerCase();
  if (m.match(/disponib|libre|ocupad|reser|agosto|julio|semana|fecha/)) return 'disponibilidad';
  if (m.match(/precio|cuest|cuanto|€|euro|presupuest|tarifa|coste/)) return 'precio';
  if (m.match(/contacto|telefono|email|correo|llamar|hablar|agente|persona/)) return 'contacto';
  if (m.match(/hola|buenas|hello|buen dia|buenos dias/)) return 'saludo';
  return 'default';
}

function detectarEmailYTelefono(mensaje) {
  const email = mensaje.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const telefono = mensaje.match(/\+?[\d\s\-/.]{9,15}/)?.[0]?.replace(/\s/g, '');
  return { email, telefono };
}

// POST /api/whatsapp/message — Respuesta IA con contexto del CRM
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message requerido' });

    // Obtener propiedades vacacionales disponibles para dar contexto a la IA
    const propiedades = await prisma.propiedad.findMany({
      where: { tipo: 'VACACIONAL', estado: 'DISPONIBLE', activo: true },
      include: { alquilerVacacional: { select: { precioTemporadaAlta: true, precioTemporadaBaja: true } } },
      select: {
        id: true, nombre: true, zona: true, habitaciones: true,
        alquilerVacacional: true,
      },
      take: 10,
    });

    const intencion = detectarIntencion(message);
    const generarRespuesta = RESPUESTAS_IA[intencion] || RESPUESTAS_IA.default;
    const respuesta = generarRespuesta(propiedades);

    // Detectar datos de contacto para auto-crear lead
    const { email, telefono } = detectarEmailYTelefono(message);

    res.json({
      respuesta,
      intencion,
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
    if (!email && !telefono) return res.status(400).json({ error: 'Email o teléfono requerido' });

    // Evitar duplicados
    const existe = await prisma.cliente.findFirst({
      where: { OR: [email ? { email } : {}, telefono ? { telefono } : {}] },
    });

    if (existe) {
      return res.json({ ok: true, lead: existe, nuevo: false, mensaje: 'Lead ya existente actualizado' });
    }

    const lead = await prisma.cliente.create({
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

    res.json({ ok: true, lead, nuevo: true, mensaje: 'Lead creado automáticamente desde WhatsApp' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando lead', detail: err.message });
  }
});

// GET /api/whatsapp/leads-recientes — Leads capturados recientemente desde WhatsApp
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

module.exports = router;
