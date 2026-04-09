import { useState, useRef, useCallback } from 'react';
import { FileText, Upload, CheckCircle2, Edit3, X, ChevronDown, ChevronUp,
  Loader2, Building2, MapPin, Bed, Bath, Square, Phone, Mail, User, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const TIPO_LABELS = { VACACIONAL: '🌴 Vacacional', VENTA: '🏛 Venta', LARGA_DURACION: '🏡 Larga Duración' };
const PISCINA_OPT = ['SI', 'NO', 'COMUNITARIA'];

function campo(d, k) {
  return d?.[k] != null && d[k] !== '';
}

function FieldBadge({ ok }) {
  return ok
    ? <span style={{ fontSize: '0.65rem', background: '#D1FAE5', color: '#059669', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>✓</span>
    : <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>?</span>;
}

export default function AnalizarPDFModal({ onClose, onCreate }) {
  const [step, setStep]         = useState(1); // 1=upload, 2=review, 3=done
  const [analyzing, setAnalyzing] = useState(false);
  const [datos, setDatos]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState('');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState({ basico: true, precios: false, propietario: false });
  const fileRef = useRef();

  // ──── Helpers ────────────────────────────────────────────
  const toggle = k => setExpanded(p => ({ ...p, [k]: !p[k] }));
  const upd    = (k, v) => setDatos(p => ({ ...p, [k]: v }));
  const updNum = (k, v) => setDatos(p => ({ ...p, [k]: v === '' ? null : Number(v) }));
  const updBool= (k, v) => setDatos(p => ({ ...p, [k]: v }));

  // ──── Análisis PDF ────────────────────────────────────────
  const analyze = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Por favor, sube un archivo PDF');
      return;
    }
    setFilename(file.name);
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res = await fetch(`${BASE_URL}/propiedades/analizar-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error analizando el PDF');
      }
      const json = await res.json();
      setDatos(json.datos);
      setStep(2);
      toast.success('📄 PDF analizado correctamente por la IA');
    } catch (err) {
      toast.error(err.message || 'No se pudo analizar el PDF');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) analyze(file);
  };

  // ──── Crear propiedad ─────────────────────────────────────
  const handleCreate = async () => {
    if (!datos.nombre || !datos.tipo || !datos.zona) {
      toast.error('Nombre, tipo y zona son obligatorios');
      return;
    }
    if (!datos.habitaciones || !datos.banos || !datos.metrosConstruidos) {
      toast.error('Habitaciones, baños y m² son obligatorios');
      return;
    }
    setCreating(true);
    try {
      await onCreate(datos);
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Error al crear la propiedad');
    } finally {
      setCreating(false);
    }
  };

  // ──── Campos detectados / campos vacíos ──────────────────
  const camposCore = ['nombre','tipo','zona','habitaciones','banos','metrosConstruidos'];
  const detectedCount = datos ? Object.keys(datos).filter(k => datos[k] != null && k !== '_mock').length : 0;
  const totalFields = 22;

  // ──── Render ─────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 740, maxHeight: '94vh', background: 'white', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #2D5986 100%)', color: 'white', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
              <Sparkles color="#C9A84C" size={20} />
              Crear Propiedad desde PDF con IA
            </h3>
            <p style={{ margin: '3px 0 0', opacity: 0.8, fontSize: '0.8rem' }}>
              {step === 1 ? 'Paso 1/2 — Sube el PDF de la propiedad' : step === 2 ? `Paso 2/2 — Revisa los datos extraídos (${detectedCount}/${totalFields} campos detectados)` : '✅ Propiedad creada'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 8, padding: '6px 8px' }}><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: '#E2E8F0', flexShrink: 0 }}>
          <div style={{ height: '100%', width: step === 1 ? '33%' : step === 2 ? '66%' : '100%', background: 'linear-gradient(90deg,#1A3A5C,#C9A84C)', transition: 'width 0.4s ease' }} />
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.75rem' }}>

          {/* ── Paso 1: Subir PDF ───────────────────── */}
          {step === 1 && (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2.5px dashed ${dragging ? '#1A3A5C' : '#CBD5E1'}`,
                  borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer',
                  background: dragging ? '#EFF6FF' : '#F8FAFC', transition: 'all 0.2s',
                }}
              >
                {analyzing ? (
                  <>
                    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 1.25rem' }}>
                      <div className="spinner" style={{ width: 80, height: 80, position: 'absolute', border: '5px solid #E2E8F0', borderTopColor: '#1A3A5C' }} />
                      <Sparkles size={28} color="#C9A84C" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                    </div>
                    <h3 style={{ color: '#1A3A5C', fontWeight: 700 }}>Sofía IA analizando el PDF...</h3>
                    <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Extrayendo habitaciones, zona, precios, propietario y más</p>
                    <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: 4 }}>📄 {filename}</p>
                  </>
                ) : (
                  <>
                    <div style={{ width: 70, height: 70, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                      <FileText size={32} color="#1A3A5C" />
                    </div>
                    <h3 style={{ color: '#0F172A', fontWeight: 700, margin: '0 0 0.5rem' }}>Arrastra aquí el PDF de la propiedad</h3>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                      o haz clic para seleccionarlo desde tu equipo
                    </p>
                    <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                      <Upload size={15} /> Seleccionar PDF
                    </button>
                    <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '1rem' }}>
                      La IA extraerá automáticamente: nombre, zona, habitaciones, baños, m², piscina, precios, propietario, teléfono y más.
                    </p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => analyze(e.target.files?.[0])} />
              </div>

              {datos?._mock && step === 2 &&
                <div style={{ marginTop: '1rem', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400E' }}>
                  ⚠️ Modo demo: la IA de producción requiere una clave <code>OPENAI_API_KEY</code> en el backend. Los datos mostrados son de ejemplo.
                </div>
              }
            </div>
          )}

          {/* ── Paso 2: Revisar datos ───────────────── */}
          {step === 2 && datos && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {datos._mock && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '0.65rem 1rem', display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8rem', color: '#92400E' }}>
                  <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span><strong>Modo demo activado</strong> — Los datos mostrados son de ejemplo. En producción con clave OpenAI, la IA extraerá los datos reales del PDF.</span>
                </div>
              )}

              {/* Sección: Datos básicos */}
              <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle('basico')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: '#F8FAFC', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} color="#1A3A5C" /> Datos Básicos
                    <FieldBadge ok={camposCore.every(k => campo(datos, k))} />
                  </span>
                  {expanded.basico ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.basico && (
                  <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Nombre de la Villa <FieldBadge ok={campo(datos,'nombre')} /></label>
                      <input className="form-input" value={datos.nombre || ''} onChange={e => upd('nombre', e.target.value)} placeholder="Villa Can Rimbau..." />
                    </div>
                    <div>
                      <label className="form-label">Tipo <FieldBadge ok={campo(datos,'tipo')} /></label>
                      <select className="form-select" value={datos.tipo || ''} onChange={e => upd('tipo', e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        <option value="VACACIONAL">🌴 Vacacional</option>
                        <option value="VENTA">🏛 Venta</option>
                        <option value="LARGA_DURACION">🏡 Larga Duración</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Zona <FieldBadge ok={campo(datos,'zona')} /></label>
                      <input className="form-input" value={datos.zona || ''} onChange={e => upd('zona', e.target.value)} placeholder="Sant Josep, Talamanca..." />
                    </div>
                    <div>
                      <label className="form-label">Habitaciones <FieldBadge ok={campo(datos,'habitaciones')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.habitaciones ?? ''} onChange={e => updNum('habitaciones', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Baños <FieldBadge ok={campo(datos,'banos')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.banos ?? ''} onChange={e => updNum('banos', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">m² Construidos <FieldBadge ok={campo(datos,'metrosConstruidos')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.metrosConstruidos ?? ''} onChange={e => updNum('metrosConstruidos', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">m² Parcela <FieldBadge ok={campo(datos,'metrosParcela')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.metrosParcela ?? ''} onChange={e => updNum('metrosParcela', e.target.value)} placeholder="Opcional" />
                    </div>
                    <div>
                      <label className="form-label">Piscina <FieldBadge ok={campo(datos,'piscina')} /></label>
                      <select className="form-select" value={datos.piscina || 'NO'} onChange={e => upd('piscina', e.target.value)}>
                        {PISCINA_OPT.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Licencia ETV <FieldBadge ok={campo(datos,'licenciaETV')} /></label>
                      <input className="form-input" value={datos.licenciaETV || ''} onChange={e => upd('licenciaETV', e.target.value)} placeholder="ETV-IBI-XXXXX" />
                    </div>
                    {/* Checkboxes */}
                    <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      {[['garaje','🚗 Garaje'],['terraza','🌅 Terraza'],['jardin','🌿 Jardín'],['vistasMar','🌊 Vistas al mar'],['ascensor','🛗 Ascensor']].map(([k, label]) => (
                        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          <input type="checkbox" checked={!!datos[k]} onChange={e => updBool(k, e.target.checked)} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Características especiales <FieldBadge ok={campo(datos,'caracteristicas') && datos.caracteristicas?.length > 0} /></label>
                      <input className="form-input" value={Array.isArray(datos.caracteristicas) ? datos.caracteristicas.join(', ') : (datos.caracteristicas || '')} onChange={e => upd('caracteristicas', e.target.value.split(',').map(s => s.trim()))} placeholder="Piscina infinity, Domótica, Barbacoa..." />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Descripción <FieldBadge ok={campo(datos,'descripcion')} /></label>
                      <textarea className="form-input" rows={3} value={datos.descripcion || ''} onChange={e => upd('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Notas internas <FieldBadge ok={campo(datos,'notas')} /></label>
                      <textarea className="form-input" rows={2} value={datos.notas || ''} onChange={e => upd('notas', e.target.value)} style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Precios */}
              <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle('precios')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: '#F8FAFC', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    💰 Precios
                    <FieldBadge ok={!!(datos.precioVenta || datos.precioAlquilerTemporadaAlta || datos.rentaMensual)} />
                  </span>
                  {expanded.precios ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.precios && (
                  <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div>
                      <label className="form-label">Precio Venta (€) <FieldBadge ok={campo(datos,'precioVenta')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.precioVenta ?? ''} onChange={e => updNum('precioVenta', e.target.value)} placeholder="Ej: 2500000" />
                    </div>
                    <div>
                      <label className="form-label">Alquiler T. Alta (€/sem) <FieldBadge ok={campo(datos,'precioAlquilerTemporadaAlta')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaAlta ?? ''} onChange={e => updNum('precioAlquilerTemporadaAlta', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Alquiler T. Media (€/sem) <FieldBadge ok={campo(datos,'precioAlquilerTemporadaMedia')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaMedia ?? ''} onChange={e => updNum('precioAlquilerTemporadaMedia', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Alquiler T. Baja (€/sem) <FieldBadge ok={campo(datos,'precioAlquilerTemporadaBaja')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaBaja ?? ''} onChange={e => updNum('precioAlquilerTemporadaBaja', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Renta Mensual (€/mes) <FieldBadge ok={campo(datos,'rentaMensual')} /></label>
                      <input className="form-input" type="number" min="0" value={datos.rentaMensual ?? ''} onChange={e => updNum('rentaMensual', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Propietario */}
              <div className="card" style={{ padding: 0 }}>
                <button onClick={() => toggle('propietario')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: '#F8FAFC', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={16} color="#1A3A5C" /> Propietario
                    <FieldBadge ok={campo(datos,'propietarioNombre')} />
                  </span>
                  {expanded.propietario ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.propietario && (
                  <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Nombre Propietario <FieldBadge ok={campo(datos,'propietarioNombre')} /></label>
                      <input className="form-input" value={datos.propietarioNombre || ''} onChange={e => upd('propietarioNombre', e.target.value)} placeholder="Nombre completo..." />
                    </div>
                    <div>
                      <label className="form-label">Teléfono <FieldBadge ok={campo(datos,'propietarioTelefono')} /></label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input className="form-input" value={datos.propietarioTelefono || ''} onChange={e => upd('propietarioTelefono', e.target.value)} placeholder="+34 600 000 000" style={{ paddingLeft: 32 }} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Email <FieldBadge ok={campo(datos,'propietarioEmail')} /></label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input className="form-input" value={datos.propietarioEmail || ''} onChange={e => upd('propietarioEmail', e.target.value)} placeholder="correo@ejemplo.com" style={{ paddingLeft: 32 }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Paso 3: Confirmación ─────────────────── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={42} color="#059669" />
              </div>
              <h3 style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem' }}>¡Propiedad creada con éxito!</h3>
              <p style={{ color: '#64748B', lineHeight: 1.6 }}>
                Los datos han sido guardados en el CRM y sincronizados con Google Sheets automáticamente.
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1.5rem' }}>
                Ver propiedad →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div style={{ borderTop: '1px solid #E2E8F0', padding: '1rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', flexShrink: 0 }}>
            <button onClick={() => setStep(1)} style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
              ← Subir otro PDF
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{detectedCount}/{totalFields} campos detectados</span>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                {creating ? 'Creando...' : 'Crear Propiedad en CRM'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
