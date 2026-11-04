import { useState, useEffect } from 'react';
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
  const [rememberMe, setRememberMe] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const savedEmail = localStorage.getItem('synner_remembered_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (rememberMe && email) localStorage.setItem('synner_remembered_email', email);
      else localStorage.removeItem('synner_remembered_email');
      await loginWithEmail(email, password);
      toast.success('¡Bienvenido a SYNNER!');
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

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Para restablecer tu contraseña, contacta con el administrador de tu agencia o soporte@synnercrm.com', {
      icon: 'ℹ️',
      duration: 5000,
    });
  };

  return (
    <>
      <style>{`
        @keyframes login-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logo-appear {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float-logo {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.55; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.25); }
        }
        @keyframes spin-lf { to { transform: rotate(360deg); } }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary, #F0EDE6);
          font-family: var(--font-sans, 'Inter', sans-serif);
          padding: 2rem 1.25rem;
          position: relative;
          overflow: hidden;
        }

        /* Rejilla técnica sutil de fondo (armonía "panel de control") */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(26,58,92,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,58,92,0.035) 1px, transparent 1px);
          background-size: 38px 38px;
          -webkit-mask-image: radial-gradient(circle at 50% 42%, #000 0%, transparent 78%);
                  mask-image: radial-gradient(circle at 50% 42%, #000 0%, transparent 78%);
          pointer-events: none;
        }
        /* Halo cobre muy sutil tras el logo */
        .login-root::after {
          content: '';
          position: absolute;
          top: -120px; left: 50%;
          width: 620px; height: 620px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 68%);
          pointer-events: none;
        }

        .login-stage {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Marca ── */
        .login-brand {
          text-align: center;
          margin-bottom: 1.5rem;
          animation: logo-appear 0.9s cubic-bezier(0.16,1,0.3,1) both;
        }

        .login-logo-badge {
          width: 128px;
          height: 128px;
          margin: 0 auto 1.1rem;
          border-radius: 28px;
          background: linear-gradient(160deg, #FFFFFF 0%, #FBF7EF 100%);
          border: 1px solid var(--border-light, #EDE9E0);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 18px 40px rgba(13,27,42,0.14),
            0 0 0 6px rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        /* Barra de acento navy→gold, idéntica a las tarjetas del CRM */
        .login-logo-badge::before {
          content: '';
          position: absolute;
          top: 0; left: 18%; right: 18%;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: linear-gradient(90deg, #8C4E16, #C27B3C, #E3B07A);
        }
        .login-logo-badge img {
          width: 86px;
          height: 86px;
          object-fit: contain;
          animation: float-logo 5.5s ease-in-out infinite;
          filter: drop-shadow(0 6px 10px rgba(140,78,22,0.25));
        }

        .login-brand-name {
          font-size: 2.3rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          line-height: 1;
          color: #A5601F;
          margin: 0 0 0.3rem;
        }
        .login-brand-name .dot { color: var(--warm-gold, #C9A84C); }

        .login-brand-sub {
          display: block;
          font-size: 0.7rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--slate-gray, #8A9BB0);
          font-weight: 600;
        }

        .login-ai-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 0.9rem;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(26,58,92,0.04);
          border: 1px solid rgba(201,168,76,0.3);
          font-size: 0.62rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #7A5F00;
          font-weight: 600;
        }
        .login-ai-chip .d {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--success, #2D8A5E);
          box-shadow: 0 0 7px var(--success, #2D8A5E);
          animation: pulse-dot 2.2s infinite ease-in-out;
        }

        /* ── Tarjeta de formulario (igual que las cards del CRM) ── */
        .login-card {
          width: 100%;
          background: var(--bg-card, #FFFFFF);
          border-radius: var(--radius-lg, 16px);
          box-shadow: var(--shadow-lg, 0 8px 32px rgba(13,27,42,0.1));
          border: 1px solid var(--border-light, #EDE9E0);
          overflow: hidden;
          opacity: 0;
          animation: login-fade-in 0.65s cubic-bezier(0.16,1,0.3,1) 0.18s forwards;
        }
        .login-card-bar {
          height: 3px;
          background: linear-gradient(90deg, #8C4E16, #C27B3C, #E3B07A);
        }
        .login-card-body { padding: 1.9rem 1.85rem; }

        .login-greeting { margin-bottom: 1.3rem; }
        .login-greeting h1 {
          font-size: 1.3rem; font-weight: 700;
          color: var(--text-primary, #0D1B2A); margin: 0 0 0.2rem;
        }
        .login-greeting p {
          font-size: 0.85rem; color: var(--text-muted, #8A9BB0); margin: 0;
        }

        .lf-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.1rem; }
        .lf-label { font-size: 0.82rem; font-weight: 500; color: var(--text-secondary, #4A5568); }
        .lf-input-wrap { position: relative; }
        .lf-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text-muted, #8A9BB0); pointer-events: none; display: flex;
        }
        .lf-input {
          width: 100%;
          padding: 0.75rem 1rem; padding-left: 38px;
          border: 1.5px solid var(--border, #DDD8CF);
          border-radius: var(--radius-md, 10px);
          font-size: 0.9rem; font-family: var(--font-sans, 'Inter', sans-serif);
          color: var(--text-primary, #0D1B2A);
          background: var(--white, #FFFFFF);
          transition: all 0.2s ease; outline: none; box-sizing: border-box;
        }
        .lf-input:focus {
          border-color: var(--mediterranean, #1A3A5C);
          box-shadow: 0 0 0 3px rgba(26,58,92,0.08);
        }
        .lf-input::placeholder { color: var(--slate-gray, #8A9BB0); font-weight: 400; }

        .lf-eye {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted, #8A9BB0); display: flex; padding: 2px; transition: color 0.2s;
        }
        .lf-eye:hover { color: var(--deep-navy, #0D1B2A); }

        .lf-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 0.82rem 1rem;
          border-radius: var(--radius-md, 10px);
          font-size: 0.88rem; font-weight: 600;
          font-family: var(--font-sans, 'Inter', sans-serif);
          border: none; cursor: pointer; transition: all 0.2s ease; margin-top: 0.35rem;
          background: linear-gradient(135deg, var(--mediterranean, #1A3A5C) 0%, #244d73 100%);
          color: #ffffff; box-shadow: 0 2px 8px rgba(26,58,92,0.25); letter-spacing: 0.02em;
        }
        .lf-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1f4570 0%, #2a5a82 100%);
          transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,58,92,0.35);
        }
        .lf-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .lf-btn-dev {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 0.68rem 1rem;
          border-radius: var(--radius-md, 10px);
          font-size: 0.82rem; font-weight: 500;
          font-family: var(--font-sans, 'Inter', sans-serif);
          border: 1px dashed var(--border, #DDD8CF);
          background: var(--pearl-white, #F5F0E8);
          color: var(--text-secondary, #4A5568);
          cursor: pointer; transition: all 0.2s ease;
        }
        .lf-btn-dev:hover:not(:disabled) {
          border-color: var(--warm-gold, #C9A84C);
          background: #FFFDF9; color: var(--deep-navy, #0D1B2A);
        }

        .lf-divider { display: flex; align-items: center; gap: 12px; margin: 1.2rem 0 1rem; }
        .lf-divider-line { flex: 1; height: 1px; background: var(--border-light, #EDE9E0); }
        .lf-divider-text { font-size: 0.72rem; color: var(--text-muted, #8A9BB0); text-transform: uppercase; letter-spacing: 0.05em; }

        .lf-options-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.2rem; font-size: 0.8rem;
        }
        .lf-remember {
          display: flex; align-items: center; gap: 6px;
          color: var(--text-secondary, #4A5568); cursor: pointer; user-select: none;
        }
        .lf-forgot-link {
          color: var(--mediterranean, #1A3A5C); text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .lf-forgot-link:hover { color: var(--warm-gold, #C9A84C); }

        .lf-register { text-align: center; font-size: 0.82rem; color: var(--text-muted, #8A9BB0); margin-top: 1.2rem; }
        .lf-register a { color: var(--mediterranean, #1A3A5C); font-weight: 700; text-decoration: none; transition: color 0.2s; }
        .lf-register a:hover { color: var(--warm-gold, #C9A84C); }

        .lf-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 1.2rem; font-size: 0.72rem; color: var(--success, #2D8A5E); letter-spacing: 0.04em;
        }

        .login-foot {
          margin-top: 1.5rem; text-align: center;
          font-size: 0.68rem; color: var(--slate-gray, #8A9BB0); letter-spacing: 0.05em;
        }

        .lf-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
          border-radius: 50%; animation: spin-lf 0.75s linear infinite;
        }

        @media (max-width: 480px) {
          .login-logo-badge { width: 108px; height: 108px; }
          .login-logo-badge img { width: 72px; height: 72px; }
          .login-brand-name { font-size: 2rem; }
          .login-card-body { padding: 1.6rem 1.3rem; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-stage">

          {/* ── Marca: logo real cobre + wordmark ── */}
          <div className="login-brand">
            <div className="login-logo-badge">
              <img src="/synner-icon.png" alt="SYNNER" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <h1 className="login-brand-name">SYNNER</h1>
            <span className="login-brand-sub">The Intelligent CRM</span>
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>
              <div className="login-ai-chip">
                <span className="d" />
                AI Core · Red Sináptica Activa
              </div>
            </div>
          </div>

          {/* ── Tarjeta de login ── */}
          <div className="login-card">
            <div className="login-card-bar" />
            <div className="login-card-body">

              <div className="login-greeting">
                <h1>Iniciar sesión</h1>
                <p>Accede a tu portal de gestión inmobiliaria</p>
              </div>

              <form onSubmit={handleEmailLogin}>
                <div className="lf-group">
                  <label className="lf-label" htmlFor="login-email">Correo electrónico</label>
                  <div className="lf-input-wrap">
                    <span className="lf-icon"><Mail size={15} /></span>
                    <input
                      id="login-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      placeholder="tu@agencia.com" className="lf-input" autoComplete="email"
                    />
                  </div>
                </div>

                <div className="lf-group">
                  <label className="lf-label" htmlFor="login-pass">Contraseña</label>
                  <div className="lf-input-wrap">
                    <span className="lf-icon"><Lock size={15} /></span>
                    <input
                      id="login-pass" type={showPass ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••" className="lf-input" style={{ paddingRight: 40 }}
                      autoComplete="current-password"
                    />
                    <button type="button" className="lf-eye" onClick={() => setShowPass(!showPass)}
                      tabIndex={-1} title={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="lf-options-row">
                  <label className="lf-remember">
                    <input type="checkbox" checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--mediterranean, #1A3A5C)', cursor: 'pointer' }} />
                    <span>Recordar usuario</span>
                  </label>
                  <a href="#recuperar" onClick={handleForgotPassword} className="lf-forgot-link">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <button type="submit" disabled={loading} className="lf-btn">
                  {loading ? (<><span className="lf-spinner" /> Accediendo al sistema...</>)
                           : (<><ArrowRight size={16} /> Iniciar sesión</>)}
                </button>
              </form>

              <p className="lf-register">
                ¿No tienes cuenta?{' '}<Link to="/registro">Registra tu agencia</Link>
              </p>

              <div className="lf-secure">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Conexión segura cifrada · TLS 256-bit
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
