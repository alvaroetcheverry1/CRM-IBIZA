# 🚀 Guía de Despliegue — SYNNER CRM

Guía para poner SYNNER en producción. La arquitectura recomendada es:
**Frontend en Vercel · Backend en Render · Base de datos y Storage en Supabase.**

---

## 1. Requisitos previos

- Cuenta de **Supabase** (PostgreSQL + Storage).
- Cuenta de **Render** (backend Node) y **Vercel** (frontend).
- Dominio propio (ej. `synner.com`) con subdominios `app.` y `api.`.
- Claves de las integraciones que vayas a usar (OpenAI, Google, Apify, WhatsApp/Meta, SMTP).

> Antes de nada, revisa `SEGURIDAD_ROTACION_SECRETOS.md` y usa credenciales nuevas de
> producción, nunca las de desarrollo.

---

## 2. Base de datos (Supabase)

1. Crea el proyecto en Supabase y copia las cadenas de conexión:
   - `DATABASE_URL` (pooler, puerto 6543, con `?pgbouncer=true`).
   - `DIRECT_URL` (conexión directa, puerto 5432).
2. Sincroniza el esquema desde tu máquina (una sola vez, o cuando cambie el schema):
   ```bash
   cd backend
   # Con las variables de producción en el entorno:
   npx prisma db push
   ```
   Esto crea/actualiza todas las tablas. No borra datos existentes.
3. **Storage**: crea un bucket público llamado `crm-uploads` (Storage → New bucket →
   public). Es donde se guardan fotos y documentos. Sin él, el backend cae a disco
   local (no recomendado en producción).

---

## 3. Backend (Render)

1. Conecta el repositorio en Render → New Web Service, raíz `backend/`.
   El archivo `backend/render.yaml` ya define el servicio.
2. Rellena las variables de entorno (las marcadas `sync: false`) en el dashboard.
   Usa `/.env.prod.example` como referencia de qué rellenar.
   Mínimo imprescindible: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
   `FRONTEND_URL`, `PUBLIC_SERVER_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Render usará `buildCommand` (`npm install && npx prisma generate`) y
   `startCommand` (`npm start`). El health check apunta a `/health`.
4. Si usas Google Drive/Sheets, sube el `google-credentials.json` como secret file
   y apunta `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` a su ruta.

---

## 4. Frontend (Vercel)

1. Importa el repo en Vercel, raíz `frontend/`.
2. Framework: Vite. Build: `npm run build`. Output: `dist`.
3. Variable de entorno: `VITE_API_URL=https://api.synner.com/api`.
4. Edita `frontend/vercel.json` y pon en `destination` la URL real del backend de
   Render (el rewrite de `/api/*` hacia el backend).

---

## 5. Web comercial (`web-crm/`)

Es un `index.html` estático. Despliégalo en Vercel/Netlify como sitio aparte
(ej. `www.synner.com`). Ajusta `window.APP_URL` en el HTML a la URL de la app
(`https://app.synner.com`) para que el botón "Acceder" enlace al login.

---

## 6. Alternativa: despliegue autoalojado (Docker)

Si prefieres alojarlo todo tú, usa `docker-compose.prod.yml` (incluye Nginx con
SSL). Copia `.env.prod.example` a `.env`, rellénalo y:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
El servicio `postgres` del compose solo es necesario si NO usas Supabase; en ese
caso apunta `DATABASE_URL`/`DIRECT_URL` a ese contenedor.

---

## 7. Primer superadmin

El registro público crea agencias en estado PENDIENTE. Para gestionarlas necesitas
un usuario **SUPERADMIN**. En producción el `dev-login` está deshabilitado, así que
crea el superadmin directamente (una vez):
```bash
# Ejemplo con un script/consola Prisma — ajustar email y hash de contraseña.
# El superadmin no pertenece a ninguna agencia (agenciaId = null).
```
El acceso interno del superadmin es la ruta oculta **`/panel-interno`**.

---

## 8. Post-despliegue: verificación

- `GET https://api.synner.com/health` responde `{"status":"ok"}`.
- El login de agencias carga en `https://app.synner.com/login`.
- Una agencia registrada queda PENDIENTE y el superadmin puede activarla.
- Subir una foto a una propiedad la guarda en el bucket `crm-uploads`.
- Revisa el checklist de seguridad en `DESPLIEGUE.md` (sección 9).

---

## 9. Checklist de seguridad (antes de abrir al público)

- [ ] Secretos de producción nuevos (no los de desarrollo). Ver `SEGURIDAD_ROTACION_SECRETOS.md`.
- [ ] `JWT_SECRET` largo y único de producción.
- [ ] `NODE_ENV=production` (deshabilita el dev-login y los stack traces en errores).
- [ ] `CORS_EXTRA_ORIGINS` con los dominios reales (no `*`).
- [ ] HTTPS en todos los dominios (Vercel/Render lo dan; en autoalojado, Nginx + SSL).
- [ ] Bucket de Supabase con las políticas de acceso correctas.
- [ ] Rate limiting activo (ya configurado: 500 req/15 min).
- [ ] `.env` y `google-credentials.json` fuera de git (ya en `.gitignore`).
- [ ] Backups de la BD activados en Supabase.
- [ ] Rotación del `WHATSAPP_APP_SECRET` y verificación de firma del webhook.
