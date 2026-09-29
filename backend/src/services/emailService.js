const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Configuración de transportador SMTP
// Se intentará usar variables de entorno. Si no existen, se creará un transportador simulado (Ethereal) o se logueará en consola.
let transporter;

async function initTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    logger.info(`[EmailService] Usando configuración SMTP real: ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  } else {
    logger.info('[EmailService] SMTP no configurado en .env. Creando transportador de prueba Ethereal...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      logger.info(`[EmailService] Transportador Ethereal creado. Usuario: ${testAccount.user}`);
    } catch (err) {
      logger.warn('[EmailService] Error creando cuenta Ethereal, usando fallback de consola:', err.message);
      // Fallback: objeto mock que simula el transporter
      transporter = {
        sendMail: async (mailOptions) => {
          logger.info(`[MOCK EMAIL] Enviando a ${mailOptions.to}`);
          logger.info(`Asunto: ${mailOptions.subject}`);
          logger.info(`Cuerpo HTML:\n${mailOptions.html}`);
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }
  return transporter;
}

const emailService = {
  sendWelcomeEmail: async (leadEmail, leadNombre, cliente = null) => {
    if (!leadEmail) {
      logger.warn('[EmailService] Intento de enviar email a un lead sin dirección de correo.');
      return;
    }
    
    try {
      const activeTransporter = await initTransporter();
      
      let personalizedText = `Queremos darte la más cálida bienvenida a Ibiza Inteligente. Agradecemos enormemente tu interés en nuestros servicios de corretaje de propiedades exclusivas en la isla. Hemos registrado correctamente tu perfil y nos hemos puesto en marcha para buscar las propiedades que mejor se adapten a ti.`;
      
      if (cliente) {
        try {
          const { iaService } = require('./iaService');
          personalizedText = await iaService.generarEmailBienvenidaPersonalizado(cliente);
        } catch (iaErr) {
          logger.warn('[EmailService] Error al generar email personalizado con IA, usando por defecto:', iaErr.message);
        }
      }
      
      const mailOptions = {
        from: `"Ibiza Inteligente CRM" <${process.env.SMTP_FROM || 'no-reply@ibizainteligente.com'}>`,
        to: leadEmail,
        subject: `¡Bienvenido a Ibiza Inteligente, ${leadNombre}!`,
        text: `Hola ${leadNombre},\n\n${personalizedText.replace(/<[^>]*>/g, '')}\n\nAtentamente,\nEl equipo de Ibiza Inteligente`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg,#1A3A5C,#2D5F8F); padding: 20px; text-align: center; border-radius: 6px 6px 0 0; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;">Ibiza Inteligente</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85;">Mediterranean Luxury Real Estate</p>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <h2 style="color: #1a3a5c; font-size: 20px; margin-top: 0;">¡Hola ${leadNombre}!</h2>
              <p>${personalizedText}</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #c5a880; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; font-weight: 600; color: #1e293b;">¿Qué pasa a continuación?</p>
                <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 14px; color: #475569;">
                  <li>Un asesor comercial asignado evaluará tu solicitud.</li>
                  <li>Te enviaremos una preselección personalizada de villas y parcelas.</li>
                  <li>Organizaremos una primera llamada o reunión para resolver cualquier duda.</li>
                </ul>
              </div>
              <p>Si deseas acelerar el proceso o añadir especificaciones adicionales, puedes responder directamente a este correo electrónico.</p>
              <p style="margin-top: 30px;">Atentamente,<br/><strong style="color: #1a3a5c;">El Equipo de Ibiza Inteligente</strong></p>
            </div>
            <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">Este es un mensaje automático, por favor no responda directamente a esta dirección.</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Ibiza Inteligente CRM. Todos los derechos reservados.</p>
            </div>
          </div>
        `
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`[EmailService] Correo de bienvenida enviado a ${leadEmail}. ID: ${info.messageId}`);
      if (info.messageId && info.messageId.includes('ethereal')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`[EmailService] Enlace de vista previa de correo Ethereal: ${previewUrl}`);
      }
      return info;
    } catch (err) {
      logger.error(`[EmailService] Error al enviar correo a ${leadEmail}:`, err.message);
    }
  },
  sendVillaProposal: async (clientEmail, clientNombre, propiedades, fechaEntrada, fechaSalida) => {
    if (!clientEmail) {
      logger.warn('[EmailService] Intento de enviar propuesta a cliente sin dirección de correo.');
      return;
    }
    try {
      const activeTransporter = await initTransporter();
      
      const formatMoney = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
      
      const villasHtml = propiedades.map(p => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <h3 style="color: #1a3a5c; margin: 0 0 10px 0; font-size: 16px;">${p.nombre}</h3>
          <p style="margin: 0 0 5px 0; font-size: 14px; color: #475569;">
            <strong>Zona:</strong> ${p.zona} | <strong>Habitaciones:</strong> ${p.habitaciones} | <strong>Baños:</strong> ${p.banos}
          </p>
          ${p.alquilerVacacional?.precioTemporadaAlta ? `
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #c9a84c; font-weight: bold;">
              Precio Estimado: ${formatMoney(Number(p.alquilerVacacional.precioTemporadaAlta))}/semana
            </p>
          ` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/propiedades/${p.id}" style="display: inline-block; background-color: #1a3a5c; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: bold;">Ver detalles de la villa</a>
        </div>
      `).join('');

      const mailOptions = {
        from: `"Ibiza Inteligente CRM" <${process.env.SMTP_FROM || 'no-reply@ibizainteligente.com'}>`,
        to: clientEmail,
        subject: `Propuesta de Villas Disponibles para tus fechas en Ibiza - ${clientNombre}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg,#1A3A5C,#2D5F8F); padding: 20px; text-align: center; border-radius: 6px 6px 0 0; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;">Ibiza Inteligente</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85;">Propuestas de Disponibilidad</p>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <h2 style="color: #1a3a5c; font-size: 20px; margin-top: 0;">¡Hola ${clientNombre}!</h2>
              <p>Hemos seleccionado las siguientes villas de lujo disponibles para tu estancia en Ibiza del <strong>${fechaEntrada}</strong> al <strong>${fechaSalida}</strong>:</p>
              
              <div style="margin: 20px 0;">
                ${villasHtml}
              </div>

              <p>Por favor, dinos cuál de estas opciones te gusta más para que podamos proceder con el bloqueo o enviarte más detalles.</p>
              <p style="margin-top: 30px;">Atentamente,<br/><strong style="color: #1a3a5c;">El Equipo de Ibiza Inteligente</strong></p>
            </div>
            <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Ibiza Inteligente CRM. Todos los derechos reservados.</p>
            </div>
          </div>
        `
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`[EmailService] Propuesta de villas enviada a ${clientEmail}. ID: ${info.messageId}`);
      if (info.messageId && info.messageId.includes('ethereal')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`[EmailService] Enlace de vista previa de propuesta Ethereal: ${previewUrl}`);
      }
      return info;
    } catch (err) {
      logger.error(`[EmailService] Error al enviar propuesta a ${clientEmail}:`, err.message);
      throw err;
    }
  },
  sendUserInviteEmail: async (userEmail, userName, rawPassword, agenciaNombre) => {
    try {
      const activeTransporter = await initTransporter();
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      const mailOptions = {
        from: `"Soporte CRM" <${process.env.SMTP_FROM || 'no-reply@ibizainteligente.com'}>`,
        to: userEmail,
        subject: `Has sido invitado a unirte a ${agenciaNombre} en el CRM`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg,#0D1B2A,#1A3A5C); padding: 20px; text-align: center; border-radius: 6px 6px 0 0; color: white;">
              <h1 style="margin: 0; font-size: 24px;">CRM Inmobiliario</h1>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <h2 style="color: #1a3a5c; margin-top: 0;">¡Hola ${userName}!</h2>
              <p>Has sido dado de alta como usuario en el CRM para la agencia <strong>${agenciaNombre}</strong>.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0;"><strong>Tus credenciales de acceso:</strong></p>
                <p style="margin: 0;">Email: <strong>${userEmail}</strong></p>
                <p style="margin: 0;">Contraseña temporal: <strong>${rawPassword}</strong></p>
              </div>
              <p>Puedes acceder a tu panel de control desde el siguiente enlace:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #c9a84c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acceder al CRM</a>
              </p>
              <p>Te recomendamos cambiar tu contraseña una vez que hayas iniciado sesión por primera vez.</p>
            </div>
          </div>
        `
      };

      const info = await activeTransporter.sendMail(mailOptions);
      logger.info(`[EmailService] Invitación enviada a ${userEmail}. ID: ${info.messageId}`);
      if (info.messageId && info.messageId.includes('ethereal')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`[EmailService] Enlace vista previa invitacion Ethereal: ${previewUrl}`);
      }
      return info;
    } catch (err) {
      logger.error(`[EmailService] Error al enviar invitación a ${userEmail}:`, err.message);
    }
  }
};

module.exports = { emailService };
