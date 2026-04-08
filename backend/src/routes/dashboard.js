const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../utils/prisma');

// GET /api/dashboard — KPIs globales
router.get('/', authenticate, async (req, res) => {
  try {
    const [
      totalPropiedades,
      propiedadesPorTipo,
      propiedadesPorEstado,
      totalPropietarios,
      totalClientes,
      leadsPorEstado,
      reservasProximas,
      pagosEnRetraso,
      documentosRecientes,
      alertasVencimiento,
    ] = await Promise.all([
      prisma.propiedad.count({ where: { activo: true } }),
      prisma.propiedad.groupBy({ by: ['tipo'], where: { activo: true }, _count: { tipo: true } }),
      prisma.propiedad.groupBy({ by: ['estado'], where: { activo: true }, _count: { estado: true } }),
      prisma.propietario.count({ where: { activo: true } }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.cliente.groupBy({ by: ['estado'], where: { activo: true }, _count: { estado: true } }),
      prisma.reserva.findMany({
        where: { fechaEntrada: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        include: { alquilerVacacional: { include: { propiedad: { select: { nombre: true, referencia: true } } } } },
        orderBy: { fechaEntrada: 'asc' },
        take: 10,
      }),
      prisma.pagoRenta.findMany({
        where: { estado: 'RETRASO' },
        include: { alquilerLargaDuracion: { include: { propiedad: { select: { nombre: true, referencia: true } } } } },
        take: 10,
      }),
      prisma.documento.findMany({
        orderBy: { creadoEn: 'desc' },
        take: 5,
        include: { propiedad: { select: { nombre: true } } },
      }),
      prisma.alquilerLargaDuracion.findMany({
        where: { fechaVencimiento: { gte: new Date(), lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } },
        include: { propiedad: { select: { nombre: true, referencia: true } } },
        orderBy: { fechaVencimiento: 'asc' },
        take: 10,
      }),
    ]);

    // Ingresos vacacional (mes actual)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ingresosVacacional = await prisma.reserva.aggregate({
      where: { fechaEntrada: { gte: inicioMes } },
      _sum: { precioTotal: true },
    });

    // ── NUEVO: Ingresos mensuales últimos 12 meses ──────────────────────────
    const ingresosMensuales = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const agg = await prisma.reserva.aggregate({
        where: { fechaEntrada: { gte: inicio, lte: fin } },
        _sum: { precioTotal: true },
      });
      ingresosMensuales.push({
        mes: inicio.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        ingresos: agg._sum.precioTotal || 0,
      });
    }

    // ── NUEVO: Comisiones por agente (ventas cerradas) ──────────────────────
    const ventasCerradas = await prisma.propiedad.findMany({
      where: { tipo: 'VENTA', estado: 'VENDIDA', activo: true },
      include: {
        venta: { select: { precioVenta: true, comisionAgencia: true } },
        agente: { select: { nombre: true } },
      },
    });
    const comisionesPorAgenteMap = {};
    for (const p of ventasCerradas) {
      const nombre = p.agente?.nombre || 'Sin asignar';
      const precio = Number(p.venta?.precioVenta) || 0;
      const pct = Number(p.venta?.comisionAgencia) || 3;
      comisionesPorAgenteMap[nombre] = (comisionesPorAgenteMap[nombre] || 0) + (precio * pct / 100);
    }
    const comisionesPorAgente = Object.entries(comisionesPorAgenteMap)
      .map(([nombre, comision]) => ({ nombre, comision: Math.round(comision) }))
      .sort((a, b) => b.comision - a.comision);

    // ── NUEVO: Volumen venta total ──────────────────────────────────────────
    const volumenVenta = await prisma.venta.aggregate({
      where: { propiedad: { estado: 'VENDIDA' } },
      _sum: { precioVenta: true },
    });

    // ── NUEVO: Tasa de conversión de leads ─────────────────────────────────
    const totalLeads = await prisma.cliente.count({ where: { activo: true } });
    const leadsCerrados = await prisma.cliente.count({ where: { estado: 'CERRADO', activo: true } });
    const tasaConversion = totalLeads > 0 ? Math.round((leadsCerrados / totalLeads) * 100) : 0;

    res.json({
      kpis: {
        totalPropiedades,
        totalPropietarios,
        totalClientes,
        ingresosVacacionalMes: ingresosVacacional._sum.precioTotal || 0,
        volumenVentaTotal: volumenVenta._sum.precioVenta || 0,
        tasaConversion,
      },
      propiedadesPorTipo,
      propiedadesPorEstado,
      leadsPorEstado,
      ingresosMensuales,
      comisionesPorAgente,
      alertas: { reservasProximas, pagosEnRetraso, alertasVencimiento },
      actividadReciente: { documentosRecientes },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard', detail: err.message });
  }
});

module.exports = router;


