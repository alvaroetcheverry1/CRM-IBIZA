const { google } = require('googleapis');
const { logger } = require('../utils/logger');

// Estructura de carpetas por tipo de propiedad
const CARPETAS_TIPO = {
  VACACIONAL: '01_Alquiler_Vacacional',
  LARGA_DURACION: '02_Alquiler_Larga_Duracion',
  VENTA: '03_Venta',
};

const SUBCARPETAS = {
  VACACIONAL: ['Marketing', 'Dossiers', 'Contratos', 'Legal', 'Inventario'],
  LARGA_DURACION: ['Marketing', 'Dossiers', 'Contratos', 'Legal', 'Pagos'],
  VENTA: ['Marketing', 'Dossiers', 'Contratos', 'Legal', 'Due_Diligence'],
};

class DriveService {
  constructor() {
    this.enabled = !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ||
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN));
    this.drive = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  async getClient() {
    if (this.drive) return this.drive;
    if (!this.enabled) return null;

    try {
      let auth;
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
        const key = require(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
        auth = new google.auth.GoogleAuth({
          credentials: key,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      } else {
        auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        );
        auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      }
      this.drive = google.drive({ version: 'v3', auth });
      return this.drive;
    } catch (err) {
      logger.warn('Drive: no se pudo inicializar el cliente:', err.message);
      return null;
    }
  }

  async crearCarpeta(nombre, parentId) {
    const drive = await this.getClient();
    if (!drive) return null;

    const response = await drive.files.create({
      requestBody: {
        name: nombre,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id, webViewLink',
    });
    return response.data;
  }

  async buscarCarpeta(nombre, parentId) {
    const drive = await this.getClient();
    if (!drive) return null;

    const query = `name='${nombre}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await drive.files.list({ q: query, fields: 'files(id, name, webViewLink)' });
    return response.data.files[0] || null;
  }

  async obtenerOCrearCarpeta(nombre, parentId) {
    const existente = await this.buscarCarpeta(nombre, parentId);
    if (existente) return existente;
    return await this.crearCarpeta(nombre, parentId);
  }

  /**
   * Crea la estructura completa de carpetas para una propiedad en Drive
   * Retorna la URL de la carpeta principal de la propiedad
   */
  async crearEstructuraCarpetas(propiedad) {
    try {
      const drive = await this.getClient();
      if (!drive) {
        logger.info(`Drive (mock): estructura de carpetas para ${propiedad.referencia}`);
        return `https://drive.google.com/mock/${propiedad.referencia}`;
      }

      // 1. Carpeta padre del tipo (ej: 01_Alquiler_Vacacional)
      const carpetaTipo = await this.obtenerOCrearCarpeta(
        CARPETAS_TIPO[propiedad.tipo],
        this.rootFolderId,
      );
      if (!carpetaTipo) throw new Error('No se pudo acceder a la carpeta raíz');

      // 2. Carpeta de la propiedad (ej: ALQ001-Villa_Es_Moli)
      const nombrePropiedad = `${propiedad.referencia}-${propiedad.nombre.replace(/\s+/g, '_')}`;
      const carpetaPropiedad = await this.obtenerOCrearCarpeta(nombrePropiedad, carpetaTipo.id);

      // 3. Subcarpetas específicas del tipo
      const subs = SUBCARPETAS[propiedad.tipo] || [];
      await Promise.all(subs.map(sub => this.obtenerOCrearCarpeta(sub, carpetaPropiedad.id)));

      logger.info(`Drive: carpetas creadas para ${propiedad.referencia}`);
      return carpetaPropiedad.webViewLink;
    } catch (err) {
      logger.error(`Drive: error creando carpetas: ${err.message}`);
      return null;
    }
  }

  /**
   * Obtiene o crea la carpeta general de Facturas (inmoCrm/04_Facturas)
   */
  async obtenerCarpetaFacturas() {
    try {
      const drive = await this.getClient();
      if (!drive) return null;
      
      // 1. Obtener o crear la carpeta principal del CRM
      const carpetaInmoCrm = await this.obtenerOCrearCarpeta('inmoCrm', this.rootFolderId || 'root');
      
      // 2. Obtener o crear la carpeta de facturas dentro de inmoCrm
      return await this.obtenerOCrearCarpeta('04_Facturas', carpetaInmoCrm.id);
    } catch (err) {
      logger.error(`Drive: error obteniendo carpeta de facturas: ${err.message}`);
      return null;
    }
  }

  /**
   * Sube una factura PDF a la carpeta de Facturas
   */
  async subirFactura(fileBuffer, filename, mimeType = 'application/pdf') {
    try {
      const drive = await this.getClient();
      if (!drive) {
        logger.info(`Drive (mock): factura subida ${filename}`);
        return {
          url: `https://drive.google.com/mock/${filename}`,
          fileId: `mock_factura_${Date.now()}`,
        };
      }

      const carpetaFacturas = await this.obtenerCarpetaFacturas();
      if (!carpetaFacturas) throw new Error('No se pudo encontrar o crear la carpeta de Facturas');

      const { Readable } = require('stream');
      const stream = Readable.from(fileBuffer);

      const response = await drive.files.create({
        requestBody: {
          name: filename,
          mimeType,
          parents: [carpetaFacturas.id],
        },
        media: { mimeType, body: stream },
        fields: 'id, webViewLink',
      });

      return {
        url: response.data.webViewLink,
        fileId: response.data.id,
      };
    } catch (err) {
      logger.error(`Drive: error subiendo factura: ${err.message}`);
      return { url: null, fileId: null };
    }
  }

  /**
   * Sube un Dossier generado en PDF a la carpeta Marketing de la propiedad
   */
  async subirDossier(fileBuffer, propiedad, filename) {
    try {
      const drive = await this.getClient();
      if (!drive) {
        logger.info(`Drive (mock local): guardando dossier ${filename}`);
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        fs.writeFileSync(path.join(uploadsDir, filename), fileBuffer);
        return { url: `/api/uploads/${filename}`, fileId: `local_${filename}` };
      }

      // 1. Obtener la carpeta del Tipo de Propiedad
      const carpetaTipo = await this.obtenerOCrearCarpeta(CARPETAS_TIPO[propiedad.tipo], this.rootFolderId);
      if (!carpetaTipo) throw new Error('No se pudo ubicar la carpeta de tipo de propiedad');

      // 2. Obtener la carpeta de la Propiedad Específica
      const nombrePropiedad = `${propiedad.referencia}-${propiedad.nombre.replace(/\s+/g, '_')}`;
      const carpetaPropiedad = await this.obtenerOCrearCarpeta(nombrePropiedad, carpetaTipo.id);

      // 3. Obtener la subcarpeta de Dossiers
      const carpetaDossiers = await this.obtenerOCrearCarpeta('Dossiers', carpetaPropiedad.id);

      const { Readable } = require('stream');
      const stream = Readable.from(fileBuffer);

      const response = await drive.files.create({
        requestBody: { name: filename, mimeType: 'application/pdf', parents: [carpetaDossiers.id] },
        media: { mimeType: 'application/pdf', body: stream },
        fields: 'id, webViewLink',
      });

      return {
        url: response.data.webViewLink,
        fileId: response.data.id,
      };
    } catch (err) {
      logger.error(`Drive: error subiendo dossier: ${err.message}`);
      return { url: null, fileId: null };
    }
  }

  /**
   * Sube un archivo a Drive en la carpeta correspondiente a la propiedad
   */
  async subirDocumento(file, propiedadId, tipo) {
    try {
      const drive = await this.getClient();
      if (!drive) {
        logger.info(`Drive (mock offline): guardando documento localmente ${file.originalname}`);
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const safeName = Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
        const filePath = path.join(uploadsDir, safeName);
        
        if (file.buffer) {
          fs.writeFileSync(filePath, file.buffer);
        } else {
          fs.writeFileSync(filePath, 'Mock file content');
        }

        return {
          url: `/api/uploads/${safeName}`,
          fileId: `local_${safeName}`,
        };
      }

      const { Readable } = require('stream');
      const stream = Readable.from(file.buffer);

      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          mimeType: file.mimetype,
        },
        media: { mimeType: file.mimetype, body: stream },
        fields: 'id, webViewLink, webContentLink',
      });

      let urlToReturn = response.data.webViewLink;

      // Si es imagen, hacemos el archivo de solo lectura público y usamos UC link
      if (file.mimetype.startsWith('image/')) {
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: { role: 'reader', type: 'anyone' },
        });
        urlToReturn = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
      }

      return {
        url: urlToReturn,
        fileId: response.data.id,
      };
    } catch (err) {
      logger.error(`Drive: error subiendo archivo: ${err.message}`);
      return { url: null, fileId: null };
    }
  }

  async eliminarArchivo(fileId) {
    try {
      const drive = await this.getClient();
      if (!drive) return;
      await drive.files.delete({ fileId });
    } catch (err) {
      logger.warn(`Drive: no se pudo eliminar ${fileId}: ${err.message}`);
    }
  }
}

const driveService = new DriveService();
module.exports = { driveService };
