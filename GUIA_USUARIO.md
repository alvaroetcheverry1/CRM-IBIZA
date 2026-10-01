# 📘 Guía de Usuario — SYNNER CRM

Bienvenido a SYNNER, el CRM inmobiliario inteligente. Esta guía explica cómo empezar
a usar la plataforma como agencia.

---

## 1. Registro y activación

1. Entra en la web y pulsa **"Registra tu agencia"**.
2. Rellena los datos (nombre de la agencia, tu nombre, email y contraseña).
3. Tu cuenta queda **pendiente de activación**: el equipo de SYNNER la revisa y la
   activa. Recibirás un email cuando esté lista.
4. Una vez activada, entra en **/login** con tu email y contraseña.

> El primer usuario de tu agencia es el **Director**, con acceso completo.

---

## 2. Configura tu marca (marca blanca)

Ve a **Configuración**. Aquí personalizas cómo ven tus clientes la plataforma:

- **Identidad visual**: logo, color corporativo (tiñe botones y cabeceras), nombre comercial.
- **Legales y bancarios**: razón social, CIF, IBAN (para facturas).
- **WhatsApp / Integraciones**: conecta el número de WhatsApp Business de tu agencia
  (ver sección 7).
- **Equipo y usuarios**: invita a tus agentes y asigna roles.

Los catálogos públicos y el portal del propietario usan automáticamente tu logo,
color y datos de contacto.

---

## 3. Roles del equipo

| Rol | Puede |
|-----|-------|
| **Director** | Todo dentro de su agencia, incluida configuración y facturación. |
| **Agente Senior / Agente** | Gestión de propiedades, clientes, reservas, documentos. |
| **Backoffice** | Facturación y tareas administrativas. |

Cada agencia ve **solo sus propios datos**: propiedades, clientes y documentos están
aislados entre agencias.

---

## 4. Dar de alta una propiedad

Dos formas:

- **Manual**: botón "Nueva propiedad" y rellenas la ficha.
- **Con IA (recomendado)**: sube el dossier en PDF del propietario. SYNNER extrae
  las fotos, los datos (habitaciones, baños, metros, calidades) y redacta una
  descripción comercial automáticamente. Lo que no esté en el PDF se queda vacío
  (nunca se inventan datos).

Cada propiedad puede comercializarse en los tres modelos: **venta**, **alquiler
vacacional** y **larga duración**.

---

## 5. Gestión de clientes (leads)

- Da de alta leads manualmente o déjalos entrar por el bot de WhatsApp.
- Usa el **pipeline** (vista Kanban) para mover leads por estados: Nuevo → Contactado
  → Visita → Negociación → Cerrado.
- El **matchmaking IA** sugiere qué propiedades encajan con cada cliente.

---

## 6. Catálogos y propuestas

- **Catálogos**: crea una selección de propiedades y compártela por un enlace único.
  Verás cuántas veces se ha abierto.
- **Propuestas**: genera un PDF profesional con las propiedades seleccionadas para
  enviar al cliente.
- **Portal del propietario**: cada propietario tiene un enlace privado donde ve el
  estado de sus inmuebles, reservas y pagos, con tu marca.

---

## 7. WhatsApp Business (opcional)

En **Configuración → WhatsApp / Integraciones** introduce las credenciales de tu
número de WhatsApp Business (las obtienes en Meta for Developers):

- Phone Number ID
- Access Token
- Verify Token
- App Secret

Configura el webhook en Meta apuntando a `https://<tu-servidor>/api/whatsapp/webhook`.
A partir de ahí, el bot atiende a tus clientes, les propone propiedades y registra
los leads automáticamente en tu CRM.

---

## 8. Reservas y calendario (vacacional)

- Registra reservas directas o sincroniza con Airbnb/Booking vía iCal.
- El calendario unificado evita dobles reservas.

---

## 9. Portales inmobiliarios

Desde la ficha de una propiedad, botón **"Publicar en Portales"**. SYNNER genera los
feeds para Idealista, Fotocasa, Kyero y James Edition con los datos de contacto de tu
agencia.

---

## 10. Soporte

¿Dudas o incidencias? Escribe a soporte de SYNNER. Las nuevas funciones y mejoras se
publican de forma continua.
