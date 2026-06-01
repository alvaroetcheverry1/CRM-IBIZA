# 📂 Entrega de Proyecto: CRM Ibiza Inteligente

Este documento sirve de puente para que Claude Code entienda el progreso actual, las decisiones técnicas tomadas y los desafíos pendientes.

## 🚀 Estado Actual
El CRM está entrando en su fase de estabilización comercial. Se ha migrado de mock data a una base de datos **SQLite (Prisma)** y se han resuelto los cuellos de botella críticos en la carga de archivos.

## 🛠️ Stack Tecnológico
- **Frontend**: Vite + React + Vanilla CSS (Aesthetics Premium).
- **Backend**: Node.js + Express.
- **DB**: SQLite con Prisma ORM.
- **IA**: OpenAI (GPT-4o + Vision) para análisis de dossiers.
- **Almacenamiento**: Google Drive con **Fallback Local** (servido vía `/api/uploads`).

## 🧠 Cambios Críticos Recientes (Últimas 48h)

1. **Extracción de Fotos de PDF**:
   - **Archivo**: `frontend/src/utils/extractPdfPages.js`
   - **Cambio**: Se cambió el renderizado de páginas completas por la extracción de **objetos de imagen individuales (XObjects)** para obtener las fotos limpias del dossier. Posee un fallback a renderizado de página para PDFs escaneados.

2. **Análisis IA con "Consciencia"**:
   - **Archivo**: `backend/src/services/iaService.js`
   - **Cambio**: Se implementó un extractor basado en texto (Regex) que actúa como base y se complementa con **GPT-4o Vision** para "ver" elementos de lujo (piscinas infinity, chimeneas) y redactar descripciones profesionales.
   - **Regla**: Nunca inventar datos; si no está en el PDF, se queda en `null`.

3. **Estabilidad de Carga (Fix de Drive y Prisma)**:
   - **Archivo**: `backend/src/routes/documentos.js` y `driveService.js`
   - **Solución**: Se añadió un default `'[]'` al campo `fotos` de la propiedad para evitar errores de validación. Ahora las fotos se guardan en local y se sincronizan a Drive en segundo plano para evitar fallos de CORS en el slider del frontend.

## 📍 Archivos Clave para Revisar
- `backend/src/services/iaService.js`: Lógica de análisis de documentos.
- `frontend/src/components/ModalCrearPropiedadUnificado.jsx`: Pipeline de subida y análisis en el cliente.
- `frontend/src/components/PhotoSlider.jsx`: Visualización de imágenes (resuelve URLs locales y de Drive).
- `backend/prisma/schema.prisma`: Estructura actual de datos.

## 🎯 Próximos Pasos Sugeridos
1. **Auditoría de UI**: Asegurar que todos los campos extraídos por la IA se reflejan correctamente en los formularios de edición.
2. **Sincronización Total**: Refinar la sincronización con Google Sheets para que los nuevos campos de IA se mapeen correctamente.
3. **Optimización de Vision**: Ajustar el prompt de visión para detectar más detalles arquitectónicos específicos de Ibiza.
4. **Portales - Credenciales de producción**: Configurar las variables de entorno para los portales reales.

## 🌐 Módulo de Portales Inmobiliarios (NUEVO)

### Archivos creados
- **`backend/src/services/portalesService.js`**: Adaptadores de formato para Idealista XML, Fotocasa XML, Kyero XML y James Edition JSON. Gestiona publicación, despublicación y generación de feeds.
- **`backend/src/routes/portales.js`**: Rutas REST. Endpoints clave:
  - `GET /api/portales/config` — Lista portales disponibles
  - `GET /api/portales/:id/estado` — Estado de publicación de una propiedad
  - `POST /api/portales/publicar` — Publica en portales seleccionados (async background)
  - `POST /api/portales/despublicar` — Despublica
  - `GET /api/portales/feed?portal=idealista|fotocasa|kyero` — Feed XML público para que los portales lo consuman
- **`frontend/src/components/PublicadorPortales.jsx`**: Modal premium con toggle por portal, estados en tiempo real (polling), panel informativo de URLs de feed.
- **`backend/prisma/schema.prisma`**: Añadido modelo `PublicacionPortal` (estado, urlPublicacion, errores, ultimoSync).

### Variables de entorno a configurar (`.env`)
```
PORTALES_FEED_TOKEN=tu_token_secreto   # Protege el feed público (opcional)
PUBLIC_SERVER_URL=https://tudominio.com # URL pública del backend para las fotos
JAMES_EDITION_API_KEY=...              # Credencial API James Edition (si disponible)
JAMES_EDITION_AGENCY_ID=...
IDEALISTA_FEED_URL=                    # URL del feed que Idealista debe consumir
FOTOCASA_FEED_URL=
```

### Flujo de uso
1. Abrir la ficha de una propiedad → botón **"Publicar en Portales"** (azul, con icono globo).
2. Se abre el modal: seleccionar portales (checkboxes con estado visual).
3. Clic **"Publicar"** → backend procesa en background, la UI hace polling y actualiza estados.
4. Para Idealista/Fotocasa/Kyero: proporcionar la URL del feed al portal para que lo importe.
5. Para James Edition: necesita API key; sin ella funciona en modo simulación.

### Migración pendiente (ejecutar en el servidor)
```bash
cd backend && npx prisma migrate dev --name add_publicacion_portal
```

---
**Nota para Claude Code**: Todos los archivos mencionados han sido modificados recientemente para corregir fallos críticos de persistencia y extracción. El usuario busca una versión "vendeble" y estable.

