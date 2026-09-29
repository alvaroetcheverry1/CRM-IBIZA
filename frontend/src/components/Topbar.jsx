import { Plus, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

export default function Topbar({ title, subtitle, onMenuToggle }) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={onMenuToggle} 
          className="btn-icon btn-ghost mobile-menu-btn"
          style={{ display: 'none', color: 'var(--text)' }}
          title="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-subtitle" style={{ display: 'none' }}>{subtitle}</div>} {/* Ocultado en móviles para optimizar espacio */}
        </div>
      </div>
      <div className="topbar-actions" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
        {/* Búsqueda Global */}
        <GlobalSearch />
        
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/propiedades')}
          style={{ flexShrink: 0 }}
        >
          <Plus size={15} />
          Nueva Propiedad
        </button>

        {/* Notificaciones */}
        <NotificationBell />
      </div>
    </header>
  );
}
