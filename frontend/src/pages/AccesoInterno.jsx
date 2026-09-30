/**
 * AccesoInterno.jsx — Acceso reservado (superadmin de la plataforma).
 * Ruta oculta e independiente del login de agencias (/login), para que los
 * usuarios normales no vean esta puerta. La seguridad real la impone el backend
 * mediante el rol SUPERADMIN y el JWT; esta separación solo reduce la superficie
 * visible del área interna.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function AccesoInterno() {
  const { loginWithEmail, devLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Acceso concedido');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin();
      toast.success('Sesión interna iniciada');
      navigate('/admin');
    } catch {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f16',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 18,
        padding: '2.25rem 1.8rem',
        boxShadow: '0 22px 60px rgba(0,0,0,0.4)',
        border: '1px solid rgba(15,23,42,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#0d1724',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem',
          }}>
            <ShieldCheck size={24} color="#c9a84c" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0e1a26', fontWeight: 800 }}>Acceso reservado</h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#708096' }}>Área interna de administración</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                placeholder="admin@..."
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
                onChange={(e) => setPassword(e.target.value)}
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
            }}
          >
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        {!import.meta.env.PROD && (
          <>
            <div style={{ borderTop: '1px solid #eaeaec', margin: '1.1rem 0', textAlign: 'center', position: 'relative' }}>
              <span style={{ background: '#fff', padding: '0 0.5rem', fontSize: '0.72rem', color: '#8A9BB0', position: 'relative', top: -10 }}>solo desarrollo</span>
            </div>
            <button
              onClick={handleDevLogin}
              disabled={loading}
              style={{
                width: '100%', background: '#f7f8fb', color: '#425164',
                border: '1px solid #e6edf5', borderRadius: 12,
                padding: '0.72rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700,
              }}
            >
              Acceso de desarrollo (SUPERADMIN)
            </button>
          </>
        )}
      </section>
    </div>
  );
}
