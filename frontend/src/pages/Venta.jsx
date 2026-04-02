import { useQuery } from '@tanstack/react-query';
import { propiedadesApi } from '../services/api';
import { MapPin, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const ETAPAS = ['CAPTACION', 'COMERCIALIZACION', 'OFERTA', 'ARRAS', 'ESCRITURA', 'VENDIDO'];
const ETAPA_COLORS = {
  CAPTACION: '#8A9BB0', COMERCIALIZACION: '#4A6FA5', OFERTA: '#1A3A5C',
  ARRAS: '#C9A84C', ESCRITURA: '#E8C96A', VENDIDO: '#2D8A5E',
};

export default function Venta() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['propiedades-venta'],
    queryFn: () => propiedadesApi.list({ tipo: 'VENTA', limit: 50 }),
  });

  const propiedades = data?.data || [];

  // Agrupar por etapa pipeline
  const porEtapa = ETAPAS.reduce((acc, e) => {
    acc[e] = propiedades.filter(p => p.venta?.etapaPipeline === e);
    return acc;
  }, {});

  const valorTotal = propiedades.reduce((sum, p) => sum + (Number(p.venta?.precioVenta) || 0), 0);
  const comisionTotal = propiedades.reduce((sum, p) => {
    const precio = Number(p.venta?.precioVenta) || 0;
    const com = Number(p.venta?.comisionAgencia) || 0;
    return sum + (precio * com / 100);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Venta de Propiedades</h2>
          <p>Pipeline comercial · {propiedades.length} propiedades</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon navy"><TrendingUp size={20} /></div>
          <div><div className="kpi-value">{propiedades.length}</div><div className="kpi-label">En comercialización</div></div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-icon gold"><TrendingUp size={20} /></div>
          <div><div className="kpi-value">{formatMoney(valorTotal)}</div><div className="kpi-label">Valor total portfolio</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><TrendingUp size={20} /></div>
          <div><div className="kpi-value">{formatMoney(comisionTotal)}</div><div className="kpi-label">Comisiones estimadas</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{propiedades.filter(p => p.venta?.etapaPipeline === 'VENDIDO').length}</div>
          <div className="kpi-label">Vendidas</div>
        </div>
      </div>

      {/* Kanban Pipeline */}
      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="pipeline-board">
          {ETAPAS.map(etapa => (
            <div key={etapa} className="pipeline-column">
              <div className="pipeline-column-header">
                <span className="pipeline-column-title" style={{ color: ETAPA_COLORS[etapa] }}>
                  {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                </span>
                <span className="pipeline-count">{porEtapa[etapa]?.length ?? 0}</span>
              </div>
              {porEtapa[etapa]?.map(p => (
                <div key={p.id} className="pipeline-card" onClick={() => navigate(`/propiedades/${p.id}`)}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{p.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#8A9BB0', marginBottom: 8 }}>
                    <MapPin size={11} />{p.zona}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0D1B2A' }}>
                    {formatMoney(p.venta?.precioVenta)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8A9BB0', marginTop: 4 }}>
                    {p.venta?.comisionAgencia ? `Comisión: ${p.venta.comisionAgencia}%` : 'Sin comisión'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#C9A84C', fontWeight: 500 }}>
                    {p.referencia}
                  </div>
                </div>
              ))}
              {porEtapa[etapa]?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#DDD8CF', fontSize: '0.78rem', padding: '1rem 0' }}>
                  Sin propiedades
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
