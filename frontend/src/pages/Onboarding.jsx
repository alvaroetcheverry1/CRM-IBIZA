import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configuracionApi } from '../services/configuracionApi';
import { useAgency } from '../context/AgencyContext';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { refreshConfig } = useAgency();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombreComercial: '',
    nombreLegal: '',
    cif: '',
    direccion: '',
    telefonoOficial: '',
    whatsapp: '',
    emailOficial: '',
    colorPrincipal: '#1890ff',
    webUrl: '',
    instagram: '',
    facebook: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await configuracionApi.save(formData);
      await refreshConfig();
      navigate('/');
    } catch (error) {
      console.error('Error saving config', error);
      alert('Error guardando la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>¡Bienvenido a tu CRM!</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Vamos a configurar tu entorno de trabajo para que todo tenga el estilo de tu agencia.
        </p>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {step === 1 && (
            <div>
              <h3>Paso 1: Identidad Visual</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre Comercial de la Agencia</label>
                <input required type="text" name="nombreComercial" value={formData.nombreComercial} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Color Corporativo Principal</label>
                <input type="color" name="colorPrincipal" value={formData.colorPrincipal} onChange={handleChange} style={{ width: '100px', height: '40px', padding: '0', cursor: 'pointer' }} />
              </div>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>*Nota: El logo y la marca de agua se podrán subir más adelante desde los ajustes.*</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Paso 2: Datos de Facturación y Contacto</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Razón Social (Legal)</label>
                <input type="text" name="nombreLegal" value={formData.nombreLegal} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>CIF / NIF</label>
                  <input type="text" name="cif" value={formData.cif} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Teléfono Oficial</label>
                  <input type="text" name="telefonoOficial" value={formData.telefonoOficial} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email Oficial</label>
                <input type="email" name="emailOficial" value={formData.emailOficial} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Dirección Fiscal</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Paso 3: Redes Sociales (Opcional)</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Página Web (URL)</label>
                <input type="text" name="webUrl" value={formData.webUrl} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>WhatsApp Oficial</label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Instagram (URL)</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} style={{ padding: '10px 20px', background: '#ccc', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Atrás
              </button>
            ) : <div />}
            
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: formData.colorPrincipal, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {step === 3 ? (loading ? 'Guardando...' : 'Finalizar Configuración') : 'Siguiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
