# CRM Inmobiliario Profesional

Sistema integral de gestión inmobiliaria de alto standing para agencias en Mallorca y Baleares. Gestiona Alquiler Vacacional, Alquiler de Larga Duración y Venta de propiedades, con integración Google Drive/Sheets e inteligencia artificial documental.

## ⚡ Arranque Rápido (Desarrollo sin Docker)

### 1. Clonar y configurar

```bash
# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de Entorno)
```

### 2. Backend

```bash
cd backend
npm install

# Crear y migrar la base de datos (necesitas PostgreSQL corriendo)
npx prisma migrate dev --name init
npx prisma generate

# Cargar datos de prueba
npm run db:seed

# Arrancar servidor
npm run dev
# → http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 4. Acceso

Abre `http://localhost:5173` → clic en **"Acceso de Desarrollo"** (sin necesidad de Google).

---

## 🐳 Arranque con Docker (Recomendado para producción)

```bash
# Un solo comando levanta PostgreSQL + Backend + Frontend
cp .env.example .env
docker-compose up --build

# Primera vez: migrar BD y cargar datos de prueba
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

Servicios:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

---

## 🗂 Estructura del Proyecto

```
Crm Inteligente Replica/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Esquema de BD completo
│   │   └── seed.js                # Datos de prueba
│   └── src/
│       ├── server.js              # Entry point Express
│       ├── routes/                # auth, propiedades, propietarios, clientes...
│       ├── services/              # driveService, sheetsService, iaService
│       ├── middleware/            # auth.js (JWT + RBAC)
│       └── utils/                 # logger, prisma, audit
├── frontend/
│   └── src/
│       ├── App.jsx                # Routing principal
│       ├── components/            # Layout, Sidebar, Topbar
│       ├── pages/                 # Dashboard, Propiedades, Clientes...
│       ├── services/api.js        # Axios con auto-refresh JWT
│       ├── context/AuthContext    # Google OAuth + dev login
│       └── styles/index.css      # Design system Mediterranean Luxury
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔑 Variables de Entorno

Copia `.env.example` a `.env` y rellena:

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Cadena aleatoria larga | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Para Google login |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Secret | Para Google login |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Path al JSON de Service Account | Para Drive/Sheets |
| `GOOGLE_DRIVE_FOLDER_ID` | ID carpeta raíz en Drive | Para Drive sync |
| `GOOGLE_SHEETS_VACACIONAL_ID` | ID del Sheet de vacacional | Para Sheets sync |
| `OPENAI_API_KEY` | API Key de OpenAI | Para IA documental |

> **Sin credenciales de Google/OpenAI**, el sistema funciona en modo mock: las sincronizaciones se simulan y el procesamiento IA devuelve datos de prueba.

---

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/dashboard` | KPIs globales |
| `GET/POST` | `/api/propiedades` | Listado y creación |
| `GET/PUT/DELETE` | `/api/propiedades/:id` | Ficha completa |
| `GET/POST` | `/api/propietarios` | Directorio propietarios |
| `GET/POST` | `/api/clientes` | Pipeline de leads |
| `POST` | `/api/documentos/upload` | Subir PDF → Drive → IA |
| `GET` | `/api/reservas` | Reservas vacacionales |
| `GET/PUT` | `/api/pagos` | Pagos de renta |
| `POST` | `/api/auth/google` | Login con Google |
| `POST` | `/api/auth/dev-login` | Login de desarrollo |
| `POST` | `/api/auth/refresh` | Renovar JWT |
| `GET` | `/health` | Health check |

---

## 🎨 Design System

**Paleta Mediterranean Luxury:**
| Token | Hex | Uso |
|-------|-----|-----|
| `--deep-navy` | `#0D1B2A` | Header, sidebar |
| `--mediterranean` | `#1A3A5C` | CTAs, títulos |
| `--sky-blue` | `#4A6FA5` | Botones secundarios |
| `--warm-gold` | `#C9A84C` | Accents, highlights |
| `--pearl-white` | `#F5F0E8` | Fondo, cards |

**Tipografía:** Inter (sans) + Playfair Display (serif)

---

## 🔒 Seguridad

- Google OAuth 2.0 (SSO corporativo)
- JWT Access Token (1h) + Refresh Token (30d)
- RBAC: SUPERADMIN | DIRECTOR | AGENTE_SENIOR | AGENTE | BACKOFFICE
- Helmet.js + Rate Limiting (500 req/15min)
- Soft delete (nunca borrado físico de propiedades)
- Audit log inmutable de todas las acciones

---

## 🗺 Roadmap

| Fase | Estado | Contenido |
|------|--------|-----------|
| **Fase 1 · MVP** | ✅ En curso | CRUD, Auth, Drive/Sheets, IA básica |
| **Fase 2 · IA** | ⏳ Planificado | OCR avanzado, clasificación automática |
| **Fase 3 · Comercial** | ⏳ Planificado | Contratos, calendario, informes |
| **Fase 4 · Enterprise** | ⏳ Planificado | Portal cliente, portales, WhatsApp |

---

*CRM Inmobiliario Profesional · v1.0 · Confidencial*
