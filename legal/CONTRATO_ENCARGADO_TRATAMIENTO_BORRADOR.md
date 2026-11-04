> ⚠️ **BORRADOR — PENDIENTE DE REVISIÓN POR ABOGADO.** Contrato de encargo de
> tratamiento (art. 28 RGPD) entre cada agencia y SYNNER. Sustituye al antiguo
> `dpa.md` (que hacía referencia a "Neural CRM SL"). No es asesoramiento jurídico.

# Contrato de Encargado del Tratamiento (art. 28 RGPD) — SYNNER

**Responsable:** la agencia inmobiliaria que contrata el servicio, identificada en su
alta (**"el Cliente"**).
**Encargado:** [RAZÓN SOCIAL], CIF [CIF], [DIRECCIÓN] (**"SYNNER"**).
**Vigencia:** la del contrato de servicio. Se acepta electrónicamente en el registro
y forma parte de los Términos y Condiciones.

## 1. Objeto
SYNNER trata datos personales por cuenta del Cliente únicamente para prestar la
plataforma CRM contratada (gestión de propiedades, propietarios, clientes, inquilinos,
reservas, pagos, documentos, comunicaciones y funciones de IA).

## 2. Descripción del tratamiento
- **Naturaleza:** alojamiento, almacenamiento, consulta, organización, análisis asistido
  por IA, envío de comunicaciones a instancia del Cliente, copia de seguridad y supresión.
- **Categorías de interesados:** propietarios, clientes, inquilinos, huéspedes, leads y
  usuarios de la agencia.
- **Categorías de datos:** identificación y contacto, NIF, datos económicos (IBAN,
  pagos, fianzas, facturas), datos de inmuebles y contratos, documentos, notas y
  mensajes. **No se prevé tratar categorías especiales de datos**; el Cliente no debe
  introducirlas.
- **Duración:** la del servicio, más el plazo de devolución/supresión (cláusula 10).

## 3. Obligaciones de SYNNER
1. Tratar los datos **solo siguiendo instrucciones documentadas del Cliente** (este
   contrato y el uso de la plataforma), salvo obligación legal, que se comunicará al
   Cliente si la ley lo permite.
2. Avisar si considera que una instrucción infringe la normativa.
3. Garantizar la **confidencialidad** del personal autorizado.
4. Aplicar las **medidas de seguridad** del art. 32 RGPD, entre ellas:
   cifrado en tránsito; cifrado en reposo (AES-256-GCM) de NIF, IBAN y CIF; control de
   acceso por roles; aislamiento por agencia; registro de auditoría; limitación de
   peticiones; copias de seguridad gestionadas por el proveedor de base de datos.
5. No usar los datos del Cliente para fines propios ni cederlos a terceros, salvo
   subencargados autorizados.
6. **Asistir al Cliente** en el ejercicio de derechos de los interesados (trasladando
   en 5 días hábiles las solicitudes que reciba), en evaluaciones de impacto y en
   consultas con la autoridad de control.
7. **Notificar brechas de seguridad** al Cliente sin dilación indebida y, como máximo,
   en **48 horas** desde que tenga constancia, con la información disponible
   (naturaleza, datos afectados, consecuencias, medidas). [CONFIRMAR PLAZO]
8. Llevar el **registro de actividades de tratamiento** como encargado.
9. Poner a disposición del Cliente la información necesaria para demostrar el
   cumplimiento y permitir **auditorías** (cláusula 9).

## 4. Obligaciones del Cliente
1. Contar con **base jurídica** para los datos que introduce e informar a los
   interesados (art. 13/14 RGPD).
2. Dar instrucciones lícitas y no introducir categorías especiales de datos.
3. Gestionar los usuarios de su agencia, sus permisos y credenciales.
4. Responder a las solicitudes de derechos de los interesados.
5. Usar las integraciones (WhatsApp, Google, portales) conforme a la ley y a sus
   condiciones, siendo responsable de las credenciales que aporte.

## 5. Subencargados
El Cliente concede **autorización general** para los siguientes subencargados:
| Subencargado | Servicio | Ubicación |
|---|---|---|
| Supabase | Base de datos y almacenamiento | UE (Estocolmo) |
| Render | Alojamiento del backend | [CONFIRMAR] |
| Vercel | Alojamiento del frontend | [CONFIRMAR] |
| OpenAI | Análisis de documentos con IA | EE. UU. |
| Stripe | Pagos y suscripciones (datos de facturación del Cliente) | UE/EE. UU. |
| Proveedor SMTP | Envío de emails | [CONFIRMAR] |
| Google / Meta | Solo si el Cliente activa Drive/Sheets o WhatsApp | Según servicio |

SYNNER informará al Cliente de cualquier alta o sustitución con **30 días** de
antelación (email o aviso en la aplicación); el Cliente podrá oponerse por motivos
fundados y, de no haber solución, resolver el contrato. SYNNER impondrá a los
subencargados obligaciones equivalentes a las de este contrato y responderá ante el
Cliente de su cumplimiento.

## 6. Transferencias internacionales
Solo con garantías adecuadas: decisión de adecuación (p. ej. Data Privacy Framework) o
cláusulas contractuales tipo de la Comisión Europea, con medidas complementarias si
procede. El Cliente autoriza las transferencias a los subencargados de la cláusula 5.

## 7. Funciones de IA
Los documentos enviados al análisis de IA se transmiten a OpenAI únicamente para esa
función. SYNNER utilizará configuraciones que impidan el uso de esos datos para
entrenar modelos. [VERIFICAR CONDICIONES DE LA API DE OPENAI] El Cliente decide si
usa estas funciones.

## 8. Derechos de los interesados
SYNNER ofrece herramientas (consulta, edición, exportación y borrado de registros) para
que el Cliente atienda los derechos de acceso, rectificación, supresión, oposición,
limitación y portabilidad. Las entidades de negocio clave se desactivan de forma lógica
(`activo = false`); a petición del Cliente, SYNNER procederá a la supresión efectiva.

## 9. Auditoría
El Cliente puede auditar el cumplimiento una vez al año con **30 días de preaviso**,
sin perturbar la actividad ni comprometer la seguridad o datos de otros clientes, a su
coste. SYNNER podrá acreditar el cumplimiento mediante informes o certificaciones
equivalentes.

## 10. Devolución y supresión
Al terminar el servicio, SYNNER pondrá los datos a disposición del Cliente para su
exportación durante **[30] días** y después los **suprimirá** (incluidas copias), salvo
obligación legal de conservación, en cuyo caso los mantendrá bloqueados. A petición,
certificará la supresión.

## 11. Responsabilidad
Cada parte responde conforme al RGPD (arts. 82 y ss.) y a los límites de los
Términos y Condiciones, en lo que la ley permita.

## 12. Ley y jurisdicción
Ley española. Tribunales de **[Eivissa / Palma — CONFIRMAR]**. Autoridad de control
competente: Agencia Española de Protección de Datos.

## 13. Aceptación
Se entiende firmado por ambas partes al marcar el Cliente la casilla de aceptación en
el registro o al firmarse por separado. [PENDIENTE TÉCNICO: hoy el sistema NO guarda
evidencia de la aceptación (fecha, IP, versión); requiere un cambio de esquema en BD.]

**Por SYNNER:** ______________ **Por el Cliente:** ______________
