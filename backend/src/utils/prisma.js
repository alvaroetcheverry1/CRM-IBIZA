const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { cryptoUtil } = require('./crypto');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// ─── Cifrado en reposo de campos sensibles ─────────────────────────────────
// Campos a cifrar por modelo (AES-256-GCM, ver utils/crypto.js).
const CAMPOS_CIFRADOS = {
  Propietario: ['nif', 'iban'],
  AlquilerLargaDuracion: ['inquilinoNif'],
  ConfiguracionAgencia: ['cif', 'iban'],
};

if (cryptoUtil.enabled) {
  prisma.$use(async (params, next) => {
    const campos = CAMPOS_CIFRADOS[params.model];
    if (!campos) return next(params);

    // Cifrar a la entrada (create/update/upsert).
    const cifrarEn = (obj) => {
      if (!obj) return;
      for (const c of campos) {
        if (obj[c] != null && typeof obj[c] === 'string') obj[c] = cryptoUtil.encrypt(obj[c]);
      }
    };
    if (['create', 'update'].includes(params.action)) {
      cifrarEn(params.args?.data);
    } else if (params.action === 'upsert') {
      cifrarEn(params.args?.create);
      cifrarEn(params.args?.update);
    } else if (['createMany', 'updateMany'].includes(params.action)) {
      const d = params.args?.data;
      if (Array.isArray(d)) d.forEach(cifrarEn); else cifrarEn(d);
    }

    const result = await next(params);

    // Descifrar a la salida.
    const descifrarEn = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const c of campos) {
        if (typeof obj[c] === 'string') obj[c] = cryptoUtil.decrypt(obj[c]);
      }
    };
    if (Array.isArray(result)) result.forEach(descifrarEn);
    else descifrarEn(result);

    return result;
  });
  logger.info('[crypto] Cifrado en reposo activo para campos sensibles.');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma Client desconectado');
});

module.exports = { prisma };
