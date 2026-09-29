const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando corrección de problemas de login...');

  // 1. Activar todas las agencias pendientes
  const { count } = await prisma.agencia.updateMany({
    where: { estado: 'PENDIENTE' },
    data: { estado: 'ACTIVA' },
  });
  console.log(`✅ ${count} agencias que estaban en estado PENDIENTE han sido activadas.`);

  // 2. Establecer contraseña para admin@crm-dev.com
  const adminEmail = 'admin@crm-dev.com';
  const adminUser = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  
  if (adminUser) {
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    
    await prisma.usuario.update({
      where: { id: adminUser.id },
      data: { passwordHash },
    });
    console.log(`✅ Contraseña del usuario ${adminEmail} establecida como: ${defaultPassword}`);
  } else {
    console.log(`ℹ️ Usuario ${adminEmail} no encontrado. Se creará uno nuevo...`);
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    
    await prisma.usuario.create({
      data: {
        email: adminEmail,
        nombre: 'Admin',
        apellidos: 'Dev',
        rol: 'SUPERADMIN',
        passwordHash,
      },
    });
    console.log(`✅ Usuario ${adminEmail} creado con contraseña: ${defaultPassword}`);
  }

  console.log('🎉 Todos los problemas de login han sido corregidos.');
}

main()
  .catch(e => {
    console.error('Error durante la ejecución del script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
