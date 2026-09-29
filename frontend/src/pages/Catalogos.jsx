import { useState, useEffect } from 'react';
import { catalogosApi, propiedadesApi } from '../services/api';
import { Eye, Copy, Trash2, Plus, Clock, ExternalLink, Link2, X, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Catalogos() {
  const [catalogos, setCatalogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propiedades, setPropiedades] = useState([]);
  const [selectedProps, setSelectedProps] = useState([]);
  const [previewToken, setPreviewToken] = useState(null); // para el modal preview
  
  // Nuevo catálogo
  const [nombre, setNombre] = useState('');
  const [expiraEnDias, setExpiraEnDias] = useState('');

  useEffect(() => {
    fetchCatalogos();
    fetchPropiedades();
  }, []);

  const fetchCatalogos = async () => {
    try {
      const data = await catalogosApi.list();
      setCatalogos(data);
    } catch (err) {
      toast.error('Error al cargar catálogos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropiedades = async () => {
    try {
      const { data } = await propiedadesApi.list({ estado: 'DISPONIBLE' });
      setPropiedades(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (selectedProps.length === 0) {
      toast.error('Selecciona al menos una propiedad');
      return;
    }
    
    try {
      await catalogosApi.create({
        nombre,
        propiedadesIds: selectedProps,
        expiraEnDias: expiraEnDias ? parseInt(expiraEnDias) : null
      });
      toast.success('Catálogo creado con éxito');
      setIsModalOpen(false);
      setNombre('');
      setSelectedProps([]);
      setExpiraEnDias('');
      fetchCatalogos();
    } catch (err) {
      toast.error(err.message || 'Error al crear catálogo');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este catálogo?')) return;
    try {
      await catalogosApi.delete(id);
      setCatalogos(c => c.filter(x => x.id !== id));
      toast.success('Eliminado correctamente');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/c/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary), #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Link2 size={20} />
            </div>
            <h2 style={{ margin: 0 }}>Catálogos Inteligentes</h2>
          </div>
          <p>Crea selecciones privadas de propiedades y compártelas con tus clientes mediante un enlace exclusivo.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Nuevo Catálogo
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando catálogos...</div>
      ) : catalogos.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Link2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No tienes ningún catálogo creado todavía</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Crea tu primera selección privada de villas para enviársela a un cliente.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Crear primer catálogo</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {catalogos.map(cat => (
            <div key={cat.id} className="card" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>{cat.nombre}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{cat._count?.propiedades} propiedad{cat._count?.propiedades !== 1 ? 'es' : ''}</p>
                </div>
                <button onClick={() => handleEliminar(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.6 }} title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </div>
              <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                  <Eye size={15} />
                  <span style={{ fontWeight: 600 }}>{cat.vistas || 0} vistas</span>
                </div>
                {cat.expiraEn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d97706' }}>
                    <Clock size={14} />
                    <span>Caduca: {new Date(cat.expiraEn).toLocaleDateString('es-ES')}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin caducidad</span>
                )}
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => copyLink(cat.token)}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Copy size={15} /> Copiar Link
                </button>
                <button
                  onClick={() => setPreviewToken(cat.token)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                  title="Vista previa como cliente"
                >
                  <Monitor size={15} />
                </button>
                <a
                  href={`/c/${cat.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Catálogo */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="modal-header">
              <h3>Crear Nuevo Catálogo Inteligente</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <form onSubmit={handleCrear} className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Nombre del Catálogo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Selección Villas de Lujo Sr. Smith"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Caducidad (Opcional)</label>
                  <select
                    value={expiraEnDias}
                    onChange={e => setExpiraEnDias(e.target.value)}
                    className="form-input"
                  >
                    <option value="">No caduca nunca</option>
                    <option value="3">Caduca en 3 días</option>
                    <option value="7">Caduca en 7 días</option>
                    <option value="15">Caduca en 15 días</option>
                    <option value="30">Caduca en 30 días</option>
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Genera sensación de urgencia en el comprador (FOMO)</span>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Selecciona las Propiedades <span style={{ color: 'var(--primary)', fontWeight: 700 }}>({selectedProps.length} seleccionadas)</span></label>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: '280px', overflowY: 'auto' }}>
                    {propiedades.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay propiedades disponibles</div>
                    ) : propiedades.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: selectedProps.includes(p.id) ? 'var(--primary-light)' : 'transparent', transition: 'background 0.15s' }}>
                        <input
                          type="checkbox"
                          checked={selectedProps.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProps([...selectedProps, p.id]);
                            else setSelectedProps(selectedProps.filter(id => id !== p.id));
                          }}
                          style={{ marginRight: 12, width: 16, height: 16, accentColor: 'var(--primary)' }}
                        />
                        {p.fotoPrincipal && (
                          <img src={p.fotoPrincipal} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, marginRight: 12 }} />
                        )}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 2px' }}>{p.nombre}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{p.zona}{p.referencia ? ` · Ref: ${p.referencia}` : ''}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleCrear} className="btn btn-primary">Generar Enlace</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Preview de Catálogo */}
      {previewToken && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2vh' }}>
          <div style={{
            background: 'white', borderRadius: 16, overflow: 'hidden',
            width: '90vw', maxWidth: '1100px', height: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '12px 20px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Monitor size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vista previa del Catálogo — Así lo ve tu cliente</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`/c/${previewToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> Abrir en pestaña
                </a>
                <button
                  onClick={() => setPreviewToken(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe
              src={`/c/${previewToken}`}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="Preview del catálogo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
