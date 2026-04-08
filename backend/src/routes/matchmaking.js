const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');
const { iaService } = require('../services/iaService');

/** Calcula score 0-100 de compatibilidad cliente-propiedad */
function calcScore(cliente, propiedad) {
  let score = 0;

  // Presupuesto (40 pts)
  const precio =
    Number(propiedad.venta?.precioVenta) ||
    Number(propiedad.alquilerVacacional?.precioTemporadaAlta) ||
    Number(propiedad.alquilerLargaDuracion?.rentaMensual) || 0;
  const presupuesto = Number(cliente.presupuesto) || 0;
  if (precio && presupuesto) {
    const ratio = presupuesto / precio;
    if (ratio >= 0.9 && ratio <= 1.3)  score += 40;
    else if (ratio >= 0.7 && ratio <= 1.6) score += 25;
    else if (ratio >= 0.5) score += 10;
  }

  // Zona (30 pts)
  const cz = (cliente.zonaInteres || '').toLowerCase().trim();
  const pz = (propiedad.zona || '').toLowerCase().trim();
  if (cz && pz) {
    if (cz === pz || cz.includes(pz) || pz.includes(cz)) score += 30;
    else if (cz.includes('cualquier') || cz === 'ibiza' || cz === 'cualquiera') score += 20;
  } else {
    score += 15;
  }

  // Habitaciones (20 pts)
  const hab = Number(propiedad.habitaciones) || 0;
  const hMin = cliente.habitacionesMin != null ? Number(cliente.habitacionesMin) : null;
  const hMax = cliente.habitacionesMax != null ? Number(cliente.habitacionesMax) : null;
  if (hMin === null && hMax === null) score += 10;
  else if (hMin !== null && hab >= hMin && (hMax === null || hab <= hMax)) score += 20;
  else if (hMin !== null && hab >= hMin - 1) score += 10;

  // Estado lead (10 pts)
  const pts = { VISITA: 10, OFERTA: 10, CONTACTADO: 7, NUEVO: 5, CERRADO: 0, DESCARTADO: 0 };
  score += pts[cliente.estado] ?? 5;

  return Math.min(100, score);
}

function tiposCompatibles(tipoProp) {
  if (tipoProp === 'VENTA')          return ['COMPRADOR', 'AMBOS'];
  if (tipoProp === 'VACACIONAL')     return ['INQUILINO', 'AMBOS'];
  if (tipoProp === 'LARGA_DURACION') return ['INQUILINO', 'AMBOS'];
  return ['COMPRADOR', 'INQUILINO', 'AMBOS'];
}

function buildExplicacion(cliente, propiedad, score) {
  const parts = [];
  const precio =
    Number(propiedad.venta?.precioVenta) ||
    Number(propiedad.alquilerVacacional?.precioTemporadaAlta) ||
    Number(propiedad.alquilerLargaDuracion?.rentaMensual) || 0;
  const presupuesto = Number(cliente.presupuesto) || 0;

  if (presupuesto && precio) {
    const ratio = presupuesto / precio;
    if (ratio >= 0.9 && ratio <= 1.3) parts.push(`presupuesto (${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(presupuesto)}) encaja con el precio de la propiedad`);
    else if (ratio >= 0.7) parts.push(`presupuesto algo ajustado respecto al precio listado`);
  }

  const cz = (cliente.zonaInteres || '').toLowerCase();
  const pz = (propiedad.zona || '').toLowerCase();
  if (cz && pz && (cz === pz || cz.includes(pz) || pz.includes(cz))) {
    parts.push(`zona de interés (${propiedad.zona}) coincide`);
  }

  const hMin = cliente.habitacionesMin != null ? Number(cliente.habitacionesMin) : null;
  const hab = Number(propiedad.habitaciones) || 0;
  if (hMin !== null && hab >= hMin) {
    parts.push(`habitaciones (${hab}) cumplen su mínimo de ${hMin}`);
  }

  if (parts.length === 0) return `Match del ${score}% basado en criterios generales.`;
  return `Match de ${score}% porque ${parts.join(', ')}.`;
}

// GET /api/matchmaking/:propiedadId
router.get('/:propiedadId', authenticate, async (req, res) => {
  try {
    const { propiedadId } = req.params;

    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      include: {
        venta: true,
        alquilerVacacional: true,
        alquilerLargaDuracion: true,
      },
    });

    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const tipos = tiposCompatibles(propiedad.tipo);
    const clientes = await prisma.cliente.findMany({
      where: { activo: true, tipo: { in: tipos }, estado: { notIn: ['DESCARTADO', 'CERRADO'] } },
      take: 200,
    });

    const matches = clientes
      .map(c => ({ ...c, score: calcScore(c, propiedad), explicacion: buildExplicacion(c, propiedad, calcScore(c, propiedad)) }))
      .filter(c => c.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({ matches, propiedad: { nombre: propiedad.nombre, tipo: propiedad.tipo, zona: propiedad.zona } });
  } catch (err) {
    res.status(500).json({ error: 'Error en matchmaking', detail: err.message });
  }
});

// POST /api/matchmaking/enviar-dossier
router.post('/enviar-dossier', authenticate, async (req, res) => {
  try {
    const { clienteId, propiedadId, emailDestino, nombreCliente } = req.body;

    // En producción usaría nodemailer – por ahora registra en la base de datos y devuelve OK
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { nombre: true, referencia: true, urlDriveCarpeta: true },
    });

    console.log(`[MATCHMAKING] Dossier enviado a ${emailDestino || nombreCliente} para ${propiedad?.nombre}`);

    // Actualizar estado del cliente a CONTACTADO si era NUEVO
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
      if (cliente && cliente.estado === 'NUEVO') {
        await prisma.cliente.update({ where: { id: clienteId }, data: { estado: 'CONTACTADO' } });
      }
    }

    res.json({ ok: true, mensaje: `Dossier de ${propiedad?.nombre} marcado como enviado` });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando dossier', detail: err.message });
  }
});

module.exports = router;
