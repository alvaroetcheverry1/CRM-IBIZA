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
      ['1. Objeto', `${BRAND} es una plataforma SaaS de gestión inmobiliaria (CRM) ofrecida en modalidad de suscripción a agencias inmobiliarias. Estos términos regulan el acceso y uso del servicio.`],
      ['2. Registro y cuenta', 'El Cliente se registra creando una cuenta de agencia que queda pendiente de activación. Es responsable de la veracidad de sus datos y de la custodia de sus credenciales.'],
      ['3. Planes y precios', 'Planes disponibles: Core (199 €/mes), Intelligence (399 €/mes) y Autonomous (599 €/mes), en todos los casos + IVA. Facturación mensual o anual (con descuento), sin permanencia. Los pagos se procesan a través de Stripe.'],
      ['4. Uso aceptable', 'El Cliente se compromete a no usar la plataforma para fines ilícitos ni a introducir datos de terceros sin la base legal adecuada.'],
      ['5. Disponibilidad y soporte', 'Nivel de servicio según plan. El plan Autonomous incluye SLA 99,9%.'],
      ['6. Propiedad intelectual', `El software, la marca ${BRAND} y sus contenidos son titularidad del prestador. El Cliente conserva la propiedad de sus datos.`],
      ['7. Suspensión y terminación', 'El servicio podrá suspenderse por impago o incumplimiento de estos términos.'],
      ['8. Ley aplicable', 'Legislación española. [Jurisdicción a confirmar por asesoría legal.]'],
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    secciones: [
      ['1. Responsable del tratamiento', 'El titular de la plataforma. Datos de contacto disponibles bajo solicitud.'],
      ['2. Doble rol', `Respecto a los datos de la cuenta del Cliente, ${BRAND} actúa como responsable. Respecto a los datos que el Cliente introduce (sus propietarios y clientes), ${BRAND} actúa como encargado del tratamiento por cuenta del Cliente.`],
      ['3. Datos que tratamos', 'De la agencia: nombre, email, teléfono, datos de facturación. Introducidos por la agencia: datos de propietarios y clientes.'],
      ['4. Finalidades y base jurídica', 'Prestación del servicio (ejecución del contrato) y facturación (obligación contractual).'],
      ['5. Encargados y terceros', 'Se usan proveedores necesarios para el servicio: Supabase (BD y almacenamiento), Stripe (pagos), OpenAI (IA documental), Google y Meta (si el Cliente los activa).'],
      ['6. Conservación', 'Los datos se conservan mientras la cuenta esté activa y durante los plazos legales posteriores.'],
      ['7. Derechos', 'Acceso, rectificación, supresión, oposición, limitación y portabilidad. Los interesados finales ejercen sus derechos ante la agencia correspondiente.'],
      ['8. Seguridad', 'Cifrado en tránsito (HTTPS), control de acceso por roles, aislamiento por agencia, registro de auditoría y cifrado en reposo de campos sensibles.'],
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
        </div>
      </div>
    </div>
  );
}
