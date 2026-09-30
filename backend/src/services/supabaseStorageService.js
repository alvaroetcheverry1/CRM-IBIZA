const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Para compatibilidad con Node.js 20 usando la librería en backend
global.WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa el cliente si las variables existen
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BUCKET_NAME = 'crm-uploads';

// Carpeta local donde el backend ya sirve estáticos en /api/uploads (ver server.js)
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

/**
 * Guarda un archivo en disco local como fallback cuando Supabase no está configurado.
 * Devuelve una URL servible por el backend en /api/uploads/<filename>.
 * Usa PUBLIC_SERVER_URL si está definida (necesario para que los portales y el
 * frontend en producción resuelvan la imagen); si no, devuelve una ruta relativa.
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<string>}
 */
async function saveFileLocally(buffer, filename) {
  await fs.promises.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  const destPath = path.join(LOCAL_UPLOADS_DIR, filename);
  await fs.promises.writeFile(destPath, buffer);

  const base = (process.env.PUBLIC_SERVER_URL || '').replace(/\/$/, '');
  return base ? `${base}/api/uploads/${filename}` : `/api/uploads/${filename}`;
}

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública.
 * Si Supabase NO está configurado, hace fallback a almacenamiento en disco local
 * (servido vía /api/uploads) en lugar de lanzar un error. Esto garantiza que la
 * subida de fotos/documentos funcione siempre, aunque sin CDN.
 * @param {Buffer} buffer - Los bytes del archivo
 * @param {string} filename - Nombre del archivo (ej: 123_foto.jpg)
 * @param {string} mimetype - Tipo MIME (ej: image/jpeg)
 * @returns {Promise<string>} La URL pública del archivo
 */
async function uploadFile(buffer, filename, mimetype) {
  if (!supabase) {
    // Fallback local: Supabase no configurado
    console.warn(
      `[storage] Supabase no configurado — guardando "${filename}" en disco local (/api/uploads). ` +
      'Para CDN en producción, configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
    );
    return saveFileLocally(buffer, filename);
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      // Ante fallo de Supabase, no perdemos el archivo: fallback a local
      console.error('Error subiendo a Supabase, usando fallback local:', error.message);
      return saveFileLocally(buffer, filename);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Excepción subiendo a Supabase, usando fallback local:', err.message);
    return saveFileLocally(buffer, filename);
  }
}

module.exports = {
  uploadFile,
  saveFileLocally,
  supabase,
};
