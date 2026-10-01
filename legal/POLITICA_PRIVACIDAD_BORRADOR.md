> ⚠️ **BORRADOR — PENDIENTE DE REVISIÓN LEGAL.** Plantilla inicial, NO es
> asesoramiento jurídico. Debe revisarla un abogado especializado en protección de
> datos (RGPD / LOPDGDD) antes de publicarla. Rellenar los campos `[corchetes]`.

# Política de Privacidad — SYNNER CRM

**Última actualización:** [fecha]

## 1. Responsable del tratamiento
- Titular: [razón social] · CIF: [CIF] · Domicilio: [dirección]
- Contacto / DPO (si aplica): [email]

## 2. Doble rol en el tratamiento de datos (importante)
- Respecto a los **datos de la cuenta del Cliente** (agencia y sus usuarios), SYNNER
  actúa como **responsable del tratamiento**.
- Respecto a los **datos que el Cliente introduce en el CRM** (sus propietarios,
  clientes y leads), SYNNER actúa como **encargado del tratamiento** por cuenta del
  Cliente. Debe firmarse el **Contrato de Encargo de Tratamiento** (ver borrador aparte).

## 3. Datos que tratamos
- De la agencia: nombre, email, teléfono, datos de facturación.
- Introducidos por la agencia: datos de propietarios y clientes (nombre, contacto,
  NIF, IBAN en algunos casos), documentos y comunicaciones.

## 4. Finalidades y base jurídica
- Prestación del servicio CRM (ejecución del contrato).
- Facturación y pagos vía Stripe (obligación contractual/legal).
- [Comunicaciones comerciales: solo con consentimiento — a definir.]

## 5. Encargados y terceros (subencargados)
Se comunican datos a los proveedores necesarios para prestar el servicio:
- **Supabase** (base de datos y almacenamiento) — [ubicación/again DPA].
- **Stripe** (pagos).
- **OpenAI** (análisis documental con IA) — [revisar tratamiento de datos].
- **Google** (Drive/Sheets, si el Cliente lo activa).
- **Meta/WhatsApp** (si el Cliente activa el bot).
[El abogado debe verificar las transferencias internacionales y los DPA de cada uno.]

## 6. Conservación
Los datos se conservan mientras la cuenta esté activa y durante los plazos legales
posteriores. [Definir plazos concretos.]

## 7. Derechos de los interesados
Acceso, rectificación, supresión, oposición, limitación y portabilidad, dirigiéndose a
[email]. Los interesados finales (clientes/propietarios de una agencia) deben ejercer
sus derechos ante la agencia correspondiente (responsable).

## 8. Seguridad
Medidas técnicas y organizativas: cifrado en tránsito (HTTPS), control de acceso por
roles (RBAC), aislamiento multi-tenant por agencia, registro de auditoría.
[Pendiente: cifrado en reposo de campos sensibles como IBAN/NIF — ver roadmap.]

## 9. Cambios en la política
[Procedimiento de notificación de cambios.]
