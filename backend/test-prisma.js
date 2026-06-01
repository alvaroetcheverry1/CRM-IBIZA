const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const payload = {
      nombre: "Test Lead",
      apellidos: "",
      email: "",
      telefono: "",
      tipo: "COMPRADOR",
      estado: "NUEVO",
      presupuesto: null,
      zonaInteres: "",
      habitacionesMin: null,
      habitacionesMax: null,
      origen: "",
      notas: ""
    };
    
    // Simulate what Prisma gets
    const res = await prisma.cliente.create({ data: payload });
    console.log("Success:", res.id);
  } catch(e) {
    console.error("Prisma Error:", e);
  } finally {
    process.exit(0);
  }
}

main();
