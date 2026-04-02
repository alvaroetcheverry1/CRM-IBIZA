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
      // Total propiedades activas
      prisma.propiedad.count({ where: { activo: true } }),

      // Distribución por tipo
      prisma.propiedad.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: { tipo: true },
      }),

      // Distribución por estado
      prisma.propiedad.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: { estado: true },
      }),

      // Total propietarios
      prisma.propietario.count({ where: { activo: true } }),

      // Total clientes
      prisma.cliente.count({ where: { activo: true } }),

      // Leads por estado (pipeline)
      prisma.cliente.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: { estado: true },
      }),

      // Reservas próximas (30 días)
      prisma.reserva.findMany({
        where: {
          fechaEntrada: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          alquilerVacacional: {
            include: { propiedad: { select: { nombre: true, referencia: true } } },
          },
        },
        orderBy: { fechaEntrada: 'asc' },
        take: 10,
      }),

      // Pagos en retraso
      prisma.pagoRenta.findMany({
        where: { estado: 'RETRASO' },
        include: {
          alquilerLargaDuracion: {
            include: { propiedad: { select: { nombre: true, referencia: true } } },
          },
        },
        take: 10,
      }),

      // Documentos recientes
      prisma.documento.findMany({
        orderBy: { creadoEn: 'desc' },
        take: 5,
        include: { propiedad: { select: { nombre: true } } },
      }),

      // Contratos a vencer en 90 días
      prisma.alquilerLargaDuracion.findMany({
        where: {
          fechaVencimiento: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          propiedad: { select: { nombre: true, referencia: true } },
        },
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

    res.json({
      kpis: {
        totalPropiedades,
        totalPropietarios,
        totalClientes,
        ingresosVacacionalMes: ingresosVacacional._sum.precioTotal || 0,
      },
      propiedadesPorTipo,
      propiedadesPorEstado,
      leadsPorEstado,
      alertas: {
        reservasProximas,
        pagosEnRetraso,
        alertasVencimiento,
      },
      actividadReciente: {
        documentosRecientes,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard', detail: err.message });
  }
});

module.exports = router;
