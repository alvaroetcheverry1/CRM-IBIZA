const { createClient } = require('@supabase/supabase-js');

// Para compatibilidad con Node.js 20 usando la librería en backend
global.WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa el cliente si las variables existen
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BUCKET_NAME = 'crm-uploads';

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública.
 * @param {Buffer} buffer - Los bytes del archivo
 * @param {string} filename - Nombre del archivo (ej: 123_foto.jpg)
 * @param {string} mimetype - Tipo MIME (ej: image/jpeg)
 * @returns {Promise<string>} La URL pública del archivo
 */
async function uploadFile(buffer, filename, mimetype) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: true
    });

  if (error) {
    console.error('Error subiendo a Supabase:', error);
    throw new Error('No se pudo subir el archivo a Supabase: ' + error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

module.exports = {
  uploadFile,
  supabase
};
