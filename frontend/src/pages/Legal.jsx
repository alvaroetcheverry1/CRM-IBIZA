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
    titulo: 'Términos y Condiciones de Uso y Contratación',
    secciones: [
      ['1. Prestador', `${BRAND} es titularidad de INMOCHATIA, SOCIEDAD LIMITADA (NIF B27678515), Carrer del Flamenc, 19, 07817, Sant Josep de sa Talaia, Ibiza, Illes Balears. Contacto: info@synner.tech.`],
      ['2. Objeto y ámbito', 'Plataforma SaaS de CRM, automatización e inteligencia artificial para el sector inmobiliario (vacacional, larga duración y venta). Dirigida exclusivamente a profesionales y empresas; no es un servicio de consumo doméstico.'],
      ['3. Alta y cuenta', 'El registro requiere datos veraces y queda sujeto a revisión y activación. INMOCHATIA puede rechazar o suspender altas por motivos razonables (datos falsos, suplantación, actividad ilícita, riesgos de seguridad o uso no profesional). El Cliente custodia sus credenciales y responde de la actividad de sus usuarios.'],
      ['4. Planes y precios', 'CORE 199 €/mes, INTELLIGENCE 399 €/mes y AUTONOMOUS 599 €/mes, más IVA. Pago anual con 15 % de descuento (2.030 / 4.070 / 6.110 €/año). Renovación automática, sin permanencia.'],
      ['5. Pagos y cancelación', 'Pago por adelantado, con cargos recurrentes autorizados, mediante Stripe u otro proveedor. La cancelación impide la renovación del siguiente periodo pero no genera reembolso proporcional del periodo ya abonado, salvo que la ley lo exija. En caso de impago se puede suspender el acceso. Los precios se modifican con 30 días de preaviso.'],
      ['6. Uso aceptable y licencia', 'Se concede una licencia limitada, no exclusiva, intransferible y revocable para uso profesional. Prohibido el uso ilícito, acceder a datos de otras agencias, eludir la seguridad, hacer ingeniería inversa, revender el acceso, extraer componentes para crear productos competidores o introducir datos sin base legal.'],
      ['7. Propiedad de los datos', 'Los datos y contenidos que el Cliente incorpora son suyos. INMOCHATIA solo los aloja y procesa para prestar el servicio y no los usa para captar negocio, vender bases de datos ni competir con el Cliente. El software, la arquitectura, los agentes y la marca SYNNER son de INMOCHATIA.'],
      ['8. Inteligencia artificial', 'SYNNER incorpora agentes de IA con tres niveles: informativo, operativo y acciones externas de especial trascendencia. Las acciones externas requieren permiso específico y confirmación humana cuando generen costes o efectos sobre terceros. Los resultados de IA pueden contener errores y el Cliente debe revisarlos. No son asesoramiento jurídico, fiscal ni de valoración. Ver el Anexo de Autorización de Agentes.'],
      ['9. Integraciones de terceros', 'SYNNER puede conectarse con correo, mensajería (WhatsApp), Google, portales, pagos y modelos de IA, sujetos a las condiciones de cada proveedor. El Cliente aporta las cuentas y autorizaciones necesarias.'],
      ['10. Disponibilidad y soporte', 'INMOCHATIA realiza esfuerzos razonables para mantener el servicio operativo. No se garantiza un nivel de disponibilidad determinado; cualquier SLA solo es exigible si se recoge en un anexo específico firmado.'],
      ['11. Exportación y conservación', 'Tras la baja, el Cliente dispone de 30 días naturales para exportar sus datos; después se suprimen o anonimizan, salvo obligación legal de conservación.'],
      ['12. Responsabilidad', 'El Cliente responde de la legalidad de los datos, las instrucciones, los permisos de sus agentes y las acciones de sus usuarios. Entre profesionales y en lo que la ley permita, la responsabilidad total de INMOCHATIA se limita a lo pagado en los 12 meses anteriores al hecho causante, excluido el lucro cesante y los daños indirectos. No se limita el dolo, la culpa grave no limitable ni la responsabilidad imperativa en protección de datos.'],
      ['13. Indemnidad', 'El Cliente mantendrá indemne a INMOCHATIA frente a reclamaciones de terceros derivadas de datos ilícitos, falta de base jurídica, comunicaciones no autorizadas o uso ilícito de los agentes.'],
      ['14. Modificaciones', 'Los cambios sustanciales se comunican con al menos 30 días de antelación; el Cliente puede resolver el servicio afectado antes de su entrada en vigor.'],
      ['15. Ley y jurisdicción', 'Legislación española. Con renuncia a cualquier otro fuero, las partes se someten a los Juzgados y Tribunales de Eivissa (Ibiza, Illes Balears).'],
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    secciones: [
      ['1. Responsable', 'INMOCHATIA, SOCIEDAD LIMITADA (NIF B27678515), Carrer del Flamenc, 19, 07817, Sant Josep de sa Talaia, Ibiza, Illes Balears. Contacto: info@synner.tech.'],
      ['2. Doble rol', `Para los datos de la cuenta de la agencia y sus usuarios, ${BRAND} es responsable del tratamiento. Para los datos de propietarios, clientes, inquilinos y leads que la agencia introduce, ${BRAND} es encargado y la agencia es la responsable. Si eres cliente o propietario de una agencia, dirige tus solicitudes de derechos a ella.`],
      ['3. Datos que tratamos', 'De agencias y usuarios: identificación y contacto, datos de la agencia y de facturación, credenciales protegidas, plan y estado de suscripción (identificadores de Stripe, sin número de tarjeta), registros de uso y auditoría e IP. Como encargado: datos de propietarios, clientes e inquilinos (incluidos NIF e IBAN, cifrados en reposo), documentos, facturas y comunicaciones.'],
      ['4. Finalidades y base jurídica', 'Crear y administrar cuentas, gestionar suscripciones y pagos (ejecución del contrato); facturación y obligaciones fiscales (obligación legal); seguridad y prevención del fraude (interés legítimo); comunicaciones comerciales (consentimiento u otra base válida). No se toman decisiones exclusivamente automatizadas con efectos jurídicos sin garantías.'],
      ['5. Inteligencia artificial', 'Las funciones de IA pueden analizar documentos, clasificar, generar textos y ejecutar acciones autorizadas; sus resultados deben revisarse. Cuando se usan proveedores externos de IA se transmiten solo los datos necesarios. Los datos de las agencias no se usan para entrenar modelos generales de IA por decisión propia de INMOCHATIA.'],
      ['6. Destinatarios y subencargados', 'Supabase (base de datos y archivos), Render y Vercel (alojamiento), Stripe (pagos), OpenAI (IA), proveedor de email y, solo si el Cliente los activa, Google y Meta (WhatsApp). No se venden datos personales.'],
      ['7. Transferencias internacionales', 'Cuando un proveedor trata datos fuera del Espacio Económico Europeo, se apoya en una decisión de adecuación, en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo, con medidas suplementarias cuando proceda.'],
      ['8. Conservación', 'Los datos de cuenta, mientras esté activa. Tras la baja, 30 días para exportación y después supresión o anonimización. Los datos de facturación, durante los plazos mercantiles y fiscales aplicables.'],
      ['9. Derechos', 'Acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del consentimiento, escribiendo a info@synner.tech. Puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).'],
      ['10. Seguridad', 'Comunicaciones cifradas (TLS), cifrado en reposo de campos sensibles (NIF, IBAN, CIF), control de acceso por roles, separación lógica entre agencias, registros de actividad, copias de seguridad y gestión de incidencias. Ninguna medida elimina por completo el riesgo.'],
      ['11. Menores', 'El servicio es profesional y no está dirigido a menores ni al tratamiento de categorías especiales de datos.'],
    ],
  },
  dpa: {
    titulo: 'Contrato de Encargado del Tratamiento',
    secciones: [
      ['1. Partes y objeto', `Responsable: la agencia que contrata el servicio. Encargado: ${BRAND} (INMOCHATIA, SOCIEDAD LIMITADA, NIF B27678515). ${BRAND} trata datos personales por cuenta de la agencia solo para prestar el CRM contratado (art. 28 RGPD).`],
      ['2. Tratamiento', 'Interesados: propietarios, clientes, inquilinos, huéspedes, leads y usuarios de la agencia. Datos: identificación, contacto, NIF/NIE, datos económicos y bancarios, inmuebles, contratos, documentos, mensajes y notas. El Cliente no debe introducir categorías especiales de datos.'],
      ['3. Obligaciones de SYNNER', 'Tratar los datos solo según instrucciones documentadas del Cliente; garantizar la confidencialidad del personal; aplicar medidas del art. 32 RGPD (cifrado, control de acceso, separación lógica entre agencias, registros); asistir al Cliente con los derechos de los interesados; notificar brechas sin dilación indebida; y permitir auditorías.'],
      ['4. Obligaciones del Cliente', 'Contar con base jurídica para los datos que introduce, informar a los interesados, dar instrucciones lícitas, configurar correctamente los permisos de sus agentes, gestionar sus usuarios y responder a las solicitudes de derechos.'],
      ['5. Agentes de IA', 'El Cliente autoriza a los agentes a actuar solo dentro de los niveles que active (informativo, operativo y acciones externas). Las acciones externas de especial trascendencia requieren permiso específico y, cuando generen costes o efectos sobre terceros, confirmación humana.'],
      ['6. Subencargados', 'El Cliente autoriza con carácter general a Supabase, Render, Vercel, OpenAI, Stripe, el proveedor de email y, si los activa, Google y Meta. INMOCHATIA avisa con 30 días de antelación de altas o sustituciones y el Cliente puede oponerse por motivos fundados. Se imponen a los subencargados obligaciones equivalentes.'],
      ['7. Transferencias internacionales', 'Solo con garantías adecuadas conforme al capítulo V del RGPD: decisión de adecuación, Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo.'],
      ['8. Devolución y supresión', 'Al terminar el servicio, los datos se ponen a disposición del Cliente 30 días naturales para su exportación y después se suprimen o anonimizan, salvo obligación legal de conservación. Las copias de seguridad se eliminan conforme a su ciclo de rotación.'],
      ['9. Auditoría y responsabilidad', 'El Cliente puede auditar una vez al año con 30 días de preaviso, sin acceso a datos de otros clientes. Cada parte responde conforme al RGPD y la LOPDGDD.'],
      ['10. Ley y jurisdicción', 'Legislación española. Autoridad de control: Agencia Española de Protección de Datos. Juzgados y Tribunales de Eivissa (Ibiza). Se acepta electrónicamente en el registro.'],
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
