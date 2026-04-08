const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// POST /api/ical/sync — Sincronizar calendarios externos (Airbnb, Booking)
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { propiedadId, urlAirbnb, urlBooking } = req.body;
    if (!propiedadId) return res.status(400).json({ error: 'propiedadId requerido' });

    let totalImportados = 0;

    const origenes = [];
    if (urlAirbnb) origenes.push({ url: urlAirbnb, origen: 'AIRBNB' });
    if (urlBooking) origenes.push({ url: urlBooking, origen: 'BOOKING' });

    if (origenes.length === 0) {
      return res.status(400).json({ error: 'Introduce al menos una URL de iCal' });
    }

    // Borrar reservas externas previas para esta propiedad+origen
    for (const { origen } of origenes) {
      await prisma.reservaExterna.deleteMany({ where: { propiedadId, origen } });
    }

    // Procesar cada URL iCal
    for (const { url, origen } of origenes) {
      try {
        let icalData;

        // Primero intentamos fetch directo
        const fetch = require('node-fetch');
        const response = await fetch(url, { timeout: 10000 });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();

        // Parsear con ical
        const ical = require('node-ical');
        icalData = ical.parseICS(text);

        for (const uid in icalData) {
          const ev = icalData[uid];
          if (ev.type !== 'VEVENT') continue;
          if (!ev.start || !ev.end) continue;

          const fechaInicio = new Date(ev.start);
          const fechaFin = new Date(ev.end);

          // Ignorar eventos pasados
          if (fechaFin < new Date()) continue;

          await prisma.reservaExterna.upsert({
            where: { uid_propiedadId: { uid: uid.substring(0, 200), propiedadId } },
            update: { fechaInicio, fechaFin, titulo: ev.summary || '', origen, syncedAt: new Date() },
            create: { uid: uid.substring(0, 200), propiedadId, fechaInicio, fechaFin, titulo: ev.summary || '', origen, syncedAt: new Date() },
          });
          totalImportados++;
        }
      } catch (fetchErr) {
        console.error(`[iCal] Error sincronizando ${origen}:`, fetchErr.message);
        // No abortamos; seguimos con el otro origen
      }
    }

    // Guardar marca de última sincronización en la propiedad
    // (usamos notas como campo auxiliar, sin afectar el esquema)
    res.json({ ok: true, totalImportados, mensaje: `${totalImportados} eventos importados` });
  } catch (err) {
    res.status(500).json({ error: 'Error sincronizando iCal', detail: err.message });
  }
});

// GET /api/ical/:propiedadId — Obtener reservas externas de una propiedad
router.get('/:propiedadId', authenticate, async (req, res) => {
  try {
    const reservas = await prisma.reservaExterna.findMany({
      where: {
        propiedadId: req.params.propiedadId,
        fechaFin: { gte: new Date() },
      },
      orderBy: { fechaInicio: 'asc' },
    });
    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo reservas externas', detail: err.message });
  }
});

module.exports = router;
