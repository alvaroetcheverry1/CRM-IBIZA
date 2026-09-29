const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const ical = require('node-ical');

async function syncAllCalendars() {
  logger.info('[icalCron] Iniciando sincronización de calendarios vacacionales...');
  try {
    const vacacionales = await prisma.alquilerVacacional.findMany({
      where: {
        OR: [
          { urlAirbnb: { not: null, not: '' } },
          { urlBooking: { not: null, not: '' } }
        ]
      },
      include: {
        propiedad: true
      }
    });

    logger.info(`[icalCron] Encontradas ${vacacionales.length} propiedades con iCal configurado.`);

    for (const vac of vacacionales) {
      const propiedadId = vac.propiedadId;
      const feeds = [];
      if (vac.urlAirbnb) feeds.push({ url: vac.urlAirbnb, origen: 'AIRBNB' });
      if (vac.urlBooking) feeds.push({ url: vac.urlBooking, origen: 'BOOKING' });

      for (const feed of feeds) {
        try {
          logger.info(`[icalCron] Sincronizando ${feed.origen} para propiedad "${vac.propiedad.nombre}" (${propiedadId})`);
          
          // Realizar fetch con timeout
          const response = await fetch(feed.url, { signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const text = await response.text();

          const icalData = ical.parseICS(text);
          let importados = 0;

          // Eliminar reservas externas futuras previas de esta propiedad + origen
          await prisma.reservaExterna.deleteMany({
            where: {
              propiedadId,
              origen: feed.origen,
              fechaFin: { gte: new Date() }
            }
          });

          for (const uid in icalData) {
            const ev = icalData[uid];
            if (ev.type !== 'VEVENT') continue;
            if (!ev.start || !ev.end) continue;

            const fechaInicio = new Date(ev.start);
            const fechaFin = new Date(ev.end);

            // Ignorar eventos antiguos
            if (fechaFin < new Date()) continue;

            await prisma.reservaExterna.upsert({
              where: {
                uid_propiedadId: {
                  uid: uid.substring(0, 200),
                  propiedadId
                }
              },
              update: {
                fechaInicio,
                fechaFin,
                titulo: ev.summary || '',
                origen: feed.origen,
                syncedAt: new Date()
              },
              create: {
                uid: uid.substring(0, 200),
                propiedadId,
                fechaInicio,
                fechaFin,
                titulo: ev.summary || '',
                origen: feed.origen,
                syncedAt: new Date()
              }
            });
            importados++;
          }
          logger.info(`[icalCron] Sincronización exitosa: ${importados} reservas actualizadas de ${feed.origen}`);
        } catch (feedErr) {
          logger.warn(`[icalCron] Error en feed ${feed.origen} de propiedad ${propiedadId}: ${feedErr.message}`);
        }
      }
    }
  } catch (err) {
    logger.error('[icalCron] Error en syncAllCalendars:', err.message);
  }
}

function start() {
  // Ejecutar al iniciar el servidor de forma diferida (3 segundos después de arrancar para no sobrecargar el arranque)
  setTimeout(() => {
    syncAllCalendars().catch(err => logger.error('[icalCron] Error en ejecución inicial:', err));
  }, 3000);

  // Programar cada 2 horas (7200000 ms)
  const INTERVAL = 2 * 60 * 60 * 1000;
  setInterval(() => {
    syncAllCalendars().catch(err => logger.error('[icalCron] Error en ejecución programada:', err));
  }, INTERVAL);
  logger.info('[icalCron] Cron de sincronización iCal iniciado (intervalo de 2 horas).');
}

module.exports = { start, syncAllCalendars };
