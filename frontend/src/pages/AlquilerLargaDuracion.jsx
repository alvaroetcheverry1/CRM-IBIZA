import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propiedadesApi, pagosApi } from '../services/api';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function AlquilerLargaDuracion() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['propiedades-ald'],
    queryFn: () => propiedadesApi.list({ tipo: 'LARGA_DURACION', limit: 50 }),
  });

  const { data: pagosData } = useQuery({
    queryKey: ['pagos-retraso'],
    queryFn: () => pagosApi.list({ estado: 'RETRASO' }),
  });

  const marcarCobrado = useMutation({
    mutationFn: (id) => pagosApi.update(id, { estado: 'COBRADO' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pagos-retraso'] }); toast.success('Pago marcado como cobrado'); },
  });

  const propiedades = data?.data || [];
  const pagosRetraso = pagosData?.data || [];

  const diasVencimiento = (fecha) => {
    if (!fecha) return null;
    return Math.ceil((new Date(fecha) - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Alquiler Larga Duración</h2>
          <p>{propiedades.length} propiedades · {pagosRetraso.length} pagos en retraso</p>
        </div>
      </div>

      {pagosRetraso.length > 0 && (
        <div style={{ background: '#FEEFEE', border: '1px solid #F5B7B1', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} style={{ color: '#C0392B', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#922B21', fontSize: '0.875rem' }}>{pagosRetraso.length} pago(s) en retraso</strong>
            <div style={{ fontSize: '0.78rem', color: '#C0392B' }}>Atención inmediata requerida</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Propiedad</th>
                  <th>Zona</th>
                  <th>Inquilino</th>
                  <th>Renta Mensual</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#8A9BB0' }}>Sin propiedades de larga duración</td></tr>
                ) : propiedades.map(p => {
                  const ald = p.alquilerLargaDuracion || {};
                  const dias = diasVencimiento(ald.fechaVencimiento);
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/propiedades/${p.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: 500 }}>{p.referencia}</div>
                      </td>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}><MapPin size={12} />{p.zona}</span></td>
                      <td>
                        {ald.inquilinoNombre ? (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ald.inquilinoNombre}</div>
                            <div style={{ fontSize: '0.72rem', color: '#8A9BB0' }}>{ald.inquilinoTelefono}</div>
                          </div>
                        ) : <span style={{ color: '#8A9BB0' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatMoney(ald.rentaMensual)}</td>
                      <td>
                        {ald.fechaVencimiento ? (
                          <div>
                            <div style={{ fontSize: '0.82rem' }}>{new Date(ald.fechaVencimiento).toLocaleDateString('es-ES')}</div>
                            {dias !== null && dias <= 90 && (
                              <div style={{ fontSize: '0.7rem', color: dias <= 30 ? '#C0392B' : '#C9A84C', fontWeight: 600 }}>
                                {dias <= 0 ? 'Vencido' : `${dias} días`}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color: '#8A9BB0' }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge ${p.estado === 'DISPONIBLE' ? 'badge-disponible' : 'badge-alquilada'}`}>
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
