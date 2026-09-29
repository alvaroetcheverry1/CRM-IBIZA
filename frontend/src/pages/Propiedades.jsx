import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propiedadesApi, propietariosApi } from '../services/api';
import { MapPin, Bed, Bath, Square, Plus, Search, X, Loader2, FileText, Image as ImageIcon, ChevronDown, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalCrearPropiedadUnificado from '../components/ModalCrearPropiedadUnificado';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as XLSX from 'xlsx';

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
    } catch(e) {
      if (typeof p.fotos === 'string') {
        images = p.fotos.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }
  
  if (images.length === 0 && p.fotoPrincipal) {
    images.push(p.fotoPrincipal);
  }
  if (images.length === 0 && p.documentos && p.documentos[0]?.urlDrive) {
    images.push(p.documentos[0].urlDrive);
  }

  const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
  images = images.map(url => {
    if (url && url.startsWith('/')) return `${BACKEND_URL}${url}`;
    return url;
  });
  
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

// ─── Componente de Mapa ──────────────────────────────────────────────────────────
function MapView({ propiedades, navigate }) {
  const center = [38.9067, 1.4206]; // Centro de Ibiza

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #CBD5E1', marginBottom: '2rem' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {propiedades.map(p => {
          const lat = parseFloat(p.latitud);
          const lng = parseFloat(p.longitud);
          if (isNaN(lat) || isNaN(lng)) return null;

          const color = p.tipo === 'VACACIONAL' ? '#4A6FA5' : p.tipo === 'LARGA_DURACION' ? '#1A3A5C' : '#C9A84C';
          const customIcon = L.divIcon({
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
            className: 'custom-map-pin',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          return (
            <Marker key={p.id} position={[lat, lng]} icon={customIcon}>
              <Popup>
                <div style={{ width: '200px', fontFamily: 'sans-serif' }}>
                  {p.fotoPrincipal && (
                    <img 
                      src={p.fotoPrincipal} 
                      alt={p.nombre} 
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} 
                    />
                  )}
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1A3A5C' }}>{p.nombre}</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: '#8A9BB0' }}>{p.zona}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{formatMoney(getPrecio(p))}</span>
                    <button 
                      onClick={() => navigate(`/propiedades/${p.id}`)}
                      style={{ background: '#1A3A5C', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Ver Detalle
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [habs, setHabs] = useState('');
  const [banos, setBanos] = useState('');
  const [piscina, setPiscina] = useState('');
  const [minPrecio, setMinPrecio] = useState('');
  const [maxPrecio, setMaxPrecio] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Debounce simple para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['propiedades', tipo, estado, page, debouncedSearch, habs, banos, piscina, minPrecio, maxPrecio],
    queryFn: () => propiedadesApi.list({ 
      tipo: tipo || undefined, 
      estado: estado || undefined, 
      search: debouncedSearch || undefined, 
      page, 
      limit: 12,
      habitaciones: habs ? parseInt(habs, 10) : undefined,
      banos: banos ? parseInt(banos, 10) : undefined,
      piscina: piscina || undefined,
      precioMin: minPrecio ? parseFloat(minPrecio) : undefined,
      precioMax: maxPrecio ? parseFloat(maxPrecio) : undefined
    }),
  });

  const propiedades = data?.data || [];

  const handleExportExcel = () => {
    toast.success('Generando archivo Excel de propiedades...');
    try {
      const dataToExport = propiedades.map(p => ({
        'Referencia': p.referencia,
        'Nombre': p.nombre,
        'Tipo': TIPO_LABEL[p.tipo] || p.tipo,
        'Estado': p.estado,
        'Zona': p.zona,
        'Municipio': p.municipio || '—',
        'Habitaciones': p.habitaciones || 0,
        'Baños': p.banos || 0,
        'm² Construidos': p.metrosConstruidos || 0,
        'm² Parcela': p.metrosParcela || '—',
        'Precio': getPrecio(p),
        'Licencia ETV': p.alquilerVacacional?.licenciaETV || '—',
        'Propietario': p.propietario ? `${p.propietario.nombre} ${p.propietario.apellidos || ''}` : '—',
        'Descripción': p.descripcion || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Propiedades");
      
      // Auto-ajustar columnas
      const maxLen = {};
      dataToExport.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = String(row[key] || '');
          maxLen[key] = Math.max(maxLen[key] || 10, val.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLen).map(key => ({ wch: maxLen[key] + 3 }));

      XLSX.writeFile(workbook, `Propiedades_CRM_Ibiza_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel de propiedades descargado');
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar propiedades a Excel');
    }
  };

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
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', marginRight: '0.5rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ borderRadius: 0, border: 'none', padding: '0.4rem 0.8rem' }}
            >
              📋 Lista
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('map')}
              style={{ borderRadius: 0, border: 'none', padding: '0.4rem 0.8rem' }}
            >
              🗺️ Mapa
            </button>
          </div>
          <button className="btn btn-outline" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} /> Exportar Excel
          </button>
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
      <div className="filters-bar" style={{ marginBottom: '0.5rem' }}>
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

      {/* Botón de Filtros Avanzados */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)} 
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          <Filter size={14} /> {showAdvanced ? 'Ocultar Filtros' : 'Filtros Avanzados'}
        </button>
      </div>

      {/* Panel de Filtros Avanzados */}
      {showAdvanced && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <h4 style={{ color: '#1A3A5C', marginBottom: '1rem', marginTop: 0 }}>Filtros Avanzados</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Habitaciones (mínimo)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                placeholder="Ej. 3" 
                value={habs}
                onChange={e => { setHabs(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Baños (mínimo)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                placeholder="Ej. 2" 
                value={banos}
                onChange={e => { setBanos(e.target.value); setPage(1); }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Piscina</label>
              <select 
                className="form-select" 
                value={piscina}
                onChange={e => { setPiscina(e.target.value); setPage(1); }}
              >
                <option value="">Cualquiera</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Precio Mínimo (€)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                placeholder="Ej. 1000" 
                value={minPrecio}
                onChange={e => { setMinPrecio(e.target.value); setPage(1); }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Precio Máximo (€)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                placeholder="Ej. 500000" 
                value={maxPrecio}
                onChange={e => { setMaxPrecio(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => {
                setHabs('');
                setBanos('');
                setPiscina('');
                setMinPrecio('');
                setMaxPrecio('');
                setPage(1);
              }}
              style={{ color: '#EF4444', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : viewMode === 'map' ? (
        <MapView propiedades={propiedades} navigate={navigate} />
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
