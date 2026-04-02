/**
 * GeneradorPropuestas.jsx
 * Genera propuestas comerciales multi-propiedad en formato Print-Ready / PDF
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propiedadesApi } from '../services/api';
import {
  FileText, Plus, X, Printer, Check, User, Building2,
  Bed, Bath, Square, MapPin, Search, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

function fmt(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function getPrecio(p) {
  if (p.venta?.precioVenta) return { valor: p.venta.precioVenta, label: 'Precio venta' };
  if (p.alquilerVacacional?.precioTemporadaMedia) return { valor: p.alquilerVacacional.precioTemporadaMedia, label: 'T. Media / sem.' };
  if (p.alquilerLargaDuracion?.rentaMensual) return { valor: p.alquilerLargaDuracion.rentaMensual, label: 'Renta mensual' };
  return { valor: null, label: '' };
}

function getTipo(p) {
  if (p.tipo === 'VENTA') return 'EN VENTA';
  if (p.tipo === 'VACACIONAL') return 'ALQUILER VACACIONAL';
  if (p.tipo === 'LARGA_DURACION') return 'ALQUILER L/D';
  return p.tipo || '';
}

const MOCK_PROPS = [
  { id: 'v1', nombre: 'Villa Can Rimbau', zona: 'Jesús', referencia: 'ALQ-001', tipo: 'VACACIONAL', habitaciones: 6, banos: 5, metrosConstruidos: 520, metrosParcela: 3200, descripcion: 'Espectacular villa con vistas al mar, diseño contemporáneo renovada en 2023.', alquilerVacacional: { precioTemporadaMedia: 14000 } },
  { id: 'v2', nombre: 'Villa Sa Caleta Views', zona: 'Sant Josep', referencia: 'ALQ-002', tipo: 'VACACIONAL', habitaciones: 4, banos: 4, metrosConstruidos: 380, metrosParcela: 1800, descripcion: 'Vistas a Sa Caleta, arquitectura mediterránea moderna en plena naturaleza protegida.', alquilerVacacional: { precioTemporadaMedia: 9800 } },
  { id: 'v3', nombre: 'Ático Dalt Vila Premium', zona: 'Dalt Vila', referencia: 'VNT-088', tipo: 'VENTA', habitaciones: 3, banos: 3, metrosConstruidos: 220, descripcion: 'Ático de lujo en el casco histórico de Ibiza con vistas a la Marina y terraza privada.', venta: { precioVenta: 2750000 } },
  { id: 'v4', nombre: 'Finca Las Salinas Estate', zona: 'Las Salinas', referencia: 'ALQ-004', tipo: 'VACACIONAL', habitaciones: 8, banos: 7, metrosConstruidos: 680, metrosParcela: 8500, descripcion: 'Finca histórica del s.XIX restaurada, viñedos y a 5 min de playa Las Salinas.', alquilerVacacional: { precioTemporadaMedia: 22000 } },
  { id: 'v5', nombre: 'Villa Porroig Panorámica', zona: 'Porroig', referencia: 'ALQ-005', tipo: 'VACACIONAL', habitaciones: 3, banos: 3, metrosConstruidos: 280, metrosParcela: 900, descripcion: 'Minimalista con vistas 360º, ideal para parejas. Arquitectura eco sostenible.', alquilerVacacional: { precioTemporadaMedia: 5600 } },
  { id: 'v6', nombre: 'Penthouse Marina Ibiza', zona: 'Marina Botafoch', referencia: 'VNT-121', tipo: 'VENTA', habitaciones: 4, banos: 4, metrosConstruidos: 310, descripcion: 'Diseño de autor, 180m² de terraza privada con amarre de 14m incluido.', venta: { precioVenta: 4200000 } },
];

const PLANTILLAS = [
  { id: 'luxury', label: 'Luxury Dark', bgHeader: '#0F172A', accentColor: '#C9A84C', fontStyle: 'serif' },
  { id: 'clean', label: 'Corporate Clean', bgHeader: '#1E40AF', accentColor: '#93C5FD', fontStyle: 'sans' },
  { id: 'warm', label: 'Mediterranean Warm', bgHeader: '#7C3D12', accentColor: '#FCD34D', fontStyle: 'serif' },
];

// ─── Vista de impresión de la propuesta ──────────────────────────────────────
function PropuestaPreview({ cliente, propiedades, plantilla, notas }) {
  const t = PLANTILLAS.find(p => p.id === plantilla) || PLANTILLAS[0];

  return (
    <div id="propuesta-preview" style={{ background: 'white', fontFamily: t.fontStyle === 'serif' ? 'Georgia, serif' : "'Inter', sans-serif", color: '#1A1A2E' }}>
      
      {/* Portada */}
      <div style={{ background: t.bgHeader, minHeight: 200, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', opacity: 0.04, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div style={{ color: t.accentColor, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              Ibiza Luxury Dreams · Real Estate
            </div>
            <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 400, lineHeight: 1.2 }}>
              Propuesta Comercial<br />Selección de Propiedades
            </h1>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', lineHeight: 1.8 }}>
            <div style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>Preparado para:</div>
            <div style={{ color: t.accentColor, fontSize: '1rem', fontWeight: 700 }}>{cliente.nombre || 'Cliente'}</div>
            {cliente.empresa && <div>{cliente.empresa}</div>}
            <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', position: 'relative', marginTop: '2rem' }}>
          {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} seleccionada{propiedades.length !== 1 ? 's' : ''} con criterios personalizados · Confidencial
        </div>
      </div>

      {/* Propiedades */}
      <div style={{ padding: '2.5rem' }}>
        {propiedades.map((p, idx) => {
          const precio = getPrecio(p);
          return (
            <div key={p.id} style={{ marginBottom: idx < propiedades.length - 1 ? '2.5rem' : 0, paddingBottom: idx < propiedades.length - 1 ? '2.5rem' : 0, borderBottom: idx < propiedades.length - 1 ? `2px solid ${t.accentColor}22` : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                    <span style={{ background: t.bgHeader + '22', color: t.bgHeader, padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{getTipo(p)}</span>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{p.referencia}</span>
                  </div>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: t.fontStyle === 'serif' ? 400 : 700, color: '#0F172A', fontFamily: t.fontStyle === 'serif' ? 'Georgia, serif' : 'inherit' }}>
                    {p.nombre}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <MapPin size={13} />{p.zona}, Ibiza
                  </div>
                  <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.875rem', margin: '0 0 1rem' }}>{p.descripcion}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#1A3A5C' }}>
                    {p.habitaciones && <span><Bed size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.habitaciones} hab.</span>}
                    {p.banos && <span><Bath size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.banos} baños</span>}
                    {p.metrosConstruidos && <span><Square size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.metrosConstruidos} m²</span>}
                    {p.metrosParcela && <span>Parcela: {p.metrosParcela} m²</span>}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: t.bgHeader, borderRadius: 12, padding: '1.5rem', color: 'white' }}>
                    <div style={{ fontSize: '0.65rem', color: t.accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{precio.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: 4 }}>{fmt(precio.valor)}</div>
                    {p.tipo === 'VACACIONAL' && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>por semana · IVA incl.</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Notas */}
        {notas && (
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#F8FAFC', borderLeft: `3px solid ${t.accentColor}`, borderRadius: '0 8px 8px 0' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Notas adicionales</div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.7 }}>{notas}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>Ibiza Luxury Dreams</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>info@ibizaluxurydreams.com · +34 600 000 000</div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'right' }}>
            Documento confidencial · Válido 30 días<br />
            © {new Date().getFullYear()} Ibiza Luxury Dreams
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function GeneradorPropuestas() {
  const [cliente, setCliente] = useState({ nombre: '', empresa: '', email: '' });
  const [propsSeleccionadas, setPropsSeleccionadas] = useState([]);
  const [plantilla, setPlantilla] = useState('luxury');
  const [notas, setNotas] = useState('');
  const [searchProp, setSearchProp] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { data } = useQuery({
    queryKey: ['propiedades-all'],
    queryFn: () => propiedadesApi.list({ limit: 100 }),
  });

  const allProps = (data?.data?.length > 0 ? data.data : MOCK_PROPS);

  const propsFiltradas = allProps.filter(p => {
    const q = searchProp.toLowerCase();
    return !q || p.nombre.toLowerCase().includes(q) || p.zona?.toLowerCase().includes(q) || p.referencia?.toLowerCase().includes(q);
  });

  const toggleProp = (p) => {
    setPropsSeleccionadas(prev => {
      if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 5) { toast.error('Máximo 5 propiedades por propuesta'); return prev; }
      return [...prev, p];
    });
  };

  const handleExport = () => {
    if (propsSeleccionadas.length === 0) { toast.error('Selecciona al menos una propiedad'); return; }
    if (!cliente.nombre) { toast.error('Introduce el nombre del cliente'); return; }
    window.print();
  };

  if (showPreview) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#1E293B', overflow: 'auto' }}>
        <div style={{ background: '#334155', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ color: 'white', fontWeight: 600 }}>Preview · Propuesta {cliente.nombre}</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ color: 'white' }} onClick={() => setShowPreview(false)}>
              <X size={16} /> Cerrar
            </button>
            <button className="btn" style={{ background: '#C9A84C', color: '#0F172A', borderColor: '#C9A84C', fontWeight: 700 }} onClick={handleExport}>
              <Printer size={16} /> Imprimir / PDF
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 860, margin: '2rem auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', borderRadius: 8, overflow: 'hidden' }}>
          <PropuestaPreview cliente={cliente} propiedades={propsSeleccionadas} plantilla={plantilla} notas={notas} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', height: 'calc(100vh - 140px)' }}>
      {/* Left: Selector de propiedades */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#1A3A5C" /> Seleccionar Propiedades <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '0.85rem' }}>({propsSeleccionadas.length}/5)</span>
          </h3>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Buscar por nombre, zona o referencia..." value={searchProp} onChange={e => setSearchProp(e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 420, overflowY: 'auto' }}>
            {propsFiltradas.map(p => {
              const selected = propsSeleccionadas.find(x => x.id === p.id);
              const precio = getPrecio(p);
              return (
                <div key={p.id}
                  onClick={() => toggleProp(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem', borderRadius: 8,
                    border: selected ? '1.5px solid #C9A84C' : '1px solid #E2E8F0',
                    background: selected ? '#FFFBEB' : 'white', cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, border: selected ? 'none' : '2px solid #CBD5E1',
                    background: selected ? '#C9A84C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {selected && <Check size={13} color="white" strokeWidth={3} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#C9A84C', fontWeight: 600 }}>{p.referencia}</span>
                      <span><MapPin size={10} /> {p.zona}</span>
                      {p.habitaciones && <span><Bed size={10} /> {p.habitaciones}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{fmt(precio.valor)}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{precio.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seleccionadas */}
        {propsSeleccionadas.length > 0 && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#0F172A' }}>En la propuesta ({propsSeleccionadas.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {propsSeleccionadas.map(p => (
                <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0F172A', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500 }}>
                  {p.nombre.split(' ').slice(0, 2).join(' ')}
                  <button onClick={() => toggleProp(p)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Configuración de la propuesta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        
        {/* Cliente */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="#1A3A5C" /> Datos del Cliente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>NOMBRE COMPLETO *</label>
              <input className="input" placeholder="ej. James Smith" value={cliente.nombre} onChange={e => setCliente({ ...cliente, nombre: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>EMPRESA (OPCIONAL)</label>
              <input className="input" placeholder="ej. Inversol Ltd." value={cliente.empresa} onChange={e => setCliente({ ...cliente, empresa: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>EMAIL</label>
              <input className="input" placeholder="james@inversol.com" value={cliente.email} onChange={e => setCliente({ ...cliente, email: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Plantilla */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#0F172A' }}>Estilo Visual</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PLANTILLAS.map(t => (
              <div key={t.id} onClick={() => setPlantilla(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.75rem', borderRadius: 8, border: plantilla === t.id ? '2px solid #C9A84C' : '1px solid #E2E8F0', cursor: 'pointer', background: plantilla === t.id ? '#FFFBEB' : 'white' }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: t.bgHeader, border: `2px solid ${t.accentColor}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: plantilla === t.id ? 600 : 400, color: '#0F172A' }}>{t.label}</span>
                {plantilla === t.id && <Check size={14} color="#C9A84C" style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#0F172A' }}>Notas / Condiciones especiales</h3>
          <textarea className="input" rows={3} placeholder="ej. Descuento del 5% si se cierra antes del 30 de abril..." value={notas} onChange={e => setNotas(e.target.value)} style={{ lineHeight: 1.5 }} />
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center', background: '#1A3A5C', color: 'white', borderColor: '#1A3A5C', padding: '0.875rem', fontSize: '0.95rem' }}
            onClick={() => {
              if (!cliente.nombre) { toast.error('Introduce el nombre del cliente'); return; }
              if (propsSeleccionadas.length === 0) { toast.error('Selecciona al menos una propiedad'); return; }
              setShowPreview(true);
            }}
          >
            <FileText size={18} /> Ver Preview de la Propuesta
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>
            En el preview podrás imprimir o guardar como PDF con Ctrl+P
          </p>
        </div>
      </div>
    </div>
  );
}
