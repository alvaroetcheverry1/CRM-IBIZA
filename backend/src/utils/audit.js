const { prisma } = require('./prisma');

/**
 * Registra una acción de auditoría en la base de datos
 */
async function auditLog(usuarioId, accion, entidad, entidadId, datoAntes, datoDespues) {
  try {
    await prisma.auditLog.create({
      data: {
        accion,
        entidad,
        entidadId,
        datos: { antes: datoAntes, despues: datoDespues },
        usuarioId,
        propiedadId: entidad === 'Propiedad' ? entidadId : undefined,
      },
    });
  } catch {
    // Auditoría nunca debe bloquear la operación principal
  }
}

module.exports = { auditLog };
