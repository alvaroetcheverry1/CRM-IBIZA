---
inclusion: always
---

# 🗺️ Roadmap a Mercado — SYNNER CRM (backlog ejecutable)

Este es el backlog vivo que el agente `crm-builder` ejecuta de forma autónoma para
llevar SYNNER a una versión estable y vendeble. **Orden = prioridad.** El agente
trabaja de arriba abajo: coge la primera tarea no completada, la ejecuta entera, la
verifica, la marca como hecha `[x]` en este archivo, y pasa a la siguiente sin pedir
permiso para "empezar una fase".

## Reglas de ejecución autónoma

1. **Trabaja secuencialmente** por fases y, dentro de cada fase, por orden de tarea.
2. Antes de tocar código, **lee** los archivos implicados. Sigue el steering
   `crm-directrices.md` (multi-tenant, soft delete, secretos fuera de git, etc.).
3. Al terminar cada tarea: **verifica** (backend arranca / rutas responden;
   `npm run build` del frontend pasa; no rompas tests existentes) y marca `[x]` aquí
   con una nota de una línea de qué se hizo.
4. Al terminar una **fase completa**, crea un commit en la rama de trabajo actual
   con un mensaje `fase N(area): resumen`. No hagas push salvo que el usuario lo pida.
5. **PARA y pregunta al usuario** solo si: falta una credencial/decisión de negocio,
   la acción es destructiva o irreversible (borrar datos, tocar producción, resetear
   BD), o una tarea contradice una directriz. En cualquier otro caso, continúa.
6. Si una tarea queda bloqueada, márcala `[!]` con el motivo y sigue con la siguiente
   desbloqueada.
7. Mantén este archivo actualizado como única fuente de verdad del progreso.

---

## ✅ Fase 0 — Seguridad urgente  (COMPLETADA)
- [x] Cerrar fuga multi-tenant en `reservas.js` (filtrado por agenciaId)
- [x] Sacar `dev.db` de git y ampliar `.gitignore`
- [x] Fallback local real en subida de archivos (Supabase → disco)
- [x] Documentar rotación de secretos (`SEGURIDAD_ROTACION_SECRETOS.md`)

## ✅ Fase 1 — Unificación de marca SYNNER  (COMPLETADA)
- [x] Branding SYNNER en backend (server.js, CORS por env)
- [x] Emails parametrizados (BRAND_NAME / remitente / plantillas)
- [x] Feeds de portales con contacto real de la agencia (marca blanca)
- [x] Prompts de IA neutralizados
- [x] Frontend: factura/dossier/propuestas usan datos de la agencia; footers limpios

---

## ✅ Fase 2 — Estabilidad funcional y accesos  (COMPLETADA)
- [x] **WhatsApp bot**: corregido import roto (creado `iaService.generarRespuestaChat`),
      `agenciaId` asignado a los leads, código muerto eliminado, firma HMAC segura.
- [x] **WhatsApp por agencia**: credenciales en `ConfiguracionAgencia` + pestaña en
      Configuración; el bot resuelve la agencia por `phone_number_id`.
- [x] **Registro con aprobación manual**: `register` deja la agencia PENDIENTE + aviso
      por email al superadmin (`ADMIN_NOTIFICATION_EMAIL`).
- [x] **Acceso superadmin separado**: ruta oculta `/panel-interno`; quitada la puerta
      de "Desarrolladores" del login público.
- [x] **BD sincronizada con Supabase** (`db push`): esquema aplicado, persistencia
      verificada. BD definitiva = Supabase (dev.db es residuo).
- [x] **Refresh JWT en frontend**: `api.js` renueva el token ante `TOKEN_EXPIRED` y
      reintenta una vez antes de desloguear (apiCall y apiUpload).
- [x] **Access token a 1h** con refresh transparente.
- [x] **Google OAuth sin agencia**: solo entran usuarios existentes con agencia; no se
      crean cuentas huérfanas (código `NO_ACCOUNT`).

## ⏳ Fase 3 — Experiencia y web comercial
- [x] App frontend coherente con SYNNER: favicon, manifest, logo real
      (`/logo-synner.png`) en login/registro.
- [x] Web comercial (`web-crm/index.html`) rebrandeada a SYNNER + enlace "Acceder".
- [x] Eliminado MOCK_DATA que enmascaraba fallos (dashboard, propiedades, clientes,
      propietarios, documentos); `pagosApi` conectado al backend real; documento mock
      de Documentos eliminado.
- [x] Estados de error en páginas clave (Dashboard, Propiedades, Clientes,
      Propietarios, Documentos) + estado vacío en Propiedades.
- [x] Catálogos públicos ya usaban marca blanca; añadida al portal del propietario
      (endpoint `/propietarios/portal/:token` devuelve `marca`: nombre, logo, color,
      contacto; el portal la aplica en header y footer).
- [x] Accesibilidad básica: `aria-label` + `type="search"` en los buscadores de
      Clientes, Propietarios, Propiedades, Facturación y catálogo público.

## ✅ Fase 4 — Preparación de despliegue  (COMPLETADA)
- [x] `Dockerfile.prod` corregido (bug: Prisma Client se perdía; ahora se copia del
      builder) + HEALTHCHECK; ya no copia `.env.example` como `.env`.
- [x] `render.yaml` rebrandeado a SYNNER, con todas las env vars y `healthCheckPath`.
- [x] `vercel.json` con destino del backend configurable (placeholder SYNNER).
- [x] `docker-compose.prod.yml` rebrandeado, vars nuevas (BRAND/CORS/SMTP/WhatsApp),
      backend detrás de Nginx (expose), Postgres marcado opcional (Supabase por defecto).
- [x] `.env.prod.example` coherente con el código (SMTP en vez de SendGrid, marca
      SYNNER, vars nuevas; Stripe comentado para Fase 6).
- [x] Health check `/health` (existente) + HEALTHCHECK de contenedor.
- [x] `DESPLIEGUE.md`: guía completa (Supabase/Render/Vercel/Docker) + checklist de
      seguridad + creación del primer superadmin.
- [ ] (Opcional) Datos de demo/seed para una cuenta de prueba — pendiente si se desea.
  NOTA: `docker compose config` no se pudo validar aquí (Docker no instalado en el entorno).

## ⏳ Fase 5 — Calidad y cierre
- [x] **Multi-tenant en rutas menores**: tapadas 8 fugas (pagos GET/PUT, actividades
      GET/POST/DELETE, propuestas enviar-disponibilidad, tareas PUT/DELETE,
      notificaciones :id/read) y añadida auth a `facturas/upload` (estaba abierta).
      catalogos/search/matchmaking ya estaban OK.
- [x] Pruebas de humo: rutas protegidas devuelven 401 sin token y 200 con token;
      facturas/upload ahora exige auth. (Aislamiento entre 2 agencias reales: lógica
      verificada por código, no probada con datos de 2 agencias.)
- [x] **Backend de facturas (CRUD real)**: modelo `Factura` en Prisma + migración
      aplicada a Supabase (`db push`); endpoints GET/POST/PUT/DELETE con multi-tenant
      y número/totales automáticos; `facturasApi` del frontend conectado. Verificado
      end-to-end (crear/listar/actualizar/borrar).
- [x] Documentación de usuario/onboarding (`GUIA_USUARIO.md`).
- [x] Repaso final del backlog y etiqueta de versión (tag `v1.0-rc1`, release
      candidate). El tag `v1.0-vendible` se reserva para el cierre de la Fase 6
      (pago + legal), ya que sin cobrar ni base legal no es realmente "vendible".

## ⏳ Fase 6 — Monetización y cumplimiento legal
Requisitos de negocio para poder cobrar y vender. Varias tareas dependen de
decisiones o cuentas del usuario (marcadas con 👤).

### Pasarela de pago (suscripciones SaaS)
- [x] Planes reales definidos: **Silver 199 / Gold 399 / Premium 599 €/mes + IVA**,
      sin permanencia (`backend/src/config/planes.js`); alineado modelo Agencia.
- [x] Modelo `Suscripcion` en Prisma + migración aplicada a Supabase.
- [x] Integración Stripe: `stripeService` + rutas (planes, checkout, portal) +
      webhook (`stripeWebhook`) que sincroniza suscripción y estado de agencia.
- [x] Página de planes `/planes` (frontend) con checkout; `suscripcionesApi`.
- [x] Impago/cancelación → agencia SUSPENDIDA (en el webhook).
- [ ] 👤 Crear cuenta de Stripe, los productos/precios y aportar claves
      (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`). Sin ellas,
      los pagos quedan deshabilitados (rutas 503). Verificado el modo degradado.
- [x] Gestión de la suscripción desde Configuración → pestaña "Suscripción y Plan"
      (muestra plan/estado, contratar y botón al portal de Stripe).
- [x] Guía de configuración de Stripe para el usuario (`CONFIGURACION_STRIPE.md`).

### Legal y cumplimiento (RGPD)
- [x] Borradores en `legal/`: Términos, Privacidad y Cookies (marcados como BORRADOR).
- [x] Aceptación de Términos y Privacidad obligatoria en el registro.
- [ ] 👤 **Revisión por abogado** de los tres documentos (RGPD/LOPDGDD) antes de publicar.
- [ ] 👤 Contrato de encargado de tratamiento (agencia ↔ SYNNER). Revisión legal.
- [x] Páginas públicas legales en `/legal/:doc` (terminos, privacidad, cookies);
      el registro ya enlaza ahí (eran 404). Textos aún pendientes de abogado.
- [x] Cifrado en reposo de campos sensibles (AES-256-GCM vía middleware Prisma):
      Propietario.nif/iban, AlquilerLargaDuracion.inquilinoNif, ConfiguracionAgencia.cif/iban.
      Verificado: en BD se guardan como `enc:v1:...`, la API los devuelve descifrados.
      Requiere `ENCRYPTION_KEY` en el entorno.

---

*Actualiza este archivo tras cada tarea. Si surge trabajo nuevo, añádelo en la fase
que corresponda manteniendo el orden de prioridad.*
