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
   * NUEVO: Analiza un PDF completo y devuelve JSON estructurado SIN modificar la DB.
   * Usado por el endpoint /api/propiedades/analizar-pdf para pre-rellenar el formulario.
   */
  async analizarPDFCompleto(buffer, filename = 'documento.pdf') {
    logger.info(`IA: analizando PDF "${filename}" (${Math.round(buffer.length / 1024)} KB)`);

    // Mock enriquecido cuando no hay clave de OpenAI (para desarrollo)
    if (!this.enabled) {
      logger.info('IA (mock): análisis PDF simulado');
      return {
        nombre: 'Villa Can Xomeu (Extraída por IA)',
        tipo: 'VACACIONAL',
        zona: 'Sant Josep de sa Talaia',
        municipio: 'Sant Josep',
        habitaciones: 5,
        banos: 4,
        metrosConstruidos: 380,
        metrosParcela: 2500,
        piscina: 'SI',
        garaje: true,
        terraza: true,
        jardin: true,
        vistasMar: true,
        ascensor: false,
        caracteristicas: ['Piscina infinity', 'Vistas panorámicas al mar', 'Cocina americana equipada', 'Domótica Crestron', 'Barbacoa exterior'],
        descripcion: 'Excepcional villa de diseño contemporáneo situada en la privilegiada zona de Sant Josep, con impresionantes vistas al mar y atardecer. Distribuida en dos plantas con amplios espacios interiores y exteriores cuidadosamente diseñados para el disfrute del lujo y la privacidad.',
        precioVenta: null,
        precioAlquilerTemporadaAlta: 18500,
        precioAlquilerTemporadaMedia: 12000,
        precioAlquilerTemporadaBaja: 7500,
        rentaMensual: null,
        licenciaETV: 'ETV-0123-IB',
        propietarioNombre: 'Carlos Martínez López',
        propietarioTelefono: '+34 626 123 456',
        propietarioEmail: 'carlos.martinez@email.com',
        notas: 'Propiedad recién reformada en 2023. Cliente prefiere alquiler de mínimo 7 noches.',
        _mock: true,
      };
    }

    const textoPDF = await this.extraerTextoPDF(buffer);

    if (!textoPDF || textoPDF.trim().length < 30) {
      throw new Error('No se pudo extraer texto del PDF. Asegúrate de que no sea un PDF escaneado sin OCR.');
    }

    logger.info(`IA: texto extraído del PDF (${textoPDF.length} chars), enviando a GPT-4o`);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SISTEMA_PROMPT },
        {
          role: 'user',
          content: `Analiza el siguiente documento de propiedad inmobiliaria en Ibiza:\n\n${textoPDF.substring(0, 16000)}`,
        },
      ],
      temperature: 0.05,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    let datos;
    try {
      datos = JSON.parse(raw);
    } catch {
      throw new Error('La IA devolvió un JSON inválido');
    }

    logger.info(`IA: extracción completa para "${filename}"`);
    return datos;
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
