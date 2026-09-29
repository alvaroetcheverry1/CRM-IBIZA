import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tareasApi, clientesApi, propiedadesApi } from '../services/api';
import { 
  Calendar, CheckSquare, Plus, Clock, AlertCircle, X, Trash2, 
  Check, Phone, Mail, Eye, HelpCircle, Briefcase, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIPO_ICON = {
  VISITA: Eye,
  LLAMADA: Phone,
  EMAIL: Mail,
  REUNION: Briefcase,
  OTRO: HelpCircle
};

const TIPO_LABEL = {
  VISITA: 'Visita',
  LLAMADA: 'Llamada',
  EMAIL: 'Email',
  REUNION: 'Reunión',
  OTRO: 'Otro'
};

const PRIORIDAD_COLOR = {
  BAJA: { bg: '#E8F5E9', color: '#2E7D32', label: 'Baja' },
  MEDIA: { bg: '#FFF3E0', color: '#EF6C00', label: 'Media' },
  ALTA: { bg: '#FFEBEE', color: '#C62828', label: 'Alta' }
};

function TaskModal({ task, onClose, onSave, clientes = [], propiedades = [] }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!task?.id;

  const [formData, setFormData] = useState({
    titulo: task?.titulo || '',
    descripcion: task?.descripcion || '',
    fechaVencimiento: task?.fechaVencimiento ? task.fechaVencimiento.split('T')[0] : new Date().toISOString().split('T')[0],
    tipo: task?.tipo || 'VISITA',
    prioridad: task?.prioridad || 'MEDIA',
    clienteId: task?.cliente?.id || '',
    propiedadId: task?.propiedad?.id || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo) {
      toast.error('El título es obligatorio');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
    } catch (err) {
      toast.error('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Editar Tarea' : 'Nueva Tarea Comercial'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">Título</label>
            <input 
              className="form-input" 
              placeholder="Ej. Visita propiedad Can Pep" 
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Descripción</label>
            <textarea 
              className="form-textarea" 
              placeholder="Detalles sobre la tarea..." 
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Vencimiento</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.fechaVencimiento}
                onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Actividad</label>
              <select 
                className="form-select" 
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="VISITA">👁️ Visita</option>
                <option value="LLAMADA">📞 Llamada</option>
                <option value="EMAIL">✉️ Email</option>
                <option value="REUNION">🤝 Reunión</option>
                <option value="OTRO">❓ Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Prioridad</label>
            <select 
              className="form-select" 
              value={formData.prioridad}
              onChange={e => setFormData({...formData, prioridad: e.target.value})}
            >
              <option value="BAJA">🟢 Baja</option>
              <option value="MEDIA">🟡 Media</option>
              <option value="ALTA">🔴 Alta</option>
            </select>
          </div>

          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cliente Asociado (Opcional)</label>
              <select 
                className="form-select" 
                value={formData.clienteId}
                onChange={e => setFormData({...formData, clienteId: e.target.value})}
              >
                <option value="">— Ninguno —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Propiedad Asociada (Opcional)</label>
              <select 
                className="form-select" 
                value={formData.propiedadId}
                onChange={e => setFormData({...formData, propiedadId: e.target.value})}
              >
                <option value="">— Ninguna —</option>
                {propiedades.map(p => (
                  <option key={p.id} value={p.id}>{p.referencia} · {p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'transparent' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Agenda() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [modalOpen, setModalOpen] = useState(false);
  const [taskEdit, setTaskEdit] = useState(null);

  // Queries
  const { data: tareas = [], isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: () => tareasApi.list()
  });

  const { data: propData } = useQuery({
    queryKey: ['propiedades-mini'],
    queryFn: () => propiedadesApi.list({ limit: 100 }),
  });

  const { data: cliData } = useQuery({
    queryKey: ['clientes-mini'],
    queryFn: () => clientesApi.list({ limit: 100 }),
  });

  const propiedades = propData?.data || [];
  const clientes = cliData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: tareasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Tarea creada correctamente');
      setModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tareasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      setModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: tareasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success('Tarea eliminada');
    }
  });

  const handleSave = async (payload) => {
    if (taskEdit?.id) {
      await updateMutation.mutateAsync({ id: taskEdit.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleToggleCompleted = (t) => {
    updateMutation.mutate({ id: t.id, data: { completada: !t.completada } });
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e, completedStatus) => {
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const task = tareas.find(t => t.id === id);
    if (task && task.completada !== completedStatus) {
      updateMutation.mutate({ id, data: { completada: completedStatus } });
      toast.success(completedStatus ? 'Tarea completada' : 'Tarea marcada como pendiente');
    }
  };

  const pendingTasks = tareas.filter(t => !t.completada);
  const completedTasks = tareas.filter(t => t.completada);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>📅 Agenda &amp; Tareas</h2>
          <p>Gestiona y programa el seguimiento de clientes, visitas a propiedades y actividades diarias.</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', marginRight: '0.5rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: 0, border: 'none', padding: '0.4rem 0.8rem' }}
            >
              📋 Lista
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('kanban')}
              style={{ borderRadius: 0, border: 'none', padding: '0.4rem 0.8rem' }}
            >
              📊 Kanban
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => { setTaskEdit(null); setModalOpen(true); }}>
            <Plus size={16} /> Nueva Tarea
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : viewMode === 'kanban' ? (
        /* VISTA KANBAN DRAG & DROP */
        <div className="pipeline-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '500px' }}>
          {/* Columna Pendientes */}
          <div 
            className="pipeline-column" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, false)}
            style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}
          >
            <div className="pipeline-column-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span className="pipeline-column-title" style={{ color: '#C9A84C' }}>🕒 Pendientes</span>
              <span className="pipeline-count" style={{ background: '#FFF3E0', color: '#EF6C00' }}>{pendingTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px' }}>
              {pendingTasks.map(t => {
                const Icon = TIPO_ICON[t.tipo] || HelpCircle;
                const pr = PRIORIDAD_COLOR[t.prioridad] || PRIORIDAD_COLOR.MEDIA;
                return (
                  <div 
                    key={t.id} 
                    className="pipeline-card" 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    style={{ cursor: 'grab', borderLeft: `4px solid ${pr.color}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span className="badge" style={{ backgroundColor: pr.bg, color: pr.color, fontSize: '0.65rem' }}>{pr.label}</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => { setTaskEdit(t); setModalOpen(true); }} className="btn-icon btn-ghost btn-sm" title="Editar"><CheckSquare size={13} /></button>
                        <button onClick={() => deleteMutation.mutate(t.id)} className="btn-icon btn-ghost btn-sm" style={{ color: '#EF4444' }} title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1A3A5C', marginBottom: '4px' }}>{t.titulo}</div>
                    {t.descripcion && <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px' }}>{t.descripcion}</div>}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#8A9BB0', marginBottom: '6px' }}>
                      <Clock size={11} /> {new Date(t.fechaVencimiento).toLocaleDateString('es-ES')}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '6px', marginTop: '6px' }}>
                      {t.cliente && <span style={{ fontSize: '0.68rem', color: '#4A6FA5', display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={10} /> {t.cliente.nombre}</span>}
                      {t.propiedad && <span style={{ fontSize: '0.68rem', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={10} /> {t.propiedad.referencia}</span>}
                    </div>
                  </div>
                );
              })}
              {pendingTasks.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.8rem', border: '2px dashed #E2E8F0', borderRadius: '8px' }}>Arrastra aquí para reabrir / Sin tareas pendientes</div>}
            </div>
          </div>

          {/* Columna Completadas */}
          <div 
            className="pipeline-column" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, true)}
            style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}
          >
            <div className="pipeline-column-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span className="pipeline-column-title" style={{ color: '#2D8A5E' }}>✅ Completadas</span>
              <span className="pipeline-count" style={{ background: '#E8F5E9', color: '#2E7D32' }}>{completedTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px' }}>
              {completedTasks.map(t => {
                const pr = PRIORIDAD_COLOR[t.prioridad] || PRIORIDAD_COLOR.MEDIA;
                return (
                  <div 
                    key={t.id} 
                    className="pipeline-card" 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    style={{ cursor: 'grab', opacity: 0.7, textDecoration: 'line-through', borderLeft: '4px solid #94A3B8' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#64748B', fontSize: '0.65rem' }}>Completada</span>
                      <button onClick={() => deleteMutation.mutate(t.id)} className="btn-icon btn-ghost btn-sm" style={{ color: '#EF4444' }} title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748B', marginBottom: '4px' }}>{t.titulo}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '6px', marginTop: '6px' }}>
                      {t.cliente && <span style={{ fontSize: '0.68rem', color: '#64748B' }}>👤 {t.cliente.nombre}</span>}
                    </div>
                  </div>
                );
              })}
              {completedTasks.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.8rem', border: '2px dashed #E2E8F0', borderRadius: '8px' }}>Arrastra tareas aquí para completarlas</div>}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE TABLA / LISTA */
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Actividad</th>
                  <th>Tipo</th>
                  <th>Prioridad</th>
                  <th>Vencimiento</th>
                  <th>Relación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#8A9BB0' }}>
                      No tienes ninguna tarea programada. ¡Crea tu primera tarea!
                    </td>
                  </tr>
                ) : (
                  tareas.map(t => {
                    const Icon = TIPO_ICON[t.tipo] || HelpCircle;
                    const pr = PRIORIDAD_COLOR[t.prioridad] || PRIORIDAD_COLOR.MEDIA;
                    const vencido = !t.completada && new Date(t.fechaVencimiento) < new Date().setHours(0,0,0,0);

                    return (
                      <tr key={t.id} style={{ opacity: t.completada ? 0.6 : 1 }}>
                        <td>
                          <button 
                            onClick={() => handleToggleCompleted(t)} 
                            className="btn-icon" 
                            style={{ 
                              width: '20px', height: '20px', borderRadius: '4px', 
                              border: t.completada ? 'none' : '2px solid #CBD5E1', 
                              background: t.completada ? '#2D8A5E' : 'transparent', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                            }}
                          >
                            {t.completada && <Check size={12} color="white" />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: t.completada ? '#64748B' : '#1A3A5C', textDecoration: t.completada ? 'line-through' : 'none' }}>
                            {t.titulo}
                          </div>
                          {t.descripcion && <div style={{ fontSize: '0.78rem', color: '#8A9BB0' }}>{t.descripcion}</div>}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569' }}>
                            <Icon size={14} style={{ color: '#4A6FA5' }} /> {TIPO_LABEL[t.tipo]}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: t.completada ? '#E2E8F0' : pr.bg, color: t.completada ? '#64748B' : pr.color }}>
                            {pr.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: vencido ? '#EF4444' : '#475569', fontWeight: vencido ? 600 : 400 }}>
                            <Clock size={12} /> {new Date(t.fechaVencimiento).toLocaleDateString('es-ES')}
                            {vencido && <span style={{ fontSize: '0.7rem', background: '#FFEBEE', color: '#C62828', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>Vencido</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {t.cliente && <span style={{ fontSize: '0.78rem', color: '#4A6FA5' }}>👤 {t.cliente.nombre} {t.cliente.apellidos}</span>}
                            {t.propiedad && <span style={{ fontSize: '0.75rem', color: '#C9A84C' }}>🏠 {t.propiedad.referencia}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => { setTaskEdit(t); setModalOpen(true); }} className="btn-icon btn-ghost btn-sm" title="Editar"><CheckSquare size={15} /></button>
                            <button onClick={() => deleteMutation.mutate(t.id)} className="btn-icon btn-ghost btn-sm" style={{ color: '#EF4444' }} title="Eliminar"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <TaskModal 
          task={taskEdit}
          clientes={clientes}
          propiedades={propiedades}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
