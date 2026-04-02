const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.documento.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.propietario.deleteMany();
  await prisma.usuario.deleteMany();

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@crm-dev.com',
      nombre: 'Admin',
      apellidos: 'Principal',
      rol: 'SUPERADMIN'
    }
  });

  const prop1 = await prisma.propietario.create({
    data: { nombre: 'Philippe', apellidos: 'Dubois', telefono: '+34 971 234 567', email: 'philippe.dubois@email.com', categoria: 'PREMIUM' }
  });

  await prisma.propiedad.create({
    data: {
      referencia: 'ALQ-001', nombre: 'Villa Can Rimbau', tipo: 'VACACIONAL', zona: 'Jesús', municipio: 'Santa Eulalia',
      habitaciones: 6, banos: 5, metrosConstruidos: 520, metrosParcela: 3200, piscina: 'SI', garaje: true, terraza: true, jardin: true, vistasMar: true,
      categoria: 'LUJO', estado: 'DISPONIBLE',
      caracteristicas: 'Vista al mar, Piscina infinita', 
      descripcion: 'Espectacular villa de lujo con vistas panorámicas.',
      propietarioId: prop1.id,
      creadoPorId: admin.id,
      alquilerVacacional: {
        create: { precioTemporadaAlta: 8500, precioTemporadaMedia: 5200, precioTemporadaBaja: 3200, depositoGarantia: 5000, licenciaETV: 'ETV-1234' }
      },
      documentos: {
        create: [
          { tipo: 'FOTO', nombre: 'img1.jpg', urlDrive: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200' },
          { tipo: 'FOTO', nombre: 'img2.jpg', urlDrive: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200' },
          { tipo: 'FOTO', nombre: 'img3.jpg', urlDrive: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200' },
          { tipo: 'FOTO', nombre: 'img4.jpg', urlDrive: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200' }
        ]
      }
    }
  });

  console.log('Seed exitoso');
}

main().catch(console.error).finally(() => prisma.$disconnect());
