import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Upload, Image as ImageIcon, Loader2, Building2, User, ChevronDown, ChevronUp, X, Save } from 'lucide-react';
import { propiedadesApi, propietariosApi, documentosApi } from '../services/api';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const PISCINA_OPT = ['SI', 'NO', 'COMUNITARIA'];

function campo(d, k) {
  return d?.[k] != null && d[k] !== '';
}

function FieldBadge({ ok }) {
  return ok
    ? <span style={{ fontSize: '0.65rem', background: '#D1FAE5', color: '#059669', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>✓</span>
    : <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>?</span>;
}

export default function ModalCrearPropiedadUnificado({ onClose, onSuccess }) {
  const [datos, setDatos] = useState({
    nombre: '', tipo: 'VENTA', zona: '',
    habitaciones: '', banos: '', metrosConstruidos: '', metrosParcela: '',
    piscina: 'NO', licenciaETV: '', caracteristicas: '', descripcion: '', notas: '',
    precioVenta: '', precioAlquilerTemporadaAlta: '', precioAlquilerTemporadaMedia: '',
    precioAlquilerTemporadaBaja: '', rentaMensual: '',
    propietarioId: '', propietarioNombre: '', propietarioTelefono: '', propietarioEmail: '',
    garaje: false, terraza: false, jardin: false, vistasMar: false, ascensor: false,
  });

  const [propietarios, setPropietarios] = useState([]);
  const [fotos, setFotos] = useState([]);

  // Estados de proceso
  const [analyzingPdf, setAnalyzingPdf] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState({ basico: true, precios: true, propietario: true });
  const fileRef = useRef();

  const datosRef = useRef(datos);
  useEffect(() => { datosRef.current = datos; }, [datos]);

  useEffect(() => {
    propietariosApi.list({ limit: 100 })
      .then(res => setPropietarios(res?.data || []))
      .catch(() => {});
  }, []);

  const toggle = k => setExpanded(p => ({ ...p, [k]: !p[k] }));
  const upd = (k, v) => setDatos(p => ({ ...p, [k]: v }));
  const updNum = (k, v) => setDatos(p => ({ ...p, [k]: v === '' ? null : Number(v) }));
  const updBool = (k, v) => setDatos(p => ({ ...p, [k]: v }));

  // ─── Manejo de Archivos ──────────────────────────────────────────────────────
  const addFiles = useCallback(async (files) => {
    const fileArr = Array.from(files);
    const apiBase = BASE_URL.replace(/\/api$/, '');

    const pdfFiles  = fileArr.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const imageFiles = fileArr.filter(f => f.type.startsWith('image/') || f.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/));

    // ── 1. PDFs: backend extrae fotos reales + analiza con IA ────────────────
    for (const pdfFile of pdfFiles) {
      setAnalyzingPdf(true);
      try {
        const fd = new FormData();
        fd.append('pdf', pdfFile);

        const res = await fetch(`${BASE_URL}/propiedades/analizar-pdf`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: fd,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }

        const json = await res.json();
        const d = json?.datos;
        const fotosUrls = json?.fotosUrls || [];

        // Rellenar campos del formulario
        if (d) {
          const merge = {};
          const skipFields = ['_sinIA', '_pdfEscaneado', '_mock', '_errorIA'];
          for (const [k, v] of Object.entries(d)) {
            if (skipFields.includes(k)) continue;
            if (v !== null && v !== undefined && v !== '') merge[k] = v;
          }
          setDatos(prev => ({
            ...prev,
            ...merge,
            caracteristicas: Array.isArray(merge.caracteristicas)
              ? merge.caracteristicas.join(', ')
              : (merge.caracteristicas ?? prev.caracteristicas),
          }));

          const camposLlenados = Object.keys(merge).filter(k => !['tipo'].includes(k)).length;
          if (d._errorIA) {
            toast(`⚠️ IA no disponible: ${d._errorIA}. Se extrajeron ${camposLlenados} campos usando texto base.`, { icon: '⚠️' });
          } else if (d._pdfEscaneado) {
            toast(`📄 PDF sin texto — rellena los campos manualmente`, { icon: '⚠️' });
          } else if (d._sinIA) {
            toast.success(`📋 ${camposLlenados} campo(s) extraídos del PDF${fotosUrls.length > 0 ? ` · ${fotosUrls.length} fotos` : ''}`);
          } else {
            toast.success(`✨ IA: ${camposLlenados} campos + descripción optimizada${fotosUrls.length > 0 ? ` · ${fotosUrls.length} fotos` : ''}`);
          }
        }

        // Añadir fotos reales extraídas del PDF al slider preview
        if (fotosUrls.length > 0) {
          const nuevasFotos = fotosUrls.map(url => ({
            serverUrl: url,
            preview: apiBase + url,   // URL completa para <img src>
            fromPdf: true,
          }));
          setFotos(prev => [...prev, ...nuevasFotos].slice(0, 20));
        } else if (d && !d._pdfEscaneado) {
          toast(`📷 No se detectaron fotos en el PDF — sube las fotos manualmente`, { icon: 'ℹ️' });
        }
      } catch (err) {
        console.warn('[PDF] Error:', err.message);
        toast(`⚠️ No se pudo analizar el PDF: ${err.message}`, { icon: '⚠️' });
      } finally {
        setAnalyzingPdf(false);
      }
    }

    // ── 2. Imágenes directas ─────────────────────────────────────────────────
    if (imageFiles.length > 0) {
      const newFotos = imageFiles.slice(0, 20 - fotos.length).map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        fromPdf: false,
      }));
      setFotos(prev => [...prev, ...newFotos].slice(0, 20));

      // Extra: enviar a IA para analizar el contenido visual y generar descripción
      setAnalyzingPdf(true);
      try {
        const fd = new FormData();
        // Le pasamos todo lo que sepamos hasta ahora de datos
        fd.append('datosContexto', JSON.stringify(datosRef.current));
        // Tomar hasta 6 fotos para pasarlas al backend
        imageFiles.slice(0, 6).forEach(f => fd.append('fotos', f));

        const res = await fetch(`${BASE_URL}/propiedades/analizar-imagenes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: fd,
        });

        if (res.ok) {
          const json = await res.json();
          const pData = json?.datos;
          if (pData) {
            if (pData._errorIA) {
              toast(`⚠️ Análisis visual no disponible: ${pData._errorIA}`, { icon: '⚠️' });
            } else {
              setDatos(prev => {
                const merged = { ...prev };
                for (const [k, v] of Object.entries(pData)) {
                  if (v !== null && v !== undefined && v !== '' && k !== '_errorIA') {
                    merged[k] = v;
                  }
                }
                return merged;
              });
              toast.success('✨ Fotografías analizadas con éxito. Datos y descripción generados.', { icon: '✨' });
            }
          }
        }
      } catch (err) {
        console.warn('[IA Imágenes] Error:', err.message);
      } finally {
        setAnalyzingPdf(false);
      }
    }
  }, [fotos.length]);

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer?.files || []);
  };

  const removePhoto = (i) => {
    setFotos(prev => {
      const foto = prev[i];
      // Solo revocar blob URLs (fotos locales), no URLs de servidor
      if (foto?.preview && foto.preview.startsWith('blob:')) {
        URL.revokeObjectURL(foto.preview);
      }
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // ─── Guardado ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!datos.nombre?.trim() || !datos.zona?.trim()) {
      return toast.error('Nombre y zona son obligatorios');
    }

    setCreating(true);
    try {
      const body = {
        nombre: datos.nombre.trim(),
        tipo: datos.tipo,
        zona: datos.zona.trim(),
        municipio: datos.municipio || undefined,
        habitaciones: Number(datos.habitaciones) || 0,
        banos: Number(datos.banos) || 0,
        metrosConstruidos: Number(datos.metrosConstruidos) || 0,
        metrosParcela: datos.metrosParcela ? Number(datos.metrosParcela) : undefined,
        piscina: datos.piscina,
        garaje: !!datos.garaje,
        terraza: !!datos.terraza,
        jardin: !!datos.jardin,
        vistasMar: !!datos.vistasMar,
        ascensor: !!datos.ascensor,
        caracteristicas: datos.caracteristicas || undefined,
        descripcion: datos.descripcion || undefined,
        notas: datos.notas || undefined,
        propietarioId: datos.propietarioId || undefined,
      };

      if (body.tipo === 'VENTA' && datos.precioVenta)
        body.venta = { precioVenta: Number(datos.precioVenta) };
      if (body.tipo === 'VACACIONAL')
        body.alquilerVacacional = {
          precioTemporadaAlta: Number(datos.precioAlquilerTemporadaAlta) || 0,
          precioTemporadaMedia: Number(datos.precioAlquilerTemporadaMedia) || undefined,
          precioTemporadaBaja: Number(datos.precioAlquilerTemporadaBaja) || undefined,
          licenciaETV: datos.licenciaETV || undefined,
        };
      if (body.tipo === 'LARGA_DURACION' && datos.rentaMensual)
        body.alquilerLargaDuracion = { rentaMensual: Number(datos.rentaMensual) };

      // Crear propietario nuevo si es necesario
      if (!body.propietarioId && datos.propietarioNombre) {
        try {
          const propietario = await propietariosApi.create({
            nombre: datos.propietarioNombre.split(' ')[0] || datos.propietarioNombre,
            apellidos: datos.propietarioNombre.split(' ').slice(1).join(' ') || '',
            telefono: datos.propietarioTelefono || '',
            email: datos.propietarioEmail || '',
            tipo: 'PROPIETARIO',
            activo: true,
          });
          body.propietarioId = propietario.id;
        } catch { /* ignorar */ }
      }

      // Crear propiedad
      const propObj = await propiedadesApi.create(body);

      // Subir fotos: locales (file) + extraídas del PDF (serverUrl)
      const fotosASubir = fotos.filter(f => f.file || f.serverUrl);
      if (fotosASubir.length > 0 && propObj?.id) {
        const apiBase = BASE_URL.replace(/\/api$/, '');
        let subidas = 0;
        for (const foto of fotosASubir) {
          try {
            let fileToUpload = foto.file;

            if (!fileToUpload && foto.serverUrl) {
              // Foto ya en servidor — buscarla como blob y re-registrarla con el propiedadId
              const fetchRes = await fetch(apiBase + foto.serverUrl);
              const blob = await fetchRes.blob();
              const fname = foto.serverUrl.split('/').pop();
              fileToUpload = new File([blob], fname, { type: blob.type || 'image/jpeg' });
            }

            if (!fileToUpload) continue;

            const fd = new FormData();
            fd.append('file', fileToUpload, fileToUpload.name);
            fd.append('propiedadId', propObj.id);
            fd.append('tipo', 'FOTO');
            await documentosApi.upload(fd);
            subidas++;
          } catch (err) {
            console.warn('Error subiendo foto:', err.message);
          }
        }
        toast.success(`✅ Propiedad creada con ${subidas} foto(s) subida(s)`);
      } else {
        toast.success('✅ Propiedad creada correctamente');
      }

      onSuccess(propObj);
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'desconocido'));
    } finally {
      setCreating(false);
    }
  };

  const camposCore = ['nombre', 'tipo', 'zona', 'habitaciones', 'banos', 'metrosConstruidos'];
  const isBusy = analyzingPdf || creating;


  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: 780, maxHeight: '96vh', background: '#F8FAFC', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #2D5986 100%)', color: 'white', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.15rem' }}>
              <Building2 color="#C9A84C" size={20} />
              Nueva Propiedad Unificada
            </h3>
            <p style={{ margin: '3px 0 0', opacity: 0.85, fontSize: '0.8rem' }}>
              Arrastra un <strong>PDF</strong> para extraer fotos y datos automáticamente, o sube fotos directamente.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 8, padding: '6px 8px' }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Universal Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? '#1A3A5C' : '#CBD5E1'}`,
              borderRadius: 14, padding: '1.25rem', textAlign: 'center',
              background: dragging ? '#EFF6FF' : 'white', transition: 'all 0.2s', position: 'relative',
            }}
          >
            {analyzingPdf ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem', gap: 10 }}>
                <Loader2 size={32} color="#1A3A5C" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#1A3A5C', fontSize: '0.95rem' }}>Analizando con IA...</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>Extrayendo fotos, datos y optimizando descripción</div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="#1A3A5C" />
                  </div>
                  <div style={{ width: 44, height: 44, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={20} color="#D97706" />
                  </div>
                </div>
                <h4 style={{ margin: '0 0 4px', color: '#0F172A' }}>Arrastra archivos aquí</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                  PDF → extrae fotos embebidas + analiza datos y descripción con IA<br />
                  Imágenes JPG/PNG → se añaden directamente al perfil
                </p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }} onClick={() => fileRef.current?.click()}>
                  <Upload size={14} /> Seleccionar Archivos
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" multiple accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>

          {/* Fotos pre-cargadas */}
          {fotos.length > 0 && (
            <div style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Fotos ({fotos.length}/20)</span>
                <span style={{ color: '#94A3B8', fontWeight: 400 }}>
                  {fotos.filter(f => f.fromPdf).length > 0 && `${fotos.filter(f => f.fromPdf).length} del PDF · `}
                  {fotos.filter(f => !f.fromPdf).length > 0 && `${fotos.filter(f => !f.fromPdf).length} manuales`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: `2px solid ${f.fromPdf ? '#BFDBFE' : '#E2E8F0'}` }}>
                    <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {f.fromPdf && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(59,130,246,0.7)', fontSize: '0.55rem', color: 'white', textAlign: 'center', padding: '2px 0', fontWeight: 700 }}>PDF</div>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', padding: 3, cursor: 'pointer', color: 'white', display: 'flex' }}
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Datos básicos */}
          <div className="card" style={{ padding: 0, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <button onClick={() => toggle('basico')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: 'white', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="#1A3A5C" /> Datos Básicos
                <FieldBadge ok={camposCore.every(k => campo(datos, k))} />
              </span>
              {expanded.basico ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>
            {expanded.basico && (
              <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nombre de la Villa <FieldBadge ok={campo(datos, 'nombre')} /></label>
                  <input className="form-input" value={datos.nombre || ''} onChange={e => upd('nombre', e.target.value)} placeholder="Villa Can Rimbau..." />
                </div>
                <div>
                  <label className="form-label">Tipo <FieldBadge ok={campo(datos, 'tipo')} /></label>
                  <select className="form-select" value={datos.tipo || ''} onChange={e => upd('tipo', e.target.value)}>
                    <option value="VACACIONAL">🌴 Vacacional</option>
                    <option value="VENTA">🏛 Venta</option>
                    <option value="LARGA_DURACION">🏡 Larga Duración</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Zona <FieldBadge ok={campo(datos, 'zona')} /></label>
                  <input className="form-input" value={datos.zona || ''} onChange={e => upd('zona', e.target.value)} placeholder="Sant Josep, Talamanca..." />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Hab. <FieldBadge ok={campo(datos, 'habitaciones')} /></label>
                    <input className="form-input" type="number" min="0" value={datos.habitaciones ?? ''} onChange={e => updNum('habitaciones', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Baños <FieldBadge ok={campo(datos, 'banos')} /></label>
                    <input className="form-input" type="number" min="0" value={datos.banos ?? ''} onChange={e => updNum('banos', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">m² C. <FieldBadge ok={campo(datos, 'metrosConstruidos')} /></label>
                    <input className="form-input" type="number" min="0" value={datos.metrosConstruidos ?? ''} onChange={e => updNum('metrosConstruidos', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">m² Parc. <FieldBadge ok={campo(datos, 'metrosParcela')} /></label>
                    <input className="form-input" type="number" min="0" value={datos.metrosParcela ?? ''} onChange={e => updNum('metrosParcela', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Piscina</label>
                  <select className="form-select" value={datos.piscina || 'NO'} onChange={e => upd('piscina', e.target.value)}>
                    {PISCINA_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Licencia ETV</label>
                  <input className="form-input" value={datos.licenciaETV || ''} onChange={e => upd('licenciaETV', e.target.value)} placeholder="ETV-IBI-XXXXX" />
                </div>

                {/* Checkboxes */}
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: 4 }}>
                  {[['garaje', '🚗 Garaje'], ['terraza', '🌅 Terraza'], ['jardin', '🌿 Jardín'], ['vistasMar', '🌊 Vistas al mar'], ['ascensor', '🛗 Ascensor']].map(([k, label]) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                      <input type="checkbox" checked={!!datos[k]} onChange={e => updBool(k, e.target.checked)} /> {label}
                    </label>
                  ))}
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Características especiales</label>
                  <input className="form-input" value={datos.caracteristicas || ''} onChange={e => upd('caracteristicas', e.target.value)} placeholder="Piscina infinity, Domótica..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Descripción</label>
                  <textarea className="form-input" rows={2} value={datos.descripcion || ''} onChange={e => upd('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
                </div>
              </div>
            )}
          </div>

          {/* Sección: Precios */}
          <div className="card" style={{ padding: 0, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <button onClick={() => toggle('precios')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: 'white', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Tarifas y Precios
                <FieldBadge ok={!!(datos.precioVenta || datos.precioAlquilerTemporadaAlta || datos.rentaMensual)} />
              </span>
              {expanded.precios ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>
            {expanded.precios && (
              <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <label className="form-label">Precio Venta (€)</label>
                  <input className="form-input" type="number" min="0" value={datos.precioVenta ?? ''} onChange={e => updNum('precioVenta', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Renta Larga Duración (€/mes)</label>
                  <input className="form-input" type="number" min="0" value={datos.rentaMensual ?? ''} onChange={e => updNum('rentaMensual', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Vacacional T. Alta (€/sem)</label>
                    <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaAlta ?? ''} onChange={e => updNum('precioAlquilerTemporadaAlta', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Vacacional T. Media (€/sem)</label>
                    <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaMedia ?? ''} onChange={e => updNum('precioAlquilerTemporadaMedia', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Vacacional T. Baja (€/sem)</label>
                    <input className="form-input" type="number" min="0" value={datos.precioAlquilerTemporadaBaja ?? ''} onChange={e => updNum('precioAlquilerTemporadaBaja', e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección: Propietario */}
          <div className="card" style={{ padding: 0, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <button onClick={() => toggle('propietario')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: 'white', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="#1A3A5C" /> Propietario
                <FieldBadge ok={!!datos.propietarioId || !!datos.propietarioNombre} />
              </span>
              {expanded.propietario ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>
            {expanded.propietario && (
              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <label className="form-label">Asignar Propietario Existente</label>
                  <select className="form-select" value={datos.propietarioId || ''} onChange={e => upd('propietarioId', e.target.value)}>
                    <option value="">— Ninguno / Crear Nuevo —</option>
                    {propietarios.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellidos || ''}</option>
                    ))}
                  </select>
                </div>
                {!datos.propietarioId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Nombre del Nuevo Propietario</label>
                      <input className="form-input" value={datos.propietarioNombre || ''} onChange={e => upd('propietarioNombre', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Teléfono</label>
                      <input className="form-input" value={datos.propietarioTelefono || ''} onChange={e => upd('propietarioTelefono', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input className="form-input" value={datos.propietarioEmail || ''} onChange={e => upd('propietarioEmail', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', flexShrink: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            {fotos.length > 0 && `${fotos.length} foto(s) listas para subir`}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, padding: '0.65rem 1.5rem', cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isBusy}>
              {creating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {creating ? 'Guardando...' : `Guardar Propiedad${fotos.length > 0 ? ` + ${fotos.length} fotos` : ''}`}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
