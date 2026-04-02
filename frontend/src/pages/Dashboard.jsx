import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { Building2, Users, UserCheck, TrendingUp, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TIPO_COLORS = { VACACIONAL: '#4A6FA5', LARGA_DURACION: '#1A3A5C', VENTA: '#C9A84C' };
const TIPO_LABELS = { VACACIONAL: 'Vacacional', LARGA_DURACION: 'Larga Duración', VENTA: 'Venta' };
const ESTADO_COLORS = { DISPONIBLE: '#2D8A5E', ALQUILADA: '#4A6FA5', RESERVADA: '#C9A84C', VENDIDA: '#1A3A5C' };

function formatMoney(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function RelativoFecha({ date }) {
  const d = new Date(date);
  const diff = Math.round((d - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span style={{ color: '#8A9BB0' }}>Hoy</span>;
  return <span style={{ color: '#C9A84C', fontWeight: 600 }}>en {diff} días</span>;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Cargando dashboard...</span>
      </div>
    );
  }

  const { kpis = {}, propiedadesPorTipo = [], propiedadesPorEstado = [], alertas = {}, leadsPorEstado = [] } = data || {};

  const pieData = propiedadesPorTipo.map(p => ({
    name: TIPO_LABELS[p.tipo] || p.tipo,
    value: p._count.tipo,
    color: TIPO_COLORS[p.tipo],
  }));

  const barData = leadsPorEstado.map(l => ({
    name: l.estado.charAt(0) + l.estado.slice(1).toLowerCase(),
    total: l._count.estado,
  }));

  return (
    <div>
      {/* ─── KPIs ─────────────────────────────────────── */}
      <div className="kpi-grid section-gap">
        <div className="kpi-card">
          <div className="kpi-icon navy"><Building2 size={22} /></div>
          <div>
            <div className="kpi-value">{kpis.totalPropiedades ?? 0}</div>
            <div className="kpi-label">Propiedades Activas</div>
          </div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-icon gold"><TrendingUp size={22} /></div>
          <div>
            <div className="kpi-value">{formatMoney(kpis.ingresosVacacionalMes ?? 0)}</div>
            <div className="kpi-label">Ingresos Vacacional (mes)</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><UserCheck size={22} /></div>
          <div>
            <div className="kpi-value">{kpis.totalPropietarios ?? 0}</div>
            <div className="kpi-label">Propietarios</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Users size={22} /></div>
          <div>
            <div className="kpi-value">{kpis.totalClientes ?? 0}</div>
            <div className="kpi-label">Clientes & Leads</div>
          </div>
        </div>
      </div>

      {/* ─── Gráficas ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Pie distribución */}
        <div className="card">
          <div className="card-header">
            <h3>Distribución Portfolio</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Propiedades']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                      <span style={{ color: '#4A5568' }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: '#0D1B2A' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state"><p>Sin propiedades</p></div>
            )}
          </div>
        </div>

        {/* Bar pipeline leads */}
        <div className="card">
          <div className="card-header">
            <h3>Pipeline de Leads</h3>
          </div>
          <div className="card-body">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE9E0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8A9BB0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8A9BB0' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                    formatter={(v) => [v, 'Leads']}
                  />
                  <Bar dataKey="total" fill="#1A3A5C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>Sin datos de pipeline</p></div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Alertas ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Reservas próximas */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: '#4A6FA5' }} />
                Reservas Próximas
              </span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>30 días</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {alertas.reservasProximas?.length > 0 ? (
              <div>
                {alertas.reservasProximas.map((r) => (
                  <div key={r.id} style={{
                    padding: '0.875rem 1.5rem',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>
                        {r.alquilerVacacional?.propiedad?.nombre}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>{r.clienteNombre}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        <RelativoFecha date={r.fechaEntrada} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8A9BB0' }}>{r.noches} noches</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <Calendar size={32} style={{ color: '#DDD8CF', margin: '0 auto 0.5rem', display: 'block' }} />
                <p>Sin reservas próximas</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas y vencimientos */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: '#C9A84C' }} />
                Alertas & Vencimientos
              </span>
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(alertas.pagosEnRetraso?.length > 0 || alertas.alertasVencimiento?.length > 0) ? (
              <div>
                {alertas.pagosEnRetraso?.map((p) => (
                  <div key={p.id} style={{
                    padding: '0.875rem 1.5rem',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0392B', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.87rem', color: '#C0392B' }}>
                        Pago en retraso
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                        {p.alquilerLargaDuracion?.propiedad?.nombre}
                      </div>
                    </div>
                  </div>
                ))}
                {alertas.alertasVencimiento?.map((a) => (
                  <div key={a.id} style={{
                    padding: '0.875rem 1.5rem',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>
                        Contrato a vencer
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                        {a.propiedad?.nombre} · {new Date(a.fechaVencimiento).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <AlertTriangle size={32} style={{ color: '#DDD8CF', margin: '0 auto 0.5rem', display: 'block' }} />
                <p>Sin alertas activas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
