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
      prisma.propiedad.count({ where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }),
      prisma.propiedad.groupBy({ by: ['tipo'], where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) }, _count: { tipo: true } }),
      prisma.propiedad.groupBy({ by: ['estado'], where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) }, _count: { estado: true } }),
      prisma.propietario.count({ where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }),
      prisma.cliente.count({ where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }),
      prisma.cliente.groupBy({ by: ['estado'], where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) }, _count: { estado: true } }),
      prisma.reserva.findMany({
        where: { fechaEntrada: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, alquilerVacacional: { propiedad: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } } },
        include: { alquilerVacacional: { include: { propiedad: { select: { nombre: true, referencia: true } } } } },
        orderBy: { fechaEntrada: 'asc' },
        take: 10,
      }),
      prisma.pagoRenta.findMany({
        where: { estado: 'RETRASO', alquilerLargaDuracion: { propiedad: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } } },
        include: { alquilerLargaDuracion: { include: { propiedad: { select: { nombre: true, referencia: true } } } } },
        take: 10,
      }),
      prisma.documento.findMany({
        where: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) },
        orderBy: { creadoEn: 'desc' },
        take: 5,
        include: { propiedad: { select: { nombre: true } } },
      }),
      prisma.alquilerLargaDuracion.findMany({
        where: { fechaVencimiento: { gte: new Date(), lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }, propiedad: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } },
        include: { propiedad: { select: { nombre: true, referencia: true } } },
        orderBy: { fechaVencimiento: 'asc' },
        take: 10,
      }),
    ]);

    // Ingresos vacacional (mes actual)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ingresosVacacional = await prisma.reserva.aggregate({
      where: { fechaEntrada: { gte: inicioMes }, alquilerVacacional: { propiedad: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } } },
      _sum: { precioTotal: true },
    });

    // ── NUEVO: Ingresos mensuales dinámicos (1, 3, 6, 12, 24... meses) ─────
    let numMeses = 12;
    if (req.query.meses === 'total') {
      const primeraReserva = await prisma.reserva.findFirst({
        where: { alquilerVacacional: { propiedad: { ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } } },
        orderBy: { fechaEntrada: 'asc' },
        select: { fechaEntrada: true }
      });
      if (primeraReserva) {
        const diffYears = new Date().getFullYear() - primeraReserva.fechaEntrada.getFullYear();
        const diffMonths = new Date().getMonth() - primeraReserva.fechaEntrada.getMonth();
        numMeses = diffYears * 12 + diffMonths + 1;
        if (numMeses < 12) numMeses = 12; // Mínimo mostrar 12
      }
    } else if (req.query.meses) {
      numMeses = parseInt(req.query.meses, 10) || 12;
    }

    const cutOffDate = new Date();
    cutOffDate.setMonth(cutOffDate.getMonth() - numMeses + 1);
    cutOffDate.setDate(1);
    cutOffDate.setHours(0, 0, 0, 0);

    const reserves = await prisma.reserva.findMany({
      where: {
        fechaEntrada: { gte: cutOffDate },
        alquilerVacacional: { propiedad: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }
      },
      select: { fechaEntrada: true, precioTotal: true }
    });

    const ingresosMensuales = [];
    for (let i = numMeses - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const sum = reserves
        .filter(r => {
          const rDate = new Date(r.fechaEntrada);
          return rDate.getFullYear() === year && rDate.getMonth() === month;
        })
        .reduce((s, r) => s + Number(r.precioTotal || 0), 0);

      ingresosMensuales.push({
        mes: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        ingresos: sum,
      });
    }

    // ── NUEVO: Comisiones por agente (ventas cerradas) ──────────────────────
    const ventasCerradas = await prisma.propiedad.findMany({
      where: { tipo: 'VENTA', estado: 'VENDIDA', activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) },
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
      where: { propiedad: { estado: 'VENDIDA', ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } },
      _sum: { precioVenta: true },
    });

    // ── NUEVO: Tasa de conversión de leads ─────────────────────────────────
    const totalLeads = await prisma.cliente.count({ where: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } });
    const leadsCerrados = await prisma.cliente.count({ where: { estado: 'CERRADO', activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } });
    const tasaConversion = totalLeads > 0 ? Math.round((leadsCerrados / totalLeads) * 100) : 0;

    // ── NUEVO: Ocupación Media Vacacional (%) ──────────────────────────────
    const totalVacacionalesCount = await prisma.alquilerVacacional.count({
      where: { propiedad: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }
    });
    const totalNochesReservadas = await prisma.reserva.aggregate({
      where: {
        fechaEntrada: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        alquilerVacacional: { propiedad: { activo: true, ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {}) } }
      },
      _sum: { noches: true }
    });
    const nochesReservadas = totalNochesReservadas._sum.noches || 0;
    const ocupacionVacacional = totalVacacionalesCount > 0 
      ? Math.min(100, Math.round((nochesReservadas / (totalVacacionalesCount * 365)) * 100))
      : 0;

    // ── NUEVO: Rentabilidad Media del Portfolio (%) ───────────────────────
    const propiedadesRentables = await prisma.propiedad.findMany({
      where: {
        activo: true,
        precioCompra: { not: null },
        ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {})
      },
      include: {
        alquilerVacacional: {
          include: {
            reservas: {
              where: {
                fechaEntrada: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
              }
            }
          }
        },
        alquilerLargaDuracion: true
      }
    });

    let sumaRentabilidad = 0;
    let countRentables = 0;

    for (const p of propiedadesRentables) {
      const precioAcq = Number(p.precioCompra) || 0;
      if (precioAcq <= 0) continue;

      let ingresosAnuales = 0;
      if (p.tipo === 'VACACIONAL' && p.alquilerVacacional) {
        ingresosAnuales = p.alquilerVacacional.reservas.reduce((sum, r) => sum + Number(r.precioTotal || 0), 0);
      } else if (p.tipo === 'LARGA_DURACION' && p.alquilerLargaDuracion) {
        ingresosAnuales = Number(p.alquilerLargaDuracion.rentaMensual || 0) * 12;
      }

      const rentabilidad = (ingresosAnuales / precioAcq) * 100;
      sumaRentabilidad += rentabilidad;
      countRentables++;
    }

    const rentabilidadMedia = countRentables > 0 ? Number((sumaRentabilidad / countRentables).toFixed(2)) : 0;

    // ── NUEVO: Tiempo Medio de Venta (días) ─────────────────────────────────
    const propiedadesVendidas = await prisma.propiedad.findMany({
      where: {
        tipo: 'VENTA',
        estado: 'VENDIDA',
        activo: true,
        ...(req.user.agenciaId ? { agenciaId: req.user.agenciaId } : {})
      },
      select: { creadoEn: true, actualizadoEn: true }
    });

    let sumaDias = 0;
    let countVendidas = 0;

    for (const p of propiedadesVendidas) {
      const diffTime = Math.abs(new Date(p.actualizadoEn) - new Date(p.creadoEn));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      sumaDias += diffDays;
      countVendidas++;
    }

    const tiempoMedioVenta = countVendidas > 0 ? Math.round(sumaDias / countVendidas) : 0;

    res.json({
      kpis: {
        totalPropiedades,
        totalPropietarios,
        totalClientes,
        ingresosVacacionalMes: ingresosVacacional._sum.precioTotal || 0,
        volumenVentaTotal: volumenVenta._sum.precioVenta || 0,
        tasaConversion,
        ocupacionVacacional,
        rentabilidadMedia,
        tiempoMedioVenta
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


