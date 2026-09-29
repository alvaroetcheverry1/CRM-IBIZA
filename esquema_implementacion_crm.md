# 🏛️ Esquema de Implementación: Ecosistema Neural CRM

Este documento detalla la **arquitectura técnica, el catálogo de APIs, el modelo de datos, los flujos lógicos de automatización y el historial de hitos** del ecosistema **Neural CRM** (anteriormente conocido como CRM Ibiza Inteligente).

---

## 🗺️ Mapa de Arquitectura y Stack Tecnológico

La plataforma está construida sobre una arquitectura de **SaaS Multi-Tenant** (aislamiento lógico por cliente), permitiendo que múltiples agencias utilicen la misma infraestructura manteniendo sus datos estrictamente aislados:

```
[ Frontend: React 18 + Vite ] (UI Premium Mediterranean Luxury)
             │
             ▼ (Peticiones HTTPS Cifradas con JWT Bearer Token)
[ Backend: Node.js 20 + Express.js ]
  ├── [ Prisma ORM ] ──► [ DB Relacional: PostgreSQL (Supabase) / Fallback SQLite ]
  ├── [ Motor IA ] ──► OpenAI API (GPT-4o Text / Vision AI) + PDF-Parse + Tesseract
  ├── [ Cloud Integrations ] ──► Google Drive API + Sheets API + Supabase Storage CDN
  └── [ Meta API ] ──► WhatsApp Business API Cloud (Webhooks de entrada y salida)
```

---

## 🛠️ Desglose de Módulos Implementados y Justificación

### 1. Ingesta Documental Inteligente (Vision AI)
* **¿Qué es?:** Pipeline que recibe dossieres PDF de propietarios, extrae características, imágenes limpias y genera copys comerciales automáticos.
* **Componentes Clave:** 
  * `backend/src/services/iaService.js`: Orquestador de llamadas a OpenAI (GPT-4o + Vision) y estructuración de respuestas mediante esquemas JSON.
  * `frontend/src/utils/extractPdfPages.js`: Lógica del cliente para procesar las páginas del PDF.
  * `backend/src/routes/documentos.js`: Controladores REST de carga y parseo.
* **Flujo Lógico:**
  1. El usuario carga un dossier en PDF.
  2. El backend procesa el archivo extrayendo el texto plano mediante `pdf-parse`.
  3. El script de imágenes abre el PDF, localiza los objetos binarios de imagen incrustados (**XObjects**) y los extrae como archivos JPEG independientes a alta resolución. Si el PDF es escaneado, se ejecuta un *fallback* de renderizado de página completa.
  4. Las imágenes son subidas a **Supabase Storage CDN**. Las URLs permanentes generadas se inyectan directamente en el prompt de **GPT-4o Vision** para evitar la sobrecarga de ancho de banda y latencia de enviarlas en Base64.
  5. La IA responde con un objeto JSON tipado que detalla: número de dormitorios, baños, metros, calidades especiales (chimenea, piscina de desbordamiento, vistas al mar, domótica) y un copy redactado en el tono del lujo.
* **Valor de Negocio:** Automatiza una tarea administrativa rutinaria, reduciendo el onboarding de una propiedad de **90 minutos a menos de 3 minutos (97% de ahorro)**.

### 2. Módulo Híbrido Inmobiliario (Tres Modelos en Un Inventario)
* **¿Qué es?:** Arquitectura relacional que permite gestionar Venta, Alquiler de Larga Duración y Alquiler Vacacional de forma nativa sobre el mismo inmueble físico.
* **Componentes Clave (Prisma Models):**
  * `Propiedad`: Entidad central que contiene los metadatos físicos, georreferenciación (latitud/longitud), características de lujo, fotos y estados operativos (`DISPONIBLE`, `RESERVADO`, `VENDIDO`, `MANTENIMIENTO`).
  * `AlquilerVacacional`: Sub-modelo con campos de Licencia `ETV`, Cédula de habitabilidad, precios semanales según temporada (Alta: jun-ago, Media: may/sep/oct, Baja: resto del año), depósito de garantía y check-in/out.
  * `AlquilerLargaDuracion`: Sub-modelo que registra inquilinos, fianza en meses, renta mensual, día límite de pago y control de cobros recurrentes en la tabla `PagoRenta`.
  * `Venta`: Sub-modelo con precios públicos e internos (precios mínimos confidenciales de aceptación), comisión de agencia en %, referencia catastral y pipeline Kanban de etapas.
* **Valor de Negocio:** Permite comercializar villas en alquiler vacacional durante el verano y ofrecerlas en venta en invierno en la misma base de datos, sin duplicidad de datos.

### 3. Calendario Unificado y Channel Manager iCal (Channel Manager)
* **¿Qué es?:** Módulo que unifica las reservas de plataformas externas (Airbnb, Booking.com, MioWeb) con el motor de reservas directas de la agencia en una sola cuadrícula mensual.
* **Componentes Clave:** 
  * `backend/src/services/icalCron.js`: Tarea en background (CRON) que consume periódicamente las URLs de iCal (`.ics`) configuradas para cada villa en la tabla `AlquilerVacacional`.
  * `backend/src/routes/ical.js`: API para sincronizaciones manuales o inmediatas.
  * `ReservaExterna` (Prisma Model): Modelo para almacenar IDs únicos de reserva del canal origen, previniendo duplicados de sincronización.
* **Valor de Negocio:** Elimina por completo las dobles reservas (el mayor riesgo reputacional del sector vacacional) y permite responder llamadas de clientes filtrando disponibilidad instantáneamente.

### 4. Escuadrón de Agentes Autónomos de IA
* **¿Qué es?:** Suite de bots inteligentes que automatizan los flujos de comunicación y operaciones diarias.
* **Los Agentes:**
  * **AI Inbound (WhatsApp Bot):** Escucha el webhook de la API de Meta Business, analiza el texto del cliente en lenguaje natural, consulta el inventario del CRM, propone villas con fotos/precios y guarda la ficha del lead calificado en el CRM.
  * **AI Outbound:** Asistente generador de guiones comerciales para llamadas en base al perfil del lead.
  * **AI Captador (Scraping):** Rastreador en background que busca propiedades particulares en Idealista y Fotocasa, extrayendo datos de contacto para alertar a los agentes.
  * **AI Setter:** Agente de citas autónomo sincronizado con calendarios locales de los agentes. Envía recordatorios por WhatsApp 24h y 2h antes de las visitas.
  * **AI Closer Legal:** Asistente que analiza contratos en PDF frente a la Ley de Arrendamientos Urbanos (LAU) para alertar de riesgos, y redacta borradores de contratos de arras y alquileres.
* **Valor de Negocio:** Multiplica la fuerza comercial y operativa de agencias boutique pequeñas sin contratar personal adicional.

---

## 🗄️ Detalle de Base de Datos (Esquema Prisma)

A continuación se detalla la estructura lógica de las principales tablas relacionales de la base de datos de producción:

| Modelo | Propósito Principal | Campos Clave | Relaciones |
| :--- | :--- | :--- | :--- |
| **`Agencia`** | Multi-Tenancy. Identidad del cliente del SaaS. | `id`, `nombre`, `plan` (STARTER/PRO/ELITE), `estado` (ACTIVA/SUSPENDIDA) | Usuarios, Propiedades, Clientes, Configuración. |
| **`Usuario`** | Agentes y directores de la agencia. | `id`, `email`, `passwordHash`, `rol` (SUPERADMIN/DIRECTOR/AGENTE) | Pertenece a una `Agencia`. Gestiona `Propiedades` y `Tareas`. |
| **`Propiedad`** | Ficha física central del inmueble. | `id`, `referencia`, `nombre`, `fotos` (JSON string de URLs CDN) | Vinculada a un `Propietario`, un `Agente` de ventas y una `Agencia`. |
| **`AlquilerVacacional`**| Especificaciones para corta estancia. | `id`, `licenciaETV`, `preciosTemporadaAlta/Media/Baja` | Relación 1:1 con `Propiedad`. Contiene múltiples `Reservas`. |
| **`Reserva`** | Bloqueo de fechas vacacionales directas. | `id`, `clienteNombre`, `fechaEntrada`, `fechaSalida`, `precioTotal` | Vinculada a `AlquilerVacacional`. |
| **`AlquilerLargaDuracion`**| Arrendamientos a largo plazo. | `id`, `inquilinoNombre`, `rentaMensual`, `fechaVencimiento` | Relación 1:1 con `Propiedad`. Contiene múltiples `PagoRenta`. |
| **`Venta`** | Registro de activos para compraventa. | `id`, `precioVenta`, `precioMinimo`, `etapaPipeline` (CAPTACION...ESCRITURA) | Relación 1:1 con `Propiedad`. |
| **`Cliente`** | Leads en embudo de ventas y WhatsApp. | `id`, `nombre`, `presupuesto`, `scoreIA`, `estado` (NUEVO, VISITA...) | Pertenece a `Agencia`. Mensajes de WhatsApp y actividades. |
| **`MensajeWhatsApp`**| Historial de chats con Meta API. | `id`, `clienteId`, `rol` (usuario/agente), `contenido` | Vinculado a `Cliente`. |
| **`ConfiguracionAgencia`**| Configuración de Marca Blanca de la agencia. | `id`, `colorPrincipal` (HEX), `logoUrl`, `watermarkUrl`, `nombreComercial` | Relación 1:1 con `Agencia`. |

---

## 📡 Catálogo de Endpoints de la API (Routing REST)

El backend de Express expone una API estructurada y protegida por políticas de autenticación y límites de tráfico:

### Módulo de Autenticación y Cuentas (`backend/src/routes/auth.js`)
* `POST /api/auth/google` — Autenticación federada (SSO) mediante Google OAuth 2.0.
* `POST /api/auth/dev-login` — Acceso de desarrollo sin contraseña (omisión segura de autenticación en entornos locales).
* `POST /api/auth/refresh` — Renovación del token de sesión JWT utilizando un refresh token persistente en cookies seguras.

### Módulo de Gestión Inmobiliaria (`backend/src/routes/propiedades.js`)
* `GET /api/propiedades` — Listado paginado y filtrado de inmuebles (filtro por tipo, estado, precio y zona).
* `POST /api/propiedades` — Creación manual de un inmueble (requiere autenticación).
* `GET /api/propiedades/:id` — Ficha técnica ampliada con información de propietarios y sub-modelos de venta/vacacional.
* `PUT /api/propiedades/:id` — Edición de datos y actualización de la galería de fotos.
* `DELETE /api/propiedades/:id` — Borrado lógico (Soft delete) marcando el campo `activo` a `false`.

### Módulo Documental e IA (`backend/src/routes/documentos.js`)
* `POST /api/documentos/upload` — Sube un archivo PDF al backend, lo sincroniza con Google Drive y lo enruta al servicio OCR + GPT-4o Vision.
* `GET /api/documentos/propiedad/:propiedadId` — Historial de dossiers adjuntos a una propiedad.

### Módulo de Portales Inmobiliarios (`backend/src/routes/portales.js`)
* `GET /api/portales/config` — Obtiene las claves de conexión configuradas para cada portal.
* `POST /api/portales/publicar` — Encola una tarea asíncrona para publicar una propiedad en portales asociados.
* `POST /api/portales/despublicar` — Despublica y desvincula el anuncio de los portales.
* `GET /api/portales/feed?portal=:portalName` — Endpoint público protegido por token secreto que expone el feed XML dinámico (Idealista, Fotocasa, Kyero) o JSON (James Edition).

---

## 🎨 Especificaciones del Front-end y Marca Blanca

El frontend se ha diseñado bajo los principios de la paleta de colores **Mediterranean Luxury**, orientada al mercado boutique de lujo:

* **Paleta de Colores de Marca:**
  * Primario / Deep Navy: `#0D1B2A` (Usado en sidebar, barras de navegación y encabezados).
  * Secundario / Mediterranean: `#1A3A5C` (Botones de acción principal y llamadas a la acción).
  * Acento / Warm Gold: `#C9A84C` (Destacados, etiquetas premium e indicadores de calidad).
  * Fondo / Pearl White: `#F5F0E8` (Color sutil de fondo y tarjetas limpias).
* **Mecanismo de Marca Blanca (CSS Variables):**
  La aplicación inyecta variables nativas de CSS en el DOM en tiempo de carga (`frontend/src/context/AgencyContext.jsx`):
  ```javascript
  const root = document.documentElement;
  root.style.setProperty('--mediterranean', agencia.configuracion.colorPrincipal || '#1A3A5C');
  ```
  Esto permite que toda la interfaz se adapte al color corporativo de la agencia de forma instantánea sin necesidad de recargar ni compilar estilos de nuevo.

---

## 🛡️ Políticas de Seguridad y Cumplimiento

1. **Cifrado de Datos en Reposo (Prisma Middleware):**
   Los campos críticos (`iban`, `nif`) se cifran antes de ser escritos en PostgreSQL mediante algoritmos simétricos (AES-256-GCM) y se descifran en tiempo de lectura, garantizando la privacidad de los propietarios.
2. **Registro de Auditoría (Audit Log):**
   Cada lectura, descarga de facturas o alteración de datos genera un log persistido en la tabla `AuditLog`, indicando IP, usuario responsable, timestamp e identificador de entidad.
3. **Limitación de Peticiones (Rate Limiting):**
   Las APIs del backend están protegidas contra ataques de denegación de servicio (DoS) y abusos de scraping mediante un límite de **500 peticiones por cada 15 minutos** por dirección IP (`express-rate-limit`).

---

## 📈 Historial de Pasos y Evolución del CRM

A lo largo del ciclo de vida del proyecto se han completado los siguientes hitos de implementación:

1. **Definición de Base de Datos y Multi-Tenant (Mayo 2026):**
   * Creación del modelo relacional en Prisma. El concepto clave es la vinculación del campo `agenciaId` a todas las entidades (usuarios, propiedades, clientes, facturas, actividades). Esto garantiza que la información de cada agencia esté aislada de forma lógica y segura.
2. **Sistema de Autenticación de Doble Vía (Mayo 2026):**
   * Integración de inicio de sesión con Google OAuth (para acceso seguro corporativo) y botón de Acceso de Desarrollo sin contraseña (Mock con superadmin bypass para agilizar pruebas).
3. **Módulo IA Documental y Corrección de CORS en Drive (Junio 2026):**
   * Implementación de la lectura de PDFs. Inicialmente daba problemas de CORS en las imágenes debido al almacenamiento exclusivo en Drive; se corrigió creando un **mecanismo de fallback local** que descarga las fotos al backend (`/api/uploads`) y sincroniza con Drive en segundo plano.
4. **Feeds de Sindicación XML para Portales (Junio 2026):**
   * Generación dinámica de feeds compatibles con los portales inmobiliarios líderes en España (Idealista, Fotocasa y Kyero XML), y portales mundiales de ultra-lujo (James Edition JSON) mediante mapeo de atributos estructurados de calidades detectadas por IA.
5. **Estabilización de Bucles de Redirección (Junio 2026 - Reciente):**
   * Corrección de un problema crítico de recarga en el frontend. Las páginas públicas o de login que cargaban configuraciones (como el color o el logo) eran rechazadas con código HTTP 401 por falta de token JWT, lo que forzaba una redirección a `/login`. Al estar en la misma página de login, se provocaba un bucle infinito que congelaba la aplicación. Se solucionó permitiendo la consulta de configuraciones sin JWT para renderizar la marca blanca pública y controlando que no se redirigiera al usuario si ya se encontraba en el formulario de inicio de sesión.
6. **Pitch Deck Corporativo (Hoy):**
   * Creación y generación del script [generate_pptx.js](file:///Users/robert/Desktop/Neural_CRM_Pitch/generate_pptx.js) que estructura una presentación ejecutiva de 18 diapositivas con el plan comercial y técnico de la marca para atraer inversores o socios distribuidores.
