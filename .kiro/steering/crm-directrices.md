---
inclusion: always
---

# Directrices del Proyecto — Neural CRM (CRM Inmobiliario)

Estas directrices aplican a TODO trabajo sobre este proyecto. Kiro y el agente
`crm-builder` deben respetarlas siempre.

## 1. Qué es el proyecto

CRM inmobiliario **SaaS multi-tenant** de alto standing para agencias de Mallorca,
Baleares e Ibiza. Gestiona tres modelos de negocio sobre el mismo inmueble:
- **Alquiler Vacacional** (licencia ETV, temporadas, channel manager iCal)
- **Alquiler de Larga Duración** (inquilinos, fianzas, pagos de renta)
- **Venta** (pipeline Kanban, precio público/mínimo confidencial, comisiones)

Objetivo actual: **llevar el producto a una versión estable y vendeble ("salir al mercado")**.

## 2. Stack tecnológico (respetar, no reemplazar sin acuerdo)

- **Frontend**: React 18 + Vite + Vanilla CSS (design system "Mediterranean Luxury").
  React Router, TanStack Query, Axios, Recharts, Leaflet, lucide-react.
- **Backend**: Node.js 20 + Express. Prisma ORM.
- **DB**: PostgreSQL (Supabase) en producción; fallback SQLite en desarrollo.
- **IA**: OpenAI GPT-4o + Vision, pdf-parse, Tesseract (OCR).
- **Cloud**: Google Drive API + Sheets API, Supabase Storage CDN.
- **Mensajería**: WhatsApp Business API (Meta Cloud), Nodemailer.

No introducir librerías o frameworks nuevos sin justificarlo y confirmarlo con el usuario.

## 2.1 Base de datos definitiva (IMPORTANTE)

- La base de datos **definitiva es PostgreSQL en Supabase** (`DATABASE_URL`/`DIRECT_URL`).
  Todo el CRM lee y escribe ahí. El esquema Prisma usa `provider = "postgresql"`.
- El archivo `backend/prisma/dev.db` (SQLite) es un **residuo de desarrollo** con datos
  de ejemplo antiguos. NO es la fuente de verdad y no debe usarse como tal.
- Los cambios de esquema se aplican a Supabase con `prisma db push` (o migración) tras
  confirmarlo con el usuario. Si un dato "no aparece", primero comprobar que se está
  mirando Supabase y no el SQLite.
- Nunca cambiar el destino de la BD sin migrar los datos y avisar al usuario. Perder
  datos es inaceptable.

## 3. Arquitectura y reglas de negocio inviolables

- **Multi-tenant por `agenciaId`**: TODA entidad (usuarios, propiedades, clientes,
  facturas, actividades, etc.) debe filtrarse por `agenciaId`. Nunca escribir una
  query que pueda cruzar datos entre agencias.
- **Soft delete**: las propiedades y entidades críticas nunca se borran físicamente;
  se marca `activo = false`.
- **Audit log**: acciones sensibles (lecturas de datos confidenciales, descargas de
  facturas, alteraciones) deben quedar registradas en `AuditLog`.
- **Datos IA sin inventar**: si un dato no está en el PDF/dossier, se queda en `null`.
  Nunca alucinar características de una propiedad.
- **Campos confidenciales** (`iban`, `nif`, `precioMinimo`): tratar como sensibles,
  cifrado en reposo, no exponer en logs ni respuestas no autorizadas.

## 4. Seguridad

- Auth: Google OAuth 2.0 (SSO) + JWT (access 1h / refresh 30d) + dev-login solo local.
- RBAC: SUPERADMIN | DIRECTOR | AGENTE_SENIOR | AGENTE | BACKOFFICE.
- Helmet + rate limiting (500 req / 15 min por IP).
- Nunca commitear secretos. `google-credentials.json`, `.env`, tokens y API keys
  fuera de git. Usar `.env.example` / `.env.prod.example` como plantilla.
- Configuración de marca blanca pública (color/logo) puede leerse sin JWT; el resto
  requiere token.

## 5. Design System "Mediterranean Luxury"

- Deep Navy `#0D1B2A` (sidebar, headers), Mediterranean `#1A3A5C` (CTAs),
  Sky Blue `#4A6FA5` (secundarios), Warm Gold `#C9A84C` (accents),
  Pearl White `#F5F0E8` (fondos/cards).
- Tipografía: Inter (sans) + Playfair Display (serif).
- Marca blanca: los colores se inyectan como CSS vars según la agencia; no hardcodear
  el color primario en componentes, usar la variable `--mediterranean`.

## 6. Convenciones de código

- Idioma del dominio en **español** (nombres de modelos, rutas, variables de negocio:
  `propiedades`, `propietarios`, `reservas`, `pagos`). Mantener esa convención.
- Rutas backend en `backend/src/routes/`, lógica en `backend/src/services/`,
  middleware en `backend/src/middleware/`, utilidades en `backend/src/utils/`.
- Frontend: páginas en `src/pages/`, componentes reutilizables en `src/components/`,
  llamadas API centralizadas en `src/services/api.js`.
- Seguir el estilo existente del archivo antes de introducir uno nuevo. Leer el
  código vecino antes de escribir.

## 7. Flujo de trabajo y verificación

- Antes de tocar código que no se conoce, leerlo. No proponer cambios a ciegas.
- Tras cambios de backend: comprobar que arranca (`npm run dev` / `npm start`) y que
  las rutas afectadas responden. Tras cambios de esquema: generar migración Prisma.
- Tras cambios de frontend: `npm run build` debe pasar sin errores.
- No añadir tests salvo que el usuario lo pida, pero no romper los existentes
  (`backend/src/services/__tests__`).
- Cambios de esquema Prisma → crear migración con nombre descriptivo
  (`npx prisma migrate dev --name ...`), no editar el historial de migraciones.

## 8. Seguridad operativa (acciones peligrosas)

Pedir confirmación explícita antes de: borrar datos o archivos en masa, tocar
producción, resetear la base de datos, modificar credenciales, o cualquier operación
difícil de revertir. Preferir alternativas no destructivas.

## 9. Documentos de referencia del proyecto

- `README.md` — arranque y visión general.
- `CLAUDE_HANDOVER.md` — estado reciente y decisiones técnicas.
- `esquema_implementacion_crm.md` — arquitectura, modelo de datos y catálogo de APIs.
- `esquema-web-crm.md` — esquema de la web.
- Carpetas `estrategia-comercial/`, `legal/`, `proyecto/` — contexto de negocio y legal.
