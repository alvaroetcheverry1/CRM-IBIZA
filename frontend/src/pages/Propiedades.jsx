import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propiedadesApi, propietariosApi } from '../services/api';
import { MapPin, Bed, Bath, Square, Plus, Search, X, Loader2, FileText, Image as ImageIcon, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalCrearPropiedadUnificado from '../components/ModalCrearPropiedadUnificado';

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
  let images = [];
  if (p.fotos) {
    try {
      const parsed = JSON.parse(p.fotos);
      if (Array.isArray(parsed)) {
        images = parsed.filter(url => typeof url === 'string' && url.trim().length > 0);
      }
    } catch(e) {}
  }
  
  if (images.length === 0 && p.fotoPrincipal) {
    images.push(p.fotoPrincipal);
  }
  if (images.length === 0 && p.documentos && p.documentos[0]?.urlDrive) {
    images.push(p.documentos[0].urlDrive);
  }
  
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextImg = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % images.length);
  };
  
  const prevImg = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="property-card" onClick={onClick}>
      <div className="property-card-img" style={{ position: 'relative' }}>
        {images.length > 0
          ? (
            <>
              <img 
                src={images[currentIdx]} 
                alt={p.nombre} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }} 
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
              <div style={{display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center', fontSize:'3rem', background:'#f0f0f0'}}>🏠</div>
              {images.length > 1 && (
                <>
                  <button onClick={prevImg} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: 2 }}>‹</button>
                  <button onClick={nextImg} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: 2 }}>›</button>
                  <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                    {images.map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === currentIdx ? 'white' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                </>
              )}
            </>
          )
          : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem'}}>🏠</div>
        }
        <div className="property-card-badges" style={{ zIndex: 10 }}>
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
// (Movido a ModalCrearPropiedadUnificado.jsx)

export default function Propiedades() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Debounce simple para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['propiedades', tipo, estado, page, debouncedSearch],
    queryFn: () => propiedadesApi.list({ tipo: tipo || undefined, estado: estado || undefined, search: debouncedSearch || undefined, page, limit: 12 }),
  });

  const propiedades = data?.data || [];

  return (
    <div>
      {showCreateModal && (
        <ModalCrearPropiedadUnificado
          onClose={() => setShowCreateModal(false)}
          onSuccess={(propObj) => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['propiedades'] });
            if (propObj?.id) navigate(`/propiedades/${propObj.id}`);
          }}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Propiedades</h2>
          <p>Portfolio completo — {data?.meta?.total ?? 0} propiedades</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Nueva Propiedad
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
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowCreateModal(true)}>
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
