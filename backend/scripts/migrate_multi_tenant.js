const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Iniciando script de migración multi-tenant...');
  
  // Buscar o crear la agencia por defecto
  let agencia = await prisma.agencia.findFirst({ orderBy: { creadoEn: 'asc' } });
  
  if (!agencia) {
    agencia = await prisma.agencia.create({
      data: {
        nombre: 'Agencia Principal',
        email: 'info@agenciaprincipal.com',
        estado: 'ACTIVA',
        plan: 'PRO',
      }
    });
    console.log('Creada agencia principal por defecto:', agencia.id);
  } else {
    console.log('Agencia principal encontrada:', agencia.id, '-', agencia.nombre);
  }

  const { id: agenciaId } = agencia;

  // Actualizar Usuarios
  const usuariosRes = await prisma.usuario.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Usuarios actualizados: ${usuariosRes.count}`);

  // Actualizar Propiedades
  const propsRes = await prisma.propiedad.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Propiedades actualizadas: ${propsRes.count}`);

  // Actualizar Clientes
  const clientesRes = await prisma.cliente.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Clientes actualizados: ${clientesRes.count}`);

  // Actualizar Propietarios
  const propRes = await prisma.propietario.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Propietarios actualizados: ${propRes.count}`);

  // Actualizar Documentos
  const docRes = await prisma.documento.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Documentos actualizados: ${docRes.count}`);

  // Actualizar Configuración
  const configRes = await prisma.configuracionAgencia.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Configuraciones actualizadas: ${configRes.count}`);
  
  // Actividades
  const actRes = await prisma.actividad.updateMany({
    where: { agenciaId: null },
    data: { agenciaId }
  });
  console.log(`Actividades actualizadas: ${actRes.count}`);

  console.log('Migración completada con éxito.');
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
