> ⚠️ **BORRADOR v2 — PENDIENTE DE REVISIÓN POR ABOGADO.** Redactado a partir del
> funcionamiento real de SYNNER. No es asesoramiento jurídico. Los campos `[CORCHETES]`
> son datos de la empresa o decisiones que debe confirmar la titular / el abogado.

# Términos y Condiciones de Servicio — SYNNER

**Versión:** 2.0 · **Última actualización:** [FECHA]

## 1. Identificación del prestador
- Titular: [RAZÓN SOCIAL] ("SYNNER", "nosotros")
- NIF/CIF: [CIF] · Domicilio: [DIRECCIÓN] · Registro Mercantil: [DATOS, si procede]
- Contacto: [EMAIL DE SOPORTE] · Web: https://crm-ibiza.vercel.app (provisional)

## 2. Objeto y ámbito
SYNNER es una plataforma SaaS de gestión inmobiliaria (CRM) para agencias, que cubre
alquiler vacacional, alquiler de larga duración y venta. Estos Términos regulan el
acceso y uso del servicio por parte de **profesionales** (agencias inmobiliarias y sus
usuarios). El servicio **no está dirigido a consumidores**; el Cliente declara actuar
en el ámbito de su actividad empresarial o profesional.

## 3. Definiciones
- **Cliente**: la agencia que contrata el servicio.
- **Usuarios**: personas autorizadas por el Cliente (roles Director, Agente Senior,
  Agente, Backoffice).
- **Datos del Cliente**: toda la información que el Cliente o sus Usuarios introducen
  en la plataforma (propiedades, propietarios, clientes, documentos, facturas, etc.).

## 4. Alta, cuenta y aprobación
1. El Cliente crea una cuenta de agencia aceptando estos Términos, la Política de
   Privacidad y la Política de Cookies.
2. Toda cuenta queda **pendiente** hasta que SYNNER la active. SYNNER puede rechazar
   un alta de forma motivada (p. ej. datos falsos o actividad no profesional).
3. El Cliente garantiza la veracidad de los datos, mantiene la confidencialidad de las
   credenciales y responde de la actividad de sus Usuarios. Debe avisar sin demora de
   cualquier acceso no autorizado.
4. Cada cuenta de agencia está aislada de las demás (aislamiento multi-tenant).

## 5. Planes, precios y pago
1. Planes: **CORE 199 €/mes**, **INTELLIGENCE 399 €/mes**, **AUTONOMOUS 599 €/mes**.
   Pago anual con un **15 % de descuento** (CORE 2.030 €, INTELLIGENCE 4.070 €,
   AUTONOMOUS 6.110 €/año). Todos los precios **+ IVA** aplicable.
2. **Sin permanencia.** Suscripción de renovación automática por el periodo contratado
   (mensual o anual) hasta que se cancele.
3. Pagos gestionados por **Stripe**. SYNNER no almacena datos completos de tarjeta.
4. **Cancelación:** el Cliente puede cancelar en cualquier momento desde Configuración →
   Suscripción (portal de Stripe). El servicio sigue activo hasta el final del periodo
   ya pagado; no se prorratean ni reembolsan periodos en curso, salvo obligación legal
   o decisión comercial de SYNNER. [CONFIRMAR POLÍTICA DE REEMBOLSOS]
5. **Impago o cancelación:** la agencia pasa a estado **SUSPENDIDA** (acceso bloqueado,
   datos conservados según la cláusula 11).
6. **Cambios de precio:** SYNNER puede modificar precios con **30 días de preaviso**
   por email; el Cliente puede cancelar antes de que entren en vigor.
7. Facturas emitidas electrónicamente al email de facturación del Cliente.

## 6. Uso aceptable
El Cliente y sus Usuarios se comprometen a:
- No usar el servicio para fines ilícitos, fraudulentos o contrarios a derechos de terceros.
- Introducir datos personales **solo con base legal adecuada** y cumpliendo el RGPD
  (el Cliente es el responsable de esos datos; ver cláusula 9 y el Contrato de
  Encargado de Tratamiento).
- No intentar acceder a datos de otras agencias, eludir medidas de seguridad, hacer
  ingeniería inversa, ni sobrecargar el servicio (se aplican límites de uso).
- No revender ni ceder el acceso a terceros sin autorización escrita.
- Usar los canales de mensajería (WhatsApp, email) cumpliendo la normativa
  aplicable y las políticas del proveedor (p. ej. Meta). Las credenciales de WhatsApp
  son aportadas y gestionadas por el Cliente.

## 7. Funciones de Inteligencia Artificial
- SYNNER usa IA (p. ej. OpenAI) para analizar documentos y generar sugerencias o textos.
- La IA puede cometer errores. El sistema deja a `null` los datos que no figuran en el
  documento, pero **el Cliente debe revisar** el resultado antes de usarlo o publicarlo.
- Los resultados de IA son una ayuda, no asesoramiento jurídico, fiscal ni de valoración.

## 8. Integraciones y servicios de terceros
El servicio puede conectarse con servicios de terceros (Google Drive/Sheets, WhatsApp
Business, portales inmobiliarios, Stripe). Su uso está sujeto a los términos de esos
terceros. SYNNER no responde de interrupciones o cambios ajenos a su control.

## 9. Datos del Cliente y protección de datos
1. **Los Datos del Cliente son del Cliente.** SYNNER no adquiere derechos sobre ellos
   más allá de lo necesario para prestar el servicio.
2. Respecto de los datos personales de propietarios, clientes y leads que el Cliente
   introduce, el Cliente es **responsable del tratamiento** y SYNNER **encargado del
   tratamiento**. Se regula en el **Contrato de Encargado de Tratamiento (DPA)**, que
   forma parte de estos Términos y se acepta al registrarse.
3. Respecto de los datos de la cuenta y facturación, SYNNER es responsable (ver
   Política de Privacidad).
4. Seguridad: cifrado en tránsito, cifrado en reposo de campos sensibles (NIF, IBAN,
   CIF), control de acceso por roles y registro de auditoría. Ninguna medida elimina
   todo riesgo; SYNNER aplica las medidas adecuadas conforme al estado de la técnica.
5. Copias y exportación: el Cliente puede solicitar la exportación de sus datos durante
   la vigencia del contrato y hasta el plazo de la cláusula 11.

## 10. Disponibilidad, soporte y mantenimiento
- SYNNER se esfuerza por mantener el servicio disponible de forma continua, sin
  garantizarlo de forma ininterrumpida ni libre de errores.
- Plan **AUTONOMOUS**: objetivo de disponibilidad mensual del **99,9 %**, excluyendo
  mantenimientos programados (avisados con antelación razonable), fuerza mayor y causas
  imputables al Cliente o a terceros. [DEFINIR COMPENSACIÓN POR INCUMPLIMIENTO, si la hay]
- Soporte por [CANAL] en horario [HORARIO]. [TIEMPOS DE RESPUESTA POR PLAN]
- Versión de prueba o entornos gratuitos de infraestructura pueden implicar
  arranques lentos puntuales; no constituyen incumplimiento.

## 11. Terminación y conservación de datos
1. El Cliente puede cancelar en cualquier momento (cláusula 5.4).
2. SYNNER puede suspender o resolver el servicio por: impago, incumplimiento grave de
   estos Términos, uso ilícito o riesgo para la seguridad, previa comunicación salvo
   urgencia justificada.
3. Tras la terminación, SYNNER conserva los Datos del Cliente **[30] días** para que
   pueda exportarlos; después los suprime o anonimiza, salvo obligación legal de
   conservación. Los datos de facturación propios se conservan los plazos fiscales.
   [CONFIRMAR PLAZO]

## 12. Propiedad intelectual
El software, la marca SYNNER, el diseño y los contenidos son titularidad de [RAZÓN
SOCIAL] o sus licenciantes. Se concede al Cliente una licencia **limitada, no
exclusiva, intransferible y revocable** de uso durante la vigencia del contrato. El
Cliente conserva la propiedad de sus Datos y concede a SYNNER licencia para tratarlos
únicamente para prestar el servicio.

## 13. Garantías y limitación de responsabilidad
1. El servicio se presta "tal cual", con la diligencia profesional exigible.
2. SYNNER no responde de: datos incorrectos introducidos por el Cliente, decisiones
   comerciales basadas en el servicio o en resultados de IA, fallos de terceros
   (Stripe, Meta, Google, proveedores de infraestructura), ni lucro cesante o daños
   indirectos.
3. La responsabilidad total de SYNNER frente al Cliente se limita, salvo dolo o culpa
   grave o lo que la ley no permita limitar, a **las cantidades pagadas por el Cliente
   en los [12] meses anteriores** al hecho causante. [CONFIRMAR CAP]
4. El Cliente mantendrá indemne a SYNNER frente a reclamaciones de terceros derivadas de
   datos introducidos sin base legal o de un uso contrario a estos Términos.

## 14. Fuerza mayor
Ninguna parte responde por incumplimientos causados por hechos fuera de su control
razonable (caídas de proveedores, ciberataques pese a medidas razonables, desastres,
disposiciones de autoridad, etc.).

## 15. Modificaciones
SYNNER puede actualizar estos Términos. Los cambios sustanciales se comunicarán por
email o en la aplicación con **30 días** de antelación. Si el Cliente no está
conforme, puede cancelar antes de su entrada en vigor; seguir usando el servicio
implica aceptación.

## 16. Comunicaciones y cesión
Las comunicaciones se harán al email del Cliente registrado. SYNNER puede ceder el
contrato en caso de reestructuración o venta de negocio, notificándolo al Cliente. El
Cliente no puede ceder sin consentimiento escrito.

## 17. Ley aplicable y jurisdicción
Legislación española. Las partes se someten a los juzgados y tribunales de
**[Eivissa / Palma de Mallorca — CONFIRMAR]**, con renuncia a cualquier otro fuero,
salvo norma imperativa en contrario.

## 18. Cláusula de nulidad parcial
Si alguna cláusula fuese nula, el resto seguirá vigente.
