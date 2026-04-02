/**
 * CatalogoPublico.jsx
 * Página pública sin autenticación — accesible vía link compartible.
 * URL: /catalogo/vacacional
 */
import { useState } from 'react';
import { MapPin, Bed, Bath, Square, Search, Phone, Mail, CalendarCheck } from 'lucide-react';

// Paleta oficial
const colors = {
  navy: '#0F172A',
  navyLight: '#1A3A5C',
  gold: '#C9A84C',
  goldLight: '#DEB96E',
  sand: '#F5F0E8',
  white: '#FFFFFF',
  slate: '#64748B',
  green: '#166534',
  greenBg: '#F0FDF4',
};

function fmt(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function getTemporada() {
  const m = new Date().getMonth();
  if ([6, 7, 8].includes(m)) return { label: 'Temporada Alta', key: 'precioTemporadaAlta', color: '#DC2626' };
  if ([4, 5, 9, 10].includes(m)) return { label: 'Temporada Media', key: 'precioTemporadaMedia', color: '#D97706' };
  return { label: 'Temporada Baja', key: 'precioTemporadaBaja', color: '#16A34A' };
}

const MOCK_VILLAS = [
  {
    id: 'v1', nombre: 'Villa Can Rimbau', zona: 'Jesús', referencia: 'ALQ-001',
    habitaciones: 6, banos: 5, metrosConstruidos: 520, metrosParcela: 3200, estado: 'DISPONIBLE',
    descripcion: 'Espectacular villa de diseño contemporáneo con vistas panorámicas al mar en la exclusiva zona de Jesús. Renovada en 2023 con los más altos estándares de calidad.',
    caracteristicas: ['Piscina infinita', 'Vista al mar', 'Jardín mediterráneo', 'Domótica', 'BBQ exterior', 'WiFi fibra óptica', 'Parking privado', 'A/C central'],
    alquilerVacacional: { precioTemporadaAlta: 21000, precioTemporadaMedia: 14000, precioTemporadaBaja: 7000, licenciaETV: 'ETV-IBI-00234' },
    fotoPrincipal: null,
  },
  {
    id: 'v2', nombre: 'Villa Sa Caleta Views', zona: 'Sant Josep', referencia: 'ALQ-002',
    habitaciones: 4, banos: 4, metrosConstruidos: 380, metrosParcela: 1800, estado: 'DISPONIBLE',
    descripcion: 'Elegante villa con impresionantes vistas a Sa Caleta y sus aguas cristalinas. Arquitectura mediterránea moderna en plena naturaleza protegida.',
    caracteristicas: ['Piscina privada', 'Sala de cine', 'Terraza cubierta', 'Cocina de diseño', 'Gym interior', 'Wifi', 'Parking'],
    alquilerVacacional: { precioTemporadaAlta: 15400, precioTemporadaMedia: 9800, precioTemporadaBaja: 5200, licenciaETV: 'ETV-IBI-00678' },
    fotoPrincipal: null,
  },
  {
    id: 'v3', nombre: 'Villa Talamanca Sunset', zona: 'Talamanca', referencia: 'ALQ-003',
    habitaciones: 5, banos: 5, metrosConstruidos: 450, metrosParcela: 2500, estado: 'DISPONIBLE',
    descripcion: 'Villa de lujo a 200m de la playa de Talamanca, con los mejores atardeceres de la isla. Arquitectura de líneas puras y materiales premium de origen local.',
    caracteristicas: ['Primera línea', 'Piscina 12x6m', 'Jacuzzi exterior', 'Sala de juegos', 'Cocina exterior', 'Acceso playa privado'],
    alquilerVacacional: { precioTemporadaAlta: 18900, precioTemporadaMedia: 12500, precioTemporadaBaja: 6400, licenciaETV: 'ETV-IBI-01102' },
    fotoPrincipal: null,
  },
  {
    id: 'v4', nombre: 'Finca Las Salinas Estate', zona: 'Las Salinas', referencia: 'ALQ-004',
    habitaciones: 8, banos: 7, metrosConstruidos: 680, metrosParcela: 8500, estado: 'DISPONIBLE',
    descripcion: 'La joya de la corona. Finca histórica del siglo XIX completamente restaurada, rodeada de viñedos y a 5 minutos de la playa de Las Salinas, la más exclusiva de Ibiza.',
    caracteristicas: ['Finca histórica s.XIX', 'Piscina 20m', 'Bodega privada', 'Canchas de tenis', 'Helipuerto', 'Staff incluido', 'Servicio chef', '5 min. a Las Salinas'],
    alquilerVacacional: { precioTemporadaAlta: 35000, precioTemporadaMedia: 22000, precioTemporadaBaja: 11000, licenciaETV: 'ETV-IBI-01455' },
    fotoPrincipal: null,
  },
  {
    id: 'v5', nombre: 'Villa Porroig Panorámica', zona: 'Porroig', referencia: 'ALQ-005',
    habitaciones: 3, banos: 3, metrosConstruidos: 280, metrosParcela: 900, estado: 'DISPONIBLE',
    descripcion: 'Joya minimalista con vistas 360º de las salinas de Ibiza y el islote de Espalmador. Ideal para parejas o familias pequeñas buscando privacidad y sosiego.',
    caracteristicas: ['Vistas 360º', 'Arquitectura eco', 'Piscina natural', 'Huerto ecológico', 'Bikes incluidas', 'Silencio total'],
    alquilerVacacional: { precioTemporadaAlta: 8900, precioTemporadaMedia: 5600, precioTemporadaBaja: 3200, licenciaETV: 'ETV-IBI-01891' },
    fotoPrincipal: null,
  },
];

// Gradientes de color para cada villa (sin foto real)
const VILLA_GRADIENTS = [
  'linear-gradient(135deg, #0F172A 0%, #1A3A5C 100%)',
  'linear-gradient(135deg, #1A3A5C 0%, #2D5A8E 100%)',
  'linear-gradient(135deg, #0D2137 0%, #1D4E6C 100%)',
  'linear-gradient(135deg, #0A1628 0%, #152D4A 100%)',
  'linear-gradient(135deg, #152D4A 0%, #273E5A 100%)',
];

function VillaCard({ villa, idx }) {
  const [expanded, setExpanded] = useState(false);
  const temporada = getTemporada();
  const precio = villa.alquilerVacacional?.[temporada.key];

  return (
    <div style={{
      background: colors.white, borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #E2E8F0',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,23,42,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(15,23,42,0.08)'; }}
    >
      {/* Hero Image placeholder */}
      <div style={{ height: 220, background: VILLA_GRADIENTS[idx % VILLA_GRADIENTS.length], position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem' }}>
        {/* Ref badge */}
        <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(201,168,76,0.95)', color: colors.navy, padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          {villa.referencia}
        </div>
        {/* Status */}
        <div style={{ position: 'absolute', top: 16, right: 16, background: '#22C55E', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>
          ✓ DISPONIBLE
        </div>
        {/* Title over hero */}
        <div style={{ color: 'white', position: 'relative', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Georgia, serif', fontWeight: 400, lineHeight: 1.2 }}>{villa.nombre}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: colors.goldLight, fontSize: '0.85rem' }}>
            <MapPin size={13} /> {villa.zona}, Ibiza
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.5rem' }}>
        {/* Specs row */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', padding: '0.75rem', background: colors.sand, borderRadius: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: colors.navyLight }}>
            <Bed size={15} /> {villa.habitaciones} hab.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: colors.navyLight }}>
            <Bath size={15} /> {villa.banos} baños
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: colors.navyLight }}>
            <Square size={15} /> {villa.metrosConstruidos} m²
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.875rem', color: colors.slate, lineHeight: 1.7, margin: '0 0 1rem 0' }}>
          {villa.descripcion}
        </p>

        {/* Features */}
        {expanded && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {villa.caracteristicas.map((c, i) => (
                <span key={i} style={{ background: colors.sand, color: colors.navyLight, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginBottom: '1rem', fontWeight: 600 }}>
          {expanded ? '▲ Ver menos' : '▼ Ver características completas'}
        </button>

        {/* Price + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: temporada.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {temporada.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.navy, lineHeight: 1 }}>
              {fmt(precio)}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.slate, marginTop: 2 }}>por semana · IVA incluido</div>
          </div>
          <a href={`tel:+34600000000`} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: colors.gold, color: colors.navy, padding: '0.6rem 1.25rem',
            borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
          }}>
            <Phone size={15} /> Consultar
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPublico() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroHab, setFiltroHab] = useState('');

  const temporada = getTemporada();

  const villasFiltradas = MOCK_VILLAS.filter(v => {
    const q = busqueda.toLowerCase();
    const mq = !q || v.nombre.toLowerCase().includes(q) || v.zona.toLowerCase().includes(q);
    const mh = !filtroHab || v.habitaciones >= parseInt(filtroHab);
    return mq && mh;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Hero Header */}
      <div style={{ background: colors.navy, padding: '4rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <div style={{ color: colors.gold, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Ibiza Luxury Dreams · Portfolio Exclusivo {new Date().getFullYear()}
          </div>
          <h1 style={{ color: 'white', margin: '0 0 1rem', fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontFamily: 'Georgia, serif', fontWeight: 400, lineHeight: 1.2 }}>
            Villas de Lujo para Alquiler<br/>en Ibiza
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Selección exclusiva de villas para alquiler vacacional. Todas con licencia ETV, 
            servicio premium y Concierge disponible las 24h.
          </p>
          
          {/* Temporada badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.5rem 1.25rem', borderRadius: 30, color: 'white', fontSize: '0.85rem' }}>
            <CalendarCheck size={15} color={colors.gold} />
            Catálogo vigente · <span style={{ color: colors.gold, fontWeight: 600 }}>{temporada.label}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '1rem 2rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.5rem 1rem', minWidth: 280 }}>
          <Search size={16} color="#94A3B8" />
          <input
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem', width: '100%', color: '#0F172A' }}
            placeholder="Buscar villa o zona..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select value={filtroHab} onChange={e => setFiltroHab(e.target.value)}
          style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#475569', background: '#F8FAFC', outline: 'none' }}>
          <option value="">Cualquier tamaño</option>
          <option value="2">≥ 2 habitaciones</option>
          <option value="4">≥ 4 habitaciones</option>
          <option value="6">≥ 6 habitaciones</option>
          <option value="8">≥ 8 habitaciones</option>
        </select>
        <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
          {villasFiltradas.length} villa{villasFiltradas.length !== 1 ? 's' : ''} disponible{villasFiltradas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid Villas */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
          {villasFiltradas.map((v, idx) => (
            <VillaCard key={v.id} villa={v} idx={idx} />
          ))}
        </div>
      </div>

      {/* Footer de contacto */}
      <div style={{ background: colors.navy, padding: '3rem 2rem', textAlign: 'center', color: 'white' }}>
        <div style={{ borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'inline-block', color: colors.gold, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
          Ibiza Luxury Dreams
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
          Tu agencia de referencia para propiedades de lujo en Ibiza
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="tel:+34600000000" style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.gold, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            <Phone size={16} /> +34 600 000 000
          </a>
          <a href="mailto:info@ibizaluxurydreams.com" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem' }}>
            <Mail size={16} /> info@ibizaluxurydreams.com
          </a>
        </div>
        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Ibiza Luxury Dreams · Todos los derechos reservados · Precios orientativos sujetos a disponibilidad
        </div>
      </div>
    </div>
  );
}
