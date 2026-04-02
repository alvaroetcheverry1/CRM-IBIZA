import { Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, subtitle }) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      <div className="topbar-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/propiedades')}
        >
          <Plus size={15} />
          Nueva Propiedad
        </button>
        <div className="topbar-badge" title="Notificaciones">
          <Bell size={17} />
          <span className="badge-dot" />
        </div>
      </div>
    </header>
  );
}
