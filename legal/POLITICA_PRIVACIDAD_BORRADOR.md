> ⚠️ **BORRADOR v2 — PENDIENTE DE REVISIÓN POR ABOGADO (RGPD / LOPDGDD).** Redactado a
> partir del funcionamiento real de SYNNER. No es asesoramiento jurídico. Los campos
> `[CORCHETES]` deben completarse o confirmarse.

# Política de Privacidad — SYNNER

**Versión:** 2.0 · **Última actualización:** [FECHA]

## 1. Responsable del tratamiento
[RAZÓN SOCIAL] · CIF [CIF] · [DIRECCIÓN] · Email de privacidad: [EMAIL]
Delegado de Protección de Datos: [no designado / contacto] (valorar si es obligatorio).

## 2. Doble rol (importante)
| Datos | Rol de SYNNER |
|---|---|
| Cuenta de la agencia, usuarios, facturación, uso de la plataforma | **Responsable** del tratamiento |
| Datos de propietarios, clientes, inquilinos y leads que la agencia introduce | **Encargado** del tratamiento (por cuenta de la agencia, que es la responsable). Ver Contrato de Encargado de Tratamiento (DPA) |

Si eres cliente o propietario de una agencia que usa SYNNER, **tu responsable es esa
agencia**: dirige tus solicitudes de derechos a ella.

## 3. Datos que tratamos
**Como responsable (agencias y usuarios):**
- Identificación y contacto: nombre, email, teléfono, cargo/rol.
- Datos de la agencia: razón social, CIF, dirección, datos de facturación, logo y color.
- Credenciales: contraseña (almacenada con hash), tokens de sesión, correo recordado
  en el navegador si el usuario lo elige.
- Suscripción y pago: plan, estado, identificadores de Stripe (no almacenamos el
  número completo de tarjeta).
- Uso y seguridad: registros de actividad, auditoría y direcciones IP.

**Como encargado (introducidos por la agencia):**
- Propietarios y clientes: nombre, contacto, NIF, IBAN, preferencias, notas.
- Inquilinos y reservas: NIF, fechas, pagos, fianzas.
- Documentos, fotos, facturas y comunicaciones (incl. mensajes de WhatsApp si la
  agencia activa el bot).
Los campos NIF, IBAN y CIF se cifran en reposo.

## 4. Finalidades y bases jurídicas
| Finalidad | Base jurídica |
|---|---|
| Alta, gestión de cuenta y prestación del servicio | Ejecución del contrato (art. 6.1.b RGPD) |
| Facturación, cobro y obligaciones fiscales/contables | Contrato y obligación legal (6.1.b, 6.1.c) |
| Seguridad, prevención de fraude, auditoría | Interés legítimo (6.1.f) |
| Soporte y comunicaciones del servicio | Contrato / interés legítimo |
| Comunicaciones comerciales | Consentimiento (6.1.a), revocable [SOLO SI SE USA] |
| Aprobación manual de altas | Interés legítimo / contrato |

No se toman decisiones automatizadas con efectos jurídicos sobre personas. Las
funciones de IA asisten al usuario, que revisa el resultado.

## 5. Destinatarios y subencargados
Para prestar el servicio utilizamos los siguientes proveedores:
| Proveedor | Función | Ubicación / garantía |
|---|---|---|
| Supabase | Base de datos y almacenamiento de archivos | UE (región eu-north-1, Estocolmo) |
| Render | Alojamiento del backend | [CONFIRMAR REGIÓN] |
| Vercel | Alojamiento del frontend | Red global; [CONFIRMAR SCC/DPF] |
| Stripe | Pagos y suscripciones | UE/EE. UU.; SCC / Data Privacy Framework |
| OpenAI | Análisis de documentos con IA | EE. UU.; SCC/DPF. [CONFIRMAR retención cero / no entrenamiento] |
| Google (Drive/Sheets, login) | Solo si el Cliente lo activa | SCC/DPF |
| Meta (WhatsApp Business) | Solo si el Cliente lo activa | SCC/DPF |
| Proveedor SMTP de email | Envío de correos | [CONFIRMAR] |

Mantenemos DPA con cada proveedor. Al añadir o cambiar subencargados informaremos a
los Clientes con antelación (ver DPA, cláusula 7). No vendemos datos personales.

## 6. Transferencias internacionales
Si un proveedor trata datos fuera del Espacio Económico Europeo, se apoya en una
decisión de adecuación (p. ej. Data Privacy Framework) o en **cláusulas contractuales
tipo** de la Comisión Europea, con medidas complementarias cuando proceda.

## 7. Plazos de conservación
- Datos de cuenta: mientras la cuenta esté activa.
- Tras la baja: **[30] días** para exportación, y después supresión/anonimización de los
  Datos del Cliente (como encargado, según instrucciones del Cliente).
- Facturación y datos fiscales propios: **mínimo 6 años** (Código de Comercio) y plazos
  tributarios aplicables.
- Registros de seguridad/auditoría: [12] meses. [CONFIRMAR]
- Datos bloqueados: mientras puedan surgir responsabilidades legales.

## 8. Derechos
Puedes ejercer acceso, rectificación, supresión, oposición, limitación, portabilidad y
retirada del consentimiento escribiendo a [EMAIL], acreditando tu identidad. Responderemos
en el plazo de **un mes**. Si no estás conforme, puedes reclamar ante la **Agencia
Española de Protección de Datos** (www.aepd.es).
Para los datos introducidos por una agencia, remitiremos tu solicitud a la agencia
responsable.

## 9. Medidas de seguridad
- Cifrado en tránsito (HTTPS/TLS) y en reposo para campos sensibles (AES-256-GCM).
- Contraseñas con hash; sesiones con token de acceso de 1 h y refresco.
- Control de acceso por roles (RBAC) y aislamiento entre agencias por identificador de
  agencia.
- Registro de auditoría de acciones sensibles; limitación de peticiones (rate limiting).
- Notificación de brechas conforme al art. 33 RGPD (ver DPA).

## 10. Menores
El servicio es profesional y no está dirigido a menores de edad.

## 11. Cookies y almacenamiento local
Ver la Política de Cookies.

## 12. Cambios
Publicaremos la nueva versión y, si el cambio es sustancial, avisaremos por email o en
la aplicación.
