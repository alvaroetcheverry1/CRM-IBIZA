import { useState, useEffect, useRef } from 'react';
import { Bell, Eye, Link2, Users, X, MailOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const notifs = await apiCall('/notificaciones');
        return notifs;
      } catch (err) {
        console.warn('Error fetching notifications, using fallback:', err.message);
        return [];
      }
    },
    refetchInterval: 60 * 1000, // Cada minuto
    staleTime: 45 * 1000,
  });
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}m`;
  return 'ahora';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
    const token = localStorage.getItem('token');
    if (!token) return;

    const sseUrl = `${apiBaseUrl}/notificaciones/stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data);
        if (notif.type === 'ping') return;

        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1A3A5C' }}>{notif.titulo}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{notif.mensaje}</div>
          </div>
        ), {
          icon: notif.tipo === 'NUEVO_LEAD' ? '👤' : notif.tipo === 'ALERTA' ? '⚠️' : notif.tipo === 'IMPAGO' ? '❌' : '🔔',
          duration: 5000,
        });

        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('EventSource connection lost, will retry automatically:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter(n => !n.leida).length;

  const readMutation = useMutation({
    mutationFn: (id) => apiCall(`/notificaciones/${id}/read`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => apiCall('/notificaciones/read-all', { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconColor = (tipo) => {
    if (tipo === 'NUEVO_LEAD') return { bg: 'var(--primary-light)', color: 'var(--primary)' };
    if (tipo === 'ALERTA') return { bg: '#FEF3C7', color: '#D97706' };
    if (tipo === 'IMPAGO') return { bg: '#FEEFEE', color: '#C0392B' };
    return { bg: 'var(--bg-light)', color: 'var(--text-muted)' };
  };

  const handleNotifClick = async (n) => {
    if (!n.leida) {
      readMutation.mutate(n.id);
    }
    setOpen(false);
    if (n.enlace) {
      navigate(n.enlace);
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="topbar-badge"
        title={`${unreadCount} notificaciones`}
        style={{ position: 'relative' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#EF4444', color: 'white',
            fontSize: '0.6rem', fontWeight: 700,
            padding: '1px 5px', borderRadius: 10,
            minWidth: 16, textAlign: 'center', lineHeight: '1.4'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 340, background: 'white', borderRadius: 14,
          border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          zIndex: 9999, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notificaciones ({unreadCount})</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => readAllMutation.mutate()}
                  title="Marcar todas como leídas"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                >
                  <MailOpen size={13} /> Marcar todo leído
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Bell size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                Sin notificaciones nuevas
              </div>
            ) : (
              notifications.map(n => {
                const { bg, color } = iconColor(n.tipo);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      display: 'flex', 
                      gap: 12, 
                      alignItems: 'flex-start', 
                      border: 'none', 
                      background: n.leida ? 'none' : 'rgba(74, 111, 165, 0.06)', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.leida ? 'none' : 'rgba(74, 111, 165, 0.06)'}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {n.tipo === 'NUEVO_LEAD' ? <Users size={16} color={color} /> : <Bell size={16} color={color} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {n.titulo}
                        {!n.leida && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{n.mensaje}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span>{timeAgo(n.creadoEn)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
