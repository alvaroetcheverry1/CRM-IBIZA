require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');

const authRoutes = require('./routes/auth');
const propiedadesRoutes = require('./routes/propiedades');
const propietariosRoutes = require('./routes/propietarios');
const clientesRoutes = require('./routes/clientes');
const documentosRoutes = require('./routes/documentos');
const dashboardRoutes = require('./routes/dashboard');
const reservasRoutes = require('./routes/reservas');
const pagosRoutes = require('./routes/pagos');
const facturasRoutes = require('./routes/facturas');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Seguridad ─────────────────────────────────────────────
app.use(helmet());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  message: { error: 'Demasiadas peticiones. Inténtalo de nuevo en 15 minutos.' },
});
app.use('/api/', limiter);

// ─── CORS ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:8080',   // Agente de captación de leads
  'http://localhost:3001',   // Posible segundo frontend
  'https://ibizaluxurydreams.com',
  'https://www.ibizaluxurydreams.com',
];
app.use(cors({
  origin: (origin, cb) => {
    // Permitir peticiones sin origin (Postman, scripts locales)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS no permitido: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Request Logger ────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── Archivos Estáticos (Fallback Local) ─────────────────
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ─── Rutas ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/propiedades', propiedadesRoutes);
app.use('/api/propietarios', propietariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/facturas', facturasRoutes);

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Drive / Sheets Status ─────────────────────────────────
app.get('/api/drive/status', async (req, res) => {
  const { driveService } = require('./services/driveService');
  const { sheetsService } = require('./services/sheetsService');
  const driveClient  = await driveService.getClient().catch(() => null);
  const sheetsClient = await sheetsService.getClient().catch(() => null);
  res.json({
    drive:  { connected: !!driveClient,  hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN, hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID },
    sheets: { connected: !!sheetsClient, hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
              ids: { vacacional: !!process.env.GOOGLE_SHEETS_VACACIONAL_ID, largaDuracion: !!process.env.GOOGLE_SHEETS_LARGA_DURACION_ID, venta: !!process.env.GOOGLE_SHEETS_VENTA_ID } },
  });
});

// ─── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.path}` });
});

// ─── Error Handler Global ──────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Inicio ────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🏝 Ibiza Luxury Dreams CRM · Backend escuchando en puerto ${PORT}`);
  logger.info(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS habilitado para: ${ALLOWED_ORIGINS.join(', ')}`);
});

module.exports = app;
