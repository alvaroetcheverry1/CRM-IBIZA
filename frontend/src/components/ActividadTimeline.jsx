import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../services/api';
import { Phone, Mail, Eye, StickyNote, CheckSquare, Plus, Clock, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPOS_CONFIG = {
  LLAMADA: { icon: Phone,       color: '#4A6FA5', bg: '#EBF5FB', label: 'Llamada' },
  EMAIL:   { icon: Mail,        color: '#2D8A5E', bg: '#E8F5F0', label: 'Email' },
  VISITA:  { icon: Eye,         color: '#C9A84C', bg: '#FEF9E7', label: 'Visita' },
  NOTA:    { icon: StickyNote,  color: '#8A9BB0', bg: '#F0EDE6', label: 'Nota' },
  TAREA:   { icon: CheckSquare, color: '#9B59B6', bg: '#F5EEF8', label: 'Tarea' },
  OFERTA:  { icon: Plus,        color: '#C0392B', bg: '#FEEFEE', label: 'Oferta' },
};

export default function ActividadTimeline({ propiedadId, clienteId }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState('NOTA');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Key única para caché dependiendo de si es propiedad o cliente
  const queryKey = ['actividades', { propiedadId, clienteId }];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => actividadesApi.list({ propiedadId, clienteId, limit: 50 }),
    staleTime: 30_000,
  });

  const crear = useMutation({
    mutationFn: () => actividadesApi.create({ tipo, descripcion: desc, propiedadId, clienteId }),
    onSuccess: () => {
      qc.invalidateQueries(queryKey);
      setDesc('');
      setShowForm(false);
      toast.success('✅ Actividad registrada');
    },
    onError: (err) => toast.error('Error: ' + err.message),
  });

  const eliminar = useMutation({
    mutationFn: (id) => actividadesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(queryKey);
      toast.success('Actividad eliminada');
    },
  });

  const actividades = data?.data || [];

  return (
    <div className="card">
      <div className="card-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={17} style={{ color: '#4A6FA5' }} />
          Historial de Actividad
        </h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(v => !v)}
        >
          <Plus size={14} /> {showForm ? 'Cancelar' : 'Añadir'}
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #EDE9E0',
          background: '#FAFAF8',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          {/* Selector de tipo */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(TIPOS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const active = tipo === key;
              return (
                <button
                  key={key}
                  onClick={() => setTipo(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                    borderColor: active ? cfg.color : '#DDD8CF',
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.color : '#8A9BB0',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={12} /> {cfg.label}
                </button>
              );
            })}
          </div>
          {/* Textarea */}
          <textarea
            className="form-input"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={`Describe la ${TIPOS_CONFIG[tipo]?.label?.toLowerCase()}...`}
            rows={3}
            style={{ resize: 'vertical', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!desc.trim() || crear.isPending}
              onClick={() => crear.mutate()}
            >
              {crear.isPending ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '0.5rem 0' }}>
        {isLoading && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#8A9BB0' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        {!isLoading && actividades.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <Clock size={28} style={{ color: '#DDD8CF', margin: '0 auto 0.5rem', display: 'block' }} />
            <p>Sin actividad registrada aún</p>
          </div>
        )}
        {actividades.map((act, i) => {
          const cfg = TIPOS_CONFIG[act.tipo] || TIPOS_CONFIG.NOTA;
          const Icon = cfg.icon;
          const isLast = i === actividades.length - 1;
          return (
            <div key={act.id} style={{ display: 'flex', gap: 12, padding: '0.9rem 1.5rem', borderBottom: isLast ? 'none' : '1px solid #EDE9E0', position: 'relative' }}>
              {/* Icono tipo */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: `1.5px solid ${cfg.color}30`,
              }}>
                <Icon size={15} />
              </div>

              {/* Contenido */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cfg.label}
                  </span>
                  {act.usuario && (
                    <span style={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                      · {act.usuario.nombre} {act.usuario.apellidos || ''}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.5 }}>
                  {act.descripcion}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8A9BB0', marginTop: 4 }}>
                  {new Date(act.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
                </div>
              </div>

              {/* Eliminar */}
              <button
                onClick={() => eliminar.mutate(act.id)}
                disabled={eliminar.isPending}
                title="Eliminar actividad"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#DDD8CF', padding: 4, borderRadius: 4,
                  transition: 'color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#C0392B'}
                onMouseLeave={e => e.currentTarget.style.color = '#DDD8CF'}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
