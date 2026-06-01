const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { scraperService } = require('../services/scraperService');

// Iniciar un nuevo trabajo de scraping
router.post('/run', authenticate, async (req, res) => {
  try {
    const config = req.body;
    
    // Validación básica
    if (!config.plataforma || !config.zona) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios (plataforma, zona)' });
    }

    const jobId = await scraperService.startScrapingJob(config);
    res.json({ ok: true, jobId, message: 'Trabajo de extracción iniciado en segundo plano.' });
  } catch (error) {
    console.error('[Scraper API] Error al iniciar:', error);
    res.status(500).json({ error: 'Error al iniciar el motor de scraping' });
  }
});

// Consultar el estado de un trabajo en curso
router.get('/status/:jobId', authenticate, (req, res) => {
  const job = scraperService.getJobStatus(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job no encontrado o expirado' });
  }
  
  res.json({ ok: true, job });
});

module.exports = router;
