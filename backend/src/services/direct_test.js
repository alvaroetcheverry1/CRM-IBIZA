require('dotenv').config({ path: __dirname + '/../../.env' });
const { google } = require('googleapis');
const path = require('path');

async function directTest() {
  const sheetId = process.env.GOOGLE_SHEET_MASTER_ID;
  const keyPath = path.resolve(__dirname, '../../', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
  console.log('KEY PATH:', keyPath);
  console.log('SHEET ID:', sheetId);
  const key = require(keyPath);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log('SUCCESS, sheets found:', spreadsheet.data.sheets.map(s => s.properties.title));
  } catch (e) {
    console.error('API ERROR:', e.response ? e.response.data : e.message);
  }
}
directTest();
