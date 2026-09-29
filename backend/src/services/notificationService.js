const { prisma } = require('../utils/prisma');

const clients = [];

function addClient(agenciaId, res) {
  clients.push({ agenciaId, res });
}

function removeClient(res) {
  const index = clients.findIndex(c => c.res === res);
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

function broadcastNotification(agenciaId, notification) {
  for (const client of clients) {
    if (!client.agenciaId || client.agenciaId === agenciaId || !agenciaId) {
      try {
        client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (err) {
        console.error('[NotificationService] Error escribiendo en conexión SSE:', err.message);
      }
    }
  }
}

/**
 * Crea una notificación persistente en la base de datos
 */
async function createNotification(agenciaId, tipo, titulo, mensaje, enlace = null) {
  try {
    if (!agenciaId) {
      // Intentar buscar la primera agencia activa si no se provee
      const firstAgencia = await prisma.agencia.findFirst({ select: { id: true } });
      agenciaId = firstAgencia?.id || null;
    }

    const notif = await prisma.notificacion.create({
      data: {
        tipo,
        titulo,
        mensaje,
        enlace,
        agenciaId
      }
    });

    // Enviar en tiempo real a clientes SSE
    broadcastNotification(agenciaId, notif);

    return notif;
  } catch (error) {
    console.error('[NotificationService] Error al crear notificación:', error.message);
  }
}

/**
 * Chequea contratos que vencen en los próximos 30 días y genera alertas
 */
async function checkExpiringContractsAndLatePayments(agenciaId) {
  try {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 30);

    const expiringRentals = await prisma.alquilerLargaDuracion.findMany({
      where: {
        fechaVencimiento: { gte: new Date(), lte: limitDate },
        propiedad: { activo: true, ...(agenciaId ? { agenciaId } : {}) }
      },
      include: {
        propiedad: { select: { nombre: true } }
      }
    });

    for (const r of expiringRentals) {
      // Evitar spam: buscar notificación existente del mismo tipo y mensaje en los últimos 30 días
      const existing = await prisma.notificacion.findFirst({
        where: {
          agenciaId,
          tipo: 'ALERTA',
          mensaje: { contains: `El contrato de larga duración de "${r.propiedad.nombre}"` }
        }
      });

      if (!existing) {
        await createNotification(
          agenciaId,
          'ALERTA',
          'Contrato a Vencer',
          `El contrato de larga duración de "${r.propiedad.nombre}" vence el ${r.fechaVencimiento.toLocaleDateString('es-ES')}`,
          '/larga-duracion'
        );
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error en chequeo automático de vencimientos:', error.message);
  }
}

module.exports = {
  createNotification,
  addClient,
  removeClient,
  checkExpiringContractsAndLatePayments
};
