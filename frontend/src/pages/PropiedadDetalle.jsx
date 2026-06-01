import { useParams, useNavigate } from 'react-router-dom';
import { propiedadesApi, propietariosApi, documentosApi, actividadesApi } from '../services/api';
import { ArrowLeft, Bed, Bath, Square, Home, ExternalLink, FileText, Loader2, ImagePlus, CheckCircle, AlertCircle, Pencil, X, Save, Bot, FileCheck, Trash2, Phone, Mail, Eye, StickyNote, CheckSquare, Plus, Clock, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PhotoSlider     from '../components/PhotoSlider';
import MatchmakingModal from '../components/MatchmakingModal';
import DossierModal    from '../components/DossierModal';
import ActividadTimeline from '../components/ActividadTimeline';
import PublicadorPortales from '../components/PublicadorPortales';
import { extractPdfPages } from '../utils/extractPdfPages';

function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const TIPO_LABEL   = { VACACIONAL: '🌴 Vacacional', LARGA_DURACION: '🏡 Larga Duración', VENTA: '🏛 Venta' };
const ESTADO_BADGE = { DISPONIBLE: 'badge-disponible', ALQUILADA: 'badge-alquilada', RESERVADA: 'badge-reservada', VENDIDA: 'badge-vendida' };
const ESTADOS      = ['DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'VENDIDA', 'EN_OBRAS', 'CAPTACION'];
const ETAPAS_VENTA = ['CAPTACION', 'COMERCIALIZACION', 'OFERTA', 'ARRAS', 'ESCRITURA', 'VENDIDO'];

// ─── Componente field helpers ─────────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function EditInput({ value, onChange, type = 'text', placeholder = '' }) {
  return (
    <input
      className="form-input"
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', fontSize: '0.875rem' }}
    />
  );
}

function EditSelect({ value, onChange, options }) {
  return (
    <select className="form-select" value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PropiedadDetalle() {

  const { id }         = useParams();
  const navigate       = useNavigate();
  const qc             = useQueryClient();
  const fileInputRef   = useRef(null);

  const [showMatchModal,   setShowMatchModal]   = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showPortalesModal, setShowPortalesModal] = useState(false);
  const [uploadingPhotos,  setUploadingPhotos]  = useState([]);
  const [extractingPdf,    setExtractingPdf]    = useState(false);
  const [extractProgress,  setExtractProgress]  = useState({ current: 0, total: 0 });
  const [editMode,         setEditMode]         = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [form,             setForm]             = useState(null);
  const [propietarios,     setPropietarios]     = useState([]);

  const { data: propiedad, isLoading, isError } = useQuery({
    queryKey: ['propiedad', id],
    queryFn: () => propiedadesApi.get(id),
    retry: 1,
  });

  // Cargar propietarios para el selector del modo edición
  useEffect(() => {
    propietariosApi.list({ limit: 200 }).then(r => setPropietarios(r?.data || [])).catch(() => {});
  }, []);

  // Inicializar form con los datos actuales
  function startEdit() {
    const p = propiedad;
    setForm({
      nombre:            p.nombre ?? '',
      zona:              p.zona ?? '',
      municipio:         p.municipio ?? '',
      estado:            p.estado ?? 'DISPONIBLE',
      habitaciones:      p.habitaciones ?? 0,
      banos:             p.banos ?? 0,
      metrosConstruidos: p.metrosConstruidos ?? 0,
      metrosParcela:     p.metrosParcela ?? '',
      descripcion:       p.descripcion ?? '',
      caracteristicas:   p.caracteristicas ?? '',
      notas:             p.notas ?? '',
      propietarioId:     p.propietarioId ?? '',
      // Venta
      precioVenta:             p.venta?.precioVenta ?? '',
      precioMinimo:            p.venta?.precioMinimo ?? '',
      etapaPipeline:           p.venta?.etapaPipeline ?? 'CAPTACION',
      comisionAgencia:         p.venta?.comisionAgencia ?? '',
      referenciaCatastral:     p.venta?.referenciaCatastral ?? '',
      numRegistroPropiedad:    p.venta?.numRegistroPropiedad ?? '',
      fechaArras:              p.venta?.fechaArras ? p.venta.fechaArras.slice(0, 10) : '',
      fechaEscritura:          p.venta?.fechaEscritura ? p.venta.fechaEscritura.slice(0, 10) : '',
      notario:                 p.venta?.notario ?? '',
      observacionesVenta:      p.venta?.observaciones ?? '',
      // Vacacional
      precioTemporadaAlta:     p.alquilerVacacional?.precioTemporadaAlta ?? '',
      precioTemporadaMedia:    p.alquilerVacacional?.precioTemporadaMedia ?? '',
      precioTemporadaBaja:     p.alquilerVacacional?.precioTemporadaBaja ?? '',
      licenciaETV:             p.alquilerVacacional?.licenciaETV ?? '',
      cedula:                  p.alquilerVacacional?.cedula ?? '',
      depositoGarantia:        p.alquilerVacacional?.depositoGarantia ?? '',
      checkInHora:             p.alquilerVacacional?.checkInHora ?? '',
      checkOutHora:            p.alquilerVacacional?.checkOutHora ?? '',
      minimoNoches:            p.alquilerVacacional?.minimoNoches ?? '',
      personasMaximas:         p.alquilerVacacional?.personasMaximas ?? '',
      urlAirbnb:               p.alquilerVacacional?.urlAirbnb ?? '',
      urlBooking:              p.alquilerVacacional?.urlBooking ?? '',
      urlMioweb:               p.alquilerVacacional?.urlMioweb ?? '',
      // Larga duración
      rentaMensual:            p.alquilerLargaDuracion?.rentaMensual ?? '',
      inquilinoNombre:         p.alquilerLargaDuracion?.inquilinoNombre ?? '',
      inquilinoNif:            p.alquilerLargaDuracion?.inquilinoNif ?? '',
      inquilinoTelefono:       p.alquilerLargaDuracion?.inquilinoTelefono ?? '',
      inquilinoEmail:          p.alquilerLargaDuracion?.inquilinoEmail ?? '',
      fechaInicio:             p.alquilerLargaDuracion?.fechaInicio ? p.alquilerLargaDuracion.fechaInicio.slice(0, 10) : '',
      duracionMeses:           p.alquilerLargaDuracion?.duracionMeses ?? '',
      fechaVencimiento:        p.alquilerLargaDuracion?.fechaVencimiento ? p.alquilerLargaDuracion.fechaVencimiento.slice(0, 10) : '',
      fianzaMeses:             p.alquilerLargaDuracion?.fianzaMeses ?? '',
      fianzaImporte:           p.alquilerLargaDuracion?.fianzaImporte ?? '',
      diaPagoCada:             p.alquilerLargaDuracion?.diaPagoCada ?? '',
    });
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setForm(null);
  }

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.zona.trim()) {
      return toast.error('Nombre y zona son obligatorios');
    }
    setSaving(true);
    try {
      const payload = {
        nombre:            form.nombre.trim(),
        zona:              form.zona.trim(),
        municipio:         form.municipio || null,
        estado:            form.estado,
        habitaciones:      Number(form.habitaciones) || 0,
        banos:             Number(form.banos) || 0,
        metrosConstruidos: Number(form.metrosConstruidos) || 0,
        metrosParcela:     form.metrosParcela ? Number(form.metrosParcela) : null,
        descripcion:       form.descripcion || null,
        caracteristicas:   form.caracteristicas || null,
        notas:             form.notas || null,
        propietarioId:     form.propietarioId || null,
      };

      if (propiedad.tipo === 'VENTA') {
        payload.venta = {
          precioVenta:          Number(form.precioVenta) || null,
          precioMinimo:         form.precioMinimo ? Number(form.precioMinimo) : null,
          etapaPipeline:        form.etapaPipeline,
          comisionAgencia:      form.comisionAgencia ? Number(form.comisionAgencia) : null,
          referenciaCatastral:  form.referenciaCatastral || null,
          numRegistroPropiedad: form.numRegistroPropiedad || null,
          fechaArras:           form.fechaArras || null,
          fechaEscritura:       form.fechaEscritura || null,
          notario:              form.notario || null,
          observaciones:        form.observacionesVenta || null,
        };
      }
      if (propiedad.tipo === 'VACACIONAL') {
        payload.alquilerVacacional = {
          precioTemporadaAlta:  Number(form.precioTemporadaAlta) || null,
          precioTemporadaMedia: Number(form.precioTemporadaMedia) || null,
          precioTemporadaBaja:  Number(form.precioTemporadaBaja) || null,
          licenciaETV:          form.licenciaETV || null,
          cedula:               form.cedula || null,
          depositoGarantia:     form.depositoGarantia ? Number(form.depositoGarantia) : null,
          checkInHora:          form.checkInHora || null,
          checkOutHora:         form.checkOutHora || null,
          minimoNoches:         form.minimoNoches ? Number(form.minimoNoches) : null,
          personasMaximas:      form.personasMaximas ? Number(form.personasMaximas) : null,
          urlAirbnb:            form.urlAirbnb || null,
          urlBooking:           form.urlBooking || null,
          urlMioweb:            form.urlMioweb || null,
        };
      }
      if (propiedad.tipo === 'LARGA_DURACION') {
        payload.alquilerLargaDuracion = {
          rentaMensual:      Number(form.rentaMensual) || null,
          inquilinoNombre:   form.inquilinoNombre || null,
          inquilinoNif:      form.inquilinoNif || null,
          inquilinoTelefono: form.inquilinoTelefono || null,
          inquilinoEmail:    form.inquilinoEmail || null,
          fechaInicio:       form.fechaInicio || null,
          duracionMeses:     form.duracionMeses ? Number(form.duracionMeses) : null,
          fechaVencimiento:  form.fechaVencimiento || null,
          fianzaMeses:       form.fianzaMeses ? Number(form.fianzaMeses) : null,
          fianzaImporte:     form.fianzaImporte ? Number(form.fianzaImporte) : null,
          diaPagoCada:       form.diaPagoCada ? Number(form.diaPagoCada) : null,
        };
      }

      await propiedadesApi.update(id, payload);
      qc.invalidateQueries({ queryKey: ['propiedad', id] });
      qc.invalidateQueries({ queryKey: ['propiedades'] });
      toast.success('✅ Propiedad actualizada correctamente');
      setEditMode(false);
      setForm(null);
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'desconocido'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta propiedad? Esta acción es irreversible.')) return;
    try {
      await propiedadesApi.delete(id);
      qc.invalidateQueries({ queryKey: ['propiedades'] });
      toast.success('Propiedad eliminada');
      navigate('/propiedades');
    } catch (err) {
      toast.error('Error al eliminar: ' + (err.message || 'Desconocido'));
    }
  }

  async function handleDeletePhoto(fotoId) {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await documentosApi.delete(fotoId);
      qc.invalidateQueries({ queryKey: ['propiedad', id] });
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error('Error al eliminar foto');
    }
  }

  // ─── Subida de fotos (imágenes directas + PDFs con extracción de páginas) ───
  async function handlePhotoUpload(files) {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);

    // Separar PDFs e imágenes
    const pdfFiles   = fileArr.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const imageFiles = fileArr.filter(f => !f.name.toLowerCase().endsWith('.pdf') && !f.type.includes('pdf'));

    // ── Procesar PDFs: enviarlos al backend para análisis IA ──────────────────────────
    for (const pdfFile of pdfFiles) {
      setExtractingPdf(true);
      toast(`📄 Analizando PDF con IA...`, { icon: '🔄' });
      try {
        const fd = new FormData();
        fd.append('pdf', pdfFile);

        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/propiedades/analizar-pdf`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: fd,
        });

        if (!res.ok) throw new Error('Error al analizar el PDF en el servidor');
        const json = await res.json();
        const d = json?.datos;
        const fotosUrls = json?.fotosUrls || [];

        // Si hay datos, actualizar la propiedad
        if (d && Object.keys(d).length > 0) {
          const skipFields = ['_sinIA', '_pdfEscaneado', '_mock', '_errorIA', 'tipo'];
          const merge = {};
          for (const [k, v] of Object.entries(d)) {
            if (!skipFields.includes(k) && v !== null && v !== undefined && v !== '') {
              merge[k] = v;
            }
          }
          if (merge.caracteristicas && Array.isArray(merge.caracteristicas)) {
            merge.caracteristicas = merge.caracteristicas.join(', ');
          }
          if (Object.keys(merge).length > 0) {
            await propiedadesApi.update(id, merge);
            toast.success(`✨ IA actualizó ${Object.keys(merge).length} campos de la propiedad`);
          }
        }

        // Subir las fotos extraídas
        if (fotosUrls.length > 0) {
          const uploadsNew = fotosUrls.map((url, i) => ({ name: `Foto extraída ${i+1}`, status: 'uploading' }));
          setUploadingPhotos(prev => [...prev, ...uploadsNew]);
          const startIdx = uploadingPhotos.length;

          await Promise.all(fotosUrls.map(async (url, i) => {
            const idx = startIdx + i;
            try {
              const fetchRes = await fetch(apiBase + url);
              const blob = await fetchRes.blob();
              const fname = url.split('/').pop() || `foto_${i}.jpg`;
              const fileToUpload = new File([blob], fname, { type: blob.type || 'image/jpeg' });

              const fdFoto = new FormData();
              fdFoto.append('file', fileToUpload, fileToUpload.name);
              fdFoto.append('propiedadId', id);
              fdFoto.append('tipo', 'FOTO');
              await documentosApi.upload(fdFoto);
              
              setUploadingPhotos(prev => { const n = [...prev]; if(n[idx]) n[idx].status = 'done'; return n; });
            } catch (err) {
              setUploadingPhotos(prev => { const n = [...prev]; if(n[idx]) n[idx].status = 'error'; return n; });
            }
          }));
          toast.success(`✅ ${fotosUrls.length} fotos extraídas y guardadas`);
        } else {
          toast(`📷 No se detectaron fotos en el PDF`, { icon: 'ℹ️' });
        }

        // Subir el PDF original también como Dossier
        const fdPdf = new FormData();
        fdPdf.append('file', pdfFile, pdfFile.name);
        fdPdf.append('propiedadId', id);
        fdPdf.append('tipo', 'DOSSIER');
        await documentosApi.upload(fdPdf);

      } catch (err) {
        toast.error(`Error procesando PDF: ${err.message}`);
      } finally {
        setExtractingPdf(false);
      }
    }

    // ── Procesar imágenes directas ────────────────────────────────────────────
    if (imageFiles.length > 0) {
      const startIdx   = uploadingPhotos.length;
      const newUploads = imageFiles.map(f => ({ name: f.name, status: 'uploading' }));
      setUploadingPhotos(prev => [...prev, ...newUploads]);

      await Promise.all(imageFiles.map(async (file, i) => {
        const idx = startIdx + i;
        try {
          const fd = new FormData();
          fd.append('file', file, file.name);
          fd.append('propiedadId', id);
          fd.append('tipo', 'FOTO');
          await documentosApi.upload(fd);
          setUploadingPhotos(prev => { const n = [...prev]; n[idx] = { ...n[idx], status: 'done' }; return n; });
        } catch {
          setUploadingPhotos(prev => { const n = [...prev]; n[idx] = { ...n[idx], status: 'error' }; return n; });
          toast.error(`Error subiendo ${file.name}`);
        }
      }));

      toast.success('📸 Fotos subidas');
    }

    qc.invalidateQueries({ queryKey: ['propiedad', id] });
  }

  // ─── Render guards ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="loading-page"><div className="spinner" /><span>Cargando ficha...</span></div>;
  }
  if (!propiedad) {
    return <div className="empty-state"><h3>Propiedad no encontrada</h3></div>;
  }

  const specs = [
    { icon: Bed,    label: `${propiedad.habitaciones} habitaciones` },
    { icon: Bath,   label: `${propiedad.banos} baños` },
    { icon: Square, label: `${propiedad.metrosConstruidos}m² construidos` },
    ...(propiedad.metrosParcela ? [{ icon: Home, label: `${propiedad.metrosParcela}m² parcela` }] : []),
  ];

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} style={{ borderRadius: '50%' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {propiedad.referencia} · {TIPO_LABEL[propiedad.tipo]}
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {editMode ? (
              <input
                className="form-input"
                value={form.nombre}
                onChange={e => setField('nombre', e.target.value)}
                style={{ fontSize: '1.3rem', fontWeight: 700, padding: '0.25rem 0.5rem', width: 340 }}
              />
            ) : propiedad.nombre}
          </h2>
        </div>
        <span className={`badge ${ESTADO_BADGE[propiedad.estado] || ''}`}>{propiedad.estado}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!editMode ? (
            <>
              <button className="btn" style={{ background: '#1A3A5C', color: 'white', borderColor: '#1A3A5C' }} onClick={() => setShowMatchModal(true)}>
                <Bot size={16} /> Matchmaking IA
              </button>
              <button className="btn btn-outline" style={{ background: '#F8FAFC' }} onClick={() => setShowDossierModal(true)}>
                <FileCheck size={16} /> Generar Dossier
              </button>
              <button
                className="btn btn-outline"
                style={{ background: '#F0F7FF', borderColor: '#BAD4F0', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setShowPortalesModal(true)}
              >
                <Globe size={15} /> Publicar en Portales
              </button>
              <button className="btn btn-outline" style={{ background: '#F8FAFC', color: '#DC2626', borderColor: '#FECACA' }} onClick={handleDelete}>
                <Trash2 size={15} /> Eliminar
              </button>
              <button className="btn btn-outline" style={{ background: '#F8FAFC' }} onClick={startEdit}>
                <Pencil size={15} /> Editar
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                <X size={15} /> Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Banner de modo edición ── */}
      {editMode && (
        <div style={{ background: 'linear-gradient(90deg, #ECFDF5, #D1FAE5)', border: '1px solid #6EE7B7', borderRadius: 10, padding: '0.65rem 1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#065F46' }}>
          <Pencil size={14} /> <strong>Modo edición activo</strong> — Modifica los campos y pulsa «Guardar cambios» cuando termines.
        </div>
      )}

      {/* ── Input oculto para subir fotos o PDFs ── */}
      <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, zIndex: -1 }}
        onChange={e => handlePhotoUpload(e.target.files)} />

      {/* ── Encabezado / Slider de fotos ── */}
      <div style={{ marginBottom: uploadingPhotos.length > 0 ? '0.5rem' : '1.5rem', width: '100%', height: 420, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <PhotoSlider
          fotos={propiedad.documentos?.filter(d => d.tipo === 'FOTO') || []}
          onAddPhotos={() => fileInputRef.current?.click()}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>

      {/* Barra de progreso extracción PDF */}
      {extractingPdf && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: extractProgress.total > 0 ? 8 : 0 }}>
            <Loader2 size={16} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 600 }}>Extrayendo páginas del PDF como fotos...</span>
          </div>
          {extractProgress.total > 0 && (
            <>
              <div style={{ height: 4, background: '#BFDBFE', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#2563EB', borderRadius: 4, width: `${(extractProgress.current / extractProgress.total) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: 4 }}>Página {extractProgress.current} de {extractProgress.total}</div>
            </>
          )}
        </div>
      )}

      {uploadingPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.5rem' }}>
          {uploadingPhotos.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              {u.status === 'uploading' && <Loader2 size={16} style={{ color: '#1A3A5C', animation: 'spin 1s linear infinite' }} />}
              {u.status === 'done'      && <CheckCircle size={16} style={{ color: '#059669' }} />}
              {u.status === 'error'     && <AlertCircle size={16} style={{ color: '#DC2626' }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              <span style={{ color: u.status === 'done' ? '#059669' : u.status === 'error' ? '#DC2626' : '#8A9BB0', fontWeight: 600 }}>
                {u.status === 'uploading' ? 'Subiendo...' : u.status === 'done' ? 'Listo' : 'Error'}
              </span>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* ── Columna principal ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Especificaciones / Edición general ── */}
          <div className="card card-body">
            <h4 style={{ marginBottom: '1rem' }}>
              {editMode ? 'Datos generales' : 'Especificaciones'}
            </h4>

            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Fila 1: zona + municipio + estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <FieldLabel>Zona</FieldLabel>
                    <EditInput value={form.zona} onChange={v => setField('zona', v)} placeholder="Ej. Sant Josep" />
                  </div>
                  <div>
                    <FieldLabel>Municipio</FieldLabel>
                    <EditInput value={form.municipio} onChange={v => setField('municipio', v)} placeholder="Ej. Sant Josep de sa Talaia" />
                  </div>
                  <div>
                    <FieldLabel>Estado</FieldLabel>
                    <EditSelect value={form.estado} onChange={v => setField('estado', v)} options={ESTADOS} />
                  </div>
                </div>
                {/* Fila 2: hab + baños + m² c + m² p */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <FieldLabel>Habitaciones</FieldLabel>
                    <EditInput type="number" value={form.habitaciones} onChange={v => setField('habitaciones', v)} />
                  </div>
                  <div>
                    <FieldLabel>Baños</FieldLabel>
                    <EditInput type="number" value={form.banos} onChange={v => setField('banos', v)} />
                  </div>
                  <div>
                    <FieldLabel>m² Construidos</FieldLabel>
                    <EditInput type="number" value={form.metrosConstruidos} onChange={v => setField('metrosConstruidos', v)} />
                  </div>
                  <div>
                    <FieldLabel>m² Parcela</FieldLabel>
                    <EditInput type="number" value={form.metrosParcela} onChange={v => setField('metrosParcela', v)} placeholder="—" />
                  </div>
                </div>
                {/* Características */}
                <div>
                  <FieldLabel>Características (separadas por coma)</FieldLabel>
                  <EditInput value={form.caracteristicas} onChange={v => setField('caracteristicas', v)} placeholder="Piscina, Jardín, Vistas al mar, Garaje..." />
                </div>
                {/* Descripción */}
                <div>
                  <FieldLabel>Descripción comercial</FieldLabel>
                  <textarea
                    className="form-input"
                    value={form.descripcion}
                    onChange={e => setField('descripcion', e.target.value)}
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem', lineHeight: 1.6 }}
                    placeholder="Describe la propiedad para el catálogo público..."
                  />
                </div>
                {/* Notas internas */}
                <div>
                  <FieldLabel>Notas internas</FieldLabel>
                  <textarea
                    className="form-input"
                    value={form.notas}
                    onChange={e => setField('notas', e.target.value)}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem', lineHeight: 1.6 }}
                    placeholder="Notas privadas del agente (no se publican)..."
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {specs.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={15} style={{ color: '#1A3A5C' }} />
                        </div>
                        <span>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                {propiedad.caracteristicas && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Características</FieldLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {propiedad.caracteristicas.split(',').map((c, i) => (
                        <span key={i} style={{ background: '#F0EDE6', borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', color: '#4A5568' }}>{c.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {propiedad.municipio && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Municipio</FieldLabel>
                    <p style={{ fontSize: '0.875rem', color: '#4A5568', margin: 0 }}>{propiedad.municipio}</p>
                  </div>
                )}
                {propiedad.descripcion && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Descripción</FieldLabel>
                    <p style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.7, margin: 0 }}>{propiedad.descripcion}</p>
                  </div>
                )}
                {propiedad.notas && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Notas internas</FieldLabel>
                    <p style={{ fontSize: '0.875rem', color: '#92400E', lineHeight: 1.6, margin: 0, background: '#FFFBEB', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #FDE68A' }}>{propiedad.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>



          {/* ── Documentos ── */}
          {propiedad.documentos?.filter(d => d.tipo !== 'FOTO').length > 0 && (
            <div className="card">
              <div className="card-header"><h3>Documentos ({propiedad.documentos.filter(d => d.tipo !== 'FOTO').length})</h3></div>
              <div style={{ padding: '0.5rem 0' }}>
                {propiedad.documentos.filter(d => d.tipo !== 'FOTO').map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.5rem', borderBottom: '1px solid #EDE9E0' }}>
                    <FileText size={15} style={{ color: '#8A9BB0' }} />
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{d.nombre}</span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12, background: '#F0EDE6', color: '#4A5568' }}>{d.tipo}</span>
                    {d.urlDrive && <a href={d.urlDrive} target="_blank" rel="noreferrer" style={{ color: '#4A6FA5' }}><ExternalLink size={14} /></a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Historial de Actividad ── */}
          <ActividadTimeline propiedadId={id} />
        </div>

        {/* ── Barra lateral ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Propietario */}
          <div className="card card-body">
            <h4 style={{ marginBottom: '1rem' }}>Propietario</h4>
            {editMode ? (
              <div>
                <FieldLabel>Asignar propietario</FieldLabel>
                <select className="form-select" value={form.propietarioId} onChange={e => setField('propietarioId', e.target.value)} style={{ width: '100%' }}>
                  <option value="">— Sin asignar —</option>
                  {propietarios.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellidos || ''}</option>
                  ))}
                </select>
              </div>
            ) : (
              propiedad.propietario ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1A3A5C, #4A6FA5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                      {propiedad.propietario.nombre?.[0]}{propiedad.propietario.apellidos?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{propiedad.propietario.nombre} {propiedad.propietario.apellidos}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8A9BB0' }}>{propiedad.propietario.telefono}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4A6FA5' }}>{propiedad.propietario.email}</div>
                </>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#8A9BB0', fontStyle: 'italic' }}>Sin propietario asignado</div>
              )
            )}
          </div>

          {/* ── Panel financiero según tipo ── */}
          {propiedad.tipo === 'VENTA' && (
            <div className="card card-body">
              <h4 style={{ marginBottom: '1rem' }}>Datos de Venta</h4>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Precio de venta (€)</FieldLabel>
                      <EditInput type="number" value={form.precioVenta} onChange={v => setField('precioVenta', v)} placeholder="1500000" />
                    </div>
                    <div>
                      <FieldLabel>Precio mínimo (€)</FieldLabel>
                      <EditInput type="number" value={form.precioMinimo} onChange={v => setField('precioMinimo', v)} placeholder="1350000" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Comisión agencia (%)</FieldLabel>
                      <EditInput type="number" value={form.comisionAgencia} onChange={v => setField('comisionAgencia', v)} placeholder="5" />
                    </div>
                    <div>
                      <FieldLabel>Etapa pipeline</FieldLabel>
                      <EditSelect value={form.etapaPipeline} onChange={v => setField('etapaPipeline', v)} options={ETAPAS_VENTA} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Ref. Catastral</FieldLabel>
                    <EditInput value={form.referenciaCatastral} onChange={v => setField('referenciaCatastral', v)} placeholder="1234567AB1234A0001AB" />
                  </div>
                  <div>
                    <FieldLabel>Nº Registro de la Propiedad</FieldLabel>
                    <EditInput value={form.numRegistroPropiedad} onChange={v => setField('numRegistroPropiedad', v)} placeholder="T.123 L.45 F.67 Finca 890" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Fecha de Arras</FieldLabel>
                      <EditInput type="date" value={form.fechaArras} onChange={v => setField('fechaArras', v)} />
                    </div>
                    <div>
                      <FieldLabel>Fecha de Escritura</FieldLabel>
                      <EditInput type="date" value={form.fechaEscritura} onChange={v => setField('fechaEscritura', v)} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Notario</FieldLabel>
                    <EditInput value={form.notario} onChange={v => setField('notario', v)} placeholder="Nombre del notario..." />
                  </div>
                  <div>
                    <FieldLabel>Observaciones</FieldLabel>
                    <textarea className="form-input" value={form.observacionesVenta} onChange={e => setField('observacionesVenta', e.target.value)} rows={2} style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem' }} placeholder="Notas sobre la operación..." />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0D1B2A', marginBottom: 4 }}>
                    {formatMoney(propiedad.venta?.precioVenta)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8A9BB0', marginBottom: '1rem' }}>Precio de comercialización</div>
                  {propiedad.venta?.precioMinimo && (
                    <div style={{ fontSize: '0.82rem', color: '#4A5568', marginBottom: 6 }}>
                      Mínimo: <strong>{formatMoney(propiedad.venta.precioMinimo)}</strong>
                    </div>
                  )}
                  {propiedad.venta?.comisionAgencia && (
                    <div style={{ fontSize: '0.82rem', color: '#4A5568' }}>
                      Comisión: <strong>{propiedad.venta.comisionAgencia}%</strong> · {formatMoney(propiedad.venta.precioVenta * propiedad.venta.comisionAgencia / 100)}
                    </div>
                  )}
                  <div style={{ marginTop: '1rem' }}>
                    <span className="badge badge-larga">{propiedad.venta?.etapaPipeline}</span>
                  </div>
                  {(propiedad.venta?.referenciaCatastral || propiedad.venta?.numRegistroPropiedad) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {propiedad.venta.referenciaCatastral && (
                        <div style={{ fontSize: '0.78rem' }}><FieldLabel>Ref. Catastral</FieldLabel><span style={{ fontFamily: 'monospace' }}>{propiedad.venta.referenciaCatastral}</span></div>
                      )}
                      {propiedad.venta.numRegistroPropiedad && (
                        <div style={{ fontSize: '0.78rem' }}><FieldLabel>Registro Propiedad</FieldLabel>{propiedad.venta.numRegistroPropiedad}</div>
                      )}
                    </div>
                  )}
                  {(propiedad.venta?.fechaArras || propiedad.venta?.fechaEscritura) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {propiedad.venta.fechaArras && (
                        <div style={{ fontSize: '0.78rem' }}><FieldLabel>Arras</FieldLabel>{new Date(propiedad.venta.fechaArras).toLocaleDateString('es-ES')}</div>
                      )}
                      {propiedad.venta.fechaEscritura && (
                        <div style={{ fontSize: '0.78rem' }}><FieldLabel>Escritura</FieldLabel>{new Date(propiedad.venta.fechaEscritura).toLocaleDateString('es-ES')}</div>
                      )}
                      {propiedad.venta.notario && (
                        <div style={{ fontSize: '0.78rem' }}><FieldLabel>Notario</FieldLabel>{propiedad.venta.notario}</div>
                      )}
                    </div>
                  )}
                  {propiedad.venta?.observaciones && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', fontSize: '0.8rem', color: '#4A5568' }}>
                      <FieldLabel>Observaciones</FieldLabel>{propiedad.venta.observaciones}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {propiedad.tipo === 'VACACIONAL' && (
            <div className="card card-body">
              <h4 style={{ marginBottom: '1rem' }}>Tarifas y operativa</h4>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Temp. Alta (€/sem)</FieldLabel>
                      <EditInput type="number" value={form.precioTemporadaAlta} onChange={v => setField('precioTemporadaAlta', v)} />
                    </div>
                    <div>
                      <FieldLabel>Temp. Media (€/sem)</FieldLabel>
                      <EditInput type="number" value={form.precioTemporadaMedia} onChange={v => setField('precioTemporadaMedia', v)} />
                    </div>
                    <div>
                      <FieldLabel>Temp. Baja (€/sem)</FieldLabel>
                      <EditInput type="number" value={form.precioTemporadaBaja} onChange={v => setField('precioTemporadaBaja', v)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Depósito garantía (€)</FieldLabel>
                      <EditInput type="number" value={form.depositoGarantia} onChange={v => setField('depositoGarantia', v)} placeholder="2000" />
                    </div>
                    <div>
                      <FieldLabel>Mín. noches</FieldLabel>
                      <EditInput type="number" value={form.minimoNoches} onChange={v => setField('minimoNoches', v)} placeholder="7" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Máx. personas</FieldLabel>
                      <EditInput type="number" value={form.personasMaximas} onChange={v => setField('personasMaximas', v)} placeholder="8" />
                    </div>
                    <div>
                      <FieldLabel>Check-in</FieldLabel>
                      <EditInput value={form.checkInHora} onChange={v => setField('checkInHora', v)} placeholder="16:00" />
                    </div>
                    <div>
                      <FieldLabel>Check-out</FieldLabel>
                      <EditInput value={form.checkOutHora} onChange={v => setField('checkOutHora', v)} placeholder="10:00" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Licencia ETV</FieldLabel>
                      <EditInput value={form.licenciaETV} onChange={v => setField('licenciaETV', v)} placeholder="ETV-12345-IB" />
                    </div>
                    <div>
                      <FieldLabel>Cédula de habitabilidad</FieldLabel>
                      <EditInput value={form.cedula} onChange={v => setField('cedula', v)} placeholder="CH-2024-..." />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>URL Airbnb</FieldLabel>
                    <EditInput value={form.urlAirbnb} onChange={v => setField('urlAirbnb', v)} placeholder="https://airbnb.com/rooms/..." />
                  </div>
                  <div>
                    <FieldLabel>URL Booking</FieldLabel>
                    <EditInput value={form.urlBooking} onChange={v => setField('urlBooking', v)} placeholder="https://booking.com/hotel/..." />
                  </div>
                  <div>
                    <FieldLabel>URL Web propia</FieldLabel>
                    <EditInput value={form.urlMioweb} onChange={v => setField('urlMioweb', v)} placeholder="https://mioweb.com/..." />
                  </div>
                </div>
              ) : (
                <>
                  {[['Temporada Alta', propiedad.alquilerVacacional?.precioTemporadaAlta, '/semana'],
                    ['Temporada Media', propiedad.alquilerVacacional?.precioTemporadaMedia, '/semana'],
                    ['Temporada Baja', propiedad.alquilerVacacional?.precioTemporadaBaja, '/semana'],
                  ].map(([label, valor, suffix]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.875rem' }}>
                      <span style={{ color: '#4A5568' }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{formatMoney(valor)}<span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#8A9BB0' }}> {suffix}</span></span>
                    </div>
                  ))}
                  {(propiedad.alquilerVacacional?.depositoGarantia || propiedad.alquilerVacacional?.minimoNoches || propiedad.alquilerVacacional?.personasMaximas) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.78rem', color: '#4A5568' }}>
                      {propiedad.alquilerVacacional.depositoGarantia && <div><FieldLabel>Depósito</FieldLabel>{formatMoney(propiedad.alquilerVacacional.depositoGarantia)}</div>}
                      {propiedad.alquilerVacacional.minimoNoches && <div><FieldLabel>Mín. noches</FieldLabel>{propiedad.alquilerVacacional.minimoNoches}</div>}
                      {propiedad.alquilerVacacional.personasMaximas && <div><FieldLabel>Máx. personas</FieldLabel>{propiedad.alquilerVacacional.personasMaximas}</div>}
                    </div>
                  )}
                  {(propiedad.alquilerVacacional?.checkInHora || propiedad.alquilerVacacional?.checkOutHora) && (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem', color: '#4A5568' }}>
                      {propiedad.alquilerVacacional.checkInHora && <div><FieldLabel>Check-in</FieldLabel>{propiedad.alquilerVacacional.checkInHora}</div>}
                      {propiedad.alquilerVacacional.checkOutHora && <div><FieldLabel>Check-out</FieldLabel>{propiedad.alquilerVacacional.checkOutHora}</div>}
                    </div>
                  )}
                  {(propiedad.alquilerVacacional?.licenciaETV || propiedad.alquilerVacacional?.cedula) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem' }}>
                      {propiedad.alquilerVacacional.licenciaETV && <div><FieldLabel>Licencia ETV</FieldLabel><span style={{ fontFamily: 'monospace', color: '#1A3A5C', fontWeight: 600 }}>{propiedad.alquilerVacacional.licenciaETV}</span></div>}
                      {propiedad.alquilerVacacional.cedula && <div><FieldLabel>Cédula habitabilidad</FieldLabel><span style={{ fontFamily: 'monospace' }}>{propiedad.alquilerVacacional.cedula}</span></div>}
                    </div>
                  )}
                  {(propiedad.alquilerVacacional?.urlAirbnb || propiedad.alquilerVacacional?.urlBooking || propiedad.alquilerVacacional?.urlMioweb) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {propiedad.alquilerVacacional.urlAirbnb && <a href={propiedad.alquilerVacacional.urlAirbnb} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#E61E4D', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Airbnb</a>}
                      {propiedad.alquilerVacacional.urlBooking && <a href={propiedad.alquilerVacacional.urlBooking} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#003580', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Booking.com</a>}
                      {propiedad.alquilerVacacional.urlMioweb && <a href={propiedad.alquilerVacacional.urlMioweb} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#4A6FA5', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Web propia</a>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {propiedad.tipo === 'LARGA_DURACION' && (
            <div className="card card-body">
              <h4 style={{ marginBottom: '1rem' }}>Contrato</h4>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Renta mensual (€)</FieldLabel>
                      <EditInput type="number" value={form.rentaMensual} onChange={v => setField('rentaMensual', v)} />
                    </div>
                    <div>
                      <FieldLabel>Día de pago (día del mes)</FieldLabel>
                      <EditInput type="number" value={form.diaPagoCada} onChange={v => setField('diaPagoCada', v)} placeholder="1" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Fianza (meses)</FieldLabel>
                      <EditInput type="number" value={form.fianzaMeses} onChange={v => setField('fianzaMeses', v)} placeholder="2" />
                    </div>
                    <div>
                      <FieldLabel>Fianza importe (€)</FieldLabel>
                      <EditInput type="number" value={form.fianzaImporte} onChange={v => setField('fianzaImporte', v)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>Fecha inicio</FieldLabel>
                      <EditInput type="date" value={form.fechaInicio} onChange={v => setField('fechaInicio', v)} />
                    </div>
                    <div>
                      <FieldLabel>Duración (meses)</FieldLabel>
                      <EditInput type="number" value={form.duracionMeses} onChange={v => setField('duracionMeses', v)} placeholder="12" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Fecha vencimiento</FieldLabel>
                    <EditInput type="date" value={form.fechaVencimiento} onChange={v => setField('fechaVencimiento', v)} />
                  </div>
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Inquilino — Nombre</FieldLabel>
                    <EditInput value={form.inquilinoNombre} onChange={v => setField('inquilinoNombre', v)} placeholder="Nombre completo" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <FieldLabel>NIF / NIE</FieldLabel>
                      <EditInput value={form.inquilinoNif} onChange={v => setField('inquilinoNif', v)} placeholder="12345678A" />
                    </div>
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <EditInput value={form.inquilinoTelefono} onChange={v => setField('inquilinoTelefono', v)} placeholder="+34 600 000 000" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Email inquilino</FieldLabel>
                    <EditInput type="email" value={form.inquilinoEmail} onChange={v => setField('inquilinoEmail', v)} placeholder="inquilino@email.com" />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>
                    {formatMoney(propiedad.alquilerLargaDuracion?.rentaMensual)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#8A9BB0' }}> /mes</span>
                  </div>
                  {(propiedad.alquilerLargaDuracion?.fianzaImporte || propiedad.alquilerLargaDuracion?.diaPagoCada) && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: '#4A5568' }}>
                      {propiedad.alquilerLargaDuracion.fianzaImporte && <span>Fianza: <strong>{formatMoney(propiedad.alquilerLargaDuracion.fianzaImporte)}</strong></span>}
                      {propiedad.alquilerLargaDuracion.diaPagoCada && <span>Pago día <strong>{propiedad.alquilerLargaDuracion.diaPagoCada}</strong></span>}
                    </div>
                  )}
                  {(propiedad.alquilerLargaDuracion?.fechaInicio || propiedad.alquilerLargaDuracion?.fechaVencimiento) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem', color: '#4A5568' }}>
                      {propiedad.alquilerLargaDuracion.fechaInicio && <div><FieldLabel>Inicio</FieldLabel>{new Date(propiedad.alquilerLargaDuracion.fechaInicio).toLocaleDateString('es-ES')}</div>}
                      {propiedad.alquilerLargaDuracion.fechaVencimiento && <div><FieldLabel>Vencimiento</FieldLabel>{new Date(propiedad.alquilerLargaDuracion.fechaVencimiento).toLocaleDateString('es-ES')}</div>}
                    </div>
                  )}
                  {propiedad.alquilerLargaDuracion?.inquilinoNombre && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', fontSize: '0.875rem', color: '#4A5568' }}>
                      <FieldLabel>Inquilino</FieldLabel>
                      <div style={{ fontWeight: 600 }}>{propiedad.alquilerLargaDuracion.inquilinoNombre}</div>
                      {propiedad.alquilerLargaDuracion.inquilinoNif && <div style={{ fontSize: '0.78rem', color: '#8A9BB0' }}>{propiedad.alquilerLargaDuracion.inquilinoNif}</div>}
                      {propiedad.alquilerLargaDuracion.inquilinoTelefono && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.8rem' }}>
                          <Phone size={12} style={{ color: '#8A9BB0' }} />{propiedad.alquilerLargaDuracion.inquilinoTelefono}
                        </div>
                      )}
                      {propiedad.alquilerLargaDuracion.inquilinoEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: '0.8rem', color: '#4A6FA5' }}>
                          <Mail size={12} />{propiedad.alquilerLargaDuracion.inquilinoEmail}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Drive link */}
          {propiedad.urlDriveCarpeta && (
            <a href={propiedad.urlDriveCarpeta} target="_blank" rel="noreferrer"
              className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>
              <ExternalLink size={15} /> Abrir carpeta en Drive
            </a>
          )}
        </div>
      </div>

      {/* ── Modales ── */}
      {showMatchModal  && <MatchmakingModal propiedad={propiedad} onClose={() => setShowMatchModal(false)} />}
      {showDossierModal && <DossierModal propiedad={propiedad} onClose={() => setShowDossierModal(false)} onAddPhotos={() => fileInputRef.current?.click()} />}
      {showPortalesModal && <PublicadorPortales propiedad={propiedad} onClose={() => setShowPortalesModal(false)} />}
    </div>
  );
}
