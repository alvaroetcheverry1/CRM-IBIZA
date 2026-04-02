// ─── Datos Demo (sin backend) ─────────────────────────────
export const MOCK_DATA = {
  dashboard: {
    kpis: { totalPropiedades: 4, totalPropietarios: 3, totalClientes: 4, ingresosVacacionalMes: 32000 },
    propiedadesPorTipo: [
      { tipo: 'VACACIONAL', _count: { tipo: 2 } },
      { tipo: 'LARGA_DURACION', _count: { tipo: 1 } },
      { tipo: 'VENTA', _count: { tipo: 1 } },
    ],
    propiedadesPorEstado: [
      { estado: 'DISPONIBLE', _count: { estado: 2 } },
      { estado: 'ALQUILADA', _count: { estado: 1 } },
      { estado: 'RESERVADA', _count: { estado: 1 } },
    ],
    leadsPorEstado: [
      { estado: 'NUEVO', _count: { estado: 1 } },
      { estado: 'CONTACTADO', _count: { estado: 1 } },
      { estado: 'VISITA', _count: { estado: 1 } },
      { estado: 'OFERTA', _count: { estado: 1 } },
    ],
    alertas: {
      reservasProximas: [
        { id: '1', clienteNombre: 'Familie Schmidt', noches: 14, fechaEntrada: new Date(Date.now() + 5 * 86400000).toISOString(), alquilerVacacional: { propiedad: { nombre: 'Villa Can Rimbau', referencia: 'ALQ-001' } } },
        { id: '2', clienteNombre: 'Johnson Family', noches: 7, fechaEntrada: new Date(Date.now() + 20 * 86400000).toISOString(), alquilerVacacional: { propiedad: { nombre: 'Finca Santa Gertrudis', referencia: 'ALQ-002' } } },
      ],
      pagosEnRetraso: [],
      alertasVencimiento: [
        { id: '1', propiedad: { nombre: 'Apartamento Carrer Major, 8', referencia: 'ALD-001' }, fechaVencimiento: new Date(Date.now() + 45 * 86400000).toISOString() },
      ],
    },
    actividadReciente: { documentosRecientes: [] },
  },

  propiedades: [
    {
      id: '1', referencia: 'ALQ-001', nombre: 'Villa Can Rimbau', tipo: 'VACACIONAL', zona: 'Jesús', municipio: 'Santa Eulalia del Río',
      habitaciones: 6, banos: 5, metrosConstruidos: 520, metrosParcela: 3200, piscina: 'SI', garaje: true, terraza: true, jardin: true, vistasMar: true,
      categoria: 'LUJO', estado: 'DISPONIBLE',
      caracteristicas: 'Vista al mar, Piscina infinita, Jardín mediterráneo, Domótica, WiFi fibra, Barbacoa, Parking privado, Gym',
      descripcion: 'Espectacular villa de lujo con vistas panorámicas al mar en la exclusiva zona de Jesús. Diseño contemporáneo renovada en 2023.',
      propietario: { id: '1', nombre: 'Philippe', apellidos: 'Dubois', telefono: '+34 971 234 567', email: 'philippe.dubois@email.com' },
      agente: { id: '1', nombre: 'María García' },
      alquilerVacacional: { precioTemporadaAlta: 8500, precioTemporadaMedia: 5200, precioTemporadaBaja: 3200, depositoGarantia: 5000, licenciaETV: 'ETV-2023-IB-001234', minimoNoches: 7, personasMaximas: 12 },
      alquilerLargaDuracion: null, venta: null,
      documentos: [
        { id: 'img1', tipo: 'FOTO', urlDrive: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200' },
        { id: 'img2', tipo: 'FOTO', urlDrive: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200' },
        { id: 'img3', tipo: 'FOTO', urlDrive: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200' },
        { id: 'img4', tipo: 'FOTO', urlDrive: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200' }
      ], actividades: [], creadoEn: '2024-01-15T10:00:00Z',
    },
    {
      id: '2', referencia: 'ALQ-002', nombre: 'Finca Santa Gertrudis', tipo: 'VACACIONAL', zona: 'Santa Gertrudis', municipio: 'Santa Eulalia del Río',
      habitaciones: 4, banos: 3, metrosConstruidos: 310, metrosParcela: 8000, piscina: 'SI', garaje: false, terraza: true, jardin: true, vistasMar: false,
      categoria: 'PREMIUM', estado: 'ALQUILADA',
      caracteristicas: 'Piscina, Jardín, Finca traditional ibicenca, Chimenea, Huerto',
      descripcion: 'Auténtica finca ibicenca rehabilitada con arquitectura tradicional y comodidades modernas.',
      propietario: { id: '3', nombre: 'Hans', apellidos: 'Müller', telefono: '+49 170 123 4567', email: 'hans.muller@email.de' },
      agente: { id: '1', nombre: 'María García' },
      alquilerVacacional: { precioTemporadaAlta: 4800, precioTemporadaMedia: 3100, precioTemporadaBaja: 2100, depositoGarantia: 2500, licenciaETV: 'ETV-2021-IB-005678', minimoNoches: 7, personasMaximas: 8 },
      alquilerLargaDuracion: null, venta: null,
      documentos: [], actividades: [], creadoEn: '2024-02-20T10:00:00Z',
    },
    {
      id: '3', referencia: 'ALD-001', nombre: 'Apartamento Carrer Major, 8', tipo: 'LARGA_DURACION', zona: 'Eivissa Centre', municipio: 'Eivissa',
      habitaciones: 2, banos: 1, metrosConstruidos: 82, piscina: 'COMUNITARIA', garaje: false, ascensor: true,
      categoria: 'ESTANDAR', estado: 'ALQUILADA',
      descripcion: 'Apartamento reformado en el centro histórico de Eivissa, cerca de Dalt Vila.',
      propietario: { id: '2', nombre: 'Isabel', apellidos: 'Fernández Mas', telefono: '+34 971 345 678', email: 'isabel.fernandez@email.com' },
      agente: { id: '2', nombre: 'Carlos Martínez' },
      alquilerVacacional: null,
      alquilerLargaDuracion: { rentaMensual: 1400, inquilinoNombre: 'Laura Sánchez', inquilinoTelefono: '+34 622 111 222', inquilinoEmail: 'laura.sanchez@email.com', fechaInicio: '2024-09-01', duracionMeses: 12, fechaVencimiento: new Date(Date.now() + 45 * 86400000).toISOString(), fianzaMeses: 2, fianzaImporte: 2800 },
      venta: null,
      documentos: [], actividades: [], creadoEn: '2024-09-01T10:00:00Z',
    },
    {
      id: '4', referencia: 'VTA-001', nombre: 'Villa Talamanca Premium', tipo: 'VENTA', zona: 'Talamanca', municipio: 'Eivissa',
      habitaciones: 5, banos: 5, metrosConstruidos: 580, metrosParcela: 2800, piscina: 'SI', garaje: true, jardin: true, vistasMar: true,
      categoria: 'LUJO', estado: 'DISPONIBLE',
      caracteristicas: 'Frente al mar, Domótica, Cine en casa, Spa, Vista panorámica Eivissa, Acceso directo playa',
      descripcion: 'Villa de arquitectura contemporánea única en primera línea, con acceso directo a Talamanca.',
      propietario: { id: '1', nombre: 'Philippe', apellidos: 'Dubois', telefono: '+34 971 234 567', email: 'philippe.dubois@email.com' },
      agente: { id: '1', nombre: 'María García' },
      alquilerVacacional: null, alquilerLargaDuracion: null,
      venta: { precioVenta: 5800000, precioMinimo: 5200000, referenciaCatastral: '07026A001000010000FQ', estadoHipotecario: 'LIBRE', comisionAgencia: 5, etapaPipeline: 'COMERCIALIZACION' },
      documentos: [], actividades: [], creadoEn: '2024-03-01T10:00:00Z',
    },
  ],

  propietarios: [
    { id: '1', nombre: 'Philippe', apellidos: 'Dubois', nif: 'X1234567A', telefono: '+34 971 234 567', email: 'philippe.dubois@email.com', ciudad: 'Pollença', pais: 'Francia', categoria: 'PREMIUM', notas: 'Cliente de alto standing.', _count: { propiedades: 2 }, creadoEn: '2023-05-10T10:00:00Z' },
    { id: '2', nombre: 'Isabel', apellidos: 'Fernández Mas', nif: '41234567B', telefono: '+34 971 345 678', email: 'isabel.fernandez@email.com', ciudad: 'Palma', pais: 'España', categoria: 'ESTANDAR', _count: { propiedades: 1 }, creadoEn: '2023-07-22T10:00:00Z' },
    { id: '3', nombre: 'Hans', apellidos: 'Müller', nif: 'X9876543C', telefono: '+49 170 123 4567', email: 'hans.muller@email.de', ciudad: 'Sóller', pais: 'Alemania', categoria: 'PREMIUM', _count: { propiedades: 1 }, creadoEn: '2023-09-05T10:00:00Z' },
  ],

  clientes: [
    { id: '1', nombre: 'Stefan', apellidos: 'Weber', telefono: '+49 170 555 1234', email: 'stefan.weber@email.de', tipo: 'COMPRADOR', estado: 'VISITA', presupuesto: 5000000, zonaInteres: 'Son Vida, Puerto Andratx', habitacionesMin: 5, origen: 'REFERIDO', notas: 'Interesado en villas de lujo. Familia de 4.', _count: { actividades: 3 }, creadoEn: '2024-01-10T10:00:00Z' },
    { id: '2', nombre: 'Claudia', apellidos: 'Moreau', telefono: '+33 6 12 34 56 78', email: 'claudia.moreau@email.fr', tipo: 'INQUILINO', estado: 'OFERTA', presupuesto: 5000, zonaInteres: 'Pollença, Alcúdia', habitacionesMin: 4, origen: 'WEB', notas: 'Busca villa vacacional para verano.', _count: { actividades: 2 }, creadoEn: '2024-02-05T10:00:00Z' },
    { id: '3', nombre: 'James', apellidos: 'Thompson', telefono: '+44 7700 900123', email: 'j.thompson@email.co.uk', tipo: 'AMBOS', estado: 'NUEVO', presupuesto: 2000000, zonaInteres: null, origen: 'PORTAL', _count: { actividades: 0 }, creadoEn: '2024-03-01T10:00:00Z' },
    { id: '4', nombre: 'Anna', apellidos: 'Kowalski', telefono: '+48 600 123 456', email: null, tipo: 'INQUILINO', estado: 'CONTACTADO', presupuesto: 2500, zonaInteres: 'Palma Centro', habitacionesMin: 2, origen: 'WEB', _count: { actividades: 1 }, creadoEn: '2024-03-10T10:00:00Z' },
  ],

  documentos: [],
  reservas: [],
  pagos: [],
  facturas: [
    {
      id: 'f-001',
      numero: 'F-2024-001',
      fechaEmision: '2024-03-01T10:00:00Z',
      fechaVencimiento: '2024-03-15T10:00:00Z',
      cliente: { id: 'c-1', nombre: 'Carlos', apellidos: 'López' },
      propiedad: { id: '1', nombre: 'Villa Can Rimbau' },
      estado: 'PAGADA',
      conceptos: [
        { id: 1, descripcion: 'Honorarios intermediación alquiler vacacional (Marzo)', cantidad: 1, precioUnitario: 1500, impuestoPorcentaje: 21 },
      ],
      subtotal: 1500,
      totalImpuestos: 315,
      total: 1815,
      notas: 'Abonado por transferencia bancaria.',
    },
    {
      id: 'f-002',
      numero: 'F-2024-002',
      fechaEmision: '2024-03-10T10:00:00Z',
      fechaVencimiento: '2024-03-25T10:00:00Z',
      cliente: { id: 'c-2', nombre: 'Elena', apellidos: 'Martínez' },
      propiedad: null,
      estado: 'PENDIENTE',
      conceptos: [
        { id: 1, descripcion: 'Servicios de consultoría inmobiliaria premium', cantidad: 10, precioUnitario: 120, impuestoPorcentaje: 21 },
      ],
      subtotal: 1200,
      totalImpuestos: 252,
      total: 1452,
      notas: 'Pendiente de cobro a 15 días.',
    }
  ]
};
