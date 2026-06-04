const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    this.apifyToken = process.env.APIFY_API_TOKEN || null;
    this.jobs = new Map(); // Almacén en memoria para rastrear el progreso de los escaneos
  }

  /**
   * Inicia un trabajo de scraping en Apify (o simula uno si no hay token)
   */
  async startScrapingJob(config) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Guardamos el estado inicial
    this.jobs.set(jobId, {
      id: jobId,
      status: 'RUNNING',
      config,
      logs: ['🚀 Iniciando conexión con motor de extracción...'],
      results: [],
      startTime: Date.now()
    });

    // Ejecutar asíncronamente para no bloquear la respuesta HTTP
    this._runBackgroundScraping(jobId, config).catch(err => {
      logger.error(`[ScraperService] Error fatal en job ${jobId}: ${err.message}`);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'FAILED';
        job.logs.push(`❌ Error crítico: ${err.message}`);
      }
    });

    return jobId;
  }

  /**
   * Consulta el estado de un trabajo de scraping
   */
  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }

  // --- LÓGICA INTERNA DE EXTRACCIÓN ---

  async _runBackgroundScraping(jobId, config) {
    const job = this.jobs.get(jobId);
    const token = process.env.APIFY_API_TOKEN;
    
    try {
      if (!token) {
        job.logs.push('⚠️ APIFY_API_TOKEN no encontrado. Usando motor de extracción alternativo/simulado.');
        await this._simulateScraping(job, config);
        return;
      }

      job.logs.push(`🔌 Conectando con servidor Apify para plataforma: ${config.plataforma}...`);
      
      // Mapeo de Actores de Apify según la plataforma o URLs
      let actorId = '';
      let runInput = {};

      // Si hay URLs personalizadas, priorizamos el scraping de esas URLs
      if (config.customUrls && config.customUrls.trim()) {
        const urls = config.customUrls.split('\n').map(u => u.trim()).filter(Boolean);
        job.logs.push(`🔗 Detectadas ${urls.length} URLs personalizadas. Usando Web Scraper Universal...`);
        
        // Usamos un actor genérico pero potente para extraer contenido de cualquier sitio
        actorId = 'apify~web-scraper'; 
        runInput = {
          startUrls: urls.map(url => ({ url })),
          maxPagesPerCrawl: urls.length * 2,
          // Script básico para extraer texto y metadatos
          pageFunction: async function ({ page, request, log }) {
            const title = await page.title();
            const text = await page.$eval('body', el => el.innerText.substring(0, 5000));
            return { url: request.url, title, text };
          }
        };
      } else if (config.plataforma === 'idealista') {
        actorId = 'igolaizola~idealista-agency-scraper';
        runInput = {
          location: config.zona,
          maxPrice: config.precioMax ? parseInt(config.precioMax) : undefined,
          minRooms: config.habMin ? parseInt(config.habMin) : undefined,
          ignoreAgencies: true 
        };
      } else if (config.plataforma === 'airbnb') {
        actorId = 'dtrungtin~airbnb-scraper';
        runInput = { locationQuery: config.zona, maxListings: 20 };
      } else if (config.plataforma === 'facebook') {
        actorId = 'apify~facebook-groups-scraper';
        runInput = { urls: [`https://www.facebook.com/search/groups/?q=${encodeURIComponent(config.zona)}`] };
      } else {
        throw new Error(`Configuración de plataforma (${config.plataforma}) no reconocida y sin URLs directas.`);
      }

      // 1. Iniciar la ejecución en Apify
      const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runInput)
      });

      if (!runRes.ok) {
        if (runRes.status === 403) {
          throw new Error(`Acceso Prohibido (403): Debes entrar en Apify y añadir el Actor "${actorId}" a tu cuenta (clic en 'Try for free' o 'Add to account') antes de poder usarlo desde el CRM.`);
        }
        throw new Error(`Error iniciando Apify: ${runRes.statusText}`);
      }

      const runData = await runRes.json();
      const apifyRunId = runData.data.id;
      job.logs.push(`⚙️ Tarea iniciada en cluster (ID: ${apifyRunId}). Esperando resultados...`);

      // 2. Hacer Polling hasta que termine (máx 5 minutos)
      let isFinished = false;
      let datasetId = null;
      let attempts = 0;

      while (!isFinished && attempts < 30) {
        await new Promise(r => setTimeout(r, 10000)); // Esperar 10s entre chequeos
        attempts++;
        
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${apifyRunId}?token=${token}`);
        const statusData = await statusRes.json();
        
        const status = statusData.data.status;
        job.logs.push(`⏳ Progreso de extracción: ${status}...`);

        if (status === 'SUCCEEDED') {
          isFinished = true;
          datasetId = statusData.data.defaultDatasetId;
        } else if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`La tarea en Apify falló con estado: ${status}`);
        }
      }

      if (!isFinished) {
        throw new Error('Timeout esperando a que el scraper terminara (más de 5 minutos).');
      }

      // 3. Obtener los resultados del Dataset
      job.logs.push('📥 Descargando conjunto de datos procesado...');
      const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
      const items = await dataRes.json();

      // 4. Formatear y filtrar los resultados a nuestro formato de "Lead"
      const leads = this._formatApifyResults(items, config.plataforma, config.zona);
      job.results = leads;
      job.status = 'COMPLETED';
      job.logs.push(`✅ Extracción finalizada. ${leads.length} perfiles recuperados y limpiados.`);

    } catch (error) {
      job.status = 'FAILED';
      job.logs.push(`❌ Error en el proceso: ${error.message}`);
    }
  }

  // --- MÉTODOS DE FORMATEO Y SIMULACIÓN ---

  _formatApifyResults(items, plataforma, zona) {
    return items.map((item, idx) => {
      // Intentamos extraer nombres y teléfonos si el scraper los provee.
      // Para scrapers genéricos (URL personalizada), usamos el título de la página
      const nombreRaw = item.advertiserName || item.hostName || item.contactName || item.title || 'Perfil Extraído';
      const telefonoRaw = item.phone || item.contactPhone || null;
      
      const telefonoFallback = telefonoRaw || 'Contactar vía web';
      const descripcion = item.text ? item.text.substring(0, 150) + '...' : (item.title || 'Sin descripción');

      return {
        id: `sc-apify-${Date.now()}-${idx}`,
        nombre: nombreRaw,
        apellidos: '',
        telefono: telefonoFallback,
        email: item.email || 'No disponible',
        origen: plataforma === 'custom' ? 'URL Directa' : plataforma.charAt(0).toUpperCase() + plataforma.slice(1),
        tipo: 'Contacto Extraído',
        zonaInteres: zona || 'General',
        presupuesto: item.price || 0,
        comentarios: `Extraído de: ${item.url || 'Origen desconocido'}. Resumen: ${descripcion}`
      };
    }).filter(lead => lead.nombre && !lead.nombre.toLowerCase().includes('agencia'));
  }

  async _simulateScraping(job, config) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    
    await sleep(2000);
    job.logs.push(`🔍 [Simulación Avanzada] Escaneando listados en la zona: ${config.zona}`);
    await sleep(3000);
    job.logs.push('🤖 [IA Filter] Analizando semántica para descartar agencias y buscar propietarios directos...');
    await sleep(4000);
    
    const leads = [];
    const numLeads = Math.floor(Math.random() * 8) + 3; // Genera entre 3 y 10 leads

    const NOMBRES = ['Carlos', 'Laura', 'David', 'Elena', 'Marc', 'Sofía', 'Alejandro', 'Marta', 'Javier', 'Lucía'];
    const APELLIDOS = ['Ruiz', 'Martínez', 'Gómez', 'Fernández', 'López', 'Sánchez', 'Pérez', 'García', 'Ribas', 'Costa'];

    for(let i = 0; i < numLeads; i++) {
      const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
      
      leads.push({
        id: `sc-rnd-${Date.now()}-${i}`,
        nombre,
        apellidos: apellido,
        telefono: '+34 6' + Math.floor(Math.random() * 90000000).toString().padStart(8, '0'),
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`,
        origen: config.plataforma.charAt(0).toUpperCase() + config.plataforma.slice(1),
        tipo: 'Vendedor (Particular)',
        zonaInteres: config.zona,
        presupuesto: Math.floor(Math.random() * 20 + 5) * 100000,
        comentarios: `Detectado anuncio de particular. Propiedad valorada en el rango indicado en ${config.zona}.`
      });
    }

    job.logs.push(`⚠️ NOTA: Estos datos son generados porque no se detectó APIFY_API_TOKEN. Para extracción real, configura el token en el backend.`);
    job.results = leads;
    job.status = 'COMPLETED';
    job.logs.push(`✅ Barrido simulado finalizado. ${leads.length} perfiles recuperados.`);
  }
}

module.exports = { scraperService: new ScraperService() };
