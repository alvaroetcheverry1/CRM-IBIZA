import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { catalogosApi } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BACKEND_URL = API_URL.replace(/\/api$/, '');

function getFotoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function PublicCatalogo() {
  const { token } = useParams();
  const [catalogo, setCatalogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPropId, setExpandedPropId] = useState(null);

  useEffect(() => {
    // Cargar fuente premium Inter y Outfit
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const fetchCatalogo = async () => {
      try {
        const data = await catalogosApi.getPublic(token);
        setCatalogo(data);
      } catch (err) {
        setError(err.message || 'Error al cargar la selección.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogo();

    return () => {
      document.head.removeChild(link);
    };
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: '1.25rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '3px solid #E2E8F0', borderTopColor: '#1A3A5C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          Cargando selección privada...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '2rem', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A3A5C', marginBottom: '0.5rem' }}>Lo sentimos</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!catalogo) return null;

  const agenciaInfo = catalogo.agencia?.configuracion?.[0] || {};
  const logoUrl = agenciaInfo.logoUrl ? getFotoUrl(agenciaInfo.logoUrl) : null;
  const nombreAgencia = agenciaInfo.nombreComercial || catalogo.agencia?.nombre || 'Nuestra Agencia';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={nombreAgencia} style={{ height: '40px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A3A5C', letterSpacing: '-0.5px' }}>{nombreAgencia.toUpperCase()}</span>
            )}
          </div>
          <div>
            {agenciaInfo.whatsapp && (
              <a 
                href={`https://wa.me/${agenciaInfo.whatsapp.replace(/\D/g,'')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  padding: '10px 22px',
                  borderRadius: '30px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(37, 211, 102, 0.2)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#20BA5A'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#25D366'}
              >
                Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0F172A 100%)', color: 'white', padding: '70px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '15px', color: '#ffffff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
            {catalogo.nombre}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94A3B8', fontWeight: 300, lineHeight: '1.6', margin: 0 }}>
            Hemos preparado esta selección exclusiva de propiedades de lujo adaptadas a tus preferencias.
          </p>
        </div>
      </div>

      {/* Grid Propiedades */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 20px', width: '100%', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
          {catalogo.propiedades.map(({ propiedad }) => {
            const precioVenta = propiedad.venta?.precioVenta;
            const precioAlquiler = propiedad.alquilerVacacional?.precioTemporadaAlta || propiedad.alquilerLargaDuracion?.rentaMensual;
            const isExpanded = expandedPropId === propiedad.id;
            const photoUrl = propiedad.fotoPrincipal ? getFotoUrl(propiedad.fotoPrincipal) : null;
            
            return (
              <div 
                key={propiedad.id} 
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ height: '240px', backgroundColor: '#E2E8F0', position: 'relative', overflow: 'hidden' }}>
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={propiedad.nombre} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', backgroundColor: '#E2E8F0' }}>🏠</div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: '#1A3A5C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {propiedad.tipo?.replace('_', ' ')}
                  </div>
                </div>
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    {propiedad.zona} {propiedad.municipio && `· ${propiedad.municipio}`}
                  </p>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '15px', lineHeight: '1.4' }}>
                    {propiedad.nombre}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.82rem', color: '#475569', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🛏️</span> {propiedad.habitaciones} hab.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🚿</span> {propiedad.banos} bañ.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📐</span> {propiedad.metrosConstruidos} m²
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', border: '1px solid #E2E8F0' }}>
                      <p style={{ margin: '0 0 10px 0' }}>{propiedad.descripcion || 'Sin descripción disponible.'}</p>
                      {propiedad.caracteristicas && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                          {propiedad.caracteristicas.split(',').map((c, idx) => (
                            <span key={idx} style={{ background: '#E2E8F0', color: '#1A3A5C', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1A3A5C' }}>
                      {precioVenta ? formatMoney(precioVenta) : (precioAlquiler ? `${formatMoney(precioAlquiler)}${propiedad.tipo === 'VACACIONAL' ? '/sem' : '/mes'}` : 'Consultar')}
                    </div>
                    <button 
                      onClick={() => setExpandedPropId(isExpanded ? null : propiedad.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#C9A84C',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#B8973B'}
                      onMouseLeave={e => e.currentTarget.style.color = '#C9A84C'}
                    >
                      {isExpanded ? 'Ocultar detalles ↑' : 'Ver detalles →'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ backgroundColor: '#0F172A', color: '#94A3B8', padding: '40px 20px', textAlign: 'center', fontSize: '0.85rem', borderTop: '1px solid #1E293B' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} {nombreAgencia}. Todos los derechos reservados.</p>
        <p style={{ margin: '8px 0 0 0', opacity: 0.6 }}>Esta es una selección privada y confidencial generada a través de Ibiza Luxury Dreams CRM.</p>
      </footer>
    </div>
  );
}
