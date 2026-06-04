const OpenAI = require('openai').default;
const { logger } = require('../utils/logger');
const { prisma } = require('../utils/prisma');

const SISTEMA_PROMPT = `Eres un experto en análisis de documentación inmobiliaria de lujo en Ibiza y las Islas Baleares.
Tu tarea es leer el texto extraído de un PDF o presentación de una propiedad y devolver un JSON con los campos detectados.

CAMPOS A EXTRAER:
{
  "nombre": "Nombre de la villa o propiedad (ej: Villa Can Rimbau, Finca Las Salinas)",
  "tipo": "VACACIONAL o VENTA o LARGA_DURACION — dedúcelo del contexto",
  "zona": "Zona de Ibiza (ej: Sant Josep, Jesus, Talamanca, Las Salinas, Santa Eulalia)",
  "municipio": "Municipio exacto o null",
  "habitaciones": numero entero,
  "banos": numero entero,
  "metrosConstruidos": numero decimal solo el numero sin simbolo m2,
  "metrosParcela": numero decimal o null,
  "piscina": "SI" o "NO" o "COMUNITARIA",
  "garaje": true o false,
  "terraza": true o false,
  "jardin": true o false,
  "vistasMar": true o false,
  "ascensor": true o false,
  "caracteristicas": ["lista de caracteristicas especiales"],
  "descripcion": "descripcion detallada del inmueble en espanol de 3-4 frases",
  "precioVenta": numero en euros o null,
  "precioAlquilerTemporadaAlta": numero en euros semana o null,
  "precioAlquilerTemporadaMedia": numero en euros semana o null,
  "precioAlquilerTemporadaBaja": numero en euros semana o null,
  "rentaMensual": numero en euros mes para larga duracion o null,
  "licenciaETV": "codigo de licencia turistica ETV-IBI-XXXXX" o null,
  "propietarioNombre": "nombre completo del propietario" o null,
  "propietarioTelefono": "numero de telefono del propietario con prefijo" o null,
  "propietarioEmail": "email del propietario" o null,
  "notas": "cualquier informacion adicional relevante"
}

REGLAS CRITICAS:
- Si un campo NO aparece en el documento devuelve null NO inventes valores.
- Los precios SIEMPRE en euros numericos sin simbolo ni puntos de miles.
- Responde UNICAMENTE con el JSON valido sin texto adicional sin markdown.`;

class IAService {
  constructor() {
    this.enabled = !!process.env.OPENAI_API_KEY;
    this.client = this.enabled ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  }

  /**
   * Extraer texto de PDF con pdf-parse
   */
  async extraerTextoPDF(buffer) {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      return null;
    }
  }

  /**
   * Fallback de OCR Local usando tesseract.js
   * Para extraer texto de PDFs escaneados cuando no hay texto extraíble nativamente
   */
  async extraerTextoOCR(fotosUrls) {
    if (!fotosUrls || fotosUrls.length === 0) return null;
    try {
      const tesseract = require('tesseract.js');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      let textoTotal = '';
      
      // Analizar máximo 8 imágenes para no saturar la CPU pero cubrir la ficha de datos
      for (const url of fotosUrls.slice(0, 8)) {
        const fname = url.replace('/api/uploads/', '');
        const fullPath = path.join(uploadsDir, fname);
        logger.info(`[OCR] Extrayendo texto localmente de ${fname}...`);
        const { data: { text } } = await tesseract.recognize(fullPath, 'spa+eng');
        textoTotal += text + '\n\n';
      }
      return textoTotal;
    } catch (err) {
      logger.warn('[OCR] Error en extracción local:', err.message);
      return null;
    }
  }

  /**
   * Extrae fotos reales embebidas en el PDF escaneando el binario directamente.
   * Los PDFs almacenan imágenes JPEG como streams FF D8 FF ... FF D9 — son
   * archivos JPEG válidos que podemos extraer sin herramientas externas.
   * Filtra imágenes < 25 KB (logos, iconos, thumbnails).
   */
  async extraerImagenesPDF(buffer, filename) {
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const pdfBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const timestamp = Date.now();
    const base = path.basename(filename, path.extname(filename))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 20);

    const urls = [];
    const SOI = Buffer.from([0xFF, 0xD8, 0xFF]); // JPEG Start Of Image
    const EOI = Buffer.from([0xFF, 0xD9]);         // JPEG End Of Image

    let pos = 0;
    let idx = 0;
    const seen = new Set(); // evitar duplicados por tamaño

    while (pos < pdfBuf.length) {
      const soiPos = pdfBuf.indexOf(SOI, pos);
      if (soiPos === -1) break;

      // Buscar EOI a partir del SOI
      const eoiPos = pdfBuf.indexOf(EOI, soiPos + 4);
      if (eoiPos === -1) { pos = soiPos + 3; continue; }

      const jpegData = pdfBuf.slice(soiPos, eoiPos + 2);
      const size = jpegData.length;

      // Mínimo 25 KB → descarta thumbnails, logos e iconos
      if (size >= 25000 && !seen.has(size)) {
        seen.add(size);
        const outName = `${timestamp}_${base}_img${idx + 1}.jpg`;
        try {
          const { uploadFile } = require('./supabaseStorageService');
          const sUrl = await uploadFile(jpegData, outName, 'image/jpeg');
          urls.push(sUrl);
          idx++;
        } catch (e) {
          logger.warn(`[PDF] Error subiendo imagen ${idx} a Supabase: ${e.message}`);
        }
      }

      pos = eoiPos + 2;
    }

    logger.info(`IA: ${urls.length} fotos JPEG extraídas de "${filename}"`);
    return urls;
  }

  /**
   * Fallback: renderiza las primeras páginas del PDF como imágenes JPEG
   * usando pdfjs-dist (legacy) + @napi-rs/canvas — sin dependencias externas.
   * Permite pasar PDFs sin JPEG embebidos a Vision AI.
   */
  async renderizarPaginasPDF(buffer, filename) {
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const base = path.basename(filename, path.extname(filename))
      .replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);

    const urls = [];

    try {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const { createCanvas } = require('@napi-rs/canvas');

      const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const pdfDoc = await getDocument({
        data: uint8,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise;

      const maxPaginas = Math.min(pdfDoc.numPages, 8);
      logger.info(`[PDF] Renderizando ${maxPaginas} páginas con pdfjs + canvas`);

      for (let i = 1; i <= maxPaginas; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const scale = 3.0; // 300 DPI - Estándar para OCR de alta calidad
          const vp = page.getViewport({ scale });
          const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height));
          const ctx = canvas.getContext('2d');

          // render() puede lanzar advertencias de fuentes pero el canvas sigue útil
          try {
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
          } catch { /* Ignorar errores de fuentes/glifos — el canvas igual tiene contenido */ }

          // Pre-procesamiento para OCR: Convertir a escala de grises de alto contraste
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let j = 0; j < data.length; j += 4) {
            const gray = (data[j] * 0.3 + data[j + 1] * 0.59 + data[j + 2] * 0.11);
            // Umbral para binarizar (hacer el texto más negro y el fondo más blanco)
            const val = gray > 190 ? 255 : 0; 
            data[j] = data[j+1] = data[j+2] = val;
          }
          ctx.putImageData(imageData, 0, 0);

          const jpegBuf = canvas.toBuffer('image/jpeg', { quality: 90 });
          if (jpegBuf.length > 5000) { // Descartar páginas casi vacías (<5KB)
            const outName = `${timestamp}_${base}_pg${i}.jpg`;
            try {
              const { uploadFile } = require('./supabaseStorageService');
              const sUrl = await uploadFile(jpegBuf, outName, 'image/jpeg');
              urls.push(sUrl);
            } catch (e) {
              logger.warn(`[PDF] Error subiendo página ${i} a Supabase:`, e.message);
            }
          }
        } catch (pageErr) {
          logger.warn(`[PDF] Error obteniendo página ${i}:`, pageErr.message);
        }
      }

      logger.info(`[PDF] Páginas renderizadas como imagen: ${urls.length}`);
    } catch (e) {
      logger.warn('[PDF] renderizarPaginasPDF error:', e.message);
    }

    return urls;
  }


  extraerDatosPorRegex(texto) {
    if (!texto || texto.trim().length < 20) return {};

    const t = texto.replace(/\s+/g, ' ').replace(/\n+/g, '\n');
    const datos = {};

    // ── Nombre de la propiedad ──────────────────────────────────────────────
    // Patrones comunes: "Villa Can Rimbau", "Finca Sa...", primera línea con nombre
    const nombrePatterns = [
      /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+(?:Can|Ca'n|Ca N|de|dels|ses|ses|las|los|la|el|Sa|Es|Son)[a-zA-ZáéíóúñÁÉÍÓÚÑ ]+)/m,
      /(?:villa|finca|casa|apartamento|atico|chalet|piso|propiedad)\s+["']?([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+)/i,
      /^(Villa [A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+)/m,
      /^(Finca [A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+)/m,
    ];
    for (const pat of nombrePatterns) {
      const m = t.match(pat);
      if (m && m[1]?.trim().length > 3 && m[1].trim().length < 60) {
        datos.nombre = m[1].trim();
        break;
      }
    }

    // ── Zona / Municipio ─────────────────────────────────────────────────────
    const zonas = [
      'Sant Josep', 'Santa Eulalia', 'Santa Eulària', 'San Antonio', 'Sant Antoni',
      'Ibiza Ciudad', 'Eivissa', 'Talamanca', 'Jesus', 'Jesús', 'Las Salinas',
      'Ses Salines', 'Es Cubells', 'Cala Vadella', 'San Juan', 'Sant Joan',
      'Portinatx', 'Cala Llonga', 'Siesta', 'Can Furnet', 'Can Pep Simo',
      'Roca Llisa', 'Na Xamena', 'Porroig', 'Cala Carbo', 'Cala Tarida',
      'San Carlos', 'Sant Carles', 'Santa Gertrudis', 'Es Canar', 'Cala Mastella',
    ];
    for (const zona of zonas) {
      if (new RegExp(zona, 'i').test(t)) {
        datos.zona = zona;
        datos.municipio = zona;
        break;
      }
    }

    // ── Habitaciones ─────────────────────────────────────────────────────────
    const habMatch = t.match(/(\d+)\s*(?:habitaci[oó]n(?:es)?|dormitori[oa](?:s)?|bedroom(?:s)?|chambre(?:s)?|dorm|habs|hab\.)/i)
      || t.match(/(?:habitaci[oó]n(?:es)?|dormitori[oa](?:s)?|dorm|habs|hab\.)[\s:]*(\d+)/i);
    if (habMatch) datos.habitaciones = parseInt(habMatch[1]);

    // ── Baños ────────────────────────────────────────────────────────────────
    const banosMatch = t.match(/(\d+)\s*(?:ba[ñn]o(?:s)?|ba[ñn]o completo|bathroom(?:s)?|salle(?:s)? de bain|bañ|wc)/i)
      || t.match(/(?:ba[ñn]o(?:s)?|bañ|wc)[\s:]*(\d+)/i);
    if (banosMatch) datos.banos = parseInt(banosMatch[1]);

    // ── Metros cuadrados construidos ─────────────────────────────────────────
    const metrosMatch = t.match(/(\d[\d.,]*)\s*m[²2]?\s*(?:construid|built|habitable|living|interior|construi|const)/i)
      || t.match(/(?:superficie|built area|living area|construida|const|superficie const)[\s:]+(\d[\d.,]*)\s*m/i)
      || t.match(/(\d[\d.,]*)\s*m[²2]?\s*(?!\s*(?:parcel|plot|terreno|land))/i); // Último recurso: cualquier número seguido de m2 que no sea parcela
    if (metrosMatch) {
      const val = parseFloat(metrosMatch[1].replace(/[^\d]/g, ''));
      if (val > 10 && val < 10000) datos.metrosConstruidos = val;
    }

    // ── Metros parcela ───────────────────────────────────────────────────────
    const parcelaMatch = t.match(/(\d[\d.,]*)\s*m[²2]?\s*(?:parcel|plot|terreno|land|finca|jardín|jard)/i)
      || t.match(/(?:parcela|plot size|land area|terreno|superficie parcela)[\s:]+(\d[\d.,]*)\s*m/i);
    if (parcelaMatch) {
      const val = parseFloat(parcelaMatch[1].replace(/[^\d]/g, ''));
      if (val > 10 && val < 10000000) datos.metrosParcela = val;
    }

    // ── Piscina ──────────────────────────────────────────────────────────────
    if (/piscina\s+privada|private\s+pool|piscine\s+priv/i.test(t)) datos.piscina = 'SI';
    else if (/piscina\s+comunit|community\s+pool|piscine\s+commun/i.test(t)) datos.piscina = 'COMUNITARIA';
    else if (/piscina|pool|piscine/i.test(t)) datos.piscina = 'SI';

    // ── Características booleanas ────────────────────────────────────────────
    if (/garaje|garagem|garage/i.test(t)) datos.garaje = true;
    if (/terraza|terrasse|terrace/i.test(t)) datos.terraza = true;
    if (/jard[íi]n|jardim|garden/i.test(t)) datos.jardin = true;
    if (/vista.*mar|mar.*vistas|sea.*view|vue.*mer|ocean view/i.test(t)) datos.vistasMar = true;
    if (/ascensor|elevator|lift/i.test(t)) datos.ascensor = true;

    // ── Precio venta ─────────────────────────────────────────────────────────
    const precioVentaMatch = t.match(/(?:precio de venta|precio|sale price|prix de vente|selling price)[\s:€$]*([0-9][0-9.,\s]+)(?:\s*€|\s*EUR|\s*euros?)/i)
      || t.match(/([0-9]{3}[.,\s]?[0-9]{3}(?:[.,\s][0-9]{3})?)\s*€(?!\s*\/\s*(?:sem|week|nuit))/);
    if (precioVentaMatch) {
      const raw = precioVentaMatch[1].replace(/[\s.]/g, '').replace(',', '');
      const num = parseInt(raw);
      if (num > 50000 && num < 100000000) datos.precioVenta = num;
    }

    // ── Precios alquiler/semana ───────────────────────────────────────────────
    const alquilerPatterns = [
      { pat: /temporada alta|high season|\'t\s*alta[\s:€]+([0-9.,]+)/i, key: 'precioAlquilerTemporadaAlta' },
      { pat: /temporada media|mid season[\s:€]+([0-9.,]+)/i, key: 'precioAlquilerTemporadaMedia' },
      { pat: /temporada baja|low season[\s:€]+([0-9.,]+)/i, key: 'precioAlquilerTemporadaBaja' },
    ];
    for (const { pat, key } of alquilerPatterns) {
      const m = t.match(pat);
      if (m && m[1]) {
        const n = parseInt(m[1].replace(/[.,]/g, ''));
        if (n > 500 && n < 500000) datos[key] = n;
      }
    }
    // Precio semanal genérico si hay "por semana" o "/week"
    const semanaMatch = t.match(/([0-9.,]+)\s*€?\s*\/?\s*(?:semana|semaine|week)/i);
    if (semanaMatch && !datos.precioAlquilerTemporadaAlta) {
      const n = parseInt(semanaMatch[1].replace(/[.,]/g, ''));
      if (n > 500 && n < 500000) datos.precioAlquilerTemporadaAlta = n;
    }

    // ── Licencia ETV ─────────────────────────────────────────────────────────
    const etvMatch = t.match(/ETV[\s-]?[\w\d-]+/i) || t.match(/licencia[\s:]+([A-Z0-9-]+)/i);
    if (etvMatch) datos.licenciaETV = etvMatch[0].trim();

    // ── Tipo inferido ────────────────────────────────────────────────────────
    if (datos.precioVenta && !datos.precioAlquilerTemporadaAlta) {
      datos.tipo = 'VENTA';
    } else if (datos.precioAlquilerTemporadaAlta || /(?:alquiler vacacional|vacation rental|holiday rental)/i.test(t)) {
      datos.tipo = 'VACACIONAL';
    } else if (/larga duraci[oó]n|long.?term|longa dura/i.test(t)) {
      datos.tipo = 'LARGA_DURACION';
    }

    // ── Propietario ──────────────────────────────────────────────────────────
    const emailMatch = t.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) datos.propietarioEmail = emailMatch[1];

    const telMatch = t.match(/(?:\+34|0034|34)?[\s.-]?[6-9]\d{8}/);
    if (telMatch) datos.propietarioTelefono = telMatch[0].trim();

    // ── Características visuales del texto ──────────────────────────────────
    const features = [];
    const featureKeywords = [
      ['piscina infinity', /piscina infinity|infinity pool/i],
      ['piscina desbordante', /piscina desbordante|overflow pool/i],
      ['vistas panorámicas al mar', /vistas panorámicas|panoramic.*sea|sea.*panoramic/i],
      ['cocina equipada', /cocina.*equipada|fully equipped kitchen/i],
      ['domótica', /dom[oó]tica|smart home|home automation/i],
      ['barbacoa', /barbacoa|barbeque|BBQ/i],
      ['aire acondicionado', /aire acondicionado|A\/C|air conditioning/i],
      ['suelo radiante', /suelo radiante|underfloor heating/i],
      ['chimenea', /chimenea|fireplace|cheminée/i],
      ['cine en casa', /cine|home cinema|home theater/i],
      ['spa', /spa|jacuzzi|hidromasaje/i],
      ['bodega', /bodega|wine cellar|cave à vin/i],
      ['orientación sur', /orientaci[oó]n sur|south.?facing/i],
      ['primera línea de mar', /primera l[íi]nea de mar|beachfront/i],
      ['video vigilancia', /video[\s-]?vigilancia|CCTV|security cameras/i],
    ];
    for (const [label, pat] of featureKeywords) {
      if (pat.test(t)) features.push(label);
    }
    if (features.length > 0) datos.caracteristicas = features;

    logger.info(`[PDF Regex] Campos extraídos: ${Object.keys(datos).join(', ') || 'ninguno'}`);
    return datos;
  }

  /**
   * Analiza un PDF completo:
   * - Extrae fotos reales embebidas con pdf-export-images (no renders de página)
   * - SIN OpenAI: regex sobre texto
   * - CON OpenAI: GPT-4o texto + Vision sobre las fotos reales extraídas
   *
   * Devuelve { datos, fotosUrls } — NUNCA inventa datos.
   */
  async analizarPDFCompleto(buffer, filename = 'documento.pdf') {
    logger.info(`IA: analizando PDF "${filename}" (${Math.round(buffer.length / 1024)} KB)`);

    // ── 1. Extraer texto del PDF ─────────────────────────────────────────────
    let textoPDF = await this.extraerTextoPDF(buffer);
    let tieneTexto = textoPDF && textoPDF.trim().length > 30;

    if (!tieneTexto) {
      logger.warn(`[PDF] "${filename}" sin texto extraíble — PDF escaneado o solo imágenes`);
    } else {
      logger.info(`[PDF] Texto extraído: ${textoPDF.length} chars`);
    }

    // ── 2. Extraer fotos reales JPEG del PDF ─────────────────────────────────
    let fotosUrls = await this.extraerImagenesPDF(buffer, filename);

    // Si no hay texto, o no hay fotos embebidas, renderizamos las páginas del PDF
    let paginasUrls = [];
    if (!tieneTexto || fotosUrls.length === 0) {
      paginasUrls = await this.renderizarPaginasPDF(buffer, filename);
    }

    // Fallback para fotos: si no hay fotos JPEG reales, devolver las páginas renderizadas
    if (fotosUrls.length === 0) {
      fotosUrls = paginasUrls;
    }

    // ── OCR FALLBACK: Si no hay texto, usar tesseract.js sobre las páginas renderizadas ──
    if (!tieneTexto && paginasUrls.length > 0) {
      logger.info('[PDF] Sin texto directo, iniciando Tesseract OCR sobre las páginas...');
      textoPDF = await this.extraerTextoOCR(paginasUrls);
      tieneTexto = textoPDF && textoPDF.trim().length > 30;
      if (tieneTexto) {
        logger.info(`[PDF] Texto extraído vía OCR: ${textoPDF.length} chars. Snippet: ${textoPDF.substring(0, 200).replace(/\n/g, ' ')}...`);
      }
    }

    let datos = {};

    // ── 3. Sin OpenAI: extractor regex ───────────────────────────────────────
    if (!this.enabled) {
      logger.info('[PDF] Sin OpenAI → usando extractor por texto/regex');
      if (tieneTexto) {
        datos = this.extraerDatosPorRegex(textoPDF);
        if (Object.keys(datos).length > 0) {
          const partes = [];
          if (datos.zona) partes.push(`ubicada en ${datos.zona}`);
          if (datos.habitaciones) partes.push(`${datos.habitaciones} habitaciones`);
          if (datos.banos) partes.push(`${datos.banos} baños`);
          if (datos.metrosConstruidos) partes.push(`${datos.metrosConstruidos} m² construidos`);
          if (datos.piscina === 'SI') partes.push('piscina privada');
          if (datos.vistasMar) partes.push('vistas al mar');
          if (partes.length > 1) datos.descripcion = `Propiedad ${partes.join(', ')}.`;
          datos._sinIA = true;
        }
      } else {
        datos._pdfEscaneado = true;
      }
      return { datos, fotosUrls };
    }

    // ── 4. CON OpenAI ────────────────────────────────────────────────────────

    // 4a. Base por regex (solo si hay texto)
    if (tieneTexto) {
      datos = this.extraerDatosPorRegex(textoPDF);
    }

    // 4b. GPT-4o sobre el texto — SOLO si hay texto suficiente
    if (tieneTexto) {
      logger.info('[PDF] Enviando texto a GPT-4o...');
      try {
        const response = await this.client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SISTEMA_PROMPT },
            {
              role: 'user',
              content: `Analiza el siguiente documento de propiedad inmobiliaria:\n\n${textoPDF.substring(0, 16000)}`,
            },
          ],
          temperature: 0.05,
          max_tokens: 2500,
          response_format: { type: 'json_object' },
        });
        const gptDatos = JSON.parse(response.choices[0].message.content);
        for (const [k, v] of Object.entries(gptDatos)) {
          if (v !== null && v !== undefined && v !== '') datos[k] = v;
        }
        logger.info('[PDF] GPT-4o texto: OK');
      } catch (err) {
        if (err.status === 429) {
          logger.error('[PDF] Error GPT-4o texto: Sin saldo en OpenAI (Quota Exceeded)');
          datos._errorIA = 'Sin saldo en OpenAI';
        } else {
          logger.error('[PDF] Error GPT-4o texto:', err.message || err);
        }
      }
    } else {
      logger.info('[PDF] Sin texto — saltando llamada GPT-4o texto, usando Vision directamente');
    }

    // 4c. Vision sobre imágenes (fotos reales del PDF o páginas renderizadas)
    if (fotosUrls.length > 0) {
      logger.info(`[PDF] Vision: analizando ${Math.min(fotosUrls.length, 6)} imágenes del dossier`);
      try {
        const imageMsgs = [];
        for (const url of fotosUrls.slice(0, 6)) {
          try {
            // Enviamos directamente la URL pública de Supabase a OpenAI
            imageMsgs.push({
              type: 'image_url',
              image_url: { url: url, detail: 'high' },
            });
          } catch { /* ignorar */ }
        }

        if (imageMsgs.length > 0) {
          const tieneDatosCompletos = datos.nombre && datos.habitaciones && datos.zona;

          const promptVision = !tieneDatosCompletos
            ? `Eres un experto analista inmobiliario y copywriter de propiedades de lujo en Ibiza.
Analiza TODAS las imágenes adjuntas (pueden ser páginas de un dossier inmobiliario o fotos de la propiedad).
Tu misión: extraer todos los datos posibles Y generar una descripción comercial premium.

Busca en las imágenes: texto, números, características visuales, arquitectura, equipamientos. Presta especial atención a la arquitectura típica ibicenca (madera de sabina, paredes de piedra seca "pedra seca", estilo payés, muros encalados, minimalismo mediterráneo).

Devuelve ÚNICAMENTE este JSON (null si no puedes determinarlo con seguridad):
{
  "nombre": "nombre de la propiedad o villa",
  "tipo": "VENTA o VACACIONAL o LARGA_DURACION",
  "zona": "zona de Ibiza",
  "habitaciones": número entero,
  "banos": número entero,
  "metrosConstruidos": número,
  "metrosParcela": número,
  "piscina": "SI o NO o COMUNITARIA",
  "garaje": true/false,
  "terraza": true/false,
  "jardin": true/false,
  "vistasMar": true/false,
  "precioVenta": número en euros,
  "precioAlquilerTemporadaAlta": número,
  "descripcion_mejorada": "descripción comercial de 3-4 párrafos en español, tono premium, evocadora, destacando detalles arquitectónicos",
  "caracteristicas_visuales": ["lista de características vistas"]
}`
            : `Eres un experto copywriter de propiedades de lujo en Ibiza.
Analiza estas fotografías para MEJORAR la descripción comercial con detalles visuales específicos.
Destaca: arquitectura ibicenca (piedra seca, madera de sabina, muros blancos), vistas, piscina, jardines, luz natural, materiales.

Devuelve JSON: {
  "descripcion_mejorada": "descripción enriquecida con detalles visuales, 3-4 párrafos, español premium",
  "caracteristicas_visuales": ["lista de lo que ves en las fotos"]
}`;

          const visionRes = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: promptVision },
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Datos ya extraídos del texto (completa o mejora lo que falte):\n${JSON.stringify(datos, null, 2)}` },
                  ...imageMsgs,
                ],
              },
            ],
            temperature: 0.3,
            max_tokens: 1800,
            response_format: { type: 'json_object' },
          });

          const visionData = JSON.parse(visionRes.choices[0].message.content);
          logger.info(`[PDF] Vision respondió con campos: ${Object.keys(visionData).join(', ')}`);

          // Descripción siempre viene de Vision (es la mejorada con fotos)
          if (visionData.descripcion_mejorada) {
            datos.descripcion = visionData.descripcion_mejorada;
          }

          // Campos de metadatos: Vision completa lo que falta, no sobreescribe lo extraído del texto
          const camposMetadata = ['nombre', 'tipo', 'zona', 'municipio', 'habitaciones', 'banos',
            'metrosConstruidos', 'metrosParcela', 'piscina', 'garaje', 'terraza', 'jardin',
            'vistasMar', 'ascensor', 'precioVenta', 'precioAlquilerTemporadaAlta',
            'precioAlquilerTemporadaMedia', 'precioAlquilerTemporadaBaja', 'rentaMensual', 'licenciaETV'];
          for (const campo of camposMetadata) {
            if (visionData[campo] != null && visionData[campo] !== '' && !datos[campo]) {
              datos[campo] = visionData[campo];
            }
          }

          if (visionData.caracteristicas_visuales?.length) {
            const exist = Array.isArray(datos.caracteristicas) ? datos.caracteristicas : [];
            const nuevas = visionData.caracteristicas_visuales.filter(
              c => !exist.some(e => e.toLowerCase().includes(c.toLowerCase().slice(0, 5)))
            );
            datos.caracteristicas = [...exist, ...nuevas];
          }
          logger.info('[PDF] Vision Multimodal completado ✓');
        }
      } catch (err) {
        if (err.status === 429) {
          logger.warn('[PDF] Vision error: Sin saldo en OpenAI (Quota Exceeded)');
          datos._errorIA = 'Sin saldo en OpenAI';
        } else {
          logger.warn('[PDF] Vision error:', err.message || err);
        }
      }
    } else {
      logger.warn('[PDF] Sin imágenes disponibles para Vision — solo datos de texto');
    }

    logger.info(`[PDF] Extracción completa. Campos: ${Object.keys(datos).join(', ')}, Fotos: ${fotosUrls.length}`);
    return { datos, fotosUrls };
  }



  /**
   * Procesa un documento PDF y extrae datos de la propiedad mediante IA
   */
  async procesarDocumento(buffer, propiedadId, documentoId) {
    const textoPDF = await this.extraerTextoPDF(buffer);

    if (!this.enabled) {
      logger.info('[IA] Procesando sin OpenAI → usando extractor regex');
      return this.extraerDatosPorRegex(textoPDF);
    }

    if (!textoPDF || textoPDF.trim().length < 50) {
      throw new Error('No se pudo extraer texto del documento. Verifica que el PDF sea legible.');
    }

    logger.info(`IA: procesando documento ${documentoId}, texto: ${textoPDF.length} caracteres`);


    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SISTEMA_PROMPT },
        {
          role: 'user',
          content: `Analiza el siguiente documento inmobiliario y extrae los datos:\n\n${textoPDF.substring(0, 15000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const datos = JSON.parse(raw);

    logger.info(`IA: extracción completada para ${documentoId}`);

    // Actualizar campos de la propiedad con los datos extraídos
    if (propiedadId && datos) {
      const updateData = {};
      if (datos.zona) updateData.zona = datos.zona;
      if (datos.habitaciones) updateData.habitaciones = Number(datos.habitaciones);
      if (datos.banos) updateData.banos = Number(datos.banos);
      if (datos.metrosConstruidos) updateData.metrosConstruidos = Number(datos.metrosConstruidos);
      if (datos.metrosParcela) updateData.metrosParcela = Number(datos.metrosParcela);
      if (datos.piscina) updateData.piscina = datos.piscina;
      if (datos.descripcion) updateData.descripcion = datos.descripcion;
      if (datos.caracteristicas?.length) updateData.caracteristicas = datos.caracteristicas.join(', ');

      if (Object.keys(updateData).length > 0) {
        await prisma.propiedad.update({
          where: { id: propiedadId },
          data: updateData,
        }).catch(err => logger.warn('IA: no se pudo actualizar propiedad:', err.message));
      }
    }

    return datos;
  }

  /**
   * Procesa un texto bruto (nota/informe) y extrae datos de la propiedad mediante IA
   */
  async procesarTextoBruto(texto, propiedadId, documentoId) {
    if (!this.enabled) {
      logger.info('IA (mock): texto bruto en mock');
      return { _mock: true, procesado: true };
    }

    if (!texto || texto.trim().length < 10) return null;

    logger.info(`IA: procesando texto bruto para doc ${documentoId}, ${texto.length} caracteres`);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SISTEMA_PROMPT },
        {
          role: 'user',
          content: `Analiza las siguientes notas libres sobre una propiedad y extrae estrictamente las actualizaciones mencionadas en formato JSON. Si no hay info para un campo, usa null:\n\n${texto}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const datos = JSON.parse(raw);

    logger.info(`IA: extracción de texto completada para ${documentoId}`);

    // Actualizar campos de la propiedad con los datos extraídos
    if (propiedadId && datos) {
      const updateData = {};
      if (datos.zona) updateData.zona = datos.zona;
      if (datos.habitaciones) updateData.habitaciones = Number(datos.habitaciones);
      if (datos.banos) updateData.banos = Number(datos.banos);
      if (datos.metrosConstruidos) updateData.metrosConstruidos = Number(datos.metrosConstruidos);
      if (datos.metrosParcela) updateData.metrosParcela = Number(datos.metrosParcela);
      if (datos.piscina) updateData.piscina = datos.piscina;
      if (datos.descripcion) updateData.descripcion = datos.descripcion;
      if (datos.caracteristicas?.length) updateData.caracteristicas = datos.caracteristicas.join(', ');

      // Actualización de precios (si vienen). Habría que ver de qué tipo es la propiedad
      // pero actualizamos todo lo posible como base provisional.
      
      if (Object.keys(updateData).length > 0) {
        await prisma.propiedad.update({
          where: { id: propiedadId },
          data: updateData,
        }).catch(err => logger.warn('IA: no se pudo actualizar propiedad desde texto:', err.message));
      }
    }

    return datos;
  }

  /**
   * Genera una descripción comercial premium combinando las notas del agente y las fotos (URLs)
   */
  async generarDescripcionConFotos(textoNotas, arrUrlFotos, propiedadId) {
    if (!this.enabled) {
      logger.info('IA (mock): generar descripción con fotos');
      return "Descripción comercial premium mock generada analizando fotos y notas.";
    }

    logger.info(`IA: Redactando descripción con visión para la propiedad ${propiedadId}`);

    const contenidoMensaje = [
      {
        type: 'text',
        text: `Eres un copywriter experto en el sector inmobiliario de lujo en Ibiza y Baleares.\nTu objetivo es redactar una descripción comercial atractiva y muy cuidada para esta propiedad.\n\nToma de base estas notas del agente: "${textoNotas || 'Sin notas adicionales'}".\n\nAdemás, analiza las fotografías adjuntas de la propiedad para captar su esencia, estilo arquitectónico, iluminación y destacar sus mejores atributos visuales.\n\nEscribe directamente la descripción (unos 3-4 párrafos), sin introducciones ni comillas.`
      }
    ];

    // Añadir cada foto como image_url siempre que sean válidas
    if (arrUrlFotos && arrUrlFotos.length > 0) {
      arrUrlFotos.slice(0, 5).forEach(url => {
        if (typeof url === 'string' && url.startsWith('http')) {
          contenidoMensaje.push({
            type: 'image_url',
            image_url: { url, detail: 'auto' }
          });
        }
      });
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: contenidoMensaje }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const descripcionGenerada = response.choices[0].message.content.trim();

      // Guardar en BB.DD.
      if (propiedadId && descripcionGenerada) {
        await prisma.propiedad.update({
          where: { id: propiedadId },
          data: { descripcion: descripcionGenerada }
        });
      }

      return descripcionGenerada;
    } catch (err) {
      logger.error('[IA] Error en generarDescripcionConFotos:', err.message);
      return textoNotas;
    }
  }

  /**
   * Analiza imágenes sueltas subidas directamente para extraer datos, tipo de arquitectura,
   * características de lujo y generar de paso una buena descripción combinada.
   */
  async analizarImagenesDirectas(archivos, datosActuales = {}) {
    if (!this.enabled) {
      logger.info('[IA] mock: analizarImagenesDirectas sin OpenAI habilitado');
      return { descripcion: 'Descripción IA (mock): hermosa propiedad en base a las fotos subidas.' };
    }

    if (!archivos || archivos.length === 0) return {};

    logger.info(`[IA] analizarImagenesDirectas: analizando ${archivos.length} fotos con datos previos...`);

    const imageMsgs = [];
    for (const file of archivos.slice(0, 6)) { // Max 6 fotos
      try {
        const base64 = file.buffer.toString('base64');
        let mime = file.mimetype || 'image/jpeg';
        // Ajustar mimetype base en extensión si no confíamos en file.mimetype
        imageMsgs.push({
          type: 'image_url',
          image_url: { url: `data:${mime};base64,${base64}`, detail: 'low' }
        });
      } catch (err) {
        logger.warn('[IA] Error procesando buffer de imagen para Vision:', err.message);
      }
    }

    if (imageMsgs.length === 0) return {};

    const promptVision = `Eres un experto analista inmobiliario y copywriter de propiedades de lujo en Ibiza.
Tienes que observar cuidadosamente estas imágenes y cruzar la información con los datos previos proporcionados.
Debes extraer e interpretar todo lo posible, prestando atención a lo siguiente:
- La cantidad de habitaciones y baños si se pueden deducir o ver.
- El tipo de arquitectura (ej: ibicenca, moderna, minimalista).
- Elementos destacados (ej: piscina infinity, vistas al mar, terrazas, jardines, garaje, ascensor).
- Cualquier otro dato útil como el tipo de propiedad (VENTA / VACACIONAL) o si tiene PISCINA.
- Componer o mejorar la 'descripcion' usando un tono premium, combinando los datos existentes y lo extraído visualmente.

Devuelve un JSON estrictamente con este formato (usa null si no ves el dato):
{
  "nombre": "...",
  "tipo": "VENTA o VACACIONAL o LARGA_DURACION",
  "zona": "...",
  "habitaciones": numero,
  "banos": numero,
  "metrosConstruidos": numero,
  "piscina": "SI o NO o COMUNITARIA",
  "garaje": true,
  "terraza": true,
  "jardin": true,
  "vistasMar": true,
  "ascensor": true,
  "descripcion_mejorada": "Descripción poética y atrayente...",
  "caracteristicas_visuales": ["piscina infinity", "arquitectura moderna"]
}
No inventes datos numéricos si no hay indicios firmes.`;

    try {
      const visionRes = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: promptVision },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Datos actuales conocidos:\n${JSON.stringify(datosActuales)}` },
              ...imageMsgs
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      });

      const visionData = JSON.parse(visionRes.choices[0].message.content);
      
      const res = {};
      const camposBase = ['nombre', 'tipo', 'zona', 'habitaciones', 'banos', 'metrosConstruidos', 'piscina', 'garaje', 'terraza', 'jardin', 'vistasMar', 'ascensor'];
      for (const campo of camposBase) {
        if (visionData[campo] !== null && visionData[campo] !== undefined) {
           res[campo] = visionData[campo];
        }
      }

      if (visionData.descripcion_mejorada) {
        res.descripcion = visionData.descripcion_mejorada;
      }
      
      if (visionData.caracteristicas_visuales?.length) {
        const exist = Array.isArray(datosActuales.caracteristicas) 
          ? datosActuales.caracteristicas 
          : (typeof datosActuales.caracteristicas === 'string' 
              ? datosActuales.caracteristicas.split(',').map(s => s.trim()) 
              : []);
        
        const nuevas = visionData.caracteristicas_visuales.filter(
          c => !exist.some(e => e.toLowerCase().includes(c.toLowerCase().slice(0, 5)))
        );
        res.caracteristicas = [...exist, ...nuevas].join(', ');
      }

      logger.info('[IA] Vision para imágenes directas completado con éxito');
      return res;
    } catch (err) {
      if (err.status === 429) {
        logger.error('[IA] Error en analizarImagenesDirectas: Sin saldo en OpenAI (Quota Exceeded)');
        return { _errorIA: 'Sin saldo en OpenAI' };
      }
      logger.error('[IA] Error en analizarImagenesDirectas:', err.message || err);
      return {};
    }
  }
}

const iaService = new IAService();
module.exports = { iaService };
