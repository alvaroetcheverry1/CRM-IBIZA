import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propiedadesApi, propietariosApi } from '../services/api';
import { MapPin, Bed, Bath, Square, Plus, Search, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPO_LABEL = { VACACIONAL: 'Vacacional', LARGA_DURACION: 'Larga Duración', VENTA: 'Venta' };
const ESTADO_BADGE = {
  DISPONIBLE: 'badge-disponible', ALQUILADA: 'badge-alquilada',
  RESERVADA: 'badge-reservada', VENDIDA: 'badge-vendida',
};
const TIPO_BADGE = {
  VACACIONAL: 'badge-vacacional', LARGA_DURACION: 'badge-larga', VENTA: 'badge-venta',
};

function getPrecio(p) {
  if (p.tipo === 'VENTA') return p.venta?.precioVenta;
  if (p.tipo === 'VACACIONAL') return p.alquilerVacacional?.precioTemporadaAlta;
  if (p.tipo === 'LARGA_DURACION') return p.alquilerLargaDuracion?.rentaMensual;
  return null;
}

function getPrecioLabel(tipo) {
  if (tipo === 'VENTA') return '';
  if (tipo === 'VACACIONAL') return ' / semana (T.Alta)';
  return ' / mes';
}

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function PropertyCard({ p, onClick }) {
  const imageUrl = p.fotoPrincipal || (p.documentos && p.documentos[0]?.urlDrive) || null;

  return (
    <div className="property-card" onClick={onClick}>
      <div className="property-card-img">
        {imageUrl
          ? <img src={imageUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem'}}>🏠</div>
        }
        <div className="property-card-badges">
          <span className={`badge ${TIPO_BADGE[p.tipo]}`}>{TIPO_LABEL[p.tipo]}</span>
          <span className={`badge ${ESTADO_BADGE[p.estado] || ''}`}>{p.estado}</span>
        </div>
      </div>
      <div className="property-card-body">
        <div className="property-referencia">{p.referencia}</div>
        <div className="property-name">{p.nombre}</div>
        <div className="property-zona"><MapPin size={13} />{p.zona}</div>
        <div className="property-specs">
          <div className="property-spec"><Bed size={13} />{p.habitaciones} hab.</div>
          <div className="property-spec"><Bath size={13} />{p.banos} baños</div>
          <div className="property-spec"><Square size={13} />{p.metrosConstruidos}m²</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="property-price">{formatMoney(getPrecio(p))}</span>
          <span className="property-price-label">{getPrecioLabel(p.tipo)}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#8A9BB0' }}>
          {p.propietario?.nombre} {p.propietario?.apellidos}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Nueva Propiedad ────────────────────────────────────────────────────
function ModalNuevaPropiedad({ onClose, onCrear }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('VENTA');
  const [zona, setZona] = useState('');
  const [habitaciones, setHabitaciones] = useState(0);
  const [banos, setBanos] = useState(0);
  const [metros, setMetros] = useState(0);
  const [precio, setPrecio] = useState('');
  const [propietarioId, setPropietarioId] = useState('');
  const [propietarios, setPropietarios] = useState([]);
  const [loadingPropietarios, setLoadingPropietarios] = useState(true);
  const [loading, setLoading] = useState(false);

  // Cargar propietarios al abrir el modal
  useEffect(() => {
    propietariosApi.list({ limit: 100 })
      .then(res => setPropietarios(res?.data || []))
      .catch(() => setPropietarios([]))
      .finally(() => setLoadingPropietarios(false));
  }, []);


  const handleCreate = async () => {
    if (!nombre.trim() || !zona.trim()) return toast.error('Nombre y zona son obligatorios');
    setLoading(true);
    await onCrear({
      nombre: nombre.trim(), tipo, zona: zona.trim(),
      habitaciones: Number(habitaciones), banos: Number(banos),
      metrosConstruidos: Number(metros), precio,
      propietarioId: propietarioId || null,
    });
    setLoading(false);
  };

  const precioLabel = tipo === 'VENTA' ? 'Precio Venta (€)' : tipo === 'VACACIONAL' ? 'Precio/sem Temp. Alta (€)' : 'Renta Mensual (€)';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, padding: '2rem', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="#1A3A5C" /> Nueva Propiedad
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre / Denominación *</label>
            <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Villa Can Pere Jaume" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tipo de Operación *</label>
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="VENTA">Venta</option>
                <option value="VACACIONAL">Alquiler Vacacional</option>
                <option value="LARGA_DURACION">Alquiler Larga Duración</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Zona / Municipio *</label>
              <input className="form-input" value={zona} onChange={e => setZona(e.target.value)} placeholder="Ej. Sant Josep" />
            </div>
          </div>

          {/* ── Propietario ── */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Propietario (opcional)</label>
            <select
              className="form-select"
              value={propietarioId}
              onChange={e => setPropietarioId(e.target.value)}
              disabled={loadingPropietarios}
            >
              <option value="">— Sin asignar —</option>
              {propietarios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellidos || ''}{p.empresa ? ` (${p.empresa})` : ''}
                </option>
              ))}
            </select>
            {loadingPropietarios && (
              <div style={{ fontSize: '0.72rem', color: '#8A9BB0', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Loader2 size={11} className="spin" /> Cargando propietarios...
              </div>
            )}
            {!loadingPropietarios && propietarios.length === 0 && (
              <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: 4 }}>
                ⚠ No hay propietarios en el sistema. Puedes añadir uno después.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Habitaciones</label>
              <input className="form-input" type="number" min="0" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Baños</label>
              <input className="form-input" type="number" min="0" value={banos} onChange={e => setBanos(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>m² Construidos</label>
              <input className="form-input" type="number" min="0" value={metros} onChange={e => setMetros(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{precioLabel}</label>
            <input className="form-input" type="text" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 1500000" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading}
            style={{ background: '#1A3A5C', borderColor: '#1A3A5C', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            {loading ? 'Creando...' : 'Crear Propiedad'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Propiedades() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['propiedades', tipo, estado, page],
    queryFn: () => propiedadesApi.list({ tipo: tipo || undefined, estado: estado || undefined, page, limit: 12 }),
  });

  const propiedades = (data?.data || []).filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.zona.toLowerCase().includes(search.toLowerCase())
  );

  const handleCrear = async ({ nombre, tipo: t, zona, habitaciones, banos, metrosConstruidos, precio, propietarioId }) => {
    try {
      const propData = { nombre, tipo: t, zona, habitaciones, banos, metrosConstruidos, propietarioId: propietarioId || undefined };
      const precioNum = parseInt((precio || '').replace(/[^0-9]/g, ''), 10) || 0;
      if (t === 'VENTA') propData.venta = { precioVenta: precioNum };
      if (t === 'VACACIONAL') propData.alquilerVacacional = { precioTemporadaAlta: precioNum };
      if (t === 'LARGA_DURACION') propData.alquilerLargaDuracion = { rentaMensual: precioNum };
      const created = await propiedadesApi.create(propData);
      queryClient.invalidateQueries({ queryKey: ['propiedades'] });
      toast.success(`✅ Propiedad "${nombre}" creada en el CRM`);
      setShowModal(false);
      if (created?.id) navigate(`/propiedades/${created.id}`);
    } catch (err) {
      toast.error('Error al crear la propiedad: ' + (err.message || 'desconocido'));
    }
  };

  return (
    <div>
      {showModal && <ModalNuevaPropiedad onClose={() => setShowModal(false)} onCrear={handleCrear} />}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Propiedades</h2>
          <p>Portfolio completo — {data?.meta?.total ?? 0} propiedades</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Nueva Propiedad
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Buscar por nombre, zona..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {['', 'VACACIONAL', 'LARGA_DURACION', 'VENTA'].map(t => (
          <button
            key={t}
            className={`filter-chip${tipo === t ? ' active' : ''}`}
            onClick={() => { setTipo(t); setPage(1); }}
          >
            {t === '' ? 'Todos' : t === 'VACACIONAL' ? '🌴 Vacacional' : t === 'LARGA_DURACION' ? '🏡 Larga Duración' : '🏛 Venta'}
          </button>
        ))}
        {['', 'DISPONIBLE', 'ALQUILADA', 'RESERVADA', 'VENDIDA'].map(e => (
          <button
            key={e}
            className={`filter-chip${estado === e ? ' active' : ''}`}
            onClick={() => { setEstado(e); setPage(1); }}
          >
            {e === '' ? 'Todos estados' : e.charAt(0) + e.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : propiedades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '2rem' }}>🏠</div>
          <h3>Sin propiedades</h3>
          <p>Añade tu primera propiedad al portfolio</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nueva Propiedad
          </button>
        </div>
      ) : (
        <>
          <div className="properties-grid">
            {propiedades.map(p => (
              <PropertyCard key={p.id} p={p} onClick={() => navigate(`/propiedades/${p.id}`)} />
            ))}
          </div>

          {data?.meta?.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: data.meta.totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-btn${page === i + 1 ? ' active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
