import { useState, useRef, useCallback } from 'react';
import { Image, Upload, X, CheckCircle2, Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function CrearDesdeFotosModal({ onClose, onCreate }) {
  const [fotos, setFotos]       = useState([]);  // Array de { file, preview }
  const [nombre, setNombre]     = useState('');
  const [tipo, setTipo]         = useState('VACACIONAL');
  const [zona, setZona]         = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const addFiles = useCallback((files) => {
    const newFotos = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 10 - fotos.length)
      .map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setFotos(prev => [...prev, ...newFotos].slice(0, 10));
  }, [fotos.length]);

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer?.files || []);
  };

  const removePhoto = (i) => {
    setFotos(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleCreate = async () => {
    if (!nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!zona.trim())   return toast.error('La zona es obligatoria');

    setCreating(true);
    try {
      // 1. Crear la propiedad vacía primero
      const propData = {
        nombre: nombre.trim(),
        tipo,
        zona: zona.trim(),
        habitaciones: 0,
        banos: 0,
        metrosConstruidos: 0,
        descripcion: descripcion.trim() || undefined,
      };
      const created = await onCreate(propData, { skipRedirect: true });

      // 2. Subir cada foto como documento asociado a la propiedad
      if (fotos.length > 0 && created?.id) {
        let subidas = 0;
        for (const { file } of fotos) {
          try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('propiedadId', created.id);
            fd.append('tipo', 'FOTO');
            await fetch(`${BASE_URL}/documentos/upload`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
              body: fd,
            });
            subidas++;
          } catch { /* skip foto fallida */ }
        }
        toast.success(`✅ Propiedad creada con ${subidas} foto${subidas !== 1 ? 's' : ''}`);
      } else {
        toast.success('✅ Propiedad creada correctamente');
      }

      onClose(created);
    } catch (err) {
      toast.error(err.message || 'Error al crear la propiedad');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 660, maxHeight: '92vh', background: 'white', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2D5986 0%, #4A6FA5 100%)', color: 'white', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
              <Image color="white" size={20} />
              Crear Propiedad desde Fotos
            </h3>
            <p style={{ margin: '3px 0 0', opacity: 0.8, fontSize: '0.8rem' }}>Sube fotos y una descripción para crear el perfil rápidamente</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 8, padding: '6px 8px' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Datos básicos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Nombre de la propiedad *</label>
              <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Villa Can Xomeu, Finca Las Salinas..." autoFocus />
            </div>
            <div>
              <label className="form-label">Tipo *</label>
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="VACACIONAL">🌴 Vacacional</option>
                <option value="VENTA">🏛 Venta</option>
                <option value="LARGA_DURACION">🏡 Larga Duración</option>
              </select>
            </div>
            <div>
              <label className="form-label">Zona *</label>
              <input className="form-input" value={zona} onChange={e => setZona(e.target.value)} placeholder="Sant Josep, Talamanca..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Descripción / Notas del agente</label>
              <textarea className="form-input" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe brevemente la propiedad: características, estado, precio aproximado, observaciones..." style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Drop zone fotos */}
          <div>
            <label className="form-label">Fotos de la propiedad ({fotos.length}/10)</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fotos.length < 10 && fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#2D5986' : '#CBD5E1'}`,
                borderRadius: 12, padding: '1.75rem', textAlign: 'center',
                background: dragging ? '#EFF6FF' : '#F8FAFC',
                cursor: fotos.length < 10 ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              <Image size={28} color="#94A3B8" style={{ margin: '0 auto 0.6rem', display: 'block' }} />
              <p style={{ margin: 0, color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>
                {fotos.length < 10 ? 'Arrastra fotos aquí o haz clic para seleccionarlas' : 'Máximo 10 fotos alcanzado'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.78rem' }}>JPG, PNG, WebP — máx. 10 fotos</p>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
            </div>

            {/* Preview grid */}
            {fotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '2px solid #E2E8F0' }}>
                    <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#1A3A5C', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>PORTADA</div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {fotos.length < 10 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                  >
                    <Plus size={20} color="#94A3B8" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#1E3A8A' }}>
            💡 Se creará el perfil básico de la propiedad. Podrás completar habitaciones, baños, m², precios y más desde el detalle de la propiedad.
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '1rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#F8FAFC', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
            {creating ? 'Creando perfil...' : `Crear Perfil${fotos.length > 0 ? ` con ${fotos.length} foto${fotos.length !== 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
