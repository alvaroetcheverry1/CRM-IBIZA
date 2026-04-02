import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { propiedadesApi, propietariosApi, documentosApi } from '../services/api';
import { ArrowLeft, Bed, Bath, Square, Home, ExternalLink, FileText, Loader2, ImagePlus, CheckCircle, AlertCircle, Pencil, X, Save, Bot, FileCheck, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import PhotoSlider     from '../components/PhotoSlider';
import MatchmakingModal from '../components/MatchmakingModal';
import DossierModal    from '../components/DossierModal';

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
  const [uploadingPhotos,  setUploadingPhotos]  = useState([]);
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
      estado:            p.estado ?? 'DISPONIBLE',
      habitaciones:      p.habitaciones ?? 0,
      banos:             p.banos ?? 0,
      metrosConstruidos: p.metrosConstruidos ?? 0,
      metrosParcela:     p.metrosParcela ?? '',
      descripcion:       p.descripcion ?? '',
      caracteristicas:   p.caracteristicas ?? '',
      propietarioId:     p.propietarioId ?? '',
      // Precio según tipo
      precioVenta:       p.venta?.precioVenta ?? '',
      etapaPipeline:     p.venta?.etapaPipeline ?? 'CAPTACION',
      comisionAgencia:   p.venta?.comisionAgencia ?? '',
      precioTemporadaAlta:  p.alquilerVacacional?.precioTemporadaAlta ?? '',
      precioTemporadaMedia: p.alquilerVacacional?.precioTemporadaMedia ?? '',
      precioTemporadaBaja:  p.alquilerVacacional?.precioTemporadaBaja ?? '',
      licenciaETV:       p.alquilerVacacional?.licenciaETV ?? '',
      rentaMensual:      p.alquilerLargaDuracion?.rentaMensual ?? '',
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
        estado:            form.estado,
        habitaciones:      Number(form.habitaciones) || 0,
        banos:             Number(form.banos) || 0,
        metrosConstruidos: Number(form.metrosConstruidos) || 0,
        metrosParcela:     form.metrosParcela ? Number(form.metrosParcela) : null,
        descripcion:       form.descripcion || null,
        caracteristicas:   form.caracteristicas || null,
        propietarioId:     form.propietarioId || null,
      };

      if (propiedad.tipo === 'VENTA') {
        payload.venta = {
          precioVenta:    Number(form.precioVenta) || null,
          etapaPipeline:  form.etapaPipeline,
          comisionAgencia: form.comisionAgencia ? Number(form.comisionAgencia) : null,
        };
      }
      if (propiedad.tipo === 'VACACIONAL') {
        payload.alquilerVacacional = {
          precioTemporadaAlta:  Number(form.precioTemporadaAlta) || null,
          precioTemporadaMedia: Number(form.precioTemporadaMedia) || null,
          precioTemporadaBaja:  Number(form.precioTemporadaBaja) || null,
          licenciaETV:          form.licenciaETV || null,
        };
      }
      if (propiedad.tipo === 'LARGA_DURACION') {
        payload.alquilerLargaDuracion = {
          rentaMensual: Number(form.rentaMensual) || null,
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

  // ─── Subida de fotos ────────────────────────────────────────────────────────
  async function handlePhotoUpload(files) {
    if (!files || files.length === 0) return;
    const fileArr   = Array.from(files);
    const startIdx  = uploadingPhotos.length;
    const newUploads = fileArr.map(f => ({ name: f.name, status: 'uploading' }));
    setUploadingPhotos(prev => [...prev, ...newUploads]);

    await Promise.all(fileArr.map(async (file, i) => {
      const idx = startIdx + i;
      try {
        const fd = new FormData();
        fd.append('file', file, file.name);
        fd.append('propiedadId', id);
        fd.append('tipo', 'FOTO');
        await documentosApi.upload(fd);
        setUploadingPhotos(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: 'done' };
          return next;
        });
      } catch {
        setUploadingPhotos(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: 'error' };
          return next;
        });
        toast.error(`Error subiendo ${file.name}`);
      }
    }));

    qc.invalidateQueries({ queryKey: ['propiedad', id] });
    toast.success('📸 Fotos subidas');
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

      {/* ── Input oculto para subir fotos ── */}
      <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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

      {uploadingPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.5rem' }}>
          {uploadingPhotos.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              {u.status === 'uploading' && <Loader2 size={16} className="spin" style={{ color: '#1A3A5C' }} />}
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
                {/* Fila 1: zona + estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <FieldLabel>Zona / Municipio</FieldLabel>
                    <EditInput value={form.zona} onChange={v => setField('zona', v)} placeholder="Ej. Sant Josep" />
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
                {propiedad.descripcion && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0' }}>
                    <FieldLabel>Descripción</FieldLabel>
                    <p style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.7, margin: 0 }}>{propiedad.descripcion}</p>
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
                  <div>
                    <FieldLabel>Precio de venta (€)</FieldLabel>
                    <EditInput type="number" value={form.precioVenta} onChange={v => setField('precioVenta', v)} placeholder="1500000" />
                  </div>
                  <div>
                    <FieldLabel>Comisión agencia (%)</FieldLabel>
                    <EditInput type="number" value={form.comisionAgencia} onChange={v => setField('comisionAgencia', v)} placeholder="5" />
                  </div>
                  <div>
                    <FieldLabel>Etapa pipeline</FieldLabel>
                    <EditSelect value={form.etapaPipeline} onChange={v => setField('etapaPipeline', v)} options={ETAPAS_VENTA} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0D1B2A', marginBottom: 4 }}>
                    {formatMoney(propiedad.venta?.precioVenta)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8A9BB0', marginBottom: '1rem' }}>Precio de comercialización</div>
                  {propiedad.venta?.comisionAgencia && (
                    <div style={{ fontSize: '0.82rem', color: '#4A5568' }}>
                      Comisión: <strong>{propiedad.venta.comisionAgencia}%</strong> · {formatMoney(propiedad.venta.precioVenta * propiedad.venta.comisionAgencia / 100)}
                    </div>
                  )}
                  <div style={{ marginTop: '1rem' }}>
                    <span className="badge badge-larga">{propiedad.venta?.etapaPipeline}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {propiedad.tipo === 'VACACIONAL' && (
            <div className="card card-body">
              <h4 style={{ marginBottom: '1rem' }}>Tarifas</h4>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                  <div>
                    <FieldLabel>Licencia ETV</FieldLabel>
                    <EditInput value={form.licenciaETV} onChange={v => setField('licenciaETV', v)} placeholder="ETV-12345-IB" />
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
                  {propiedad.alquilerVacacional?.licenciaETV && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #EDE9E0', fontSize: '0.78rem' }}>
                      <FieldLabel>Licencia ETV</FieldLabel>
                      <div style={{ fontFamily: 'monospace', color: '#1A3A5C', fontWeight: 600 }}>{propiedad.alquilerVacacional.licenciaETV}</div>
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
                <div>
                  <FieldLabel>Renta mensual (€)</FieldLabel>
                  <EditInput type="number" value={form.rentaMensual} onChange={v => setField('rentaMensual', v)} />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>
                    {formatMoney(propiedad.alquilerLargaDuracion?.rentaMensual)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#8A9BB0' }}> /mes</span>
                  </div>
                  {propiedad.alquilerLargaDuracion?.inquilinoNombre && (
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4A5568' }}>
                      <div style={{ fontWeight: 600 }}>{propiedad.alquilerLargaDuracion.inquilinoNombre}</div>
                      {propiedad.alquilerLargaDuracion?.fechaVencimiento && (
                        <div style={{ fontSize: '0.78rem', color: '#8A9BB0', marginTop: 4 }}>
                          Vence: {new Date(propiedad.alquilerLargaDuracion.fechaVencimiento).toLocaleDateString('es-ES')}
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
    </div>
  );
}
