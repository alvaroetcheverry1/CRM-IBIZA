import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propiedadesApi } from '../services/api';
import {
  Building2, MapPin, BedDouble, Ruler, Trophy, TrendingUp,
  ChevronRight, ExternalLink, Loader2, Euro
} from 'lucide-react';

// Helper para PATCH autenticado
async function patchPipeline(id, etapaPipeline) {
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${BASE_URL}/propiedades/${id}/pipeline`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ etapaPipeline }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Configuración de columnas ────────────────────────────────
const COLUMNAS = [
  { id: 'CAPTACION',  label: 'Captación',  color: '#8A9BB0', emoji: '📋' },
  { id: 'VALORACION', label: 'Valoración', color: '#4A6FA5', emoji: '💰' },
  { id: 'VISITAS',    label: 'Visitas',    color: '#C9A84C', emoji: '👁️' },
  { id: 'OFERTA',     label: 'Oferta',     color: '#E8763A', emoji: '📝' },
  { id: 'ARRAS',      label: 'Arras',      color: '#9B59B6', emoji: '🤝' },
  { id: 'ESCRITURA',  label: 'Escritura',  color: '#1A3A5C', emoji: '⚖️' },
  { id: 'CERRADO',    label: 'Cerrado',    color: '#2D8A5E', emoji: '✅' },
];

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

// ── Tarjeta de propiedad ─────────────────────────────────────
function PipelineCard({ propiedad, onDragStart }) {
  const navigate = useNavigate();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, propiedad.id)}
      className="pipeline-card"
      style={{ userSelect: 'none' }}
    >
      {/* Foto o placeholder */}
      <div style={{
        height: 100, borderRadius: 8, marginBottom: 10, overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A3A5C 0%, #4A6FA5 100%)',
        position: 'relative', flexShrink: 0,
      }}>
        {propiedad.fotoPrincipal ? (
          <img
            src={propiedad.fotoPrincipal}
            alt={propiedad.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Building2 size={32} color="rgba(255,255,255,0.35)" />
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 6, left: 6,
          background: 'rgba(13,27,42,0.75)', borderRadius: 4,
          padding: '2px 7px', fontSize: '0.68rem', fontWeight: 600, color: '#C9A84C',
        }}>
          {propiedad.referencia}
        </div>
      </div>

      {/* Nombre */}
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0D1B2A', marginBottom: 4, lineHeight: 1.3 }}>
        {propiedad.nombre}
      </div>

      {/* Zona */}
      {propiedad.zona && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#8A9BB0', marginBottom: 8 }}>
          <MapPin size={11} />
          {propiedad.zona}
        </div>
      )}

      {/* Specs */}
      <div style={{ display: 'flex', gap: 10, fontSize: '0.73rem', color: '#4A5568', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <BedDouble size={11} /> {propiedad.habitaciones}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Ruler size={11} /> {propiedad.metrosConstruidos}m²
        </span>
      </div>

      {/* Precio */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid #EDE9E0',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0D1B2A' }}>
          {formatMoney(propiedad.venta?.precioVenta)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/propiedades/${propiedad.id}`); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#4A6FA5', display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.72rem', fontWeight: 600, padding: '3px 6px',
            borderRadius: 5, transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,111,165,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          Ver <ExternalLink size={11} />
        </button>
      </div>

      {/* Agente */}
      {propiedad.agente && (
        <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#8A9BB0' }}>
          Agente: {propiedad.agente.nombre}
        </div>
      )}
    </div>
  );
}

// ── Columna del Kanban ───────────────────────────────────────
function KanbanColumn({ col, propiedades, onDragStart, onDrop, onDragOver }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const total = propiedades.reduce((sum, p) => sum + Number(p.venta?.precioVenta || 0), 0);

  return (
    <div
      className="pipeline-column"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, col.id); }}
      style={{
        outline: isDragOver ? `2px dashed ${col.color}` : '2px dashed transparent',
        background: isDragOver ? `${col.color}18` : 'var(--bg-primary)',
        transition: 'all 0.2s',
      }}
    >
      {/* Header columna */}
      <div className="pipeline-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.95rem' }}>{col.emoji}</span>
          <div>
            <div
              className="pipeline-column-title"
              style={{ color: col.color }}
            >
              {col.label}
            </div>
            {total > 0 && (
              <div style={{ fontSize: '0.68rem', color: '#8A9BB0', marginTop: 1 }}>
                {formatMoney(total)}
              </div>
            )}
          </div>
        </div>
        <span className="pipeline-count" style={{ borderColor: `${col.color}40`, color: col.color }}>
          {propiedades.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ minHeight: 60 }}>
        {propiedades.map(p => (
          <PipelineCard key={p.id} propiedad={p} onDragStart={onDragStart} />
        ))}
        {propiedades.length === 0 && (
          <div style={{
            border: '2px dashed #DDD8CF', borderRadius: 8, padding: '1.5rem',
            textAlign: 'center', color: '#8A9BB0', fontSize: '0.75rem',
          }}>
            Arrastra aquí
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function PipelineVentas() {
  const queryClient = useQueryClient();
  const dragId = useRef(null);

  // Cargar propiedades de venta
  const { data, isLoading } = useQuery({
    queryKey: ['propiedades-venta-pipeline'],
    queryFn: () => propiedadesApi.list({ tipo: 'VENTA', limit: 200 }),
  });

  const propiedades = data?.data || [];

  // Mutation para actualizar etapa
  const mutarEtapa = useMutation({
    mutationFn: ({ id, etapaPipeline }) => patchPipeline(id, etapaPipeline),
    onMutate: async ({ id, etapaPipeline }) => {
      // Optimistic update
      await queryClient.cancelQueries(['propiedades-venta-pipeline']);
      const prev = queryClient.getQueryData(['propiedades-venta-pipeline']);
      queryClient.setQueryData(['propiedades-venta-pipeline'], old => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(p =>
            p.id === id
              ? { ...p, venta: { ...p.venta, etapaPipeline } }
              : p
          ),
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['propiedades-venta-pipeline'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['propiedades-venta-pipeline']);
    },
  });

  const handleDragStart = (e, id) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, nuevaEtapa) => {
    e.preventDefault();
    if (!dragId.current) return;
    const propiedad = propiedades.find(p => p.id === dragId.current);
    const etapaActual = propiedad?.venta?.etapaPipeline || 'CAPTACION';
    if (etapaActual !== nuevaEtapa) {
      mutarEtapa.mutate({ id: dragId.current, etapaPipeline: nuevaEtapa });
    }
    dragId.current = null;
  };

  // Agrupar por etapa
  const porEtapa = COLUMNAS.reduce((acc, col) => {
    acc[col.id] = propiedades.filter(p => {
      const etapa = p.venta?.etapaPipeline || 'CAPTACION';
      return etapa === col.id;
    });
    return acc;
  }, {});

  // KPIs globales
  const totalVolumen = propiedades.reduce((sum, p) => sum + Number(p.venta?.precioVenta || 0), 0);
  const enArras = porEtapa['ARRAS']?.length || 0;
  const cerradas = porEtapa['CERRADO']?.length || 0;
  const tasaConversion = propiedades.length > 0
    ? Math.round((cerradas / propiedades.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Cargando pipeline...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>🏗️ Pipeline de Ventas</h2>
          <p>Gestiona el embudo de ventas arrastrando las propiedades entre etapas</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mutarEtapa.isPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8A9BB0', fontSize: '0.82rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Guardando...
            </div>
          )}
        </div>
      </div>

      {/* KPIs resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon navy"><Building2 size={20} /></div>
          <div>
            <div className="kpi-value">{propiedades.length}</div>
            <div className="kpi-label">Total en Pipeline</div>
          </div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-icon gold"><Euro size={20} /></div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatMoney(totalVolumen)}</div>
            <div className="kpi-label">Volumen Total</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><TrendingUp size={20} /></div>
          <div>
            <div className="kpi-value">{enArras}</div>
            <div className="kpi-label">En Arras firmadas</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Trophy size={20} /></div>
          <div>
            <div className="kpi-value">{tasaConversion}%</div>
            <div className="kpi-label">Tasa de cierre</div>
          </div>
        </div>
      </div>

      {/* Flecha de flujo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden',
        padding: '0.25rem 0',
      }}>
        {COLUMNAS.map((col, i) => (
          <div key={col.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{
              flex: 1, height: 4, background: col.color, borderRadius: 2,
              opacity: 0.5,
            }} />
            {i < COLUMNAS.length - 1 && <ChevronRight size={14} color="#DDD8CF" />}
          </div>
        ))}
      </div>

      {/* Tablero Kanban */}
      <div className="pipeline-board" style={{ paddingBottom: '1rem' }}>
        {COLUMNAS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            propiedades={porEtapa[col.id] || []}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
