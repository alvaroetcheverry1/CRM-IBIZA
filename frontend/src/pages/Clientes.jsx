import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../services/api';
import { Plus, Search, Phone, Mail, ChevronRight, X, Save, Loader2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ESTADOS = ['NUEVO', 'CONTACTADO', 'VISITA', 'OFERTA', 'CERRADO', 'DESCARTADO'];
const TIPOS   = ['COMPRADOR', 'INQUILINO', 'AMBOS'];
const ESTADO_BADGE = {
  NUEVO: 'badge-nuevo', CONTACTADO: 'badge-contactado', VISITA: 'badge-visita',
  OFERTA: 'badge-oferta', CERRADO: 'badge-cerrado', DESCARTADO: 'badge-descartado',
};

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const TIPO_ICON = { COMPRADOR: '🏛', INQUILINO: '🔑', AMBOS: '🌐' };

// ─── Drawer de detalle / edición de cliente ─────────────────────────────────
function ClienteDrawer({ cliente, onClose }) {
  const qc = useQueryClient();
  const [edit, setEdit]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    nombre:          cliente.nombre          ?? '',
    apellidos:       cliente.apellidos        ?? '',
    email:           cliente.email            ?? '',
    telefono:        cliente.telefono         ?? '',
    tipo:            cliente.tipo             ?? 'COMPRADOR',
    estado:          cliente.estado           ?? 'NUEVO',
    presupuesto:     cliente.presupuesto      ?? '',
    zonaInteres:     cliente.zonaInteres      ?? '',
    habitacionesMin: cliente.habitacionesMin  ?? '',
    habitacionesMax: cliente.habitacionesMax  ?? '',
    origen:          cliente.origen           ?? '',
    notas:           cliente.notas            ?? '',
  });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSave() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      await clientesApi.update(cliente.id, {
        ...form,
        presupuesto:     form.presupuesto     ? Number(form.presupuesto)     : null,
        habitacionesMin: form.habitacionesMin ? Number(form.habitacionesMin) : null,
        habitacionesMax: form.habitacionesMax ? Number(form.habitacionesMax) : null,
      });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('✅ Cliente actualizado');
      setEdit(false);
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'desconocido'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción es irreversible.')) return;
    try {
      await clientesApi.delete(cliente.id);
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado');
      onClose();
    } catch (err) {
      toast.error('Error al eliminar: ' + (err.message || 'desconocido'));
    }
  }

  const F = ({ label, children }) => (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
  const inp = (key, type = 'text', opts = {}) => (
    <input className="form-input" type={type} value={form[key]} onChange={e => setField(key, e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} {...opts} />
  );

  // Color por estado del cliente
  const estadoColor = { NUEVO: '#64748B', CONTACTADO: '#2563EB', VISITA: '#D97706', OFERTA: '#7C3AED', CERRADO: '#059669', DESCARTADO: '#DC2626' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 500, background: 'white', zIndex: 901, boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1A3A5C,#2D5F8F)', color: 'white', padding: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                {TIPO_ICON[cliente.tipo]}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{cliente.nombre} {cliente.apellidos}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{cliente.tipo}</span>
                  <span style={{ background: estadoColor[cliente.estado] || 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{cliente.estado}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.82rem', opacity: 0.85 }}>
            {cliente.telefono && <span>📞 {cliente.telefono}</span>}
            {cliente.email    && <span>✉️ {cliente.email}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {edit ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <F label="Nombre">{inp('nombre')}</F>
                <F label="Apellidos">{inp('apellidos')}</F>
                <F label="Email"><input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} /></F>
                <F label="Teléfono">{inp('telefono')}</F>
                <F label="Tipo de cliente">
                  <select className="form-select" value={form.tipo} onChange={e => setField('tipo', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </F>
                <F label="Estado">
                  <select className="form-select" value={form.estado} onChange={e => setField('estado', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Presupuesto (€)">{inp('presupuesto', 'number')}</F>
                <F label="Zona de interés">{inp('zonaInteres')}</F>
                <F label="Hab. mínimas">{inp('habitacionesMin', 'number')}</F>
                <F label="Hab. máximas">{inp('habitacionesMax', 'number')}</F>
                <F label="Origen">
                  <select className="form-select" value={form.origen} onChange={e => setField('origen', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                    {['','WEB','REFERIDO','PORTAL','REDES_SOCIALES','LLAMADA','OTRO'].map(o => <option key={o} value={o}>{o || '— Sin especificar —'}</option>)}
                  </select>
                </F>
              </div>
              <F label="Notas">
                <textarea className="form-input" value={form.notas} onChange={e => setField('notas', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem' }} />
              </F>
            </>
          ) : (
            <>
              {/* Info financiera */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <F label="Presupuesto"><span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{formatMoney(cliente.presupuesto)}</span></F>
                  <F label="Zona de interés"><span style={{ fontSize: '0.875rem', color: '#0F172A' }}>{cliente.zonaInteres || '—'}</span></F>
                  {(cliente.habitacionesMin != null) && (
                    <F label="Habitaciones"><span style={{ fontSize: '0.875rem', color: '#0F172A' }}>{cliente.habitacionesMin}{cliente.habitacionesMax ? `–${cliente.habitacionesMax}` : '+'}</span></F>
                  )}
                  <F label="Origen"><span style={{ fontSize: '0.875rem', color: '#0F172A' }}>{cliente.origen || '—'}</span></F>
                </div>
              </div>

              {/* Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cliente.telefono && (
                  <a href={`tel:${cliente.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', color: '#0F172A', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <Phone size={15} style={{ color: '#4A6FA5' }} /> {cliente.telefono}
                  </a>
                )}
                {cliente.email && (
                  <a href={`mailto:${cliente.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', color: '#4A6FA5', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <Mail size={15} /> {cliente.email}
                  </a>
                )}
              </div>

              {/* Cambio de estado rápido */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', marginBottom: 8 }}>Cambiar estado</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ESTADOS.map(s => (
                    <button key={s} onClick={async () => {
                      try {
                        await clientesApi.update(cliente.id, { estado: s });
                        qc.invalidateQueries({ queryKey: ['clientes'] });
                        toast.success(`Estado → ${s}`);
                        onClose();
                      } catch { toast.error('Error actualizando estado'); }
                    }}
                    style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${s === cliente.estado ? '#1A3A5C' : '#CBD5E1'}`, background: s === cliente.estado ? '#1A3A5C' : 'white', color: s === cliente.estado ? 'white' : '#475569', cursor: 'pointer', fontSize: '0.78rem', fontWeight: s === cliente.estado ? 600 : 400 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {cliente.notas && (
                <F label="Notas">
                  <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, background: '#F8FAFC', padding: '0.75rem', borderRadius: 8 }}>{cliente.notas}</div>
                </F>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          {edit ? (
            <>
              <button onClick={() => setEdit(false)} style={{ border: '1px solid #CBD5E1', background: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748B' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleDelete} style={{ background: 'white', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} /> Eliminar
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ border: '1px solid #CBD5E1', background: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748B' }}>Cerrar</button>
                <button onClick={() => setEdit(true)} style={{ background: '#1A3A5C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={15} /> Editar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function Clientes() {
  const queryClient = useQueryClient();
  const [search, setSearch]   = useState('');
  const [estado, setEstado]   = useState('');
  const [view, setView]       = useState('lista');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', estado],
    queryFn: () => clientesApi.list({ estado: estado || undefined, limit: 100 }),
  });

  const updateEstado = useMutation({
    mutationFn: ({ id, estado }) => clientesApi.update(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Estado actualizado');
    },
  });

  const clientes = (data?.data || []).filter(c =>
    !search || `${c.nombre} ${c.apellidos || ''} ${c.email || ''} ${c.telefono || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const pipeline = ESTADOS.reduce((acc, e) => {
    acc[e] = clientes.filter(c => c.estado === e);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Clientes &amp; Leads</h2>
          <p>{data?.meta?.total ?? 0} contactos en el pipeline</p>
        </div>
        <div className="page-header-actions">
          <button className={`filter-chip${view === 'lista' ? ' active' : ''}`} onClick={() => setView('lista')}>Lista</button>
          <button className={`filter-chip${view === 'pipeline' ? ' active' : ''}`} onClick={() => setView('pipeline')}>Pipeline</button>
          <button className="btn btn-primary"><Plus size={16} />Nuevo Lead</button>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="search-input" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['', ...ESTADOS].map(e => (
          <button key={e} className={`filter-chip${estado === e ? ' active' : ''}`} onClick={() => setEstado(e)}>
            {e === '' ? 'Todos' : e.charAt(0) + e.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : view === 'pipeline' ? (
        <div className="pipeline-board">
          {ESTADOS.map(e => (
            <div key={e} className="pipeline-column">
              <div className="pipeline-column-header">
                <span className="pipeline-column-title">{e.charAt(0) + e.slice(1).toLowerCase()}</span>
                <span className="pipeline-count">{pipeline[e]?.length ?? 0}</span>
              </div>
              {pipeline[e]?.map(c => (
                <div key={c.id} className="pipeline-card" onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.87rem', marginBottom: 4 }}>{c.nombre} {c.apellidos}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8A9BB0', marginBottom: 8 }}>{TIPO_ICON[c.tipo]} {c.tipo} · {c.zonaInteres || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4A5568', fontWeight: 600 }}>{formatMoney(c.presupuesto)}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {ESTADOS.filter(s => s !== e).slice(0, 3).map(s => (
                      <button key={s} onClick={ev => { ev.stopPropagation(); updateEstado.mutate({ id: c.id, estado: s }); }}
                        style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 12, border: '1px solid #DDD8CF', cursor: 'pointer', background: 'white', color: '#4A5568' }}>
                        → {s.charAt(0) + s.slice(1, 4).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Tipo</th>
                  <th>Zona interés</th>
                  <th>Presupuesto</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#8A9BB0' }}>Sin clientes</td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.nombre} {c.apellidos}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>{TIPO_ICON[c.tipo]} {c.tipo}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {c.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}><Phone size={11} />{c.telefono}</span>}
                        {c.email    && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#4A6FA5' }}><Mail size={11} />{c.email}</span>}
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.78rem' }}>{c.tipo}</span></td>
                    <td style={{ fontSize: '0.82rem', color: '#4A5568' }}>{c.zonaInteres || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(c.presupuesto)}</td>
                    <td><span className={`badge ${ESTADO_BADGE[c.estado] || ''}`}>{c.estado}</span></td>
                    <td style={{ fontSize: '0.78rem', color: '#8A9BB0' }}>{c.origen || '—'}</td>
                    <td><ChevronRight size={15} style={{ color: '#94A3B8' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <ClienteDrawer cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
