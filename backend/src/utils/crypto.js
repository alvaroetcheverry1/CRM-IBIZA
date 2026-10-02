/**
 * crypto.js — Cifrado en reposo de campos sensibles (AES-256-GCM).
 *
 * Usa ENCRYPTION_KEY (clave de 32 bytes en hex o base64, o cualquier cadena que se
 * normaliza a 32 bytes con SHA-256). Si no hay clave configurada, el cifrado queda
 * deshabilitado y los valores se guardan tal cual (modo degradado para desarrollo).
 *
 * Formato del valor cifrado:  enc:v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 * El prefijo permite detectar si un valor ya está cifrado y mantener compatibilidad
 * con datos antiguos guardados en texto plano (se devuelven sin cambios al leer).
 */
const crypto = require('crypto');
const { logger } = require('./logger');

const PREFIX = 'enc:v1:';
const raw = process.env.ENCRYPTION_KEY || '';
let KEY = null;

if (raw) {
  // Normaliza cualquier cadena a exactamente 32 bytes.
  KEY = crypto.createHash('sha256').update(raw).digest();
} else {
  logger.warn('[crypto] ENCRYPTION_KEY no configurada: los campos sensibles NO se cifran.');
}

const cryptoUtil = {
  get enabled() {
    return !!KEY;
  },

  /** Cifra un string. Devuelve el valor con prefijo, o el original si no procede. */
  encrypt(value) {
    if (!KEY || value == null || value === '') return value;
    if (typeof value === 'string' && value.startsWith(PREFIX)) return value; // ya cifrado
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
      const ct = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
    } catch (e) {
      logger.error('[crypto] Error cifrando:', e.message);
      return value;
    }
  },

  /** Descifra un valor con prefijo. Si no está cifrado, lo devuelve tal cual. */
  decrypt(value) {
    if (!KEY || typeof value !== 'string' || !value.startsWith(PREFIX)) return value;
    try {
      const [, , ivB64, tagB64, ctB64] = value.split(':');
      const iv = Buffer.from(ivB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');
      const ct = Buffer.from(ctB64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    } catch (e) {
      logger.error('[crypto] Error descifrando:', e.message);
      return value;
    }
  },
};

module.exports = { cryptoUtil };
