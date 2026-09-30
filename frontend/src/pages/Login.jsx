import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { loginWithEmail } = useAuth();
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 980,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo-synner.png" alt="SYNNER" style={{ width: 300, height: 300, objectFit: 'contain', display: 'block', margin: '0 auto 0.25rem', filter: 'drop-shadow(0 0 14px rgba(214, 153, 96, 0.12))' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(3.25rem, 6vw, 7rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.08em',
            color: '#f1c9a4',
            fontWeight: 700,
            textShadow: '0 0 18px rgba(241, 201, 164, 0.08)',
          }}>
            SYNNER
          </h1>
          <div style={{
            marginTop: '0.4rem',
            color: '#efc7a7',
            fontSize: 'clamp(1.2rem, 2vw, 2.2rem)',
            letterSpacing: '-0.04em',
            fontWeight: 500,
            fontStyle: 'italic',
          }}>
            The intelligent CRM
          </div>
        </div>

        <section style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 26,
          padding: '2rem 1.6rem',
          boxShadow: '0 22px 60px rgba(0,0,0,0.26)',
          border: '1px solid rgba(15,23,42,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.8rem', color: '#0e1a26', fontWeight: 800, textAlign: 'center' }}>Inicia sesión</h2>

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: 6 }}>Email</label>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: 6 }}>Contraseña</label>
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
                background: 'linear-gradient(135deg, #0d1724, #1a3a5c)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '0.9rem 1rem', fontWeight: 700, fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 12px 24px rgba(13,27,42,0.22)',
              }}
            >
              {loading ? 'Accediendo...' : <><ArrowRight size={16} /> Iniciar sesión</>}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '1.2rem 0 0.4rem', fontSize: '0.8rem', color: '#708096' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: '#0f2744', fontWeight: 800, textDecoration: 'none' }}>
              Registra tu agencia
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1.1rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#29a36a', boxShadow: '0 0 0 4px rgba(41,163,106,0.08)' }} />
            <span style={{ fontSize: '0.71rem', color: '#2D8A5E', fontWeight: 700 }}>Sistema seguro</span>
          </div>
        </section>
      </div>
    </div>
  );
}
