require('dotenv').config({ path: __dirname + '/../.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function loadJson(filename) {
  const file = path.join(__dirname, '../../prisma', filename);
  if (fs.existsSync(file)) {
    const data = fs.readFileSync(file, 'utf8');
    if (!data.trim()) return [];
    return JSON.parse(data);
  }
  return [];
}

async function migrate() {
  try {
    console.log('--- Migrating Usuarios ---');
    const usuarios = loadJson('usuarios.json');
    for (const u of usuarios) {
      const exists = await prisma.usuario.findUnique({ where: { email: u.email } });
      if (!exists) {
        await prisma.usuario.create({
          data: {
            id: u.id, googleId: u.googleId, email: u.email, nombre: u.nombre, apellidos: u.apellidos,
            avatar: u.avatar, rol: u.rol, activo: u.activo === 1,
            creadoEn: new Date(u.creadoEn), actualizadoEn: new Date(u.actualizadoEn)
          }
        });
      }
    }

    console.log('--- Migrating Propietarios ---');
    const propietarios = loadJson('propietarios.json');
    for (const p of propietarios) {
      const exists = await prisma.propietario.findUnique({ where: { id: p.id } });
      if (!exists) {
        await prisma.propietario.create({
          data: {
            id: p.id, nombre: p.nombre, apellidos: p.apellidos, nif: p.nif, telefono: p.telefono,
            telefonoAlternativo: p.telefonoAlternativo, email: p.email, direccion: p.direccion,
            ciudad: p.ciudad, pais: p.pais, iban: p.iban, categoria: p.categoria, notas: p.notas,
            urlDriveCarpeta: p.urlDriveCarpeta, activo: p.activo === 1,
            creadoEn: new Date(p.creadoEn), actualizadoEn: new Date(p.actualizadoEn)
          }
        });
      }
    }

    console.log('--- Migrating Clientes ---');
    const clientes = loadJson('clientes.json');
    for (const c of clientes) {
      const exists = await prisma.cliente.findUnique({ where: { id: c.id } });
      if (!exists) {
        await prisma.cliente.create({
          data: {
            id: c.id, nombre: c.nombre, apellidos: c.apellidos, telefono: c.telefono, email: c.email,
            tipo: c.tipo, estado: c.estado, presupuesto: c.presupuesto, zonaInteres: c.zonaInteres,
            habitacionesMin: c.habitacionesMin, habitacionesMax: c.habitacionesMax, notas: c.notas,
            origen: c.origen, urlDriveCarpeta: c.urlDriveCarpeta, activo: c.activo === 1,
            creadoEn: new Date(c.creadoEn), actualizadoEn: new Date(c.actualizadoEn)
          }
        });
      }
    }

    console.log('--- Migrating Propiedades ---');
    const propiedades = loadJson('propiedades.json');
    const vacacionales = loadJson('vacacional.json');
    const largas = loadJson('larga.json');
    const ventas = loadJson('venta.json');
    
    // Get valid admin ID
    const defaultUser = await prisma.usuario.findFirst();
    const validAgenteId = defaultUser ? defaultUser.id : null;

    for (const p of propiedades) {
      const exists = await prisma.propiedad.findUnique({ where: { id: p.id } });
      if (!exists) {
        const vac = vacacionales.find(v => v.propiedadId === p.id);
        const larga = largas.find(l => l.propiedadId === p.id);
        const venta = ventas.find(v => v.propiedadId === p.id);

        let currentRef = p.referencia;
        let success = false;
        let attempts = 0;
        
        while (!success && attempts < 5) {
          try {
            await prisma.propiedad.create({
              data: {
                id: p.id, referencia: currentRef, nombre: p.nombre, tipo: p.tipo, zona: p.zona,
                municipio: p.municipio, direccion: p.direccion, latitud: p.latitud, longitud: p.longitud,
                habitaciones: p.habitaciones, banos: p.banos, metrosConstruidos: p.metrosConstruidos,
                metrosParcela: p.metrosParcela, piscina: p.piscina, garaje: p.garaje === 1,
                trastero: p.trastero === 1, ascensor: p.ascensor === 1, terraza: p.terraza === 1,
                jardin: p.jardin === 1, vistasMar: p.vistasMar === 1, categoria: p.categoria,
                estado: p.estado, caracteristicas: p.caracteristicas, descripcion: p.descripcion,
                notas: p.notas, urlDriveCarpeta: p.urlDriveCarpeta, fotoPrincipal: p.fotoPrincipal,
                fotos: p.fotos || '[]', activo: p.activo === 1,
                creadoEn: new Date(p.creadoEn), actualizadoEn: new Date(p.actualizadoEn),
                propietarioId: p.propietarioId, agenteId: validAgenteId,
                
                alquilerVacacional: vac ? {
                  create: {
                    id: vac.id, licenciaETV: vac.licenciaETV, cedula: vac.cedula,
                    precioTemporadaAlta: vac.precioTemporadaAlta, precioTemporadaMedia: vac.precioTemporadaMedia,
                    precioTemporadaBaja: vac.precioTemporadaBaja, depositoGarantia: vac.depositoGarantia,
                    checkInHora: vac.checkInHora, checkOutHora: vac.checkOutHora, instruccionesLlave: vac.instruccionesLlave,
                    minimoNoches: vac.minimoNoches, personasMaximas: vac.personasMaximas,
                    urlAirbnb: vac.urlAirbnb, urlBooking: vac.urlBooking, urlMioweb: vac.urlMioweb
                  }
                } : undefined,

                alquilerLargaDuracion: larga ? {
                  create: {
                    id: larga.id, inquilinoNombre: larga.inquilinoNombre, inquilinoNif: larga.inquilinoNif,
                    inquilinoTelefono: larga.inquilinoTelefono, inquilinoEmail: larga.inquilinoEmail,
                    fechaInicio: larga.fechaInicio ? new Date(larga.fechaInicio) : null, duracionMeses: larga.duracionMeses,
                    fechaVencimiento: larga.fechaVencimiento ? new Date(larga.fechaVencimiento) : null,
                    rentaMensual: larga.rentaMensual, fianzaMeses: larga.fianzaMeses, fianzaImporte: larga.fianzaImporte,
                    diaPagoCada: larga.diaPagoCada, ipcUltimaActualizacion: larga.ipcUltimaActualizacion ? new Date(larga.ipcUltimaActualizacion) : null
                  }
                } : undefined,

                venta: venta ? {
                  create: {
                    id: venta.id, precioVenta: venta.precioVenta, precioMinimo: venta.precioMinimo,
                    referenciaCatastral: venta.referenciaCatastral, numRegistroPropiedad: venta.numRegistroPropiedad,
                    estadoHipotecario: venta.estadoHipotecario, comisionAgencia: venta.comisionAgencia,
                    etapaPipeline: venta.etapaPipeline, fechaArras: venta.fechaArras ? new Date(venta.fechaArras) : null,
                    fechaEscritura: venta.fechaEscritura ? new Date(venta.fechaEscritura) : null,
                    notario: venta.notario, observaciones: venta.observaciones
                  }
                } : undefined
              }
            });
            success = true;
          } catch (e) {
            if (e.code === 'P2002' && e.meta && e.meta.target.includes('referencia')) {
              attempts++;
              currentRef = p.referencia + '-OLD' + (attempts > 1 ? attempts : '');
            } else {
              throw e;
            }
          }
        }
      }
    }

    console.log('--- Migrating Documentos ---');
    const documentos = loadJson('documentos.json');
    for (const d of documentos) {
      const exists = await prisma.documento.findUnique({ where: { id: d.id } });
      if (!exists) {
        await prisma.documento.create({
          data: {
            id: d.id, nombre: d.nombre, tipo: d.tipo, mimeType: d.mimeType, tamanoBytes: d.tamanoBytes,
            urlDrive: d.urlDrive, driveFileId: d.driveFileId, estadoProcesamiento: d.estadoProcesamiento,
            datosExtraidos: d.datosExtraidos, errorProcesamiento: d.errorProcesamiento,
            propiedadId: d.propiedadId, propietarioId: d.propietarioId, clienteId: d.clienteId,
            subidoPorId: validAgenteId,
            creadoEn: new Date(d.creadoEn)
          }
        });
      }
    }

    console.log('Migration Complete!');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
