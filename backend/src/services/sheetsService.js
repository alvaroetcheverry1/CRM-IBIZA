const { google } = require('googleapis');
const { logger } = require('../utils/logger');

const SHEET_HEADERS = {
  VACACIONAL: ['ID Referencia', 'Nombre Villa', 'Nombre Propietario', 'Teléfono Propietario',
    'Zona / Municipio', 'Nº Habitaciones', 'Nº Baños', 'Piscina', 'm² Construidos', 'm² Parcela',
    'Precio Temp. Alta €/sem', 'Precio Temp. Media €/sem', 'Precio Temp. Baja €/sem',
    'Licencia ETV', 'Características', 'Estado', 'URL Drive', 'Notas', 'Fecha Alta', 'Agente', 'URL Dossier'],
  LARGA_DURACION: ['ID Referencia', 'Nombre Propiedad', 'Nombre Propietario', 'Teléfono Propietario',
    'Zona', 'Habitaciones', 'Baños', 'm² Construidos', 'Renta Mensual €', 'Estado Contrato',
    'Inquilino', 'Fecha Inicio', 'Fecha Vencimiento', 'Estado', 'URL Drive', 'Fecha Alta', 'Agente', 'URL Dossier'],
  VENTA: ['ID Referencia', 'Nombre Propiedad', 'Nombre Propietario', 'Teléfono Propietario',
    'Zona', 'Habitaciones', 'Baños', 'm² Construidos', 'Precio Venta €', 'Referencia Catastral',
    'Estado Hipotecario', 'Comisión Agencia %', 'Etapa Pipeline', 'Características',
    'Estado', 'URL Drive', 'Fecha Alta', 'Agente', 'URL Dossier'],
};

class SheetsService {
  constructor() {
    this.enabled = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    this.sheets = null;
    this.sheetIds = {
      VACACIONAL: process.env.GOOGLE_SHEETS_VACACIONAL_ID,
      LARGA_DURACION: process.env.GOOGLE_SHEETS_LARGA_DURACION_ID,
      VENTA: process.env.GOOGLE_SHEETS_VENTA_ID,
    };
  }

  async getClient() {
    if (this.sheets) return this.sheets;
    if (!this.enabled) return null;

    try {
      const key = require(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
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

  propiedadToRow(propiedad) {
    const fecha = new Date(propiedad.creadoEn).toLocaleDateString('es-ES');
    const base = [
      propiedad.referencia,
      propiedad.nombre,
      propiedad.propietario?.nombre + ' ' + (propiedad.propietario?.apellidos || ''),
      propiedad.propietario?.telefono || '',
      propiedad.zona,
      propiedad.habitaciones,
      propiedad.banos,
      propiedad.metrosConstruidos,
    ];

    const urlDossier = propiedad.documentos?.find(d => d.tipo === 'DOSSIER')?.urlDrive || '';

    if (propiedad.tipo === 'VACACIONAL') {
      const av = propiedad.alquilerVacacional || {};
      return [...base,
        propiedad.metrosParcela || '',
        av.precioTemporadaAlta || '',
        av.precioTemporadaMedia || '',
        av.precioTemporadaBaja || '',
        av.licenciaETV || '',
        propiedad.caracteristicas || '',
        propiedad.estado,
        propiedad.urlDriveCarpeta || '',
        propiedad.descripcion || '',
        fecha,
        propiedad.agente?.nombre || '',
        urlDossier,
      ];
    }

    if (propiedad.tipo === 'VENTA') {
      const v = propiedad.venta || {};
      return [...base,
        v.precioVenta || '',
        v.referenciaCatastral || '',
        v.estadoHipotecario || '',
        v.comisionAgencia || '',
        v.etapaPipeline || '',
        propiedad.caracteristicas || '',
        propiedad.estado,
        propiedad.urlDriveCarpeta || '',
        fecha,
        propiedad.agente?.nombre || '',
        urlDossier,
      ];
    }

    // LARGA_DURACION
    const ald = propiedad.alquilerLargaDuracion || {};
    return [...base,
      ald.rentaMensual || '',
      ald.inquilinoNombre ? 'Alquilado' : 'Disponible',
      ald.inquilinoNombre || '',
      ald.fechaInicio ? new Date(ald.fechaInicio).toLocaleDateString('es-ES') : '',
      ald.fechaVencimiento ? new Date(ald.fechaVencimiento).toLocaleDateString('es-ES') : '',
      propiedad.estado,
      propiedad.urlDriveCarpeta || '',
      fecha,
      propiedad.agente?.nombre || '',
      urlDossier,
    ];
  }

  async sincronizarPropiedad(propiedad) {
    try {
      const sheets = await this.getClient();
      const sheetId = this.sheetIds[propiedad.tipo];

      if (!sheets || !sheetId) {
        logger.info(`Sheets (mock): sincronizado ${propiedad.referencia} tipo ${propiedad.tipo}`);
        return;
      }

      const row = this.propiedadToRow(propiedad);

      // Buscar si ya existe la fila por referencia
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:A',
      });

      const rows = existing.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === propiedad.referencia);

      if (rowIndex > 0) {
        // Actualizar fila existente
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `A${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
      } else {
        // Añadir nueva fila
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'A:A',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
      }

      logger.info(`Sheets: ${propiedad.referencia} sincronizado correctamente`);
    } catch (err) {
      logger.error(`Sheets: error sincronizando ${propiedad.referencia}: ${err.message}`);
    }
  }
}

const sheetsService = new SheetsService();
module.exports = { sheetsService };
