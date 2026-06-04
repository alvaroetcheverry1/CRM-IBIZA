import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Palmtree, Home, Building2, Users, UserCheck,
  FileText, Settings, LogOut, Bot, MessageCircle, CalendarDays, Presentation, Globe, Radar, CalendarClock, Scale, KanbanSquare, Database
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { section: 'Propiedades' },
  { to: '/vacacional', icon: Palmtree, label: 'Alquiler Vacacional' },
  { to: '/vacacional/calendario', icon: CalendarDays, label: 'Calendario Disponibilidad' },
  { to: '/larga-duracion', icon: Home, label: 'Alquiler L/D' },
  { to: '/venta', icon: Building2, label: 'Venta' },
  { to: '/pipeline', icon: KanbanSquare, label: 'Pipeline Ventas' },
  { to: '/propiedades', icon: Building2, label: 'Todas las Propiedades' },
  { section: 'Personas' },
  { to: '/propietarios', icon: UserCheck, label: 'Propietarios' },
  { to: '/clientes', icon: Users, label: 'Clientes & Leads' },
  { section: 'Agentes IA' },
  { to: '/agente-comercial', icon: Bot, label: 'AI Outbound (Llamadas)' },
  { to: '/whatsapp', icon: MessageCircle, label: 'AI Inbound (WhatsApp)' },
  { to: '/agente-scraper', icon: Radar, label: 'AI Captador (Scraping)' },
  { to: '/agente-setter', icon: CalendarClock, label: 'AI Setter (Citas)' },
  { to: '/agente-legal', icon: Scale, label: 'AI Closer (Legal)' },
  { section: 'Gestión' },
  { to: '/documentos', icon: FileText, label: 'Documentos & IA' },
  { to: '/migracion', icon: Database, label: 'Migration Wizard' },
  { to: '/facturacion', icon: FileText, label: 'Facturación' },
  { to: '/propuestas', icon: Presentation, label: 'Generador Propuestas' },
];

function initials(name, lastname) {
  return `${name?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase();
}

import { useAgency } from '../context/AgencyContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { config, logoUrl } = useAgency();

  const { data: newLeadsData } = useQuery({
    queryKey: ['clientes', 'NUEVO_SIDEBAR'],
    queryFn: () => clientesApi.list({ estado: 'NUEVO', limit: 1 }),
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    staleTime: 2 * 60 * 1000,
  });

  const newLeadsCount = newLeadsData?.meta?.total || 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {logoUrl !== '/logo.png' && logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <h1>{config?.nombreComercial || 'Ibiza Luxury'}<br/>Dreams</h1>
            <span>Real Estate · Ibiza</span>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" size={18} />
              {item.label}
              {item.to === '/clientes' && newLeadsCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                  {newLeadsCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.nombre} />
              : initials(user?.nombre, user?.apellidos)}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.nombre} {user?.apellidos}</div>
            <div className="user-role">{user?.rol?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-icon"
            title="Cerrar sesión"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
