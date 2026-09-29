import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, devLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('¡Bienvenido!');
      navigate('/');
    } catch (err) {
      if (err.message?.includes('PENDING_ACTIVATION')) {
        toast.error('Tu cuenta está pendiente de activación. Te avisaremos por email en breve.', { duration: 6000 });
      } else {
        toast.error(err.message || 'Email o contraseña incorrectos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin();
      toast.success('Sesión de desarrollo iniciada');
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
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(74,111,165,0.08)', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        padding: '3rem',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo-synner.png" alt="SYNNER — The intelligent CRM" style={{ maxWidth: 220, width: '100%', margin: '0 auto 0.5rem', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@agencia.com"
                className="form-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8A9BB0' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '0.875rem', fontWeight: 700, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(13,27,42,0.3)',
              marginTop: 4,
            }}
          >
            {loading ? 'Accediendo...' : <><ArrowRight size={16} /> Iniciar Sesión</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.5rem 0 0.5rem', fontSize: '0.8rem', color: '#8A9BB0' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: '#1A3A5C', fontWeight: 700, textDecoration: 'none' }}>
            Registra tu agencia
          </Link>
        </div>

        <div style={{ borderTop: '1px solid #EEE', margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 0.5rem', fontSize: '0.72rem', color: '#AAA', position: 'relative', top: -10 }}>o</span>
        </div>

        {/* Dev Login */}
        {!import.meta.env.PROD && (
          <button
            onClick={handleDevLogin}
            disabled={loading}
            style={{
              width: '100%', background: '#F8F9FA', color: '#666',
              border: '1px solid #DDD', borderRadius: 10,
              padding: '0.65rem', fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Shield size={14} /> Acceso desarrollo (sin contraseña)
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.25rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D8A5E' }} />
          <span style={{ fontSize: '0.72rem', color: '#2D8A5E', fontWeight: 500 }}>Sistema seguro · TLS 1.3 · GDPR</span>
        </div>
      </div>
    </div>
  );
}
