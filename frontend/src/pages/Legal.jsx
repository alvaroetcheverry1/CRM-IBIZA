/**
 * Legal.jsx — Páginas legales públicas (Términos, Privacidad, Cookies).
 * Una sola página que muestra el documento según la ruta /legal/:doc.
 *
 * NOTA: Los textos son borradores pendientes de revisión por un abogado. El contenido
 * definitivo debe sustituir a estos placeholders antes de operar en producción.
 */
import { useParams, Link } from 'react-router-dom';

const BRAND = 'SYNNER';
const anio = new Date().getFullYear();

const DOCS = {
  terminos: {
    titulo: 'Términos y Condiciones de Servicio',
    secciones: [
      ['1. Prestador y objeto', `${BRAND} es una plataforma SaaS de gestión inmobiliaria (CRM) para agencias (alquiler vacacional, larga duración y venta). Estos Términos regulan su uso por profesionales; el servicio no está dirigido a consumidores. Titular: [RAZÓN SOCIAL], CIF [CIF], [DIRECCIÓN].`],
      ['2. Alta y cuenta', 'Toda cuenta de agencia queda pendiente hasta que SYNNER la active, y puede rechazarse de forma motivada. El Cliente garantiza la veracidad de sus datos, custodia sus credenciales y responde de la actividad de sus usuarios. Cada agencia está aislada de las demás.'],
      ['3. Planes y pago', 'Core 199 €/mes, Intelligence 399 €/mes y Autonomous 599 €/mes, más IVA. Pago anual con 15 % de descuento. Sin permanencia, con renovación automática hasta su cancelación. Pagos procesados por Stripe; no almacenamos datos completos de tarjeta. Se puede cancelar en cualquier momento y el servicio sigue activo hasta el fin del periodo pagado. Los cambios de precio se avisan con 30 días de antelación.'],
      ['4. Impago y suspensión', 'Por impago o cancelación la agencia pasa a estado suspendida (acceso bloqueado, datos conservados). SYNNER puede suspender o resolver el servicio por incumplimiento grave, uso ilícito o riesgo para la seguridad.'],
      ['5. Uso aceptable', 'Está prohibido usar el servicio con fines ilícitos, acceder a datos de otras agencias, eludir medidas de seguridad, hacer ingeniería inversa, revender el acceso o introducir datos personales sin base legal. Las credenciales de integraciones (WhatsApp, Google) las aporta y gestiona el Cliente.'],
      ['6. Inteligencia artificial', 'Las funciones de IA asisten al usuario y pueden contener errores. El Cliente debe revisar los resultados antes de usarlos o publicarlos. No constituyen asesoramiento jurídico, fiscal ni de valoración.'],
      ['7. Datos y protección de datos', 'Los datos introducidos son del Cliente. Respecto de los datos personales de propietarios, clientes y leads, el Cliente es responsable del tratamiento y SYNNER es encargado, conforme al Contrato de Encargado de Tratamiento, que forma parte de estos Términos. Medidas: cifrado en tránsito y en reposo de campos sensibles, control de acceso por roles y registro de auditoría.'],
      ['8. Disponibilidad y soporte', 'SYNNER procura la disponibilidad continua del servicio sin garantizarla de forma ininterrumpida. El plan Autonomous tiene un objetivo de disponibilidad del 99,9 % mensual, excluidos mantenimientos programados y causas ajenas. Soporte: [CANAL Y HORARIO].'],
      ['9. Terminación y datos', 'Tras la baja, los datos se conservan [30] días para su exportación y después se suprimen, salvo obligación legal de conservación.'],
      ['10. Propiedad intelectual', `El software, la marca ${BRAND} y sus contenidos son titularidad del prestador. Se concede al Cliente una licencia limitada, no exclusiva e intransferible mientras dure el contrato.`],
      ['11. Responsabilidad', 'El servicio se presta con la diligencia profesional exigible. SYNNER no responde de datos incorrectos del Cliente, de decisiones basadas en resultados de IA, de fallos de terceros ni de daños indirectos. Su responsabilidad total se limita, salvo dolo o culpa grave, a lo pagado en los [12] meses anteriores.'],
      ['12. Modificaciones', 'Los cambios sustanciales se comunican con 30 días de antelación; el Cliente puede cancelar antes de su entrada en vigor.'],
      ['13. Ley y jurisdicción', 'Legislación española. Tribunales de [Eivissa / Palma — por confirmar].'],
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    secciones: [
      ['1. Responsable', 'Responsable: [RAZÓN SOCIAL], CIF [CIF], [DIRECCIÓN]. Contacto de privacidad: [EMAIL].'],
      ['2. Doble rol', `Para los datos de la cuenta de la agencia y sus usuarios, ${BRAND} es responsable del tratamiento. Para los datos de propietarios, clientes, inquilinos y leads que la agencia introduce, ${BRAND} es encargado y la agencia es la responsable. Si eres cliente o propietario de una agencia, dirige tus solicitudes de derechos a ella.`],
      ['3. Datos que tratamos', 'De agencias y usuarios: identificación y contacto, datos de la agencia y de facturación, credenciales (contraseña con hash), plan y estado de suscripción (identificadores de Stripe, sin número de tarjeta) y registros de uso y auditoría. Como encargado: datos de propietarios, clientes e inquilinos (incluidos NIF e IBAN, cifrados en reposo), documentos, facturas y comunicaciones.'],
      ['4. Finalidades y base jurídica', 'Prestación del servicio y gestión de la cuenta (ejecución del contrato); facturación y obligaciones fiscales (contrato y obligación legal); seguridad, prevención de fraude y auditoría (interés legítimo). No se toman decisiones automatizadas con efectos jurídicos.'],
      ['5. Destinatarios y subencargados', 'Supabase (base de datos y archivos, UE), Render y Vercel (alojamiento), Stripe (pagos), OpenAI (análisis de documentos con IA), proveedor de email y, solo si el Cliente los activa, Google y Meta (WhatsApp). No vendemos datos personales.'],
      ['6. Transferencias internacionales', 'Cuando un proveedor trata datos fuera del Espacio Económico Europeo, se apoya en una decisión de adecuación o en cláusulas contractuales tipo de la Comisión Europea.'],
      ['7. Conservación', 'Los datos de cuenta, mientras esté activa. Tras la baja, [30] días para exportación y después supresión. Los datos de facturación, durante los plazos mercantiles y fiscales (mínimo 6 años).'],
      ['8. Derechos', 'Acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del consentimiento, escribiendo a [EMAIL]. Plazo de respuesta: un mes. Puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).'],
      ['9. Seguridad', 'Cifrado en tránsito y en reposo de campos sensibles (AES-256-GCM), control de acceso por roles, aislamiento entre agencias, sesiones con token de 1 hora, registro de auditoría y limitación de peticiones.'],
      ['10. Menores', 'El servicio es profesional y no está dirigido a menores.'],
    ],
  },
  dpa: {
    titulo: 'Contrato de Encargado del Tratamiento',
    secciones: [
      ['1. Partes y objeto', `Responsable: la agencia que contrata el servicio. Encargado: ${BRAND} ([RAZÓN SOCIAL]). ${BRAND} trata datos personales por cuenta de la agencia solo para prestar el CRM contratado (art. 28 RGPD).`],
      ['2. Tratamiento', 'Interesados: propietarios, clientes, inquilinos, huéspedes, leads y usuarios de la agencia. Datos: identificación, contacto, NIF, datos económicos, inmuebles, documentos, notas y mensajes. No se deben introducir categorías especiales de datos.'],
      ['3. Obligaciones de SYNNER', 'Tratar los datos solo según instrucciones documentadas del Cliente; garantizar la confidencialidad del personal; aplicar medidas de seguridad del art. 32 RGPD (cifrado, control de acceso, aislamiento por agencia, auditoría); asistir al Cliente con los derechos de los interesados y las evaluaciones de impacto; notificar brechas sin dilación indebida y como máximo en 48 horas; y permitir auditorías.'],
      ['4. Obligaciones del Cliente', 'Contar con base jurídica para los datos que introduce, informar a los interesados, dar instrucciones lícitas, gestionar sus usuarios y credenciales, y responder a las solicitudes de derechos.'],
      ['5. Subencargados', 'El Cliente autoriza con carácter general a Supabase, Render, Vercel, OpenAI, Stripe, el proveedor de email y, si los activa, Google y Meta. SYNNER avisará con 30 días de antelación de cualquier alta o sustitución, y el Cliente podrá oponerse por motivos fundados. SYNNER impone a los subencargados obligaciones equivalentes.'],
      ['6. Transferencias internacionales', 'Solo con garantías adecuadas: decisión de adecuación o cláusulas contractuales tipo.'],
      ['7. Devolución y supresión', 'Al terminar el servicio, los datos se ponen a disposición del Cliente [30] días para su exportación y después se suprimen, salvo obligación legal de conservación. A petición, SYNNER certifica la supresión.'],
      ['8. Auditoría', 'Una vez al año, con 30 días de preaviso, sin perjudicar la actividad ni los datos de otros clientes.'],
      ['9. Ley y jurisdicción', 'Legislación española. Autoridad de control: Agencia Española de Protección de Datos. Se acepta electrónicamente en el registro.'],
    ],
  },
  cookies: {
    titulo: 'Política de Cookies',
    secciones: [
      ['1. Qué son', 'Pequeños archivos que se almacenan en el navegador para el funcionamiento del sitio.'],
      ['2. Cookies que utilizamos', 'Técnicas/necesarias: almacenamiento local para la sesión (token de acceso y refresco), imprescindibles para iniciar sesión. Stripe puede establecer cookies propias durante el pago.'],
      ['3. Gestión', 'Si se incorporan cookies no esenciales (analítica), se solicitará consentimiento conforme a la guía de la AEPD.'],
      ['4. Cómo desactivarlas', 'Puedes borrar o bloquear cookies desde tu navegador; deshabilitar las técnicas puede impedir el inicio de sesión.'],
    ],
  },
};

export default function Legal() {
  const { doc } = useParams();
  const data = DOCS[doc] || DOCS.terminos;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '3rem 1.25rem' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', background: 'white', borderRadius: 16, padding: '2.5rem', boxShadow: '0 10px 40px rgba(13,27,42,0.08)' }}>
        <Link to="/" style={{ color: '#1A3A5C', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>← Volver</Link>
        <div style={{ marginTop: '1rem', borderBottom: '2px solid #C9A84C', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 700 }}>{BRAND}</div>
          <h1 style={{ margin: '0.25rem 0 0', color: '#0D1B2A', fontFamily: 'Playfair Display, serif' }}>{data.titulo}</h1>
          <p style={{ color: '#8A9BB0', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Última actualización: {anio}</p>
        </div>

        <div style={{ marginTop: '1.5rem', color: '#334155', lineHeight: 1.7 }}>
          {data.secciones.map(([titulo, texto], i) => (
            <section key={i} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', color: '#1A3A5C', marginBottom: '0.4rem' }}>{titulo}</h2>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>{texto}</p>
            </section>
          ))}
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <Link to="/legal/terminos" style={{ color: '#1A3A5C' }}>Términos</Link>
          <Link to="/legal/privacidad" style={{ color: '#1A3A5C' }}>Privacidad</Link>
          <Link to="/legal/cookies" style={{ color: '#1A3A5C' }}>Cookies</Link>
          <Link to="/legal/dpa" style={{ color: '#1A3A5C' }}>Encargado de tratamiento</Link>
        </div>
      </div>
    </div>
  );
}
