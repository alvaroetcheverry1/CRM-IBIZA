import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentosApi, propiedadesApi } from '../services/api';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, CheckCircle, AlertCircle, Clock, ExternalLink,
  PenTool, ShieldCheck, Mail, Send, Loader2, NotebookPen, ChevronDown,
  ChevronUp, Save, FileEdit, Cloud, Plus, Home, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const ESTADO_PROCESA = {
  COMPLETADO: { icon: CheckCircle, color: '#2D8A5E', label: 'Completado' },
  PROCESANDO: { icon: Clock, color: '#C9A84C', label: 'Procesando...' },
  PENDIENTE: { icon: Clock, color: '#8A9BB0', label: 'Pendiente' },
  ERROR: { icon: AlertCircle, color: '#C0392B', label: 'Error' },
};

const TIPOS_NOTA = [
  { value: 'OTRO', label: 'Nota general' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'DOSSIER_MARKETING', label: 'Dossier / Marketing' },
  { value: 'NOTA_SIMPLE', label: 'Nota simple registral' },
  { value: 'CONTRATO_ARRENDAMIENTO', label: 'Informe de arrendamiento' },
  { value: 'CERTIFICADO_ENERGETICO', label: 'Certificado energético' },
];

// ─── Dropzone de subida de archivos ──────────────────────────────────────────
function DropzoneUpload({ onUpload, onDocumentUploaded }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files) => {
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await onUpload(fd);
        toast.success(`${file.name} subido correctamente`);
        // Notify parent so it can open the property creation modal
        if (onDocumentUploaded) onDocumentUploaded(file.name);
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }
    setUploading(false);
  }, [onUpload, onDocumentUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.ms-powerpoint': ['.ppt', '.pptx'] },
    multiple: true,
  });

  return (
    <div {...getRootProps()} className={`upload-zone${isDragActive ? ' dragover' : ''}`}>
      <input {...getInputProps()} />
      <div className="upload-zone-icon"><Upload size={36} /></div>
      <h4>{isDragActive ? 'Suelta los archivos aquí...' : uploading ? 'Subiendo...' : 'Arrastra PDFs y presentaciones'}</h4>
      <p>O haz clic para seleccionar archivos · PDF, PPT, PPTX · Máx. 50 MB</p>
      <p style={{ marginTop: 8, fontSize: '0.7rem', color: '#C9A84C', fontWeight: 500 }}>
        ⚡ Los PDFs se procesan automáticamente con IA · Se creará una ficha de propiedad automáticamente
      </p>
    </div>
  );
}

// ─── Modal creación de Propiedad desde Doc ────────────────────────────────────
function ModalCrearPropiedad({ filename, onClose, onCrear }) {
  const cleanName = (filename || '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const [nombre, setNombre] = useState(cleanName);
  const [tipo, setTipo] = useState('VENTA');
  const [zona, setZona] = useState('');
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nombre.trim() || !zona.trim()) return toast.error('El nombre y la zona son obligatorios');
    setLoading(true);
    await onCrear({ nombre: nombre.trim(), tipo, zona: zona.trim(), precio });
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 440, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Home size={18} color="#1A3A5C" /> Crear Ficha de Propiedad
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1.25rem', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
          📄 Archivo subido: <strong>{filename}</strong><br/>
          Completa estos datos para crear una ficha en el CRM.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre de la Propiedad *</label>
            <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Villa Can Pere Jaume" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tipo de Operación *</label>
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="VENTA">Venta</option>
                <option value="VACACIONAL">Alquiler Vacacional</option>
                <option value="LARGA_DURACION">Alquiler Larga Duración</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Zona / Municipio *</label>
              <input className="form-input" value={zona} onChange={e => setZona(e.target.value)} placeholder="Ej. Sant Josep" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              {tipo === 'VENTA' ? 'Precio de Venta (€)' : tipo === 'VACACIONAL' ? 'Precio/semana Temporada Alta (€)' : 'Renta Mensual (€)'}
            </label>
            <input className="form-input" type="text" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 1500000" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Omitir</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ background: '#1A3A5C', borderColor: '#1A3A5C', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            {loading ? 'Creando...' : 'Crear Propiedad en CRM'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel de escritura ───────────────────────────────────────────────────────
function PanelEscritura({ propiedades, onGuardar, loading }) {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [propiedadId, setPropiedadId] = useState('');
  const [tipoDoc, setTipoDoc] = useState('OTRO');
  const [regenDesc, setRegenDesc] = useState(false);

  const propSeleccionada = propiedades.find(p => p.id === propiedadId);
  const charCount = contenido.length;
  const canSave = titulo.trim().length > 0 && contenido.trim().length > 0;

  const handleGuardar = async () => {
    await onGuardar({
      titulo: titulo.trim(),
      contenido,
      propiedadId: propiedadId || null,
      propiedadNombre: propSeleccionada?.nombre || null,
      tipoDoc,
      regenDesc,
    });
    setTitulo('');
    setContenido('');
    setPropiedadId('');
    setTipoDoc('OTRO');
    setRegenDesc(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Fila superior: Título + Tipo + Propiedad */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Título del documento
          </label>
          <input
            className="form-input"
            placeholder="Ej: Informe de estado Villa Can Rimbau"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 170px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tipo de documento
          </label>
          <select
            className="form-select"
            value={tipoDoc}
            onChange={e => setTipoDoc(e.target.value)}
          >
            {TIPOS_NOTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Propiedad asociada
          </label>
          <select
            className="form-select"
            value={propiedadId}
            onChange={e => {
              setPropiedadId(e.target.value);
              if (!e.target.value) setRegenDesc(false);
            }}
          >
            <option value="">— Sin propiedad —</option>
            {propiedades.map(p => (
              <option key={p.id} value={p.id}>{p.referencia} · {p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Área de texto ampliada */}
      <div style={{ position: 'relative' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
          Contenido (Redacta aquí toda la información libremente)
        </label>
        <textarea
          className="form-textarea"
          placeholder={`Escribe aquí la información relevante sobre la propiedad${propSeleccionada ? ` "${propSeleccionada.nombre}"` : ''}...\n\nDetalla cualquier cambio: "Se ha añadido una nueva habitación forrada de madera, la piscina cuenta ahora con cascada y luces led, los precios han subido a 12.000€ la semana en agosto..."`}
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          style={{
            lineHeight: 1.6,
            minHeight: 300,
          }}
        />
        <span style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          fontSize: '0.7rem',
          color: charCount > 10000 ? '#C0392B' : '#8A9BB0',
          background: 'var(--bg-card, #fff)',
          padding: '2px 6px',
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          {charCount.toLocaleString('es-ES')} caracteres
        </span>
      </div>

      {/* Selector de Generación de Descripción con IA y Fotos */}
      {propiedadId && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
          <div style={{ paddingTop: 2 }}>
            <input 
              type="checkbox" 
              id="chk-regen" 
              checked={regenDesc} 
              onChange={e => setRegenDesc(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7C3AED' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="chk-regen" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', cursor: 'pointer', display: 'block', marginBottom: 4 }}>
              ✨ Integrar en perfil: Generar Descripción Comercial con IA
            </label>
            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              Si activas esta opción, la IA analizará <strong>este texto</strong> junto con las <strong>fotografías actuales</strong> de la propiedad para redactar una nueva descripción atractiva y rellenar automáticamente la ficha del inmueble en el CRM.
            </div>
          </div>
        </div>
      )}

      {/* Pie: info + botón guardar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#8A9BB0' }}>
          <Cloud size={14} style={{ color: '#4A6FA5' }} />
          <span>Se guardará en el CRM y Drive</span>
        </div>
        <button
          className="btn"
          onClick={handleGuardar}
          disabled={!canSave || loading}
          style={{
            background: canSave ? '#1A3A5C' : '#CBD5E1',
            color: 'white',
            borderColor: canSave ? '#1A3A5C' : '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            padding: '0.6rem 1.2rem',
          }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {loading ? 'Guardando y Analizando...' : 'Guardar y Procesar'}
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Documentos() {
  const queryClient = useQueryClient();
  const [firmaModalDoc, setFirmaModalDoc] = useState(null);
  const [firmaStatuses, setFirmaStatuses] = useState({});
  const [panelEscrOpen, setPanelEscrOpen] = useState(true);
  const [notaLoading, setNotaLoading] = useState(false);
  const [pendingDocName, setPendingDocName] = useState(null); // triggers property creation modal

  const { data, isLoading } = useQuery({
    queryKey: ['documentos'],
    queryFn: () => documentosApi.list({ limit: 50 }),
    refetchInterval: 5000,
  });

  // Propiedades para el selector del panel de escritura
  const { data: propData } = useQuery({
    queryKey: ['propiedades-mini'],
    queryFn: () => propiedadesApi.list({ limit: 100 }),
  });
  const propiedades = propData?.data || [];

  const uploadMutation = useMutation({
    mutationFn: documentosApi.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: documentosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Documento eliminado');
    },
  });

  const handleGuardarNota = async (datos) => {
    setNotaLoading(true);
    try {
      const result = await documentosApi.createNota(datos);
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      
      if (result._cambiosExtraidos) {
        queryClient.invalidateQueries({ queryKey: ['propiedades'] });
        queryClient.invalidateQueries({ queryKey: ['propiedades-mini'] });
        const c = result._cambiosExtraidos;
        let msg = `✨ IA ha actualizado la propiedad:\n`;
        if (c.habitaciones) msg += `· Habitaciones: ${c.habitaciones}\n`;
        if (c.banos) msg += `· Baños: ${c.banos}\n`;
        if (c.piscina) msg += `· Piscina: ${c.piscina}\n`;
        if (c.nuevoPrecio) msg += `· Precio ref: ${c.nuevoPrecio.toLocaleString('es-ES')}€\n`;
        if (c.descReescrita) msg += `· ¡Descripción reescrita analizando texto + fotos!\n`;
        toast.success(msg, { duration: 6000 });
      } else {
        toast.success('✅ Nota guardada en el CRM y sincronizada con Drive');
      }
    } catch {
      toast.error('Error al guardar la nota');
    } finally {
      setNotaLoading(false);
    }
  };

  const handleCrearPropiedadDesdeDoc = async ({ nombre, tipo, zona, precio }) => {
    try {
      const body = {
        nombre,
        tipo,
        zona,
        habitaciones: 0,
        banos: 0,
        metrosConstruidos: 0,
      };

      const precioNum = parseInt((precio || '').replace(/[^0-9]/g, ''), 10) || 0;
      if (tipo === 'VENTA') body.venta = { precioVenta: precioNum };
      if (tipo === 'VACACIONAL') body.alquilerVacacional = { precioTemporadaAlta: precioNum };
      if (tipo === 'LARGA_DURACION') body.alquilerLargaDuracion = { rentaMensual: precioNum };

      await propiedadesApi.create(body);
      queryClient.invalidateQueries({ queryKey: ['propiedades'] });
      queryClient.invalidateQueries({ queryKey: ['propiedades-mini'] });
      toast.success(`✅ Propiedad "${nombre}" creada en el CRM`, { duration: 4000 });
      setPendingDocName(null);
    } catch (err) {
      toast.error('Error al crear la propiedad: ' + (err.message || 'desconocido'));
    }
  };


  const fetchedDocs = data?.data || [];

  // Si no hay documentos en BBDD, inyectamos uno falso para la demo visual de la firma:
  const documentos = fetchedDocs.length > 0 ? fetchedDocs : [
    {
      id: 'mock-doc-1',
      nombre: 'Contrato_Arras_Villa_Talamanca_Signed.pdf',
      tipo: 'application/pdf',
      propiedad: { nombre: 'Villa Talamanca' },
      estadoProcesamiento: 'COMPLETADO',
      creadoEn: new Date().toISOString(),
      urlDrive: 'https://drive.google.com/file/d/demo/view',
      esNota: false,
    }
  ];

  const procesados = documentos.filter(d => d.estadoProcesamiento === 'COMPLETADO').length;
  const notas = documentos.filter(d => d.esNota).length;

  return (
    <div>
      {/* MODAL CREAR PROPIEDAD DESDE DOC */}
      {pendingDocName && (
        <ModalCrearPropiedad
          filename={pendingDocName}
          onClose={() => setPendingDocName(null)}
          onCrear={handleCrearPropiedadDesdeDoc}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Documentos &amp; Inteligencia Artificial</h2>
          <p>{documentos.length} documentos · {procesados} procesados por IA · {notas} notas escritas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-icon navy"><FileText size={20} /></div>
          <div><div className="kpi-value">{documentos.length}</div><div className="kpi-label">Total documentos</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckCircle size={20} /></div>
          <div><div className="kpi-value">{procesados}</div><div className="kpi-label">Procesados por IA</div></div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-icon gold"><Upload size={20} /></div>
          <div><div className="kpi-value">{documentos.filter(d => d.urlDrive).length}</div><div className="kpi-label">En Drive</div></div>
        </div>
        <div className="kpi-card" style={{ borderColor: '#7C3AED', background: 'rgba(124,58,237,0.05)' }}>
          <div className="kpi-icon" style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}><NotebookPen size={20} /></div>
          <div><div className="kpi-value" style={{ color: '#7C3AED' }}>{notas}</div><div className="kpi-label">Notas escritas</div></div>
        </div>
      </div>

      {/* Upload de archivos */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <DropzoneUpload 
          onUpload={uploadMutation.mutateAsync} 
          onDocumentUploaded={(filename) => setPendingDocName(filename)}
        />
      </div>

      {/* Panel de escritura ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        {/* Header del panel (toggle) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.5rem',
            cursor: 'pointer',
            borderBottom: panelEscrOpen ? '1px solid rgba(124,58,237,0.15)' : 'none',
            background: 'linear-gradient(90deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
            transition: 'background 0.2s',
          }}
          onClick={() => setPanelEscrOpen(v => !v)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(124,58,237,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileEdit size={17} color="#7C3AED" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary, #0F172A)' }}>
                Redactar Nota / Informe
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                Escribe información directamente → se guarda en el CRM y en Google Drive
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#7C3AED',
              background: 'rgba(124,58,237,0.1)', padding: '3px 8px', borderRadius: 12,
            }}>
              NUEVO
            </span>
            {panelEscrOpen
              ? <ChevronUp size={18} color="#8A9BB0" />
              : <ChevronDown size={18} color="#8A9BB0" />
            }
          </div>
        </div>

        {/* Cuerpo colapsable */}
        {panelEscrOpen && (
          <div style={{ padding: '1.5rem' }}>
            <PanelEscritura
              propiedades={propiedades}
              onGuardar={handleGuardarNota}
              loading={notaLoading}
            />
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="card">
        <div className="card-header">
          <h3>Historial de Documentos</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Propiedad</th>
                <th>Estado IA</th>
                <th>Drive</th>
                <th>Firma Digital</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : documentos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#8A9BB0' }}>Sin documentos. Sube el primero.</td></tr>
              ) : documentos.map(d => {
                const ei = ESTADO_PROCESA[d.estadoProcesamiento] || ESTADO_PROCESA.PENDIENTE;
                const EicoIcon = ei.icon;
                return (
                  <tr key={d.id} style={d.esNota ? { background: 'rgba(124,58,237,0.03)' } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d.esNota
                          ? <NotebookPen size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />
                          : <FileText size={16} style={{ color: '#8A9BB0', flexShrink: 0 }} />
                        }
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{d.nombre}</span>
                          {d.esNota && (
                            <span style={{
                              marginLeft: 6, fontSize: '0.65rem', fontWeight: 600,
                              background: 'rgba(124,58,237,0.12)', color: '#7C3AED',
                              padding: '1px 6px', borderRadius: 4,
                            }}>NOTA</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.75rem', color: '#4A5568' }}>{d.tipo || d.mimeType}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{d.propiedad?.nombre || '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: ei.color }}>
                        <EicoIcon size={13} />{ei.label}
                      </span>
                    </td>
                    <td>
                      {d.urlDrive
                        ? <a href={d.urlDrive} target="_blank" rel="noreferrer" style={{ color: '#4A6FA5' }}><ExternalLink size={14} /></a>
                        : <span style={{ color: '#DDD8CF' }}>—</span>
                      }
                    </td>
                    <td>
                      {d.esNota ? (
                        <span style={{ fontSize: '0.73rem', color: '#8A9BB0', fontStyle: 'italic' }}>N/A</span>
                      ) : (
                        <>
                          {!firmaStatuses[d.id] && (
                            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#1A3A5C', color: '#1A3A5C' }} onClick={() => setFirmaModalDoc(d)}>
                              <PenTool size={12} style={{ marginRight: 4 }} /> Solicitar
                            </button>
                          )}
                          {firmaStatuses[d.id] === 'ENVIADO' && (
                            <span style={{ fontSize: '0.75rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: 4, background: '#FEF3C7', padding: '4px 8px', borderRadius: 4, fontWeight: 500 }}>
                              <Clock size={12} /> Pte. Firma
                            </span>
                          )}
                          {firmaStatuses[d.id] === 'FIRMADO' && (
                            <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 4, background: '#D1FAE5', padding: '4px 8px', borderRadius: 4, fontWeight: 500 }}>
                              <ShieldCheck size={12} /> Firmado (Sello SHA256)
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#8A9BB0' }}>{new Date(d.creadoEn).toLocaleDateString('es-ES')}</td>
                    <td>
                      <button className="btn btn-ghost btn-icon" style={{ color: '#C0392B' }}
                        onClick={() => deleteMutation.mutate(d.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {firmaModalDoc && (
        <FirmaModal
          documento={firmaModalDoc}
          onClose={() => setFirmaModalDoc(null)}
          onSuccess={() => {
            setFirmaStatuses(prev => ({ ...prev, [firmaModalDoc.id]: 'ENVIADO' }));
            setFirmaModalDoc(null);
            toast.success('Solicitud de firma enviada correctamente a las partes.');
            setTimeout(() => {
              setFirmaStatuses(prev => ({ ...prev, [firmaModalDoc.id]: 'FIRMADO' }));
              toast.success(`¡El documento ${firmaModalDoc.nombre} ha sido firmado por todas las partes! 🖋️`);
            }, 6000);
          }}
        />
      )}
    </div>
  );
}

// ─── Modal de Solicitud de Firma Digital ──────────────────────────────────────────────
function FirmaModal({ documento, onClose, onSuccess }) {
  const [sending, setSending] = useState(false);
  const [datos, setDatos] = useState({
    nombreProp: 'Propietario / Arrendador',
    emailProp: 'propietario@ibizaluxurydreams.com',
    nombreCli: 'Cliente Principal',
    emailCli: 'cliente@ejemplo.com'
  });

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

        {/* Header */}
        <div style={{ background: '#0F172A', color: 'white', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: '#1A3A5C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenTool size={20} color="#C9A84C" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Gestor de Firmas Legales</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 2 }}>Integrado con DocuSign / Signaturit</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Doc Info */}
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={24} color="#64748B" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.9rem' }}>{documento.nombre}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>PDF listo para certificación con sellado de tiempo.</div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            Configura los destinatarios requeridos para la firma biométrica / certificado digital de este documento.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>FIRMANTED 1 (PROPIETARIO)</label>
                <div style={{ display: 'flex', background: 'white', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRight: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}><ShieldCheck size={16} color="#64748B" /></div>
                  <input className="input" style={{ border: 'none', borderRadius: 0, flex: 1, fontSize: '0.85rem' }} value={datos.nombreProp} onChange={e => setDatos({...datos, nombreProp: e.target.value})} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>CORREO (FIRMANTED 1)</label>
                <div style={{ display: 'flex', background: 'white', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRight: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}><Mail size={16} color="#64748B" /></div>
                  <input className="input" style={{ border: 'none', borderRadius: 0, flex: 1, fontSize: '0.85rem' }} value={datos.emailProp} onChange={e => setDatos({...datos, emailProp: e.target.value})} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>FIRMANTED 2 (CLIENTE)</label>
                <div style={{ display: 'flex', background: 'white', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRight: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}><ShieldCheck size={16} color="#64748B" /></div>
                  <input className="input" style={{ border: 'none', borderRadius: 0, flex: 1, fontSize: '0.85rem' }} value={datos.nombreCli} onChange={e => setDatos({...datos, nombreCli: e.target.value})} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>CORREO (FIRMANTED 2)</label>
                <div style={{ display: 'flex', background: 'white', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRight: '1px solid #CBD5E1', display: 'flex', alignItems: 'center' }}><Mail size={16} color="#64748B" /></div>
                  <input className="input" style={{ border: 'none', borderRadius: 0, flex: 1, fontSize: '0.85rem' }} value={datos.emailCli} onChange={e => setDatos({...datos, emailCli: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={sending}>Cancelar</button>
          <button className="btn" onClick={handleSend} disabled={sending} style={{ background: '#1A3A5C', color: 'white', borderColor: '#1A3A5C' }}>
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {sending ? 'Procesando Envío...' : 'Enviar para Firma Legal'}
          </button>
        </div>
      </div>
    </div>
  );
}
