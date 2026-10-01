/**
 * Planes.jsx — Página de precios y suscripción.
 * Carga el catálogo real del backend. Si el usuario está autenticado como
 * DIRECTOR/SUPERADMIN, el botón inicia el checkout de Stripe; si no, lleva al registro.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suscripcionesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Check, Loader2 } from 'lucide-react';

export default function Planes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const [periodo, setPeriodo] = useState('mensual'); // 'mensual' | 'anual'

  useEffect(() => {
    suscripcionesApi.getPlanes()
      .then((res) => setPlanes(res.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const contratar = async (planId) => {
    if (!user) {
      navigate('/registro');
      return;
    }
    setProcesando(planId);
    try {
      const { url } = await suscripcionesApi.checkout(planId, periodo);
      if (url) window.location.href = url; // Redirige a Stripe Checkout
    } catch (err) {
      toast.error(err.message || 'No se pudo iniciar el pago. Inténtalo más tarde.');
    } finally {
      setProcesando(null);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><div className="spinner" /></div>;
  }
  if (error) {
    return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#C0392B' }}>No se pudieron cargar los planes. Inténtalo de nuevo.</div>;
  }

  return (
    <div style={{ padding: '3rem 1.5rem', background: '#0D1B2A', minHeight: '100vh', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: 0, fontFamily: 'Playfair Display, serif' }}>Planes de SYNNER</h1>
        <p style={{ color: '#8A9BB0', marginTop: '0.5rem' }}>Precios + IVA · Sin permanencia · Cancela cuando quieras.</p>

        {/* Selector mensual / anual */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 30, padding: 4, marginTop: '1.25rem' }}>
          {[['mensual', 'Mensual'], ['anual', 'Anual · ahorra 15%']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriodo(val)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: 24, padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700,
                background: periodo === val ? '#C9A84C' : 'transparent',
                color: periodo === val ? '#0D1B2A' : '#E2E8F0',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        {planes.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: plan.recomendado ? 'linear-gradient(160deg,#1A3A5C,#102A44)' : 'rgba(255,255,255,0.04)',
              border: plan.recomendado ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '2rem',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {plan.recomendado && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C9A84C', color: '#0D1B2A', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recomendado
              </div>
            )}
            <div style={{ color: '#C9A84C', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{plan.nivel}</div>
            <h2 style={{ margin: '0.25rem 0 0.25rem', fontSize: '1.6rem' }}>{plan.nombre}</h2>
            <p style={{ color: '#8A9BB0', fontSize: '0.85rem', minHeight: 40, margin: 0 }}>{plan.descripcion}</p>
            <div style={{ margin: '1.25rem 0' }}>
              {periodo === 'anual' ? (
                <>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>€{plan.precioAnual}</span>
                  <span style={{ color: '#8A9BB0' }}> / año + IVA</span>
                  <div style={{ fontSize: '0.8rem', color: '#C9A84C', marginTop: 4 }}>
                    ≈ €{Math.round(plan.precioAnual / 12)}/mes · ahorras €{plan.precioMensual * 12 - plan.precioAnual}/año
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>€{plan.precioMensual}</span>
                  <span style={{ color: '#8A9BB0' }}> / mes + IVA</span>
                </>
              )}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
              {plan.caracteristicas.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.88rem', color: '#E2E8F0' }}>
                  <Check size={16} color="#C9A84C" style={{ flexShrink: 0, marginTop: 2 }} /> {c}
                </li>
              ))}
            </ul>
            <button
              onClick={() => contratar(plan.id)}
              disabled={procesando === plan.id}
              style={{
                background: plan.recomendado ? '#C9A84C' : 'transparent',
                color: plan.recomendado ? '#0D1B2A' : 'white',
                border: plan.recomendado ? 'none' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '0.85rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {procesando === plan.id ? <><Loader2 size={16} className="spin" /> Redirigiendo...</> : `Contratar ${plan.nombre}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748B', marginTop: '0.75rem' }}>
              PAGO SEGURO · VISA · MASTERCARD · AMEX · BIZUM
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
