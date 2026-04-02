import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles = {
  '/': { title: 'Dashboard', subtitle: 'Resumen de actividad' },
  '/vacacional': { title: 'Alquiler Vacacional', subtitle: 'Gestión de propiedades turísticas' },
  '/vacacional/calendario': { title: 'Calendario de Disponibilidad', subtitle: 'Vista de disponibilidad y tarifas por villa' },
  '/larga-duracion': { title: 'Alquiler Larga Duración', subtitle: 'Contratos residenciales' },
  '/venta': { title: 'Venta', subtitle: 'Propiedades en comercialización' },
  '/propiedades': { title: 'Todas las Propiedades', subtitle: 'Portfolio completo' },
  '/propietarios': { title: 'Propietarios', subtitle: 'Cartera de clientes propietarios' },
  '/clientes': { title: 'Clientes', subtitle: 'Gestión de leads y compradores' },
  '/documentos': { title: 'Documentos & IA', subtitle: 'Gestor documental impulsado por IA' },
  '/propuestas': { title: 'Generador de Propuestas', subtitle: 'Crea presentaciones comerciales para clientes' },
  '/agente-comercial': { title: 'Agente Comercial IA', subtitle: 'Central telefónica outbound autónoma' },
  '/whatsapp': { title: 'Asistente WhatsApp', subtitle: 'Atención al cliente inbound 24/7' },
};

export default function Layout() {
  const location = useLocation();
  const pageInfo = titles[location.pathname] || { title: 'CRM Inmobiliario', subtitle: '' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
