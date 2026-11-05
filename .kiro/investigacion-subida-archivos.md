# Investigación — Errores al subir archivos al CRM (SYNNER)

**Fecha:** investigación de solo lectura. No se modificó ningún archivo.
**Reporte del usuario:** al subir archivos al CRM aparece que "son muy largos" o que "no los puede procesar".

---

## Resumen (respuesta directa)

Hay **dos problemas distintos** que producen los dos síntomas que describe el usuario:

1. **"Son muy largos" / el archivo no llega al backend** → **Causa más probable: el límite de ~4.5 MB del proxy de Vercel.**
   En producción el frontend NO llama directamente a Render. Llama a `/api/...` (ruta relativa) y
   `frontend/vercel.json` reescribe esa ruta hacia `https://crm-ibiza.onrender.com/api/...`. Esa reescritura
   pasa por la capa serverless de Vercel, que limita el cuerpo de la petición a ~4.5 MB. Cualquier PDF, foto
   grande (fotos de móvil modernas superan fácilmente 4–12 MB) o presentación supera ese límite y Vercel
   responde **413** antes de que la petición llegue a Render. El backend admite hasta 50 MB (multer) y el
   propio interfaz anuncia "Máx. 50 MB", por lo que el límite real (4.5 MB) sorprende al usuario.

2. **"No los puede procesar" / la extracción falla o tarda demasiado** → **Dos causas:**
   - **(2a) Timeout del proxy en `/propiedades/analizar-pdf`**: esta ruta procesa el PDF de forma
     **síncrona** (OCR con Tesseract + render de páginas + llamadas a OpenAI Vision) antes de responder.
     Con PDFs escaneados o grandes, el proceso puede tardar más que el timeout del proxy (Vercel ~ varios
     segundos a <60s; Render free "despierta" tras inactividad y puede tardar) y la petición se corta con
     **504 / timeout**, que el frontend muestra como error de análisis.
   - **(2b) HEIC/HEIF sin conversión**: el `fileFilter` acepta `.heic/.heif` (formato por defecto del iPhone)
     pero el backend **no tiene ninguna librería de conversión** (`sharp`, `heic-convert`, etc. no están en
     `package.json`). pdf-parse, Tesseract y OpenAI Vision no procesan HEIC, así que esas imágenes se
     "suben" pero la extracción posterior no produce nada → "no se puede procesar".

El caso 1 (límite de Vercel) es casi con seguridad el que genera el mensaje literal de **"muy largo"**.

---

## Evidencia (con citas de archivo)

### A. El frontend enruta las subidas a través del proxy de Vercel (no directo a Render)

- `frontend/.env.production`:
  ```
  VITE_API_URL=/api
  ```
  Ruta **relativa**. En producción, todas las llamadas del frontend van a `https://crm-ibiza.vercel.app/api/...`.

- `frontend/vercel.json`:
  ```json
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://crm-ibiza.onrender.com/api/:path*" }
  ]
  ```
  La reescritura reenvía `/api/*` a Render, **pasando por la infraestructura serverless de Vercel**. Es ahí
  donde aplica el límite de ~4.5 MB de cuerpo de petición.

- `frontend/src/services/api.js`:
  - `const BASE_URL = import.meta.env.VITE_API_URL || '/api';`
  - `apiUpload()` hace `fetch(\`${BASE_URL}${path}\`, { method: 'POST', body: formData })` → usa `/api`,
    luego Vercel.
  - `documentosApi.upload` → `apiUpload('/documentos/upload', ...)`.

- Los modales de subida construyen la URL igual:
  - `frontend/src/components/AnalizarPDFModal.jsx`:
    `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';`
    `fetch(\`${BASE_URL}/propiedades/analizar-pdf\`, ...)` → `/api` → Vercel.
  - `frontend/src/components/CrearDesdeFotosModal.jsx`: mismo patrón, `fetch(\`${BASE_URL}/documentos/upload\`, ...)`.
  - `frontend/src/pages/Documentos.jsx`: `DropzoneUpload` → `uploadMutation.mutateAsync` → `documentosApi.upload`.

> **Confirmación clave:** ninguna subida apunta a la URL directa de Render; todas pasan por `/api` → Vercel.
> Por eso el límite de 50 MB del backend es irrelevante en producción: el cuello de botella está antes.

### B. El backend admite 50 MB (pero no se llega a usar en prod)

- `backend/src/routes/documentos.js` (multer `upload`): `limits: { fileSize: 50 * 1024 * 1024 }` (50 MB).
  Aplica a `POST /api/documentos/upload` y `POST /api/documentos/dossier`.
- `backend/src/routes/propiedades.js` (multer `uploadPDF`): `limits: { fileSize: 50 * 1024 * 1024 }` (50 MB).
  Aplica a `POST /api/propiedades/analizar-pdf` y `/analizar-imagenes`.
- `backend/src/routes/facturas.js`: `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB), solo `application/pdf`.
- `backend/src/routes/configuracion.js`: `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB), solo imágenes (logo).
- `backend/src/server.js`: `express.json({ limit: '50mb' })` y `express.urlencoded({ ..., limit: '50mb' })`.

- **No hay `app.set('trust proxy', ...)`** en `server.js`. No corta peticiones grandes, pero sí afecta al
  rate-limit por IP (detrás de proxy todas las IPs pueden verse como una) y a `req.ip`. No es la causa del
  error de tamaño, pero conviene anotarlo.
- El interfaz anuncia un límite engañoso: `Documentos.jsx` muestra "PDF, PPT, PPTX · Máx. 50 MB", que no se
  cumple en producción por el límite de Vercel.

### C. `/propiedades/analizar-pdf` procesa de forma SÍNCRONA (riesgo de timeout)

- `backend/src/routes/propiedades.js`, ruta `POST /analizar-pdf`:
  ```js
  const { datos, fotosUrls } = await iaService.analizarPDFCompleto(req.file.buffer, req.file.originalname);
  res.json({ ok: true, datos, fotosUrls });
  ```
  La respuesta se **bloquea** hasta que termina todo el pipeline de IA.

- `backend/src/services/iaService.js`, `analizarPDFCompleto()` ejecuta en cadena y con `await`:
  1. `extraerTextoPDF` (pdf-parse).
  2. `extraerImagenesPDF` (escaneo del binario + subida a Supabase de cada JPEG).
  3. `renderizarPaginasPDF` (pdfjs-dist + `@napi-rs/canvas`, render a 300 DPI escala 3.0, hasta 8 páginas,
     binarización pixel a pixel, subida a Supabase) — **muy costoso en CPU**.
  4. `extraerTextoOCR` → `tesseract.recognize(..., 'spa+eng')` sobre hasta 8 imágenes — **lento**.
  5. Llamadas a OpenAI GPT-4o (texto) y GPT-4o Vision (hasta 6 imágenes con `detail: 'high'`).

  En Render free (CPU limitada, además de "cold start" tras inactividad) este pipeline puede superar el
  timeout del proxy → **504**. El frontend lo muestra como "Error analizando el PDF" / "No se pudo analizar".

- **Contraste**: `POST /api/documentos/upload` procesa el PDF en **background** (no bloquea la respuesta):
  ```js
  if (req.file.mimetype === 'application/pdf' && propiedadId) {
    iaService.procesarDocumento(...).then(...).catch(...);  // no await
  }
  res.status(201).json(finalDoc);
  ```
  Responde rápido y procesa después; por eso esta ruta es menos propensa a timeout (aunque sí al límite de
  tamaño de Vercel del punto A).

### D. HEIC/HEIF aceptado pero no convertido

- `backend/src/routes/documentos.js` `fileFilter` acepta `.heic|.heif`:
  ```js
  file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/)
  ```
- No existe ninguna dependencia de conversión en `backend/package.json` (búsqueda de `sharp`, `heic-convert`,
  `heic`, `libheif`: **sin resultados**).
- `iaService` extrae JPEG embebidos y renderiza páginas, pero una **imagen HEIC suelta** no la convierte nadie;
  pdf-parse/Tesseract/Vision no la procesan. Resultado: se almacena pero la extracción no da datos.
- Nota: la ruta de propiedades `uploadPDF` (`analizar-pdf`/`analizar-imagenes`) **no** incluye heic/heif en su
  filtro (solo jpg/jpeg/png/webp/gif + pdf), así que ahí un HEIC se rechazaría con "Solo se aceptan PDFs e
  imágenes".

### E. Infra / proxy

- `backend/render.yaml`: servicio web `plan: free`, `healthCheckPath: /health`, `startCommand: npm start`.
  Plan free → cold starts e inactividad (agrava el punto C).
- `frontend/vercel.json`: el rewrite de `/api/*` es el punto donde actúa el límite de ~4.5 MB.
- `docker-compose.prod.yml` existe pero el despliegue real descrito es Render + Vercel + Supabase; el proxy
  relevante en producción es **Vercel**, no Nginx.

---

## Conclusiones y recomendaciones (priorizadas)

### Fix #1 (PRINCIPAL) — Evitar el proxy de Vercel para las subidas

El frontend debería llamar **directamente a Render** para las rutas de subida/análisis, saltándose la
reescritura de Vercel y su límite de ~4.5 MB.

Opciones (elegir una):

- **Opción A (recomendada, mínima):** definir `VITE_API_URL=https://crm-ibiza.onrender.com/api` en
  `frontend/.env.production` y quitar el rewrite de `/api` en `vercel.json`. Así todo el tráfico API va
  directo a Render (hasta 50 MB de multer). Requiere que el CORS del backend permita el origen de Vercel
  (`FRONTEND_URL` / `CORS_EXTRA_ORIGINS` en `server.js` ya lo contemplan).
  - Archivo/línea: `frontend/.env.production` (`VITE_API_URL=/api`), `frontend/vercel.json` (bloque
    `rewrites` de `/api/:path*`).
- **Opción B (quirúrgica):** mantener `/api` por Vercel para llamadas JSON normales, pero que **solo las
  subidas** usen una base directa a Render (p. ej. `VITE_UPLOAD_URL`). Cambiaría `apiUpload` en
  `frontend/src/services/api.js` y la `BASE_URL` de `AnalizarPDFModal.jsx` / `CrearDesdeFotosModal.jsx`.

Tras el fix, el límite efectivo pasa a ser el de multer (50 MB), coherente con el texto "Máx. 50 MB".

### Fix #2 — Hacer `/analizar-pdf` asíncrono o acotar el trabajo síncrono

Evitar superar el timeout del proxy en PDFs grandes/escaneados:

- Procesar en background como hace `/documentos/upload` (crear registro, responder 202/200 con un id, y
  continuar el análisis con `.then()`), y que el frontend consulte el estado por polling
  (`estadoProcesamiento`), igual que ya hace `Documentos.jsx` con `refetchInterval: 5000`.
- O, como mínimo, limitar coste síncrono: reducir `renderizarPaginasPDF` (escala 3.0 → 2.0, menos páginas),
  y no ejecutar Tesseract de forma bloqueante.
- Archivos/símbolos: `backend/src/routes/propiedades.js` (`POST /analizar-pdf`),
  `backend/src/services/iaService.js` (`analizarPDFCompleto`, `renderizarPaginasPDF`, `extraerTextoOCR`).

### Fix #3 — Conversión HEIC/HEIF (o rechazarlo con mensaje claro)

- Añadir conversión HEIC→JPEG antes de procesar (p. ej. `heic-convert` o `sharp` con soporte libheif), o bien
  quitar `.heic/.heif` del `fileFilter` y mostrar un mensaje claro pidiendo JPG/PNG.
- Archivo/línea: `backend/src/routes/documentos.js` (`fileFilter`, regex de imágenes). Introducir una
  dependencia nueva requiere confirmación del usuario (ver directrices del proyecto).

### Fix #4 — Alinear el mensaje del interfaz con el límite real

Mientras persista el límite de Vercel, el texto "Máx. 50 MB" en `Documentos.jsx` induce a error. Tras el
Fix #1 el texto vuelve a ser correcto; si no se aplica, debería decir ~4 MB.

### Mejoras menores

- Añadir `app.set('trust proxy', 1)` en `backend/src/server.js` para que el rate-limit y `req.ip` funcionen
  bien detrás de Render/Vercel (no es la causa del error de tamaño, pero es correcto operativamente).
- Devolver un mensaje de error específico cuando multer corta por tamaño (actualmente un 413 de multer no se
  traduce a un texto claro para el usuario).

---

## Qué datos del usuario harían falta para confirmar

Para distinguir cuál de las causas está activa en cada caso, pedir:

1. **Código HTTP** que aparece en la pestaña Red del navegador al fallar la subida:
   - **413** → confirma el límite de Vercel (Fix #1). El cuerpo suele venir de Vercel, no del backend.
   - **504 / timeout** → confirma el timeout síncrono de `/analizar-pdf` (Fix #2).
   - **500** con `detail` → error de procesamiento (posible HEIC u otro; Fix #3) o fallo de IA.
   - **400** "Solo se aceptan PDFs e imágenes" → archivo HEIC en la ruta de propiedades (Fix #3).
2. **Tamaño exacto del archivo** (MB). Si falla >4.5 MB y funciona <4.5 MB → es el límite de Vercel.
3. **Tipo/extensión** del archivo (.pdf, .heic, .jpg, .pptx) y si es un **PDF escaneado** (solo imágenes) o
   con texto, porque los escaneados disparan el pipeline lento de OCR.
4. **En qué pantalla** ocurre (Documentos drag&drop, "Crear desde PDF", "Crear desde fotos", logo en
   Configuración, factura), para saber qué ruta/límite aplica.
5. Si el backend de Render estaba "dormido" (primera petición tras un rato) cuando falló (cold start agrava
   los timeouts).
