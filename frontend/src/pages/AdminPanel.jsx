/**
 * AdminPanel.jsx — Panel de Superadministrador
 * Solo accesible para usuarios con rol SUPERADMIN
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, CheckCircle, AlertCircle, Clock,
  ChevronRight, MoreVertical, RefreshCw, TrendingUp,
  Globe, Settings, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_COLOR = {
  TRIAL: { bg: '#FEF3C7', color: '#D97706', label: 'Trial' },
  STARTER: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Starter' },
  PRO: { bg: '#EDE9FE', color: '#7C3AED', label: 'Pro' },
  ELITE: { bg: '#D1FAE5', color: '#059669', label: 'Elite' },
};

const ESTADO_CONFIG = {
  ACTIVA: { icon: <CheckCircle size={14} />, color: '#059669', bg: '#D1FAE5', label: 'Activa' },
  PENDIENTE: { icon: <Clock size={14} />, color: '#D97706', bg: '#FEF3C7', label: 'Pendiente' },
  SUSPENDIDA: { icon: <AlertCircle size={14} />, color: '#DC2626', bg: '#FEE2E2', label: 'Suspendida' },
};

function EstadoBadge({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: c.bg, color: c.color, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  );
}

function PlanBadge({ plan }) {
  const c = PLAN_COLOR[plan] || PLAN_COLOR.TRIAL;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [agenciaActiva, setAgenciaActiva] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState('STARTER');
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [crearForm, setCrearForm] = useState({ nombre: '', email: '', telefono: '', plan: 'STARTER', password: '', crearDirector: true });

  // Redirigir si no es SUPERADMIN
  if (user?.rol !== 'SUPERADMIN') {
    navigate('/');
    return null;
  }

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000,
  });

  const { data: agenciasData, isLoading } = useQuery({
    queryKey: ['admin-agencias'],
    queryFn: adminApi.getAgencias,
  });

  const activarMutation = useMutation({
    mutationFn: ({ id, plan }) => adminApi.activarAgencia(id, plan),
    onSuccess: () => {
      toast.success('Agencia activada correctamente');
      qc.invalidateQueries(['admin-agencias']);
      qc.invalidateQueries(['admin-stats']);
      setAgenciaActiva(null);
    },
    onError: (err) => toast.error(err.message || 'Error al activar'),
  });

  const suspenderMutation = useMutation({
    mutationFn: ({ id }) => adminApi.suspenderAgencia(id, ''),
    onSuccess: () => {
      toast.success('Agencia suspendida');
      qc.invalidateQueries(['admin-agencias']);
    },
    onError: (err) => toast.error(err.message || 'Error al suspender'),
  });

  const crearAgenciaMutation = useMutation({
    mutationFn: (data) => adminApi.createAgencia(data),
    onSuccess: () => {
      toast.success('Agencia y Director creados correctamente');
      qc.invalidateQueries(['admin-agencias']);
      qc.invalidateQueries(['admin-stats']);
      setShowCrearModal(false);
      setCrearForm({ nombre: '', email: '', telefono: '', plan: 'STARTER', password: '', crearDirector: true });
    },
    onError: (err) => toast.error(err.message || 'Error al crear la agencia'),
  });

  const agencias = agenciasData?.data || [];
  const pendientes = agencias.filter(a => a.estado === 'PENDIENTE');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Panel de Superadministrador</h2>
          <p>Gestión de todas las agencias de la plataforma</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => qc.invalidateQueries()}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowCrearModal(true)}>
            <Plus size={16} /> Crear Agencia
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Agencias Totales', value: stats?.agencias?.total || 0, icon: <Building2 size={20} />, color: '#1A3A5C' },
          { label: 'Activas', value: stats?.agencias?.activas || 0, icon: <CheckCircle size={20} />, color: '#059669' },
          { label: 'Pendientes', value: stats?.agencias?.pendientes || 0, icon: <Clock size={20} />, color: '#D97706' },
          { label: 'Propiedades Totales', value: stats?.propiedades || 0, icon: <Globe size={20} />, color: '#7C3AED' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{stat.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              </div>
              <div style={{ color: stat.color, opacity: 0.3 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pendientes de activación */}
      {pendientes.length > 0 && (
        <div style={{ marginBottom: '1.5rem', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> {pendientes.length} Agencia{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''} de activación
          </h4>
          {pendientes.map(ag => (
            <div key={ag.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderTop: '1px solid #FEF3C7' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0D1B2A' }}>{ag.nombre}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 8 }}>{ag.email}</span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 8 }}>{ag.telefono}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={agenciaActiva === ag.id ? planSeleccionado : 'STARTER'}
                  onChange={e => { setAgenciaActiva(ag.id); setPlanSeleccionado(e.target.value); }}
                  className="form-input"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ELITE">Elite</option>
                  <option value="TRIAL">Trial (Prueba)</option>
                </select>
                <button
                  onClick={() => activarMutation.mutate({ id: ag.id, plan: planSeleccionado })}
                  disabled={activarMutation.isLoading}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#059669' }}
                >
                  <CheckCircle size={14} /> Activar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de Agencias */}
      <div className="card">
        <div className="card-header">
          <h3>Todas las Agencias</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                {['Agencia', 'Estado', 'Plan', 'Usuarios', 'Propiedades', 'Clientes', 'Registrada', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</td></tr>
              ) : agencias.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay agencias registradas</td></tr>
              ) : agencias.map(ag => (
                <tr key={ag.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0D1B2A' }}>{ag.nombre}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{ag.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}><EstadoBadge estado={ag.estado} /></td>
                  <td style={{ padding: '0.85rem 1rem' }}><PlanBadge plan={ag.plan} /></td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{ag._count?.usuarios || 0}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{ag._count?.propiedades || 0}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{ag._count?.clientes || 0}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.75rem' }}>
                    {new Date(ag.creadoEn).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ag.estado === 'PENDIENTE' && (
                        <button onClick={() => activarMutation.mutate({ id: ag.id, plan: 'STARTER' })} className="btn btn-sm" style={{ background: '#D1FAE5', color: '#059669', border: 'none' }}>
                          Activar
                        </button>
                      )}
                      {ag.estado === 'ACTIVA' && (
                        <button onClick={() => { if(confirm('¿Suspender esta agencia?')) suspenderMutation.mutate({ id: ag.id }); }} className="btn btn-sm" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }}>
                          Suspender
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCrearModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Crear Nueva Agencia</h3>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form 
                onSubmit={(e) => { e.preventDefault(); crearAgenciaMutation.mutate(crearForm); }}
                className="form-grid"
              >
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label required">Nombre de la Agencia</label>
                  <input required type="text" className="form-input" value={crearForm.nombre} onChange={e => setCrearForm({...crearForm, nombre: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input required type="email" className="form-input" value={crearForm.email} onChange={e => setCrearForm({...crearForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-input" value={crearForm.telefono} onChange={e => setCrearForm({...crearForm, telefono: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label required">Plan Inicial</label>
                  <select className="form-input" value={crearForm.plan} onChange={e => setCrearForm({...crearForm, plan: e.target.value})}>
                    <option value="TRIAL">Trial (Prueba)</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ELITE">Elite</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: crearForm.crearDirector ? '15px' : '0' }}>
                    <input type="checkbox" checked={crearForm.crearDirector} onChange={e => setCrearForm({...crearForm, crearDirector: e.target.checked})} />
                    <span style={{ fontWeight: 600 }}>Crear usuario Director automáticamente</span>
                  </label>
                  
                  {crearForm.crearDirector && (
                    <div>
                      <label className="form-label required">Contraseña Temporal del Director</label>
                      <input required type="text" className="form-input" minLength={8} placeholder="Min. 8 caracteres" value={crearForm.password} onChange={e => setCrearForm({...crearForm, password: e.target.value})} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>Se usará el email de la agencia como usuario.</p>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary w-100" disabled={crearAgenciaMutation.isLoading}>
                    {crearAgenciaMutation.isLoading ? 'Creando...' : 'Crear Agencia y Dar Acceso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
