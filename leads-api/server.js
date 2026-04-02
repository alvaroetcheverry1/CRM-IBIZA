const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// ─── CORS — acepta landing page y CRM ─────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173', // CRM frontend
    'http://localhost:8080', // Agente landing (http-server)
    'null',                  // file:// origin
    '*',                     // cualquier origen en desarrollo
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Necesario para que file:// funcione
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// ─── Helpers de persistencia ──────────────────────────────
function readLeads() {
  if (!fs.existsSync(LEADS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch { return []; }
}

function writeLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// ─── Inicializar archivo si no existe ─────────────────────
if (!fs.existsSync(LEADS_FILE)) writeLeads([]);

// ─── GET /api/clientes — listar leads ─────────────────────
app.get('/api/clientes', (req, res) => {
  const leads = readLeads();
  const { estado, tipo, search } = req.query;
  let filtered = leads;
  if (estado) filtered = filtered.filter(l => l.estado === estado);
  if (tipo) filtered = filtered.filter(l => l.tipo === tipo);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(l =>
      (l.nombre + ' ' + l.apellidos + ' ' + l.email).toLowerCase().includes(q)
    );
  }
  res.json({ data: filtered, meta: { total: filtered.length } });
});

// ─── GET /api/clientes/:id ────────────────────────────────
app.get('/api/clientes/:id', (req, res) => {
  const leads = readLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(lead);
});

// ─── POST /api/clientes — crear lead ──────────────────────
app.post('/api/clientes', (req, res) => {
  const leads = readLeads();
  const lead = {
    id: 'LEAD-' + Date.now(),
    nombre: req.body.nombre || 'Sin nombre',
    apellidos: req.body.apellidos || '',
    email: req.body.email || null,
    telefono: req.body.telefono || null,
    tipo: req.body.tipo || 'AMBOS',
    estado: req.body.estado || 'NUEVO',
    zonaInteres: req.body.zonaInteres || null,
    presupuesto: req.body.presupuesto ? Number(req.body.presupuesto) : null,
    origen: req.body.origen || 'WEB',
    notas: req.body.notas || null,
    _count: { actividades: 0 },
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
  leads.unshift(lead);
  writeLeads(leads);
  console.log(`✅ Nuevo lead: ${lead.nombre} ${lead.apellidos} (${lead.email}) — ${lead.origen}`);
  res.status(201).json(lead);
});

// ─── PATCH /PUT /api/clientes/:id — actualizar estado ─────
app.patch('/api/clientes/:id', updateLead);
app.put('/api/clientes/:id', updateLead);

function updateLead(req, res) {
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Lead no encontrado' });
  leads[idx] = { ...leads[idx], ...req.body, actualizadoEn: new Date().toISOString() };
  writeLeads(leads);
  res.json(leads[idx]);
}

// ─── DELETE /api/clientes/:id ─────────────────────────────
app.delete('/api/clientes/:id', (req, res) => {
  const leads = readLeads();
  const filtered = leads.filter(l => l.id !== req.params.id);
  writeLeads(filtered);
  res.json({ message: 'Lead eliminado' });
});

// ─── GET /api/dashboard ───────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const leads = readLeads();
  const byEstado = {};
  leads.forEach(l => { byEstado[l.estado] = (byEstado[l.estado] || 0) + 1; });

  res.json({
    kpis: {
      totalLeads: leads.length,
      leadsMes: leads.filter(l => new Date(l.creadoEn) > new Date(Date.now() - 30 * 86400000)).length,
      leadsHoy: leads.filter(l => new Date(l.creadoEn).toDateString() === new Date().toDateString()).length,
      tasaConversion: leads.length > 0
        ? Math.round((leads.filter(l => l.estado === 'CERRADO').length / leads.length) * 100)
        : 0,
    },
    leadsPorEstado: Object.entries(byEstado).map(([estado, count]) => ({ estado, _count: { estado: count } })),
    leadsRecientes: leads.slice(0, 5),
  });
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  const leads = readLeads();
  res.json({ status: 'ok', totalLeads: leads.length, timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏝  Ibiza Luxury Dreams — API de Leads`);
  console.log(`📡 Escuchando en http://localhost:${PORT}`);
  console.log(`📂 Leads guardados en: ${LEADS_FILE}`);
  console.log(`\n✅ Listo. La landing page y el CRM están conectados.\n`);
});

module.exports = app;
