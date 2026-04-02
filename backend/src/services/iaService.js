const OpenAI = require('openai').default;
const { logger } = require('../utils/logger');
const { prisma } = require('../utils/prisma');

const SISTEMA_PROMPT = `Eres un asistente experto en análisis de documentación inmobiliaria de alto standing.
Tu tarea es extraer información estructurada de documentos de propiedades inmobiliarias en Mallorca y Baleares.

Analiza el documento y extrae en formato JSON los siguientes campos:
{
  "nombre": "Nombre de la villa o propiedad",
  "zona": "Zona o municipio (ej: Pollença, Alcúdia, Sóller, Deià...)",
  "municipio": "Municipio exacto",
  "habitaciones": número entero,
  "banos": número entero,
  "metrosConstruidos": número decimal,
  "metrosParcela": número decimal o null,
  "piscina": "SI" | "NO" | "COMUNITARIA",
  "garaje": true/false,
  "terraza": true/false,
  "jardin": true/false,
  "vistasMar": true/false,
  "precioVenta": número en euros o null,
  "precioAlquilerTemporadaAlta": número en euros/semana o null,
  "precioAlquilerTemporadaMedia": número en euros/semana o null,
  "precioAlquilerTemporadaBaja":  número en euros/semana o null,
  "licenciaETV": "código de licencia" o null,
  "referenciaCatastral": "referencia" o null,
  "caracteristicas": ["característica 1", "característica 2", ...],
  "descripcion": "descripción general del inmueble",
  "propietarioNombre": "nombre del propietario o null si no aparece",
  "observaciones": "cualquier información adicional relevante"
}

REGLAS CRÍTICAS:
- Si un campo no aparece en el documento, devuelve null (no inventes valores).
- Precios siempre en euros (€), convierte si están en otra moneda.
- Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown.`;

class IAService {
  constructor() {
    this.enabled = !!process.env.OPENAI_API_KEY;
    this.client = this.enabled ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  }

  /**
   * Extraer texto de PDF (simplificado - en producción usar Google Document AI)
   */
  async extraerTextoPDF(buffer) {
    try {
      // Intentar con pdf-parse si está disponible
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      // Fallback: devolver indicación para que GPT-4 Vision procese la imagen
      return null;
    }
  }

  /**
   * Procesa un documento PDF y extrae datos de la propiedad mediante IA
   */
  async procesarDocumento(buffer, propiedadId, documentoId) {
    if (!this.enabled) {
      logger.info('IA (mock): procesamiento simulado');
      // Mock de datos para desarrollo
      return {
        nombre: 'Villa extraída por IA (mock)',
        zona: 'Pollença',
        habitaciones: 4,
        banos: 3,
        metrosConstruidos: 320,
        piscina: 'SI',
        caracteristicas: ['Vista al mar', 'Piscina privada', 'Aire acondicionado'],
        _mock: true,
      };
    }

    const textoPDF = await this.extraerTextoPDF(buffer);

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
      logger.error('IA: Error al generar descripción con fotos:', err.message);
      return null;
    }
  }
}

const iaService = new IAService();
module.exports = { iaService };
