import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, MapPin, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useState } from 'react';

// Format helpers
function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PortalPropietario() {
  const { token } = useParams();
  const [selectedPropId, setSelectedPropId] = useState(null);

  const { data: owner, isLoading, isError } = useQuery({
    queryKey: ['portalPropietario', token],
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiBaseUrl}/propietarios/portal/${token}`);
      if (!response.ok) {
        throw new Error('No se pudo cargar el portal. Token inválido o expirado.');
      }
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#1A3A5C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#1A3A5C', fontWeight: 600 }}>Cargando portal exclusivo de propietario...</p>
      </div>
    );
  }

  if (isError || !owner) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '2rem' }}>
        <div style={{ maxWidth: 400, padding: '2rem', background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1A3A5C' }}>Acceso Restringido</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6 }}>El enlace de acceso ha expirado, es inválido o no dispones de permisos activos para este portal.</p>
        </div>
      </div>
    );
  }

  const propiedades = owner.propiedades || [];
  const selectedProp = propiedades.find(p => p.id === selectedPropId) || propiedades[0];

  // Calcular KPIs Generales
  const totalInmuebles = propiedades.length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'sans-serif' }}>
      
      {/* Header Premium */}
      <header style={{ background: 'linear-gradient(135deg,#1A3A5C,#2D5F8F)', color: 'white', padding: '2.5rem 2rem', boxShadow: '0 4px 20px rgba(15,23,42,0.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Portal del Propietario</span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 300 }}>Bienvenido, {owner.nombre} {owner.apellidos}</h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', opacity: 0.8 }}>Consulta en tiempo real la rentabilidad, reservas e historial de tus propiedades exclusivas.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.5rem', borderRadius: 8, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>Tus Propiedades</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#C9A84C' }}>{totalInmuebles} <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 400 }}>inmueble{totalInmuebles !== 1 ? 's' : ''}</span></div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'minmax(250px, 320px) 1fr', gap: '2rem' }}>
        
        {/* Sidebar: Selector de Inmuebles */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ color: '#1A3A5C', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Tus Propiedades</h3>
          {propiedades.map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedPropId(p.id)}
              style={{
                cursor: 'pointer',
                background: 'white',
                border: selectedProp?.id === p.id ? '2px solid #C9A84C' : '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '1rem',
                boxShadow: selectedProp?.id === p.id ? '0 4px 15px rgba(201,168,76,0.15)' : '0 2px 5px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A9BB0' }}>{p.referencia}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  background: p.estado === 'DISPONIBLE' ? '#ECFDF5' : '#FEF2F2', 
                  color: p.estado === 'DISPONIBLE' ? '#059669' : '#DC2626', 
                  padding: '2px 8px', 
                  borderRadius: 12 
                }}>{p.estado}</span>
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1A3A5C' }}>{p.nombre}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#64748B' }}>
                <MapPin size={12} /> {p.zona}
              </div>
            </div>
          ))}
        </aside>

        {/* Detalle y Stats de la Propiedad Seleccionada */}
        {selectedProp ? (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cabecera Inmueble */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>{selectedProp.tipo === 'VENTA' ? '🏛 Venta' : selectedProp.tipo === 'VACACIONAL' ? '🌴 Vacacional' : '🏡 Larga Duración'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#8A9BB0' }}>{selectedProp.referencia}</span>
                  </div>
                  <h2 style={{ margin: '8px 0', color: '#1A3A5C', fontWeight: 600 }}>{selectedProp.nombre}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748B' }}>
                    <MapPin size={14} /> {selectedProp.zona} {selectedProp.municipio ? `· ${selectedProp.municipio}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8A9BB0', textTransform: 'uppercase', fontWeight: 600 }}>Valor Comercial</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A3A5C' }}>
                    {selectedProp.tipo === 'VENTA' ? formatMoney(selectedProp.venta?.precioVenta) : 
                     selectedProp.tipo === 'VACACIONAL' ? `${formatMoney(selectedProp.alquilerVacacional?.precioTemporadaAlta)}/sem` : 
                     `${formatMoney(selectedProp.alquilerLargaDuracion?.rentaMensual)}/mes`}
                  </div>
                </div>
              </div>

              {/* Características rápidas */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.2rem', color: '#475569', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <div>🛏 <strong>{selectedProp.habitaciones}</strong> hab.</div>
                <div>🛁 <strong>{selectedProp.banos}</strong> baños</div>
                <div>📐 <strong>{selectedProp.metrosConstruidos}</strong> m² const.</div>
                {selectedProp.metrosParcela && <div>🌳 <strong>{selectedProp.metrosParcela}</strong> m² parcela</div>}
                {selectedProp.piscina === 'SI' && <div>🏊‍♂️ Piscina</div>}
              </div>
            </div>

            {/* Fila de KPIs específicos de la propiedad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} style={{ color: '#D97706' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#8A9BB0', textTransform: 'uppercase', fontWeight: 600 }}>Visitas Realizadas</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B' }}>
                    {selectedProp.actividades?.filter(a => a.tipo === 'VISITA').length || 0}
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} style={{ color: '#059669' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#8A9BB0', textTransform: 'uppercase', fontWeight: 600 }}>Estado Comercial</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
                    {selectedProp.tipo === 'VENTA' ? `Etapa: ${selectedProp.venta?.etapaPipeline || 'Comercialización'}` : 'Activo en Alquiler'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#8A9BB0', textTransform: 'uppercase', fontWeight: 600 }}>Rentabilidad</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
                    {selectedProp.tipo === 'VENTA' ? 'Plusvalía Alta' : 'Estable'}
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Reservas o Actividades */}
            {selectedProp.tipo === 'VACACIONAL' && (
              <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ color: '#1A3A5C', fontSize: '1.1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} /> Historial de Reservas</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Noches</th>
                        <th style={{ textAlign: 'right' }}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedProp.alquilerVacacional?.reservas?.length ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#8A9BB0' }}>Sin reservas registradas</td></tr>
                      ) : (
                        selectedProp.alquilerVacacional.reservas.map(res => (
                          <tr key={res.id}>
                            <td style={{ fontWeight: 600 }}>{res.clienteNombre}</td>
                            <td>{formatDate(res.fechaEntrada)}</td>
                            <td>{formatDate(res.fechaSalida)}</td>
                            <td>{res.noches}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#2D8A5E' }}>{formatMoney(res.precioTotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedProp.tipo === 'LARGA_DURACION' && (
              <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ color: '#1A3A5C', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Control de Rentas y Pagos</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: -8, marginBottom: 16 }}>Inquilino actual: <strong>{selectedProp.alquilerLargaDuracion?.inquilinoNombre || '—'}</strong></p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mes de Renta</th>
                        <th>Importe</th>
                        <th>Estado</th>
                        <th>Fecha de Cobro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedProp.alquilerLargaDuracion?.pagos?.length ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#8A9BB0' }}>Sin registros de pago</td></tr>
                      ) : (
                        selectedProp.alquilerLargaDuracion.pagos.map(pago => (
                          <tr key={pago.id}>
                            <td>{new Date(pago.mes).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</td>
                            <td style={{ fontWeight: 600 }}>{formatMoney(pago.importe)}</td>
                            <td>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 8px', 
                                borderRadius: 12, 
                                background: pago.estado === 'PAGADO' ? '#ECFDF5' : '#FEF2F2', 
                                color: pago.estado === 'PAGADO' ? '#059669' : '#DC2626',
                                fontWeight: 600
                              }}>{pago.estado}</span>
                            </td>
                            <td>{formatDate(pago.fechaCobro)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actividades Recientes / Visitas */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
              <h3 style={{ color: '#1A3A5C', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Actividad y Seguimiento Comercial</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!selectedProp.actividades?.length ? (
                  <p style={{ fontSize: '0.875rem', color: '#8A9BB0', textAlign: 'center', padding: '1rem' }}>No hay actividades registradas públicamente.</p>
                ) : (
                  selectedProp.actividades.map(act => (
                    <div key={act.id} style={{ display: 'flex', gap: 12, padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: '1.1rem' }}>
                        {act.tipo === 'VISITA' ? '👁‍🗨' : act.tipo === 'LLAMADA' ? '📞' : '📝'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{act.descripcion}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8A9BB0', marginTop: 4 }}>{formatDate(act.fecha)} · {act.tipo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, padding: '3rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#8A9BB0' }}>
            No tienes propiedades asociadas en este portal.
          </div>
        )}

      </main>

      {/* Footer minimalista */}
      <footer style={{ marginTop: '4rem', padding: '2rem', background: '#1A3A5C', color: 'white', textAlign: 'center', fontSize: '0.8rem', opacity: 0.9 }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Ibiza Inteligente. Portal de Acceso Seguro para Propietarios.</p>
        <p style={{ margin: '4px 0 0 0', opacity: 0.6 }}>Esta información es estrictamente confidencial. Si tienes dudas, ponte en contacto con tu agente comercial asignado.</p>
      </footer>
    </div>
  );
}
