/**
 * Registro.jsx — Página de registro de nueva agencia
 * Las agencias quedan en estado PENDIENTE hasta activación manual del superadmin
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [form, setForm] = useState({
    nombreAgencia: '',
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register({
        nombreAgencia: form.nombreAgencia,
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
      });
      setExito(true);
    } catch (err) {
      toast.error(err.message || 'Error al registrar la agencia');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: '3rem', maxWidth: 440, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)', textAlign: 'center',
        }}>
          <CheckCircle2 size={64} color="#2D8A5E" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#0D1B2A', fontWeight: 700, marginBottom: '0.5rem' }}>
            ¡Registro completado!
          </h2>
          <p style={{ color: '#64748B', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Hemos recibido tu solicitud para <strong>{form.nombreAgencia}</strong>.<br />
            Nuestro equipo revisará tu cuenta y te enviaremos un email a <strong>{form.email}</strong> cuando esté activa.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Normalmente activamos las cuentas en 24-48 horas laborables.
          </p>
          <Link to="/login" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '2.5rem',
        maxWidth: 520, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(13,27,42,0.25)',
          }}>
            <Building2 size={28} color="#C9A84C" />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>
            Registra tu Agencia
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8A9BB0' }}>
            Crea tu cuenta de acceso al CRM inmobiliario profesional
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre de la agencia */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>
              Nombre de la Agencia *
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input
                type="text" name="nombreAgencia" value={form.nombreAgencia}
                onChange={handleChange} required
                placeholder="Ej. Ibiza Luxury Properties"
                className="form-input" style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Nombre + Apellidos en fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Nombre *</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Juan" className="form-input" style={{ paddingLeft: 32 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Apellidos</label>
              <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="García López" className="form-input" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="juan@miagencia.com" className="form-input" style={{ paddingLeft: 32 }} />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Teléfono de contacto</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} placeholder="+34 600 000 000" className="form-input" style={{ paddingLeft: 32 }} />
            </div>
          </div>

          {/* Contraseña en fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="Mín. 8 caracteres" className="form-input" style={{ paddingLeft: 32 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 5 }}>Confirmar *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }} />
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Repite la contraseña" className="form-input" style={{ paddingLeft: 32 }} />
              </div>
            </div>
          </div>

          {/* Aviso PENDIENTE */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#1D4ED8' }}>
            ℹ️ Tu cuenta quedará en estado <strong>pendiente de revisión</strong>. Recibirás un email cuando esté activa.
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '0.9rem', fontWeight: 700, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(13,27,42,0.3)',
            }}
          >
            {loading ? 'Registrando...' : 'Solicitar Acceso'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#64748B', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Ya tengo cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
