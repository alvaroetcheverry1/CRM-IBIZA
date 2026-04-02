const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:${PORT}/oauth2callback`
);

app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Fuerza a obtener refresh_token siempre
  });
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.send(`
        <div style="font-family:sans-serif;text-align:center;margin-top:50px;color:#DC2626">
          <h2>⚠️ No se obtuvo refresh_token</h2>
          <p>Esto ocurre cuando la app ya está autorizada. Revoca el acceso en
          <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>
          y vuelve a intentarlo.</p>
        </div>
      `);
    }

    // Guardar en .env
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ REFRESH TOKEN guardado en .env');
    console.log('🔄 Reinicia el backend: npm start\n');

    res.send(`
      <div style="font-family:sans-serif;text-align:center;margin-top:50px;max-width:500px;margin-left:auto;margin-right:auto;">
        <div style="font-size:4rem">✅</div>
        <h1 style="color:#059669">¡Conexión Exitosa!</h1>
        <p style="color:#374151">Tu CRM ya está enlazado a <strong>Google Drive y Google Sheets</strong>.</p>
        <p style="color:#374151">El <code>GOOGLE_REFRESH_TOKEN</code> se ha guardado en <code>.env</code>.</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:1.5rem 0"/>
        <p style="color:#6B7280;font-size:0.9rem">
          Próximo paso: reinicia el backend con <code>npm start</code> en la carpeta <code>backend/</code>.<br/>
          También añade tu <strong>GOOGLE_DRIVE_FOLDER_ID</strong> al <code>.env</code>.
        </p>
        <p style="color:#6B7280;font-size:0.85rem">Puedes cerrar esta pestaña.</p>
      </div>
    `);

    setTimeout(() => process.exit(0), 1500);
  } catch (err) {
    console.error('Error en OAuth callback:', err.message);
    res.send(`<h2 style="color:red">Error: ${err.message}</h2>`);
  }
});

// Página de inicio con instrucciones
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family:sans-serif;text-align:center;margin-top:60px;">
      <h2>Configuración Google Drive · CRM</h2>
      <a href="/auth" style="display:inline-block;padding:1rem 2rem;background:#1A3A5C;color:white;border-radius:8px;text-decoration:none;font-size:1.1rem;margin-top:1rem">
        Conectar con Google →
      </a>
    </div>
  `);
});

app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('🚀 SERVIDOR DE AUTORIZACIÓN GOOGLE (Drive + Sheets)');
  console.log('');
  console.log('  Abre este enlace en tu navegador:');
  console.log(`  \x1b[36mhttp://localhost:${PORT}/auth\x1b[0m`);
  console.log('');
  console.log('  O visita: http://localhost:3001');
  console.log('======================================================\n');
});
