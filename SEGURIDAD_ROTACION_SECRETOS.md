# 🔐 Rotación de secretos — Acción requerida antes de producción

Durante la auditoría de la Fase 0 se detectó que el archivo `backend/.env` contiene
**credenciales reales** y que algunas han circulado en el árbol del proyecto y/o en
documentación. Aunque `.env` y `google-credentials.json` están correctamente
ignorados por git (no se subieron al repositorio), **cualquier secreto que haya
estado en texto plano debe considerarse comprometido y rotarse** antes de salir al
mercado.

> Estado de git verificado: `backend/.env` y `backend/google-credentials.json`
> NO están trackeados. `backend/prisma/dev.db` se ha retirado del índice de git en
> esta fase.

## Secretos a rotar

| Secreto | Dónde se usa | Acción |
|---|---|---|
| **Contraseña de PostgreSQL / Supabase** (`DATABASE_URL`, `DIRECT_URL`) | Conexión a la BD | Cambiar la contraseña del rol de Postgres en el panel de Supabase y actualizar `.env`. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Subida de archivos (Storage) | Regenerar la Service Role Key en Supabase → Project Settings → API. |
| **`OPENAI_API_KEY`** | Análisis IA de dossiers | Revocar la key en platform.openai.com y crear una nueva. |
| **`APIFY_API_TOKEN`** | Scraper de portales | Regenerar el token en la consola de Apify. |
| **`JWT_SECRET`** | Firma de tokens de sesión | Generar uno nuevo y largo: `openssl rand -base64 48`. Rotarlo invalida las sesiones activas (aceptable). |
| **Credenciales SMTP** (`SMTP_USER`, `SMTP_PASS`) | Envío de emails | Si son reales, regenerar la contraseña de aplicación. |
| **`google-credentials.json`** | Google Drive/Sheets | Si el JSON de la service account ha circulado, generar una nueva clave en Google Cloud Console y borrar la antigua. |

## Pasos recomendados

1. **Rotar cada secreto** en su proveedor (tabla anterior).
2. **Actualizar** el `backend/.env` de cada entorno con los nuevos valores.
3. **Documentación**: se verificó que los archivos `.md`/`.txt` versionados NO
   contienen secretos reales (solo el `backend/.env`, que está fuera de git). Aun
   así, revisar los `.docx` del proyecto antes de compartirlos externamente.
4. **Verificar el historial de git** por si algún secreto se coló en commits
   antiguos:
   ```bash
   git log -p -- backend/.env
   git log --all --full-history -- "*google-credentials.json"
   ```
   Si aparece algún secreto en el historial, además de rotarlo hay que limpiarlo del
   historial (p. ej. con `git filter-repo`) — coordinar antes porque reescribe el
   historial compartido.
5. **Producción**: guardar los secretos en el gestor de variables del hosting
   (Render, Vercel, etc.), no en archivos.

## Buenas prácticas a mantener

- Nunca pegar secretos reales en documentos `.md`/`.docx` del repo.
- Usar `.env.example` como única plantilla versionada (sin valores reales).
- Un `JWT_SECRET` distinto por entorno (dev/staging/prod).
