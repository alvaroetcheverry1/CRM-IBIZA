import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Shield } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, devLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin();
      toast.success('Sesión iniciada en modo desarrollo');
      navigate('/');
    } catch {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 50%, #0D1B2A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(74,111,165,0.08)', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        padding: '3rem',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        textAlign: 'center',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(13,27,42,0.25)',
          }}>
            <Building2 size={32} color="#C9A84C" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#0D1B2A', fontWeight: 700, marginBottom: 4 }}>
            Ibiza Luxury Dreams
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            Real Estate · Ibiza
          </p>
        </div>

        <h2 style={{ fontSize: '1rem', color: '#4A5568', marginBottom: '0.5rem', fontWeight: 500 }}>
          Accede a tu cuenta
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8A9BB0', marginBottom: '2rem' }}>
          Sistema de gestión inmobiliaria de alto standing
        </p>

        {/* Google Sign-In placeholder */}
        <div style={{
          border: '1.5px dashed #DDD8CF',
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '1rem',
          background: '#F9F7F3',
        }}>
          <p style={{ fontSize: '0.78rem', color: '#8A9BB0', marginBottom: '0.5rem' }}>
            Google Sign-In se activa con tu CLIENT_ID
          </p>
          <code style={{ fontSize: '0.72rem', color: '#4A6FA5', background: '#EBF5FB', padding: '4px 8px', borderRadius: 6 }}>
            GOOGLE_CLIENT_ID en .env
          </code>
        </div>

        {/* Dev Login */}
        <button
          onClick={handleDevLogin}
          disabled={loading}
          className="btn btn-primary w-full"
          style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.9rem' }}
        >
          <Shield size={16} />
          {loading ? 'Accediendo...' : 'Acceso de Desarrollo (sin Google)'}
        </button>

        <p style={{ fontSize: '0.72rem', color: '#8A9BB0', marginTop: '1.5rem', lineHeight: 1.6 }}>
          En producción, este botón se sustituye por el inicio de sesión con Google (SSO corporativo).
          <br />Los datos sensibles se cifran según normativa GDPR.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.25rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D8A5E' }} />
          <span style={{ fontSize: '0.72rem', color: '#2D8A5E', fontWeight: 500 }}>Sistema seguro · TLS 1.3 · GDPR</span>
        </div>
      </div>
    </div>
  );
}
