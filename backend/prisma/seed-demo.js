/**
 * seed-demo.js — Datos de demostración para una cuenta de prueba de SYNNER.
 *
 * SEGURO y MULTI-TENANT: crea (o reutiliza) UNA agencia demo aislada y rellena sus
 * datos. NO borra datos de otras agencias. Es idempotente: si la agencia demo ya
 * existe, limpia SOLO sus propios datos y los vuelve a crear.
 *
 * Uso:  node prisma/seed-demo.js
 * Credenciales demo:  demo@synner.tech / Demo1234!
 */
const { prisma } = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');

const DEMO_EMAIL = 'demo@synner.tech';
const DEMO_PASSWORD = 'Demo1234!';

async function main() {
  console.log('🌱 Seed demo SYNNER — agencia aislada, sin tocar otras agencias');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1) Agencia demo (idempotente por email)
  let agencia = await prisma.agencia.findUnique({ where: { email: DEMO_EMAIL } });
  if (!agencia) {
    agencia = await prisma.agencia.create({
      data: {
        nombre: 'Agencia Demo SYNNER',
        email: DEMO_EMAIL,
        passwordHash,
        plan: 'INTELLIGENCE',
        estado: 'ACTIVA',
        telefono: '+34 971 000 000',
        pais: 'España',
        activadaEn: new Date(),
        legalAceptado: true,
        legalAceptadoEn: new Date(),
        legalVersion: '2.0',
        notas: 'Cuenta de demostración generada por seed-demo.js',
      },
    });
    console.log('  ✓ Agencia demo creada:', agencia.id);
  } else {
    console.log('  ↺ Agencia demo ya existía, reutilizando:', agencia.id);
  }
  const agenciaId = agencia.id;

  // Configuración de agencia (idempotente)
  const cfg = await prisma.configuracionAgencia.findFirst({ where: { agenciaId } });
  if (!cfg) {
    await prisma.configuracionAgencia.create({
      data: {
        agenciaId,
        nombreComercial: 'Agencia Demo SYNNER',
        emailOficial: DEMO_EMAIL,
        telefonoOficial: '+34 971 000 000',
      },
    });
  }

  // 2) Limpiar SOLO los datos de ESTA agencia (orden respetando FKs)
  const props = await prisma.propiedad.findMany({ where: { agenciaId }, select: { id: true } });
  const propIds = props.map((p) => p.id);
  if (propIds.length) {
    const av = await prisma.alquilerVacacional.findMany({ where: { propiedadId: { in: propIds } }, select: { id: true } });
    const ald = await prisma.alquilerLargaDuracion.findMany({ where: { propiedadId: { in: propIds } }, select: { id: true } });
    await prisma.reserva.deleteMany({ where: { alquilerVacacionalId: { in: av.map((x) => x.id) } } });
    await prisma.pagoRenta.deleteMany({ where: { alquilerLargaDuracionId: { in: ald.map((x) => x.id) } } });
    await prisma.alquilerVacacional.deleteMany({ where: { propiedadId: { in: propIds } } });
    await prisma.alquilerLargaDuracion.deleteMany({ where: { propiedadId: { in: propIds } } });
    await prisma.venta.deleteMany({ where: { propiedadId: { in: propIds } } });
  }
  await prisma.actividad.deleteMany({ where: { agenciaId } });
  await prisma.propiedad.deleteMany({ where: { agenciaId } });
  await prisma.contratoMandato.deleteMany({ where: { agenciaId } });
  await prisma.propietario.deleteMany({ where: { agenciaId } });
  await prisma.cliente.deleteMany({ where: { agenciaId } });
  // Usuarios demo excepto el DIRECTOR principal (se recrea abajo con upsert)
  await prisma.usuario.deleteMany({ where: { agenciaId, email: { not: DEMO_EMAIL } } });

  // 3) Usuarios
  const director = await prisma.usuario.upsert({
    where: { email: DEMO_EMAIL },
    update: { agenciaId, rol: 'DIRECTOR', activo: true, passwordHash },
    create: {
      email: DEMO_EMAIL, passwordHash, nombre: 'Dirección', apellidos: 'Demo',
      rol: 'DIRECTOR', agenciaId, activo: true,
    },
  });
  const agente = await prisma.usuario.create({
    data: {
      email: 'agente.demo@synner.tech', passwordHash, nombre: 'Lucía', apellidos: 'Serra',
      rol: 'AGENTE', agenciaId, activo: true,
    },
  });

  // 4) Propietarios
  const prop1 = await prisma.propietario.create({
    data: {
      agenciaId, nombre: 'Antoni', apellidos: 'Bonet', nif: '43111222C',
      telefono: '+34 600 111 222', email: 'antoni.bonet@example.com',
      ciudad: 'Ibiza', categoria: 'PREMIUM', iban: 'ES7620770024003102575766',
    },
  });
  const prop2 = await prisma.propietario.create({
    data: {
      agenciaId, nombre: 'Marga', apellidos: 'Riera', nif: '43333444D',
      telefono: '+34 600 333 444', email: 'marga.riera@example.com',
      ciudad: 'Santa Eulària', categoria: 'ESTANDAR',
    },
  });

  // 5) Propiedades (una por cada modelo de negocio) + submodelos
  const ref = () => 'DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  const pVac = await prisma.propiedad.create({
    data: {
      agenciaId, propietarioId: prop1.id, agenteId: agente.id,
      referencia: ref(), nombre: 'Villa Es Vedrà', tipo: 'VILLA', zona: 'Cala d\'Hort',
      municipio: 'Sant Josep', habitaciones: 5, banos: 4, metrosConstruidos: 420,
      metrosParcela: 1500, piscina: 'PRIVADA', garaje: true, terraza: true, jardin: true,
      vistasMar: true, categoria: 'LUJO', estado: 'DISPONIBLE',
      descripcion: 'Villa de lujo con vistas a Es Vedrà, piscina infinity y licencia turística.',
      fotos: '[]',
    },
  });
  await prisma.alquilerVacacional.create({
    data: {
      propiedadId: pVac.id, licenciaETV: 'ETV-0001-IB', precioTemporadaAlta: 3500,
      precioTemporadaMedia: 2200, precioTemporadaBaja: 1500, depositoGarantia: 1500,
      minimoNoches: 7, personasMaximas: 10,
    },
  });
  await prisma.reserva.create({
    data: {
      alquilerVacacionalId: (await prisma.alquilerVacacional.findUnique({ where: { propiedadId: pVac.id } })).id,
      clienteNombre: 'Familia Müller', clienteEmail: 'muller@example.com',
      fechaEntrada: new Date('2026-07-10'), fechaSalida: new Date('2026-07-24'),
      noches: 14, personas: 8, precioTotal: 49000, temporada: 'ALTA', origen: 'DIRECTO',
    },
  });

  const pLarga = await prisma.propiedad.create({
    data: {
      agenciaId, propietarioId: prop2.id, agenteId: agente.id,
      referencia: ref(), nombre: 'Piso Marina Botafoc', tipo: 'PISO', zona: 'Marina Botafoc',
      municipio: 'Ibiza', habitaciones: 3, banos: 2, metrosConstruidos: 110,
      ascensor: true, terraza: true, categoria: 'ESTANDAR', estado: 'DISPONIBLE',
      descripcion: 'Piso de 3 dormitorios en Marina Botafoc, ideal para larga duración.',
      fotos: '[]',
    },
  });
  await prisma.alquilerLargaDuracion.create({
    data: {
      propiedadId: pLarga.id, inquilinoNombre: 'Pau Tur', inquilinoNif: '43555666E',
      inquilinoEmail: 'pau.tur@example.com', fechaInicio: new Date('2026-01-01'),
      duracionMeses: 12, rentaMensual: 1800, fianzaMeses: 2, fianzaImporte: 3600, diaPagoCada: 5,
    },
  });

  const pVenta = await prisma.propiedad.create({
    data: {
      agenciaId, propietarioId: prop1.id, agenteId: director.id,
      referencia: ref(), nombre: 'Ático Dalt Vila', tipo: 'ATICO', zona: 'Dalt Vila',
      municipio: 'Ibiza', habitaciones: 2, banos: 2, metrosConstruidos: 95,
      terraza: true, vistasMar: true, categoria: 'LUJO', estado: 'DISPONIBLE',
      descripcion: 'Ático con terraza y vistas al puerto, dentro del recinto amurallado.',
      fotos: '[]',
    },
  });
  await prisma.venta.create({
    data: {
      propiedadId: pVenta.id, precioVenta: 890000, precioMinimo: 820000,
      estadoHipotecario: 'LIBRE', comisionAgencia: 5, etapaPipeline: 'CAPTACION',
    },
  });

  // 6) Clientes (leads)
  await prisma.cliente.createMany({
    data: [
      { agenciaId, nombre: 'Sophie', apellidos: 'Laurent', telefono: '+34 600 777 888', email: 'sophie@example.com', tipo: 'COMPRADOR', estado: 'NUEVO', presupuesto: 950000, zonaInteres: 'Dalt Vila', origen: 'WEB', scoreIA: 82 },
      { agenciaId, nombre: 'James', apellidos: 'Carter', telefono: '+34 600 999 000', email: 'james@example.com', tipo: 'INQUILINO', estado: 'CONTACTADO', zonaInteres: 'Marina Botafoc', origen: 'PORTAL', scoreIA: 60 },
      { agenciaId, nombre: 'Elena', apellidos: 'Costa', telefono: '+34 600 222 333', email: 'elena@example.com', tipo: 'AMBOS', estado: 'NUEVO', zonaInteres: 'Santa Eulària', origen: 'REFERIDO', scoreIA: 71 },
    ],
  });

  // 7) Actividades
  await prisma.actividad.createMany({
    data: [
      { agenciaId, tipo: 'LLAMADA', descripcion: 'Primer contacto con Sophie Laurent', usuarioId: agente.id, clienteId: null },
      { agenciaId, tipo: 'VISITA', descripcion: 'Visita programada al Ático Dalt Vila', usuarioId: director.id, propiedadId: pVenta.id },
    ],
  });

  console.log('✅ Seed demo completado para agencia', agenciaId);
  console.log('   Login:', DEMO_EMAIL, '/', DEMO_PASSWORD);
  console.log('   3 propiedades (vacacional, larga, venta), 2 propietarios, 3 clientes, 1 reserva.');
}

main()
  .catch((e) => { console.error('❌ Error en seed demo:', e.message); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); process.exit(process.exitCode || 0); });
