import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Propiedades from './pages/Propiedades';
import PropiedadDetalle from './pages/PropiedadDetalle';
import Propietarios from './pages/Propietarios';
import Clientes from './pages/Clientes';
import Documentos from './pages/Documentos';
import Facturacion from './pages/Facturacion';
import AgenteComercial from './pages/AgenteComercial';
import WhatsAppBot from './pages/WhatsAppBot';
import AgenteScraper from './pages/AgenteScraper';
import AgenteSetter from './pages/AgenteSetter';
import AgenteLegal from './pages/AgenteLegal';
import CalendarioVacacional from './pages/CalendarioVacacional';
import AlquilerVacacional from './pages/AlquilerVacacional';
import AlquilerLargaDuracion from './pages/AlquilerLargaDuracion';
import Venta from './pages/Venta';
import CatalogoPublico from './pages/CatalogoPublico';
import GeneradorPropuestas from './pages/GeneradorPropuestas';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/catalogo/vacacional" element={<CatalogoPublico />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="propiedades" element={<Propiedades />} />
        <Route path="propiedades/:id" element={<PropiedadDetalle />} />
        <Route path="vacacional" element={<AlquilerVacacional />} />
        <Route path="vacacional/calendario" element={<CalendarioVacacional />} />
        <Route path="larga-duracion" element={<AlquilerLargaDuracion />} />
        <Route path="venta" element={<Venta />} />
        <Route path="propietarios" element={<Propietarios />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="facturacion" element={<Facturacion />} />
        <Route path="agente-comercial" element={<AgenteComercial />} />
        <Route path="whatsapp" element={<WhatsAppBot />} />
        <Route path="agente-scraper" element={<AgenteScraper />} />
        <Route path="agente-setter" element={<AgenteSetter />} />
        <Route path="agente-legal" element={<AgenteLegal />} />
        <Route path="propuestas" element={<GeneradorPropuestas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
