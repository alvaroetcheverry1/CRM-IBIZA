/**
 * PublicadorPortales.jsx
 * Modal premium para publicar propiedades en portales inmobiliarios.
 * Portales: Idealista, Fotocasa, James Edition, Kyero
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Globe, CheckCircle2, AlertCircle, Loader2, ExternalLink, Radio, RefreshCw, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Configuración visual de portales ───────────────────────────────────────
const PORTALES_META = {
  idealista: {
    nombre: 'Idealista',
    emoji: '🏠',
    color: '#FF4E00',
    bgColor: '#FFF4F0',
    borderColor: '#FFD0C0',
    descripcion: 'Líder en España · Feed XML',
    url: 'https://www.idealista.com',
  },
  fotocasa: {
    nombre: 'Fotocasa',
    emoji: '📸',
    color: '#E91E63',
    bgColor: '#FDF0F5',
    borderColor: '#F8BBD9',
    descripcion: 'Segundo portal nacional · Feed XML',
    url: 'https://www.fotocasa.es',
  },
  james_edition: {
    nombre: 'James Edition',
    emoji: '💎',
    color: '#1A1A2E',
    bgColor: '#F0F0F8',
    borderColor: '#C8C8E8',
    descripcion: 'Lujo internacional · API REST',
    url: 'https://www.jamesedition.com',
  },
  kyero: {
    nombre: 'Kyero',
    emoji: '🌍',
    color: '#2E7D32',
    bgColor: '#F0F7F0',
    borderColor: '#C8E6C9',
    descripcion: 'Internacional · Feed XML',
    url: 'https://www.kyero.com',
  },
};

// ─── Badge de estado ─────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const config = {
    PUBLICADO:     { icon: <CheckCircle2 size={12} />, label: 'Publicado',     color: '#059669', bg: '#D1FAE5' },
    PUBLICANDO:    { icon: <Loader2 size={12} className="spin" />, label: 'Publicando…', color: '#D97706', bg: '#FEF3C7' },
    ERROR:         { icon: <AlertCircle size={12} />, label: 'Error',          color: '#DC2626', bg: '#FEE2E2' },
    NO_PUBLICADO:  { icon: <Radio size={12} />,        label: 'No publicado',  color: '#64748B', bg: '#F1F5F9' },
  };
  const c = config[estado] || config.NO_PUBLICADO;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.color,
      borderRadius: 20, padding: '2px 8px',
      fontSize: '0.7rem', fontWeight: 600,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Tarjeta de portal ───────────────────────────────────────────────────────
function PortalCard({ portalId, meta, estadoActual, seleccionado, onToggle }) {
  const isSelected = seleccionado.includes(portalId);
  const isPublicado = estadoActual?.estado === 'PUBLICADO';
  const isPublicando = estadoActual?.estado === 'PUBLICANDO';

  return (
    <div
      onClick={() => !isPublicando && onToggle(portalId)}
      style={{
        border: `2px solid ${isSelected ? meta.color : isPublicado ? meta.borderColor : '#E2E8F0'}`,
        borderRadius: 12,
        padding: '1rem',
        cursor: isPublicando ? 'not-allowed' : 'pointer',
        background: isSelected ? meta.bgColor : 'white',
        transition: 'all 0.2s ease',
        position: 'relative',
        opacity: isPublicando ? 0.8 : 1,
        boxShadow: isSelected ? `0 0 0 3px ${meta.color}20` : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Checkbox visual */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 20, height: 20, borderRadius: 6,
        border: `2px solid ${isSelected ? meta.color : '#CBD5E1'}`,
        background: isSelected ? meta.color : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {isSelected && <CheckCircle2 size={12} color="white" />}
      </div>

      {/* Logo + Nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{meta.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{meta.nombre}</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{meta.descripcion}</div>
        </div>
      </div>

      {/* Estado actual */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <EstadoBadge estado={estadoActual?.estado || 'NO_PUBLICADO'} />
        {estadoActual?.urlPublicacion && (
          <a
            href={estadoActual.urlPublicacion}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: meta.color, display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Ver en portal <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Error */}
      {estadoActual?.errores && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#DC2626', background: '#FEF2F2', borderRadius: 6, padding: '4px 8px' }}>
          {estadoActual.errores?.mensaje || 'Error de sincronización'}
        </div>
      )}

      {/* Último sync */}
      {estadoActual?.ultimoSync && (
        <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', color: '#94A3B8' }}>
          Sync: {new Date(estadoActual.ultimoSync).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

// ─── Panel de info del feed ──────────────────────────────────────────────────
function FeedInfoPanel({ propiedadId }) {
  const [expanded, setExpanded] = useState(false);
  const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

  const feedUrls = {
    idealista: `${serverBase}/api/portales/feed?portal=idealista`,
    fotocasa:  `${serverBase}/api/portales/feed?portal=fotocasa`,
    kyero:     `${serverBase}/api/portales/feed?portal=kyero`,
  };

  return (
    <div style={{ background: '#F0F7FF', border: '1px solid #BAD4F0', borderRadius: 10, padding: '0.75rem 1rem', marginTop: '1rem' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Info size={14} style={{ color: '#3B82F6' }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1E40AF' }}>
          ¿Cómo funcionan los feeds XML?
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#3B82F6' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#334155', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            Los portales <strong>Idealista</strong>, <strong>Fotocasa</strong> y <strong>Kyero</strong> funcionan mediante un <em>feed XML</em>.
            Al activar la publicación, la propiedad se añade al feed. Los portales importarán el feed automáticamente (máx. 24h).
          </p>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#0F172A' }}>URLs de feed a proporcionar a cada portal:</p>
          {Object.entries(feedUrls).map(([portal, url]) => (
            <div key={portal} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: '#64748B', textTransform: 'capitalize', minWidth: 80 }}>{portal}:</span>
              <code style={{ background: '#E0EEFF', borderRadius: 4, padding: '1px 6px', fontSize: '0.68rem', wordBreak: 'break-all' }}>
                {url}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(url); toast.success('Copiado'); }}
                style={{ background: 'transparent', border: '1px solid #BAD4F0', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: '0.65rem', color: '#3B82F6', flexShrink: 0 }}
              >
                Copiar
              </button>
            </div>
          ))}
          <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: '0.7rem' }}>
            <strong>James Edition</strong> usa API REST directa. Requiere configurar <code>JAMES_EDITION_API_KEY</code> en el servidor.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Modal principal ─────────────────────────────────────────────────────────
export default function PublicadorPortales({ propiedad, onClose }) {
  const [estados, setEstados] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [despublicando, setDespublicando] = useState(false);

  const cargarEstados = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/portales/${propiedad.id}/estado`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Error al cargar estado');
      const data = await res.json();
      setEstados(data);
    } catch (err) {
      console.error('[PublicadorPortales] Error cargando estados:', err);
      // Fallback: estados vacíos
      setEstados(Object.keys(PORTALES_META).map(id => ({
        id, nombre: PORTALES_META[id].nombre, estado: 'NO_PUBLICADO',
        urlPublicacion: null, idExterno: null, ultimoSync: null, errores: null,
      })));
    } finally {
      setLoading(false);
    }
  }, [propiedad.id]);

  useEffect(() => {
    cargarEstados();
  }, [cargarEstados]);

  // Polling mientras hay publicaciones en curso
  useEffect(() => {
    const hayPublicando = estados.some(e => e.estado === 'PUBLICANDO');
    if (!hayPublicando) return;
    const interval = setInterval(cargarEstados, 2500);
    return () => clearInterval(interval);
  }, [estados, cargarEstados]);

  function togglePortal(id) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handlePublicar() {
    if (seleccionados.length === 0) {
      toast.error('Selecciona al menos un portal');
      return;
    }
    setPublicando(true);
    try {
      const res = await fetch(`${API_BASE}/portales/publicar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ propiedadId: propiedad.id, portales: seleccionados }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      toast.success(`🚀 Publicando en ${seleccionados.map(id => PORTALES_META[id]?.nombre).join(', ')}…`);
      setSeleccionados([]);

      // Recargar estados después de 1s para que los que ya terminaron aparezcan
      setTimeout(cargarEstados, 1200);
    } catch (err) {
      toast.error('Error: ' + (err.message || 'desconocido'));
    } finally {
      setPublicando(false);
    }
  }

  async function handleDespublicar() {
    const publicados = estados.filter(e => e.estado === 'PUBLICADO').map(e => e.id);
    if (publicados.length === 0) {
      toast.error('No hay portales publicados para despublicar');
      return;
    }
    if (!window.confirm(`¿Despublicar de ${publicados.map(id => PORTALES_META[id]?.nombre || id).join(', ')}?`)) return;
    setDespublicando(true);
    try {
      const res = await fetch(`${API_BASE}/portales/despublicar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ propiedadId: propiedad.id, portales: publicados }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al despublicar');
      toast.success('Propiedad despublicada de los portales');
      cargarEstados();
    } catch (err) {
      toast.error('Error: ' + (err.message || 'desconocido'));
    } finally {
      setDespublicando(false);
    }
  }

  const totalPublicados = estados.filter(e => e.estado === 'PUBLICADO').length;
  const hayPublicando = estados.some(e => e.estado === 'PUBLICANDO');

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.65)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 580,
        background: 'white',
        borderRadius: 18,
        zIndex: 1001,
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1A3A5C 100%)',
          color: 'white',
          padding: '1.25rem 1.5rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Globe size={20} style={{ color: '#C9A84C' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Publicar en Portales</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7 }}>
                {propiedad.nombre} · {propiedad.referencia}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Indicador de portales activos */}
              {totalPublicados > 0 && (
                <div style={{
                  background: 'rgba(5,150,105,0.2)',
                  border: '1px solid rgba(5,150,105,0.4)',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: '0.72rem', fontWeight: 600, color: '#34D399',
                }}>
                  {totalPublicados} activo{totalPublicados > 1 ? 's' : ''}
                </div>
              )}
              <button
                onClick={cargarEstados}
                disabled={loading}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}
              >
                <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Info de fotos */}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: `${propiedad.tipo?.replace('_', ' ')}`, color: '#C9A84C' },
              { label: `${propiedad.habitaciones || 0} hab.`, color: '#94A3B8' },
              { label: `${propiedad.zona}`, color: '#94A3B8' },
              { label: `${propiedad._count?.documentos || 0} docs`, color: '#94A3B8' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: '0.72rem', color, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2px 8px' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Body scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* Alerta si no hay fotos */}
          {(propiedad._count?.documentos || 0) === 0 && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FCD34D',
              borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.78rem', color: '#92400E',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Esta propiedad no tiene documentos/fotos. Los portales requieren al menos una imagen para publicar. Sube fotos desde la ficha de la propiedad.</span>
            </div>
          )}

          {/* Instrucción */}
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem', lineHeight: 1.6 }}>
            Selecciona los portales donde quieres publicar y haz clic en <strong>Publicar</strong>.
            Los portales marcados en verde ya tienen esta propiedad publicada.
          </p>

          {/* Grid de portales */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#1A3A5C' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {Object.entries(PORTALES_META).map(([id, meta]) => {
                const estadoActual = estados.find(e => e.id === id);
                return (
                  <PortalCard
                    key={id}
                    portalId={id}
                    meta={meta}
                    estadoActual={estadoActual}
                    seleccionado={seleccionados}
                    onToggle={togglePortal}
                  />
                );
              })}
            </div>
          )}

          {/* Resumen selección */}
          {seleccionados.length > 0 && (
            <div style={{
              marginTop: '1rem',
              background: '#F0F7FF', border: '1px solid #BAD4F0',
              borderRadius: 10, padding: '0.6rem 1rem',
              fontSize: '0.78rem', color: '#1E40AF',
            }}>
              <strong>{seleccionados.length} portal{seleccionados.length > 1 ? 'es' : ''} seleccionado{seleccionados.length > 1 ? 's' : ''}:</strong>{' '}
              {seleccionados.map(id => PORTALES_META[id]?.nombre).join(', ')}
            </div>
          )}

          {/* Estado de publicación en curso */}
          {hayPublicando && (
            <div style={{
              marginTop: '0.75rem',
              background: '#FFFBEB', border: '1px solid #FCD34D',
              borderRadius: 10, padding: '0.6rem 1rem',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.78rem', color: '#92400E',
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Publicación en progreso… La página se actualiza sola.
            </div>
          )}

          {/* Panel info feeds */}
          <FeedInfoPanel propiedadId={propiedad.id} />
        </div>

        {/* Footer con acciones */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
          background: '#FAFAFA',
        }}>
          <button
            onClick={handleDespublicar}
            disabled={despublicando || totalPublicados === 0}
            style={{
              background: 'white', color: '#DC2626',
              border: '1px solid #FECACA', borderRadius: 9,
              padding: '8px 16px', cursor: totalPublicados === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              opacity: totalPublicados === 0 ? 0.4 : 1,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {despublicando ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Despublicar todo
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: 'white', border: '1px solid #CBD5E1',
                borderRadius: 9, padding: '8px 18px',
                cursor: 'pointer', fontSize: '0.82rem', color: '#64748B',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handlePublicar}
              disabled={publicando || seleccionados.length === 0}
              style={{
                background: seleccionados.length === 0
                  ? '#94A3B8'
                  : 'linear-gradient(135deg, #1A3A5C 0%, #2D5986 100%)',
                color: 'white', border: 'none', borderRadius: 9,
                padding: '8px 22px', cursor: seleccionados.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s',
                boxShadow: seleccionados.length > 0 ? '0 4px 14px rgba(26,58,92,0.35)' : 'none',
              }}
            >
              {publicando
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Publicando…</>
                : <><Globe size={14} /> Publicar {seleccionados.length > 0 ? `(${seleccionados.length})` : ''}</>
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .spin { animation: spin 1s linear infinite !important; }
      `}</style>
    </>
  );
}
