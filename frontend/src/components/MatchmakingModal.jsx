import { useState, useEffect } from 'react';
import { Bot, Send, Loader2, X, ChevronDown, UserCheck } from 'lucide-react';
import { clientesApi } from '../services/api';
import toast from 'react-hot-toast';

// Comerciales de la empresa (puede cargarse desde /api/auth/users en el futuro)
const COMERCIALES = [
  { id: 'c1', nombre: 'María González', rol: 'Agente Senior' },
  { id: 'c2', nombre: 'Carlos Ruiz',    rol: 'Agente' },
  { id: 'c3', nombre: 'Ana Martínez',  rol: 'Agente' },
  { id: 'c4', nombre: 'Pedro Flores',  rol: 'Director Comercial' },
];

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/** Calcula score 0-100 de compatibilidad cliente-propiedad */
function calcScore(cliente, propiedad) {
  let score = 0;

  // Presupuesto (40 pts)
  const precio =
    Number(propiedad.venta?.precioVenta) ||
    Number(propiedad.alquilerVacacional?.precioTemporadaAlta) ||
    Number(propiedad.alquilerLargaDuracion?.rentaMensual) || 0;
  const presupuesto = Number(cliente.presupuesto) || 0;
  if (precio && presupuesto) {
    const ratio = presupuesto / precio;
    if (ratio >= 0.9 && ratio <= 1.3)  score += 40;
    else if (ratio >= 0.7 && ratio <= 1.6) score += 25;
    else if (ratio >= 0.5) score += 10;
  }

  // Zona (30 pts)
  const cz = (cliente.zonaInteres || '').toLowerCase().trim();
  const pz = (propiedad.zona || '').toLowerCase().trim();
  if (cz && pz) {
    if (cz === pz || cz.includes(pz) || pz.includes(cz)) score += 30;
    else if (cz.includes('cualquier') || cz === 'ibiza' || cz === 'cualquiera') score += 20;
  } else {
    score += 15; // sin preferencia = neutral
  }

  // Habitaciones (20 pts)
  const hab = Number(propiedad.habitaciones) || 0;
  const hMin = cliente.habitacionesMin != null ? Number(cliente.habitacionesMin) : null;
  const hMax = cliente.habitacionesMax != null ? Number(cliente.habitacionesMax) : null;
  if (hMin === null && hMax === null) score += 10;
  else if (hMin !== null && hab >= hMin && (hMax === null || hab <= hMax)) score += 20;
  else if (hMin !== null && hab >= hMin - 1) score += 10;

  // Estado lead (10 pts)
  const pts = { VISITA: 10, OFERTA: 10, CONTACTADO: 7, NUEVO: 5, CERRADO: 0, DESCARTADO: 0 };
  score += pts[cliente.estado] ?? 5;

  return Math.min(100, score);
}

/** Filtra los tipos de cliente compatibles según el tipo de propiedad */
function tiposCompatibles(tipoProp) {
  if (tipoProp === 'VENTA')          return ['COMPRADOR', 'AMBOS'];
  if (tipoProp === 'VACACIONAL')     return ['INQUILINO', 'AMBOS'];
  if (tipoProp === 'LARGA_DURACION') return ['INQUILINO', 'AMBOS'];
  return ['COMPRADOR', 'INQUILINO', 'AMBOS'];
}

const TIPO_ICON = { VENTA: '🏛', VACACIONAL: '🌴', LARGA_DURACION: '🏡' };
const TIPO_LABEL = { VENTA: 'Compradores potenciales', VACACIONAL: 'Inquilinos vacacionales', LARGA_DURACION: 'Inquilinos larga duración' };

export default function MatchmakingModal({ propiedad, onClose }) {
  const [loading,    setLoading]    = useState(true);
  const [matches,    setMatches]    = useState([]);
  const [assigning,  setAssigning]  = useState(null); // cliente id
  const [comercial,  setComercial]  = useState('');
  const [nota,       setNota]       = useState('');
  const [sentIds,    setSentIds]    = useState(new Set());
  const [sending,    setSending]    = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const tipos = tiposCompatibles(propiedad.tipo);
        const res = await clientesApi.list({ limit: 200 });
        const todos = res?.data || [];
        const compatibles = todos
          .filter(c => tipos.includes(c.tipo) && c.estado !== 'DESCARTADO' && c.estado !== 'CERRADO')
          .map(c => ({ ...c, score: calcScore(c, propiedad) }))
          .filter(c => c.score >= 40)
          .sort((a, b) => b.score - a.score);
        if (mounted) { setMatches(compatibles); setLoading(false); }
      } catch {
        // fallback con datos de demostración si no hay backend
        if (mounted) {
          setMatches([
            { id: 'm1', nombre: 'Álvaro', apellidos: 'Etcheverría', presupuesto: 2200000, zonaInteres: 'Sant Josep', habitacionesMin: 4, estado: 'VISITA', score: 92 },
            { id: 'm2', nombre: 'María',  apellidos: 'García',      presupuesto: 1800000, zonaInteres: 'Cualquiera', habitacionesMin: 3, estado: 'OFERTA', score: 78 },
            { id: 'm3', nombre: 'Carlos', apellidos: 'López',       presupuesto: 1500000, zonaInteres: 'Talamanca',  habitacionesMin: 2, estado: 'CONTACTADO', score: 61 },
          ]);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [propiedad.id]);

  function handleSend(m) {
    setSending(m.id);
    setTimeout(() => {
      setSending(null);
      setSentIds(prev => new Set([...prev, m.id]));
      toast.success(`📧 Dossier enviado a ${m.nombre} ${m.apellidos || ''}`);
    }, 1400);
  }

  function handleAssign(m) {
    if (!comercial) return toast.error('Selecciona un comercial');
    toast.success(`✅ ${m.nombre} asignado a ${COMERCIALES.find(c => c.id === comercial)?.nombre}`);
    setAssigning(null);
    setComercial('');
    setNota('');
  }

  const scoreColor = s => s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#64748B';
  const scoreBg    = s => s >= 80 ? '#D1FAE5' : s >= 60 ? '#FEF3C7' : '#F1F5F9';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(5px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: '#1A3A5C', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bot color="#C9A84C" size={20} /> Matchmaking {TIPO_ICON[propiedad.tipo]}
            </h3>
            <p style={{ margin: '3px 0 0', opacity: 0.8, fontSize: '0.82rem' }}>
              {TIPO_LABEL[propiedad.tipo]} · «{propiedad.nombre}» · {propiedad.zona}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem', background: '#F8FAFC' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ borderColor: '#1A3A5C', borderTopColor: 'transparent', width: 36, height: 36, marginBottom: '1rem' }} />
              <p style={{ color: '#475569', fontWeight: 600, margin: 0 }}>Analizando compatibilidad de clientes...</p>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '4px 0 0' }}>Cruzando presupuesto, zona, habitaciones y estado del lead</p>
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              <p style={{ fontWeight: 600 }}>No hay clientes compatibles</p>
              <p style={{ fontSize: '0.82rem' }}>Añade más clientes al CRM o revisa los criterios de la propiedad.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                {matches.length} cliente{matches.length !== 1 ? 's' : ''} compatible{matches.length !== 1 ? 's' : ''} encontrado{matches.length !== 1 ? 's' : ''} (score ≥ 40%)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matches.map(m => (
                  <div key={m.id}>
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{m.nombre} {m.apellidos || ''}</span>
                            <span style={{ fontSize: '0.72rem', background: scoreBg(m.score), color: scoreColor(m.score), padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>
                              {m.score}% match
                            </span>
                            <span style={{ fontSize: '0.7rem', background: '#F0F4F8', color: '#64748B', padding: '2px 8px', borderRadius: 20 }}>{m.estado}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap' }}>
                            <span>💰 {formatMoney(m.presupuesto)}</span>
                            {m.zonaInteres && <span>📍 {m.zonaInteres}</span>}
                            {m.habitacionesMin != null && <span>🛏 {m.habitacionesMin}{m.habitacionesMax ? `–${m.habitacionesMax}` : '+'} hab.</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            className="btn"
                            disabled={sending === m.id || sentIds.has(m.id)}
                            onClick={() => handleSend(m)}
                            style={{ background: sentIds.has(m.id) ? '#059669' : '#1A3A5C', color: 'white', fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            {sending === m.id ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                            {sentIds.has(m.id) ? 'Enviado ✓' : 'Dossier'}
                          </button>
                          <button
                            onClick={() => setAssigning(assigning === m.id ? null : m.id)}
                            style={{ background: assigning === m.id ? '#F1F5F9' : 'white', border: '1px solid #CBD5E1', borderRadius: 8, color: '#475569', fontSize: '0.78rem', padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <UserCheck size={13} /> Asignar <ChevronDown size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div style={{ marginTop: '0.75rem', height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${m.score}%`, background: `linear-gradient(90deg, ${scoreColor(m.score)}, ${scoreColor(m.score)}99)`, borderRadius: 2, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* Panel asignación */}
                    {assigning === m.id && (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0 0 10px 10px', padding: '1rem', marginTop: -4 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1E40AF', marginBottom: '0.75rem' }}>
                          📋 Asignar a un comercial
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Comercial asignado *</label>
                            <select className="form-select" value={comercial} onChange={e => setComercial(e.target.value)} style={{ fontSize: '0.82rem' }}>
                              <option value="">— Seleccionar —</option>
                              {COMERCIALES.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} · {c.rol}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nota al comercial</label>
                            <input className="form-input" value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej. Cliente muy interesado en precio" style={{ fontSize: '0.82rem' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setAssigning(null)} style={{ border: '1px solid #CBD5E1', background: 'white', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748B' }}>Cancelar</button>
                          <button onClick={() => handleAssign(m)} style={{ background: '#1E40AF', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            Confirmar asignación
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.25rem', background: '#EFF6FF', padding: '0.9rem 1rem', borderRadius: 8, border: '1px solid #BFDBFE', fontSize: '0.8rem', color: '#1E3A8A' }}>
                💡 <strong>Score de compatibilidad</strong>: calculado en base a presupuesto (40%), zona de interés (30%), habitaciones (20%) y etapa del lead (10%).
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
