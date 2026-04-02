import { useQuery } from '@tanstack/react-query';
import { propiedadesApi } from '../services/api';
import { MapPin, Bed, Bath, Square, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function AlquilerVacacional() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['propiedades-vacacional'],
    queryFn: () => propiedadesApi.list({ tipo: 'VACACIONAL', limit: 50 }),
  });

  const propiedades = data?.data || [];
  const disponibles = propiedades.filter(p => p.estado === 'DISPONIBLE').length;
  const alquiladas = propiedades.filter(p => p.estado === 'ALQUILADA').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Alquiler Vacacional</h2>
          <p>{propiedades.length} villas · {disponibles} disponibles · {alquiladas} alquiladas</p>
        </div>
      </div>

      {/* Stats mini */}
      <div className="kpi-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-value">{propiedades.length}</div>
          <div className="kpi-label">Total villas</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-value">{disponibles}</div>
          <div className="kpi-label">Disponibles</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-value">{alquiladas}</div>
          <div className="kpi-label">Alquiladas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{propiedades.filter(p => p.estado === 'RESERVADA').length}</div>
          <div className="kpi-label">Reservadas</div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Villa</th>
                  <th>Zona</th>
                  <th>Especificaciones</th>
                  <th>T. Alta /sem</th>
                  <th>T. Media /sem</th>
                  <th>T. Baja /sem</th>
                  <th>Licencia ETV</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#8A9BB0' }}>Sin propiedades vacacionales</td></tr>
                ) : propiedades.map(p => {
                  const av = p.alquilerVacacional || {};
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/propiedades/${p.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: 500 }}>{p.referencia}</div>
                      </td>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}><MapPin size={12} />{p.zona}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: '#4A5568' }}>
                          <span><Bed size={12} /> {p.habitaciones}</span>
                          <span><Bath size={12} /> {p.banos}</span>
                          <span><Square size={12} /> {p.metrosConstruidos}m²</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0D1B2A' }}>{formatMoney(av.precioTemporadaAlta)}</td>
                      <td style={{ color: '#4A5568' }}>{formatMoney(av.precioTemporadaMedia)}</td>
                      <td style={{ color: '#8A9BB0' }}>{formatMoney(av.precioTemporadaBaja)}</td>
                      <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{av.licenciaETV || '—'}</td>
                      <td>
                        <span className={`badge ${p.estado === 'DISPONIBLE' ? 'badge-disponible' : p.estado === 'ALQUILADA' ? 'badge-alquilada' : 'badge-reservada'}`}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
