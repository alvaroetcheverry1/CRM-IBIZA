import React, { useState, useEffect } from 'react';
import { configuracionApi } from '../services/configuracionApi';
import { useAgency } from '../context/AgencyContext';
import { Save, Image as ImageIcon, CreditCard, Building, Link as LinkIcon, UploadCloud, CheckCircle, Users, Edit2, Trash2, UserPlus } from 'lucide-react';
import { usuariosApi } from '../services/api';

export default function Configuracion() {
  const { config, refreshConfig } = useAgency();
  const [activeTab, setActiveTab] = useState('visual');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ logoUrl: false, firmaUrl: false, watermarkUrl: false });
  const [usuarios, setUsuarios] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ nombre: '', apellidos: '', email: '', rol: 'AGENTE', password: '' });

  const [formData, setFormData] = useState({
    nombreComercial: '', nombreLegal: '', cif: '', direccion: '', 
    telefonoOficial: '', whatsapp: '', emailOficial: '', 
    colorPrincipal: '#1890ff', webUrl: '', instagram: '', facebook: '',
    logoUrl: '', watermarkUrl: '', firmaUrl: '', iban: '', idiomaPrincipal: 'es'
  });

  const [facturacion, setFacturacion] = useState({ iva: 21, irpf: 0, prefijo: 'F-' });
  const [portales, setPortales] = useState({ idealista: '', fotocasa: '', james_edition: '', customPortals: [] });

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
        facebook: config.facebook || '',
        logoUrl: config.logoUrl || '',
        watermarkUrl: config.watermarkUrl || '',
        firmaUrl: config.firmaUrl || '',
        iban: config.iban || '',
        idiomaPrincipal: config.idiomaPrincipal || 'es'
      });

      if (config.configFacturacion) {
        try { setFacturacion(JSON.parse(config.configFacturacion)); } catch(e){}
      }
      if (config.tokensPortales) {
        try { 
          const parsed = JSON.parse(config.tokensPortales);
          setPortales({
            idealista: parsed.idealista || '',
            fotocasa: parsed.fotocasa || '',
            james_edition: parsed.james_edition || '',
            customPortals: Array.isArray(parsed.customPortals) ? parsed.customPortals : []
          });
        } catch(e){}
      }
    }
  }, [config]);

  useEffect(() => {
    if (activeTab === 'equipo') {
      loadUsuarios();
    }
  }, [activeTab]);

  const loadUsuarios = async () => {
    try {
      const res = await usuariosApi.list();
      setUsuarios(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const handleInviteChange = (e) => setInviteForm({ ...inviteForm, [e.target.name]: e.target.value });

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      await usuariosApi.create(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ nombre: '', apellidos: '', email: '', rol: 'AGENTE', password: '' });
      loadUsuarios();
      alert('Usuario invitado correctamente');
    } catch (err) {
      alert(err.message || 'Error al invitar usuario');
    }
  };

  const handleToggleActivo = async (id, currentStatus) => {
    try {
      await usuariosApi.update(id, { activo: !currentStatus });
      loadUsuarios();
    } catch (err) {
      alert(err.message || 'Error al actualizar usuario');
    }
  };

  const handleChangeRol = async (id, newRol) => {
    try {
      await usuariosApi.update(id, { rol: newRol });
      loadUsuarios();
    } catch (err) {
      alert(err.message || 'Error al cambiar rol');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFacturacion = (e) => setFacturacion({ ...facturacion, [e.target.name]: e.target.value });
  const handlePortales = (e) => setPortales({ ...portales, [e.target.name]: e.target.value });

  const handleAddCustomPortal = (e) => {
    e.preventDefault();
    setPortales({
      ...portales,
      customPortals: [
        ...portales.customPortals,
        { id: `custom_${Date.now()}`, nombre: '', url: '' }
      ]
    });
  };

  const handleCustomPortalChange = (index, field, value) => {
    const updated = [...portales.customPortals];
    updated[index][field] = value;
    setPortales({ ...portales, customPortals: updated });
  };

  const handleRemoveCustomPortal = (index, e) => {
    e.preventDefault();
    const updated = portales.customPortals.filter((_, i) => i !== index);
    setPortales({ ...portales, customPortals: updated });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading({ ...uploading, [fieldName]: true });
    try {
      const res = await configuracionApi.uploadImage(file);
      setFormData(prev => ({ ...prev, [fieldName]: res.url }));
    } catch (error) {
      console.error('Error subiendo imagen', error);
      alert('Error subiendo imagen. Verifica tu conexión.');
    } finally {
      setUploading({ ...uploading, [fieldName]: false });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        configFacturacion: JSON.stringify(facturacion),
        tokensPortales: JSON.stringify(portales)
      };
      await configuracionApi.save(payload);
      await refreshConfig();
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving config', error);
      alert('Error guardando la configuración');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'visual', label: 'Identidad Visual', icon: ImageIcon },
    { id: 'legal', label: 'Legales y Bancarios', icon: Building },
    { id: 'facturacion', label: 'Facturación', icon: CreditCard },
    { id: 'portales', label: 'Portales Inmobiliarios', icon: LinkIcon },
    { id: 'equipo', label: 'Equipo y Usuarios', icon: Users }
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Configuración de Agencia (Marca Blanca)</h2>
          <p>Personaliza la plataforma a tu marca, facturación y contratos automáticos.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="card" style={{ width: '250px', flexShrink: 0, padding: '10px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 20px', border: 'none', background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text)',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    textAlign: 'left', cursor: 'pointer', borderRight: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent'
                  }}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ flex: 1, minHeight: '600px' }}>
          <div className="card-body">
            {activeTab === 'visual' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h3>Imágenes y Color Corporativo</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Configura los recursos gráficos de tu agencia.</p>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  {/* LOGO UPLOAD */}
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="form-label">Logo Principal</label>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center', background: 'var(--bg-light)', position: 'relative' }}>
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                      )}
                      <div style={{ marginTop: '10px' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          <UploadCloud size={14} /> {uploading.logoUrl ? 'Subiendo...' : 'Subir Logo'}
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* WATERMARK UPLOAD */}
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="form-label">Marca de Agua (PNG Transparente)</label>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center', background: 'var(--bg-light)' }}>
                      {formData.watermarkUrl ? (
                        <img src={formData.watermarkUrl} alt="Watermark" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                      )}
                      <div style={{ marginTop: '10px' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          <UploadCloud size={14} /> {uploading.watermarkUrl ? 'Subiendo...' : 'Subir Marca'}
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'watermarkUrl')} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Nombre Comercial</label>
                  <input required type="text" className="form-input" name="nombreComercial" value={formData.nombreComercial} onChange={handleChange} placeholder="Ej. Ibiza Luxury Dreams" />
                </div>
                <div className="form-group">
                  <label className="form-label">Color Corporativo Principal</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" name="colorPrincipal" value={formData.colorPrincipal} onChange={handleChange} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Teñirá botones y cabeceras del CRM</span>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Idioma Principal de la Agencia</label>
                  <select name="idiomaPrincipal" value={formData.idiomaPrincipal} onChange={handleChange} className="form-input" style={{ maxWidth: '300px' }}>
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                    <option value="de">Alemán</option>
                    <option value="fr">Francés</option>
                    <option value="it">Italiano</option>
                  </select>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>Idioma por defecto para PDFs e interfaz (los agentes de IA detectarán automáticamente el idioma del cliente).</span>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h3>Datos Legales, Contacto y Firma</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Estos datos se utilizarán automáticamente en los contratos y mandatos.</p>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Firma Digital (Responsable Agencia)</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center', background: 'var(--bg-light)', maxWidth: '300px' }}>
                    {formData.firmaUrl ? (
                      <img src={formData.firmaUrl} alt="Firma" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sube la firma para autocompletar contratos</p>
                    )}
                    <div style={{ marginTop: '10px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        <UploadCloud size={14} /> {uploading.firmaUrl ? 'Subiendo...' : 'Subir Firma'}
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'firmaUrl')} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Razón Social (Nombre Legal)</label>
                  <input type="text" className="form-input" name="nombreLegal" value={formData.nombreLegal} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">CIF / NIF</label>
                  <input type="text" className="form-input" name="cif" value={formData.cif} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Dirección Fiscal Completa</label>
                  <input type="text" className="form-input" name="direccion" value={formData.direccion} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cuenta Bancaria (IBAN)</label>
                  <input type="text" className="form-input" name="iban" value={formData.iban} onChange={handleChange} placeholder="ES12 3456 ..." />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '10px' }}>
                  <h4>Contacto Público</h4>
                </div>
                <div className="form-group"><label className="form-label">Teléfono Oficial</label><input type="text" className="form-input" name="telefonoOficial" value={formData.telefonoOficial} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input type="text" className="form-input" name="whatsapp" value={formData.whatsapp} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Email Oficial</label><input type="email" className="form-input" name="emailOficial" value={formData.emailOficial} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Sitio Web</label><input type="url" className="form-input" name="webUrl" value={formData.webUrl} onChange={handleChange} /></div>
              </div>
            )}

            {activeTab === 'facturacion' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h3>Configuración de Facturación</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Configura los valores por defecto para generar facturas a propietarios y clientes.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Prefijo de Facturas</label>
                  <input type="text" className="form-input" name="prefijo" value={facturacion.prefijo} onChange={handleFacturacion} placeholder="Ej: F-2026-" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>La próxima factura será: {facturacion.prefijo}001</span>
                </div>
                <div className="form-group">
                  <label className="form-label">% IVA (por defecto)</label>
                  <input type="number" className="form-input" name="iva" value={facturacion.iva} onChange={handleFacturacion} />
                </div>
                <div className="form-group">
                  <label className="form-label">% IRPF Retención (opcional)</label>
                  <input type="number" className="form-input" name="irpf" value={facturacion.irpf} onChange={handleFacturacion} />
                </div>
              </div>
            )}

            {activeTab === 'portales' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h3>Conexión con Portales Inmobiliarios</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Configura los accesos para sincronizar tus propiedades automáticamente.</p>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Idealista (Feed XML URL o Token)</label>
                  <input type="text" className="form-input" name="idealista" value={portales.idealista} onChange={handlePortales} placeholder="https://..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Fotocasa (Feed XML URL o Token)</label>
                  <input type="text" className="form-input" name="fotocasa" value={portales.fotocasa} onChange={handlePortales} placeholder="https://..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">James Edition (API Key o Token)</label>
                  <input type="text" className="form-input" name="james_edition" value={portales.james_edition} onChange={handlePortales} placeholder="API Key..." />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Portales Personalizados (Feed XML)</h4>
                    <button onClick={handleAddCustomPortal} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                      + Añadir Portal
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '5px' }}>
                    Añade portales adicionales que admitan importación por Feed XML.
                  </p>
                </div>

                {portales.customPortals.map((cp, index) => (
                  <div key={cp.id} style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--bg-light)', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Nombre del Portal</label>
                      <input type="text" className="form-input" value={cp.nombre} onChange={(e) => handleCustomPortalChange(index, 'nombre', e.target.value)} placeholder="Ej. Kyero, MiPortal..." />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label className="form-label">URL de Destino / Endpoint</label>
                      <input type="text" className="form-input" value={cp.url} onChange={(e) => handleCustomPortalChange(index, 'url', e.target.value)} placeholder="https://api.portal.com/ingest..." />
                    </div>
                    <button onClick={(e) => handleRemoveCustomPortal(index, e)} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '8px' }}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'equipo' && (
              <div className="form-grid" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3>Equipo y Usuarios</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona los accesos y roles de los miembros de tu agencia.</p>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                    <UserPlus size={16} /> Invitar Agente
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Último Acceso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(u => (
                        <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.6 }}>
                          <td>{u.nombre} {u.apellidos}</td>
                          <td>{u.email}</td>
                          <td>
                            <select 
                              value={u.rol} 
                              onChange={(e) => handleChangeRol(u.id, e.target.value)}
                              className="form-input"
                              style={{ padding: '4px 8px', width: 'auto', fontSize: '0.85rem' }}
                              disabled={u.rol === 'SUPERADMIN' || !u.activo}
                            >
                              <option value="AGENTE">Agente</option>
                              <option value="DIRECTOR">Director</option>
                            </select>
                          </td>
                          <td>
                            <span className={`status-badge status-${u.activo ? 'ACTIVO' : 'CERRADO'}`}>
                              {u.activo ? 'Activo' : 'Suspendido'}
                            </span>
                          </td>
                          <td>{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString() : 'Nunca'}</td>
                          <td>
                            <button 
                              type="button"
                              className="btn btn-icon btn-sm" 
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              title={u.activo ? 'Suspender Usuario' : 'Reactivar Usuario'}
                              disabled={u.rol === 'SUPERADMIN'}
                            >
                              {u.activo ? <Trash2 size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay usuarios en esta agencia</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Invitar Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleInviteSubmit} className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Nombre</label>
                  <input required type="text" name="nombre" value={inviteForm.nombre} onChange={handleInviteChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input type="text" name="apellidos" value={inviteForm.apellidos} onChange={handleInviteChange} className="form-input" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label required">Email</label>
                  <input required type="email" name="email" value={inviteForm.email} onChange={handleInviteChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Contraseña Temporal</label>
                  <input required type="text" name="password" minLength={8} value={inviteForm.password} onChange={handleInviteChange} className="form-input" placeholder="Min 8 caracteres" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Rol</label>
                  <select name="rol" value={inviteForm.rol} onChange={handleInviteChange} className="form-input">
                    <option value="AGENTE">Agente</option>
                    <option value="DIRECTOR">Director</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary w-100">Crear Usuario e Invitar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
