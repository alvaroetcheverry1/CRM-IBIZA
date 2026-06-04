const { google } = require('googleapis');
const { logger } = require('../utils/logger');
const path = require('path');

class SheetsService {
  constructor() {
    this.enabled = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    this.sheets = null;
    this.sheetId = process.env.GOOGLE_SHEET_MASTER_ID;
  }

  async getClient() {
    if (this.sheets) return this.sheets;
    if (!this.enabled || !this.sheetId) return null;

    try {
      const keyPath = path.resolve(__dirname, '../../', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
      const key = require(keyPath);
      const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
      return this.sheets;
    } catch (err) {
      logger.warn('Sheets: no se pudo inicializar:', err.message);
      return null;
    }
  }

  // Mapear Propiedad
  propiedadToRow(propiedad) {
    const fecha = new Date(propiedad.creadoEn).toLocaleDateString('es-ES');
    
    // Simplificamos la fila para el master
    // ID, Tipo, Nombre, Zona, Habitaciones, Precio, Estado, URL Drive
    let precio = '';
    if (propiedad.tipo === 'VACACIONAL') precio = propiedad.alquilerVacacional?.precioTemporadaAlta || '';
    if (propiedad.tipo === 'LARGA_DURACION') precio = propiedad.alquilerLargaDuracion?.rentaMensual || '';
    if (propiedad.tipo === 'VENTA') precio = propiedad.venta?.precioVenta || '';

    return [
      propiedad.id, // A
      propiedad.referencia || '', // B
      propiedad.tipo, // C
      propiedad.nombre, // D
      propiedad.zona || '', // E
      propiedad.habitaciones || '', // F
      precio, // G
      propiedad.estado || '', // H
      propiedad.urlDriveCarpeta || '', // I
      fecha // J
    ];
  }

  // Mapear Cliente
  clienteToRow(cliente) {
    const fecha = new Date(cliente.creadoEn).toLocaleDateString('es-ES');
    return [
      cliente.id, // A
      cliente.nombre || '', // B
      cliente.apellidos || '', // C
      cliente.telefono || '', // D
      cliente.email || '', // E
      cliente.presupuesto || '', // F
      cliente.estado || '', // G
      fecha // H
    ];
  }

  async inicializarPestanas(sheets) {
    // Verificar si las pestañas existen, si no, crearlas.
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
      const sheetsList = spreadsheet.data.sheets.map(s => s.properties.title);
      
      const requiredSheets = ['Propiedades', 'Clientes'];
      const requests = [];

      requiredSheets.forEach(title => {
        if (!sheetsList.includes(title)) {
          requests.push({
            addSheet: { properties: { title } }
          });
        }
      });

      if (requests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.sheetId,
          requestBody: { requests }
        });
        
        // Escribir cabeceras
        if (!sheetsList.includes('Propiedades')) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: 'Propiedades!A1:J1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['ID CRM', 'Referencia', 'Tipo', 'Nombre', 'Zona', 'Habitaciones', 'Precio/Renta', 'Estado', 'URL Drive', 'Fecha Alta']] }
          });
        }
        if (!sheetsList.includes('Clientes')) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: 'Clientes!A1:H1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['ID CRM', 'Nombre', 'Apellidos', 'Teléfono', 'Email', 'Presupuesto', 'Estado', 'Fecha Alta']] }
          });
        }
      }
    } catch (e) {
      logger.warn('Sheets: Error verificando pestañas', e.message, e.response?.data);
    }
  }

  async sincronizarEntidad(entidad, tipoEntidad) {
    try {
      const sheets = await this.getClient();
      if (!sheets) return;

      await this.inicializarPestanas(sheets);

      let sheetName = '';
      let row = [];

      if (tipoEntidad === 'propiedad') {
        sheetName = 'Propiedades';
        row = this.propiedadToRow(entidad);
      } else if (tipoEntidad === 'cliente') {
        sheetName = 'Clientes';
        row = this.clienteToRow(entidad);
      } else {
        return;
      }

      // Buscar si existe (basado en ID, columna A)
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: `${sheetName}!A:A`,
      });

      const rows = existing.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === entidad.id);

      if (rowIndex > 0) {
        // Actualizar fila
        await sheets.spreadsheets.values.update({
          spreadsheetId: this.sheetId,
          range: `${sheetName}!A${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
      } else {
        // Añadir nueva fila
        await sheets.spreadsheets.values.append({
          spreadsheetId: this.sheetId,
          range: `${sheetName}!A:A`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
      }

      logger.info(`Sheets: ${tipoEntidad} ${entidad.id} sincronizado`);
    } catch (err) {
      logger.error(`Sheets: error sincronizando ${tipoEntidad}: ${err.message}`);
    }
  }

  async sincronizarPropiedad(propiedad) {
    return this.sincronizarEntidad(propiedad, 'propiedad');
  }

  async sincronizarCliente(cliente) {
    return this.sincronizarEntidad(cliente, 'cliente');
  }
}

const sheetsService = new SheetsService();
module.exports = { sheetsService };
