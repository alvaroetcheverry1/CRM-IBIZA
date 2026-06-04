require('dotenv').config({ path: __dirname + '/../../.env' });
const { sheetsService } = require('./sheetsService');

async function test() {
  try {
    const sheets = await sheetsService.getClient();
    if (!sheets) {
      console.error('No se pudo obtener el cliente de sheets. Revisa GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
      return;
    }
    console.log('Cliente Sheets OK');
    await sheetsService.inicializarPestanas(sheets);
    console.log('Pestañas inicializadas OK');
  } catch (e) {
    console.error('Error detallado:', e);
  }
}

test();
