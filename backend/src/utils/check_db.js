require('dotenv').config({ path: __dirname + '/../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.propiedad.count();
  console.log(`Total propiedades: ${count}`);
  const props = await prisma.propiedad.findMany({
    select: { id: true, nombre: true, creadoEn: true, activo: true },
    orderBy: { creadoEn: 'asc' },
    take: 10
  });
  console.log('Oldest properties:');
  console.log(props);
  
  const lastProps = await prisma.propiedad.findMany({
    select: { id: true, nombre: true, creadoEn: true, activo: true },
    orderBy: { creadoEn: 'desc' },
    take: 5
  });
  console.log('Newest properties:');
  console.log(lastProps);
  
  const clientesCount = await prisma.cliente.count();
  console.log(`Total clientes: ${clientesCount}`);
  
  await prisma.$disconnect();
}
check();
