import { useState } from 'react';
import { FileCheck, FileText, Loader2, ChevronLeft, ChevronRight, Check, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { documentosApi } from '../services/api';

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const IDIOMAS = ['Español', 'English', 'Deutsch', 'Français'];

export default function DossierModal({ propiedad, onClose, onAddPhotos }) {
  const fotos = propiedad.documentos?.filter(d => d.tipo === 'FOTO') || [];

  // ── Step 1: selección de fotos ──
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState(
    new Set(fotos.slice(0, 8).map(f => f.id))
  );

  // ── Step 2: contenido editable ──
  const precioDefault =
    propiedad.venta?.precioVenta ||
    propiedad.alquilerVacacional?.precioTemporadaAlta ||
    propiedad.alquilerLargaDuracion?.rentaMensual || '';

  const [titulo,      setTitulo]      = useState(propiedad.nombre || '');
  const [descripcion, setDescripcion] = useState(propiedad.descripcion || '');
  const [caracteristicas, setCaracteristicas] = useState(propiedad.caracteristicas || '');
  const [precio,      setPrecio]      = useState(precioDefault);
  const [agente,      setAgente]      = useState('');
  const [telefono,    setTelefono]    = useState('');
  const [email,       setEmail]       = useState('info@ibizaluxurydreams.com');
  const [idioma,      setIdioma]      = useState('Español');

  // ── Wizard state ──
  const [step,       setStep]       = useState(1); // 1 | 2 | 3
  const [generating, setGenerating] = useState(false);

  function toggleFoto(id) {
    setFotosSeleccionadas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const element = document.getElementById('dossier-pdf-content');
      const opt = {
        margin:       [0, 0, 0, 0],
        filename:     `Dossier_${propiedad.referencia}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generar Blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

      // Descargar localmente
      const tempUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = tempUrl;
      link.download = opt.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(tempUrl);

      // Subir a Drive (Marketing)
      const formData = new FormData();
      formData.append('file', pdfBlob, opt.filename);
      formData.append('propiedadId', propiedad.id);
      
      await documentosApi.uploadDossier(formData);
      
      toast.success('📄 Dossier descargado y guardado en Drive (Carpeta Marketing)');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('❌ Error al generar o subir el dossier');
    } finally {
      setGenerating(false);
    }
  }

  const fotosElegidas = fotos.filter(f => fotosSeleccionadas.has(f.id));

  const steps = [
    { n: 1, label: 'Fotos' },
    { n: 2, label: 'Contenido' },
    { n: 3, label: 'Preview' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: step === 3 ? 820 : 620, maxHeight: '95vh', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: '#1A3A5C', color: 'white', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileCheck size={18} color="#C9A84C" /> Generar Dossier</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
          </div>
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div
                  onClick={() => s.n < step && setStep(s.n)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: s.n < step ? 'pointer' : 'default',
                    padding: '4px 0', flex: 1,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: step > s.n ? '#059669' : step === s.n ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {step > s.n ? <Check size={13} /> : s.n}
                  </div>
                  <span style={{ fontSize: '0.78rem', opacity: step === s.n ? 1 : 0.65, fontWeight: step === s.n ? 600 : 400 }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.n + 1 ? '#059669' : 'rgba(255,255,255,0.2)', margin: '0 6px' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* ── PASO 1: Selección de fotos ── */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                  Selecciona las fotos que quieres incluir en el dossier ({fotosSeleccionadas.size} seleccionadas).
                </p>
                <button
                  onClick={onAddPhotos}
                  style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, color: '#1A3A5C', fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ImagePlus size={14} /> Añadir más fotos
                </button>
              </div>
              
              {fotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', background: '#F8FAFC', borderRadius: 10, border: '2px dashed #E2E8F0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Sin fotos disponibles</p>
                  <p style={{ margin: '4px 0 1rem', fontSize: '0.82rem' }}>Sube fotos para agregarlas al dossier.</p>
                  <button onClick={onAddPhotos} className="btn btn-primary" style={{ background: '#1A3A5C', fontSize: '0.8rem' }}>
                    Añadir fotos
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {fotos.map(f => {
                    const sel = fotosSeleccionadas.has(f.id);
                    return (
                      <button key={f.id} onClick={() => toggleFoto(f.id)}
                        style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', padding: 0, cursor: 'pointer', border: `3px solid ${sel ? '#1A3A5C' : '#E2E8F0'}`, background: '#F0EDE6', transition: 'border 0.15s' }}>
                        {f.urlDrive
                          ? <img src={f.urlDrive} alt={f.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🖼</div>
                        }
                        {sel && (
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, background: '#1A3A5C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={13} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: Editar contenido ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Título del dossier</label>
                  <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Descripción comercial</label>
                  <textarea className="form-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} style={{ resize: 'vertical', lineHeight: 1.6 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Características destacadas (separadas por coma)</label>
                  <input className="form-input" value={caracteristicas} onChange={e => setCaracteristicas(e.target.value)} placeholder="Piscina, Zona relax, Vistas panorámicas..." />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Precio a mostrar (€)</label>
                  <input className="form-input" type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Idioma</label>
                  <select className="form-select" value={idioma} onChange={e => setIdioma(e.target.value)}>
                    {IDIOMAS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre del agente</label>
                  <input className="form-input" value={agente} onChange={e => setAgente(e.target.value)} placeholder="Ej. María González" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Teléfono agente</label>
                  <input className="form-input" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email agente</label>
                  <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Preview ── */}
          {step === 3 && (
            <div id="dossier-pdf-content" style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              {/* Hero */}
              <div style={{ height: 240, position: 'relative', background: '#0F172A', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem' }}>
                {fotosElegidas[0]?.urlDrive && (
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
                    <img src={fotosElegidas[0].urlDrive} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', zIndex: 1, borderBottom: '2px solid #C9A84C', paddingBottom: 4 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 300, color: 'white', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Ibiza Luxury Dreams</span>
                </div>
                <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
                  <div style={{ color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.72rem', fontWeight: 600, marginBottom: 8 }}>Ref. {propiedad.referencia}</div>
                  <h2 style={{ fontSize: '2rem', margin: '0 0 4px', fontFamily: 'serif', fontWeight: 400 }}>{titulo}</h2>
                  <div style={{ fontSize: '1rem', fontWeight: 300 }}>{propiedad.zona}, Ibiza</div>
                </div>
              </div>
              {/* Galería mini */}
              {fotosElegidas.length > 1 && (
                <div style={{ display: 'flex', gap: 4, padding: '0.5rem', background: '#0F172A' }}>
                  {fotosElegidas.slice(1, 5).map((f, i) => (
                    <div key={f.id} style={{ flex: 1, height: 56, overflow: 'hidden', borderRadius: 4, background: '#1A3A5C' }}>
                      {f.urlDrive && <img src={f.urlDrive} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  ))}
                </div>
              )}
              {/* Cuerpo */}
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', color: '#1A3A5C' }}>
                <div>
                  <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', color: '#C9A84C', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>Overview</h4>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#475569', margin: 0 }}>
                    {descripcion || 'Espectacular propiedad de lujo en una de las zonas más exclusivas de la isla.'}
                  </p>
                  {caracteristicas && (
                    <>
                      <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', color: '#C9A84C', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem', marginTop: '1.25rem', marginBottom: '0.75rem' }}>Features</h4>
                      <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                        {caracteristicas.split(',').map((c, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
                            <div style={{ width: 4, height: 4, background: '#C9A84C', borderRadius: '50%', flexShrink: 0 }} /> {c.trim()}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: 6 }}>
                  <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', color: '#C9A84C', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem', margin: '0 0 0.75rem' }}>Specs</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {precio && <div><div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>Precio</div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A' }}>{formatMoney(precio)}</div></div>}
                    {[['Bedrooms', propiedad.habitaciones], ['Bathrooms', propiedad.banos], ['Built', `${propiedad.metrosConstruidos}m²`]].map(([l, v]) => (
                      <div key={l}><div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase' }}>{l}</div><div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{agente || 'Su Agente'}</div>
                    {telefono && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{telefono}</div>}
                    <div style={{ fontSize: '0.75rem', color: '#4A6FA5', marginTop: 2 }}>{email}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 4 }}>{idioma}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', gap: 10, background: '#FAFAF8', flexShrink: 0 }}>
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #CBD5E1', background: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
            <ChevronLeft size={15} /> {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A3A5C', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleDownload} disabled={generating}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#C9A84C', color: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
              {generating ? <Loader2 size={15} className="spin" /> : <FileText size={15} />}
              {generating ? 'Generando...' : 'Descargar PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
