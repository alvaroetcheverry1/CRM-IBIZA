require('dotenv').config({ path: __dirname + '/../.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function run() {
  const file = path.join(__dirname, '../prisma/propiedades.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`Read ${data.length} properties from JSON`);
  
  for (const p of data) {
    try {
      const exists = await prisma.propiedad.findUnique({ where: { id: p.id } });
      if (!exists) {
        await prisma.propiedad.create({
          data: {
            id: p.id, referencia: p.referencia, nombre: p.nombre, tipo: p.tipo, zona: p.zona,
            municipio: p.municipio, direccion: p.direccion, latitud: p.latitud, longitud: p.longitud,
            habitaciones: p.habitaciones, banos: p.banos, metrosConstruidos: p.metrosConstruidos,
            metrosParcela: p.metrosParcela, piscina: p.piscina, garaje: p.garaje === 1,
            trastero: p.trastero === 1, ascensor: p.ascensor === 1, terraza: p.terraza === 1,
            jardin: p.jardin === 1, vistasMar: p.vistasMar === 1, categoria: p.categoria,
            estado: p.estado, caracteristicas: p.caracteristicas, descripcion: p.descripcion,
            notas: p.notas, urlDriveCarpeta: p.urlDriveCarpeta, fotoPrincipal: p.fotoPrincipal,
            fotos: p.fotos || '[]', activo: p.activo === 1,
            creadoEn: new Date(p.creadoEn), actualizadoEn: new Date(p.actualizadoEn),
            propietarioId: p.propietarioId, agenteId: p.agenteId
          }
        });
        console.log(`Created property ${p.nombre}`);
      } else {
        console.log(`Property ${p.nombre} already exists`);
      }
    } catch (e) {
      console.log(`Error creating ${p.nombre}:`, e.message);
    }
  }
}

run().finally(() => prisma.$disconnect());
