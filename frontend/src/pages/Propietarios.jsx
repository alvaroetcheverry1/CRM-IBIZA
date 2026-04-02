import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propietariosApi } from '../services/api';
import { Search, Plus, Phone, Mail, Building2, X, Save, Loader2, Pencil, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIA_BADGE = { PREMIUM: 'badge-reservada', ESTANDAR: 'badge-larga', NUEVO: 'badge-nuevo' };
const CATEGORIAS = ['PREMIUM', 'ESTANDAR', 'NUEVO'];

// ─── Drawer de detalle/edición de propietario ───────────────────────────────
function PropietarioDrawer({ propietario, onClose }) {
  const qc = useQueryClient();
  const [edit, setEdit]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    nombre:    propietario.nombre    ?? '',
    apellidos: propietario.apellidos ?? '',
    email:     propietario.email     ?? '',
    telefono:  propietario.telefono  ?? '',
    ciudad:    propietario.ciudad    ?? '',
    pais:      propietario.pais      ?? '',
    nif:       propietario.nif       ?? '',
    categoria: propietario.categoria ?? 'ESTANDAR',
    notas:     propietario.notas     ?? '',
  });

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSave() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      await propietariosApi.update(propietario.id, form);
      qc.invalidateQueries({ queryKey: ['propietarios'] });
      toast.success('✅ Propietario actualizado');
      setEdit(false);
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'desconocido'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Estás seguro de eliminar este propietario? Esta acción es irreversible.')) return;
    try {
      await propietariosApi.delete(propietario.id);
      qc.invalidateQueries({ queryKey: ['propietarios'] });
      toast.success('Propietario eliminado');
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

  const inp = (key, opts = {}) => (
    <input
      className="form-input"
      value={form[key]}
      onChange={e => setField(key, e.target.value)}
      style={{ width: '100%', fontSize: '0.875rem' }}
      {...opts}
    />
  );

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, backdropFilter: 'blur(2px)' }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: 'white', zIndex: 901, boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1A3A5C,#2D5F8F)', color: 'white', padding: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                {propietario.nombre?.[0]}{propietario.apellidos?.[0]}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{propietario.nombre} {propietario.apellidos}</h3>
                <div style={{ opacity: 0.75, fontSize: '0.8rem', marginTop: 2 }}>{propietario.nif}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
              {propietario.categoria}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem' }}>
              🏠 {propietario._count?.propiedades ?? 0} propiedades
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {edit ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <F label="Nombre">{inp('nombre')}</F>
                <F label="Apellidos">{inp('apellidos')}</F>
                <F label="Email" ><input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} /></F>
                <F label="Teléfono">{inp('telefono')}</F>
                <F label="NIF/NIE/Pasaporte">{inp('nif')}</F>
                <F label="Categoría">
                  <select className="form-select" value={form.categoria} onChange={e => setField('categoria', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>
                <F label="Ciudad">{inp('ciudad')}</F>
                <F label="País">{inp('pais')}</F>
              </div>
              <F label="Notas internas">
                <textarea className="form-input" value={form.notas} onChange={e => setField('notas', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem' }} />
              </F>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  ['Email', propietario.email],
                  ['Teléfono', propietario.telefono],
                  ['Ciudad', propietario.ciudad],
                  ['País', propietario.pais],
                  ['NIF / Pasaporte', propietario.nif],
                  ['Categoría', propietario.categoria],
                ].map(([label, val]) => (
                  <F key={label} label={label}>
                    <div style={{ fontWeight: val ? 500 : 400, color: val ? '#0F172A' : '#8A9BB0', fontSize: '0.875rem' }}>{val || '—'}</div>
                  </F>
                ))}
              </div>
              {propietario.notas && (
                <F label="Notas">
                  <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, background: '#F8FAFC', padding: '0.75rem', borderRadius: 8 }}>{propietario.notas}</div>
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

// ─── Modal nuevo propietario ────────────────────────────────────────────────
function ModalNuevoPropietario({ onClose, onCreate }) {
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', telefono: '', nif: '', ciudad: '', pais: 'España', categoria: 'ESTANDAR' });
  const [loading, setLoading] = useState(false);
  function setField(k, v) { setForm(p => ({ ...p, [k]: v })); }
  async function handleCreate() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setLoading(true);
    await onCreate(form);
    setLoading(false);
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 950, padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ background: '#1A3A5C', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Nuevo Propietario</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {[['nombre','Nombre *'],['apellidos','Apellidos'],['email','Email'],['telefono','Teléfono'],['nif','NIF / Pasaporte'],['ciudad','Ciudad']].map(([k,l]) => (
            <div key={k}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{l}</label>
              <input className="form-input" value={form[k]} onChange={e => setField(k, e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>País</label>
            <input className="form-input" value={form.pais} onChange={e => setField('pais', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Categoría</label>
            <select className="form-select" value={form.categoria} onChange={e => setField('categoria', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ border: '1px solid #CBD5E1', background: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
          <button onClick={handleCreate} disabled={loading} style={{ background: '#1A3A5C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
            {loading ? 'Creando...' : 'Crear Propietario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function Propietarios() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [categoria, setCategoria] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['propietarios', categoria],
    queryFn: () => propietariosApi.list({ categoria: categoria || undefined, limit: 50 }),
  });

  const propietarios = (data?.data || []).filter(p =>
    !search || `${p.nombre} ${p.apellidos} ${p.email || ''} ${p.telefono || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(data) {
    try {
      await propietariosApi.create(data);
      qc.invalidateQueries({ queryKey: ['propietarios'] });
      toast.success('✅ Propietario creado');
      setShowNew(false);
    } catch (err) {
      toast.error('Error: ' + (err.message || 'desconocido'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Propietarios</h2>
          <p>{data?.meta?.total ?? 0} propietarios registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> Nuevo Propietario</button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="search-input" placeholder="Buscar propietario..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['', 'PREMIUM', 'ESTANDAR', 'NUEVO'].map(c => (
          <button key={c} className={`filter-chip${categoria === c ? ' active' : ''}`} onClick={() => setCategoria(c)}>
            {c === '' ? 'Todos' : c === 'PREMIUM' ? '⭐ Premium' : c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Propietario</th>
                  <th>Contacto</th>
                  <th>Categoría</th>
                  <th>Ciudad</th>
                  <th>Propiedades</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {propietarios.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#8A9BB0' }}>Sin propietarios</td></tr>
                ) : propietarios.map(p => (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1A3A5C,#4A6FA5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                          {p.nombre?.[0]}{p.apellidos?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.nombre} {p.apellidos}</div>
                          <div style={{ fontSize: '0.72rem', color: '#8A9BB0' }}>{p.nif}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {p.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}><Phone size={11} />{p.telefono}</span>}
                        {p.email && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#4A6FA5' }}><Mail size={11} />{p.email}</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${CATEGORIA_BADGE[p.categoria] || ''}`}>{p.categoria}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{p.ciudad || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} style={{ color: '#8A9BB0' }} />
                        <span style={{ fontWeight: 600 }}>{p._count?.propiedades ?? 0}</span>
                      </div>
                    </td>
                    <td><ChevronRight size={16} style={{ color: '#94A3B8' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <PropietarioDrawer propietario={selected} onClose={() => setSelected(null)} />}
      {showNew   && <ModalNuevoPropietario onClose={() => setShowNew(false)} onCreate={handleCreate} />}
    </div>
  );
}
