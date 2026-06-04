import React, { useState, useEffect } from 'react';
import { configuracionApi } from '../services/configuracionApi';
import { useAgency } from '../context/AgencyContext';
import { Save } from 'lucide-react';

export default function Configuracion() {
  const { config, refreshConfig } = useAgency();
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

  useEffect(() => {
    if (config) {
      setFormData({
        nombreComercial: config.nombreComercial || '',
        nombreLegal: config.nombreLegal || '',
        cif: config.cif || '',
        direccion: config.direccion || '',
        telefonoOficial: config.telefonoOficial || '',
        whatsapp: config.whatsapp || '',
        emailOficial: config.emailOficial || '',
        colorPrincipal: config.colorPrincipal || '#1890ff',
        webUrl: config.webUrl || '',
        instagram: config.instagram || '',
        facebook: config.facebook || ''
      });
    }
  }, [config]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await configuracionApi.save(formData);
      await refreshConfig();
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving config', error);
      alert('Error guardando la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Configuración de Agencia</h2>
          <p>Personaliza la apariencia y los datos corporativos de tu CRM.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '10px' }}>Identidad Visual</h3>
            </div>
            
            <div className="form-group">
              <label className="form-label required">Nombre Comercial</label>
              <input required type="text" className="form-input" name="nombreComercial" value={formData.nombreComercial} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Color Corporativo Principal</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" name="colorPrincipal" value={formData.colorPrincipal} onChange={handleChange} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: '1px solid var(--border)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Este color teñirá todo el CRM</span>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '10px' }}>Datos de Facturación y Contacto</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Razón Social (Legal)</label>
              <input type="text" className="form-input" name="nombreLegal" value={formData.nombreLegal} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">CIF / NIF</label>
              <input type="text" className="form-input" name="cif" value={formData.cif} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección Fiscal</label>
              <input type="text" className="form-input" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Oficial</label>
              <input type="email" className="form-input" name="emailOficial" value={formData.emailOficial} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono Oficial</label>
              <input type="text" className="form-input" name="telefonoOficial" value={formData.telefonoOficial} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp de Contacto</label>
              <input type="text" className="form-input" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '10px' }}>Enlaces y Redes Sociales</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Página Web (URL)</label>
              <input type="text" className="form-input" name="webUrl" value={formData.webUrl} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram (URL)</label>
              <input type="text" className="form-input" name="instagram" value={formData.instagram} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook (URL)</label>
              <input type="text" className="form-input" name="facebook" value={formData.facebook} onChange={handleChange} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
