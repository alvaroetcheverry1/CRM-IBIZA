import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../services/api';
import { Clock, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeadsAlert() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['leads-stale-alert'],
    queryFn: async () => {
      const res = await apiCall('/clientes?estado=NUEVO&limit=50');
      const clientes = res?.data || [];
      const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return clientes.filter(c => new Date(c.creadoEn) < hace3dias);
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  const staleLeads = data || [];

  if (staleLeads.length === 0) return null;

  return (
    <div className="card" style={{ borderLeft: '4px solid #F59E0B', padding: '1rem 1.5rem', background: '#FFFBEB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#D97706" />
          <span style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
            {staleLeads.length} lead{staleLeads.length !== 1 ? 's' : ''} sin contactar hace más de 3 días
          </span>
        </div>
        <button
          onClick={() => navigate('/clientes')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#D97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Ver todos <ArrowRight size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {staleLeads.slice(0, 5).map(c => {
          const dias = Math.floor((Date.now() - new Date(c.creadoEn)) / (1000 * 60 * 60 * 24));
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', padding: '5px 10px', borderRadius: 20,
              border: '1px solid #FDE68A', fontSize: '0.78rem', color: '#92400E'
            }}>
              <Users size={12} />
              <span style={{ fontWeight: 600 }}>{c.nombre} {c.apellidos || ''}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#B45309' }}>
                <Clock size={11} /> {dias}d
              </span>
            </div>
          );
        })}
        {staleLeads.length > 5 && (
          <div style={{ padding: '5px 10px', fontSize: '0.78rem', color: '#92400E', fontStyle: 'italic' }}>
            +{staleLeads.length - 5} más...
          </div>
        )}
      </div>
    </div>
  );
}
