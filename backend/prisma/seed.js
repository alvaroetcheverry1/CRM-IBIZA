const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Genera datos de prueba para el entorno de desarrollo
 */
async function main() {
  logger.info('🌱 Iniciando seed de datos de prueba...');

  // Limpiar datos existentes
  await prisma.auditLog.deleteMany();
  await prisma.actividad.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.pagoRenta.deleteMany();
  await prisma.alquilerVacacional.deleteMany();
  await prisma.alquilerLargaDuracion.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.contratoMandato.deleteMany();
  await prisma.propietario.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  // ─── Usuarios ──────────────────────────────────────────
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@crm-dev.com',
      nombre: 'Administrador',
      apellidos: 'Dev',
      rol: 'SUPERADMIN',
    },
  });

  const agente1 = await prisma.usuario.create({
    data: { email: 'maria@agencia.com', nombre: 'María', apellidos: 'García López', rol: 'AGENTE_SENIOR' },
  });

  const agente2 = await prisma.usuario.create({
    data: { email: 'carlos@agencia.com', nombre: 'Carlos', apellidos: 'Martínez', rol: 'AGENTE' },
  });

  // ─── Propietarios ──────────────────────────────────────
  const propietario1 = await prisma.propietario.create({
    data: {
      nombre: 'Philippe',
      apellidos: 'Dubois',
      nif: 'X1234567A',
      telefono: '+34 971 234 567',
      email: 'philippe.dubois@email.com',
      ciudad: 'Pollença',
      categoria: 'PREMIUM',
      notas: 'Cliente de alto standing. Prefiere comunicación por email.',
    },
  });

  const propietario2 = await prisma.propietario.create({
    data: {
      nombre: 'Isabel',
      apellidos: 'Fernández Mas',
      nif: '41234567B',
      telefono: '+34 971 345 678',
      email: 'isabel.fernandez@email.com',
      ciudad: 'Palma',
      categoria: 'ESTANDAR',
    },
  });

  const propietario3 = await prisma.propietario.create({
    data: {
      nombre: 'Hans',
      apellidos: 'Müller',
      nif: 'X9876543C',
      telefono: '+49 170 123 4567',
      email: 'hans.muller@email.de',
      ciudad: 'Sóller',
      categoria: 'PREMIUM',
    },
  });

  // ─── Propiedades Alquiler Vacacional ───────────────────
  const villa1 = await prisma.propiedad.create({
    data: {
      referencia: 'ALQ-001',
      nombre: 'Villa Es Molí',
      tipo: 'VACACIONAL',
      zona: 'Pollença',
      municipio: 'Pollença',
      habitaciones: 5,
      banos: 4,
      metrosConstruidos: 420,
      metrosParcela: 2500,
      piscina: 'SI',
      garaje: true,
      terraza: true,
      jardin: true,
      vistasMar: true,
      categoria: 'LUJO',
      estado: 'DISPONIBLE',
      caracteristicas: 'Vista al mar, Piscina privada, Jardín mediterráneo, Aire acondicionado, WiFi fibra, Barbacoa, Parking privado',
      descripcion: 'Espectacular villa de lujo con vistas panorámicas al mar. Completamente renovada en 2022.',
      propietarioId: propietario1.id,
      agenteId: agente1.id,
      alquilerVacacional: {
        create: {
          licenciaETV: 'ETV-2022-PM-001234',
          precioTemporadaAlta: 6500,
          precioTemporadaMedia: 4200,
          precioTemporadaBaja: 2800,
          depositoGarantia: 3000,
          minimoNoches: 7,
          personasMaximas: 10,
          checkInHora: '16:00',
          checkOutHora: '11:00',
        },
      },
    },
  });

  const villa2 = await prisma.propiedad.create({
    data: {
      referencia: 'ALQ-002',
      nombre: 'Finca Son Roig',
      tipo: 'VACACIONAL',
      zona: 'Alcúdia',
      municipio: 'Alcúdia',
      habitaciones: 4,
      banos: 3,
      metrosConstruidos: 280,
      metrosParcela: 5000,
      piscina: 'SI',
      garaje: false,
      terraza: true,
      jardin: true,
      vistasMar: false,
      categoria: 'PREMIUM',
      estado: 'ALQUILADA',
      caracteristicas: 'Piscina, Jardín, Finca tradicional mallorquina, Chimenea',
      descripcion: 'Auténtica finca mallorquina restaurada con todo el encanto rural.',
      propietarioId: propietario3.id,
      agenteId: agente1.id,
      alquilerVacacional: {
        create: {
          licenciaETV: 'ETV-2021-PM-005678',
          precioTemporadaAlta: 3800,
          precioTemporadaMedia: 2600,
          precioTemporadaBaja: 1800,
          depositoGarantia: 2000,
          minimoNoches: 7,
          personasMaximas: 8,
        },
      },
    },
  });

  // Reservas para villa1
  await prisma.reserva.createMany({
    data: [
      {
        alquilerVacacionalId: (await prisma.alquilerVacacional.findUnique({ where: { propiedadId: villa1.id } })).id,
        clienteNombre: 'Familie Schmidt',
        clienteEmail: 'schmidt@email.de',
        clienteTelefono: '+49 176 555 0001',
        fechaEntrada: new Date('2026-07-12'),
        fechaSalida: new Date('2026-07-26'),
        noches: 14,
        personas: 8,
        precioTotal: 13000,
        depositoCobrado: true,
        temporada: 'ALTA',
        origen: 'DIRECTO',
      },
      {
        alquilerVacacionalId: (await prisma.alquilerVacacional.findUnique({ where: { propiedadId: villa1.id } })).id,
        clienteNombre: 'Johnson Family',
        clienteEmail: 'johnson@email.co.uk',
        clienteTelefono: '+44 7700 900001',
        fechaEntrada: new Date('2026-08-09'),
        fechaSalida: new Date('2026-08-23'),
        noches: 14,
        personas: 6,
        precioTotal: 13000,
        depositoCobrado: true,
        temporada: 'ALTA',
        origen: 'AIRBNB',
      },
    ],
  });

  // ─── Propiedad Alquiler Larga Duración ─────────────────
  const pisito = await prisma.propiedad.create({
    data: {
      referencia: 'ALD-001',
      nombre: 'Apartamento Calle Mayor, 12',
      tipo: 'LARGA_DURACION',
      zona: 'Palma',
      municipio: 'Palma de Mallorca',
      habitaciones: 2,
      banos: 1,
      metrosConstruidos: 78,
      piscina: 'COMUNITARIA',
      garaje: false,
      ascensor: true,
      categoria: 'ESTANDAR',
      estado: 'ALQUILADA',
      descripcion: 'Apartamento reformado en el centro histórico de Palma.',
      propietarioId: propietario2.id,
      agenteId: agente2.id,
      alquilerLargaDuracion: {
        create: {
          inquilinoNombre: 'Laura Sánchez',
          inquilinoNif: '18234567D',
          inquilinoTelefono: '+34 622 111 222',
          inquilinoEmail: 'laura.sanchez@email.com',
          fechaInicio: new Date('2024-09-01'),
          duracionMeses: 12,
          fechaVencimiento: new Date('2025-08-31'),
          rentaMensual: 1200,
          fianzaMeses: 2,
          fianzaImporte: 2400,
          diaPagoCada: 1,
        },
      },
    },
  });

  // Pagos del alquiler
  const ald = await prisma.alquilerLargaDuracion.findUnique({ where: { propiedadId: pisito.id } });
  const pagosMeses = [
    { mes: new Date('2026-01-01'), estado: 'COBRADO' },
    { mes: new Date('2026-02-01'), estado: 'COBRADO' },
    { mes: new Date('2026-03-01'), estado: 'PENDIENTE' },
  ];
  for (const p of pagosMeses) {
    await prisma.pagoRenta.create({
      data: { alquilerLargaDuracionId: ald.id, mes: p.mes, importe: 1200, estado: p.estado,
        fechaCobro: p.estado === 'COBRADO' ? p.mes : null },
    });
  }

  // ─── Propiedad Venta ────────────────────────────────────
  await prisma.propiedad.create({
    data: {
      referencia: 'VTA-001',
      nombre: 'Villa Son Vida',
      tipo: 'VENTA',
      zona: 'Son Vida',
      municipio: 'Palma de Mallorca',
      habitaciones: 6,
      banos: 5,
      metrosConstruidos: 620,
      metrosParcela: 3200,
      piscina: 'SI',
      garaje: true,
      jardin: true,
      vistasMar: true,
      categoria: 'LUJO',
      estado: 'DISPONIBLE',
      caracteristicas: 'Urbanización exclusiva, Domótica, Cine en casa, Spa, Vista panorámica Palma',
      descripcion: 'Villa de arquitectura contemporánea en la urbanización más exclusiva de Palma.',
      propietarioId: propietario1.id,
      agenteId: agente1.id,
      venta: {
        create: {
          precioVenta: 4500000,
          precioMinimo: 4000000,
          referenciaCatastral: '07040A001000010000FQ',
          estadoHipotecario: 'LIBRE',
          comisionAgencia: 5,
          etapaPipeline: 'COMERCIALIZACION',
        },
      },
    },
  });

  // ─── Clientes / Leads ──────────────────────────────────
  await prisma.cliente.createMany({
    data: [
      {
        nombre: 'Stefan', apellidos: 'Weber', telefono: '+49 170 555 1234', email: 'stefan.weber@email.de',
        tipo: 'COMPRADOR', estado: 'VISITA', presupuesto: 5000000,
        zonaInteres: 'Son Vida, Puerto Andratx', habitacionesMin: 5, origen: 'REFERIDO',
        notas: 'Interesado en villas de lujo. Presupuesto 4-5M. Familia de 4.',
      },
      {
        nombre: 'Claudia', apellidos: 'Moreau', telefono: '+33 6 12 34 56 78', email: 'claudia.moreau@email.fr',
        tipo: 'INQUILINO', estado: 'OFERTA', presupuesto: 5000,
        zonaInteres: 'Pollença, Alcúdia', habitacionesMin: 4, origen: 'WEB',
        notas: 'Busca villa vacacional para verano con piscina y vistas al mar.',
      },
      {
        nombre: 'James', apellidos: 'Thompson', telefono: '+44 7700 900123', email: 'j.thompson@email.co.uk',
        tipo: 'AMBOS', estado: 'NUEVO', presupuesto: 2000000, origen: 'PORTAL',
      },
      {
        nombre: 'Anna', apellidos: 'Kowalski', telefono: '+48 600 123 456',
        tipo: 'INQUILINO', estado: 'CONTACTADO', presupuesto: 2500,
        zonaInteres: 'Palma Centro', habitacionesMin: 2, origen: 'WEB',
      },
    ],
  });

  logger.info('✅ Seed completado con éxito');
  logger.info(`   • 3 propietarios`);
  logger.info(`   • 4 propiedades (2 vacacional, 1 larga duración, 1 venta)`);
  logger.info(`   • 2 reservas`);
  logger.info(`   • 3 pagos de renta`);
  logger.info(`   • 4 clientes/leads`);
  logger.info(`   • 3 usuarios (admin, agente senior, agente)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
