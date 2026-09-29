import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FolderSearch, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Database,
  Cloud,
  ChevronRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const MAPPABLE_FIELDS = [
  { id: 'nombre', label: 'Nombre de la Propiedad', required: true },
  { id: 'tipo', label: 'Tipo (VENTA/VACACIONAL)', required: true },
  { id: 'zona', label: 'Zona/Ubicación', required: false },
  { id: 'habitaciones', label: 'Habitaciones', required: false },
  { id: 'banos', label: 'Baños', required: false },
  { id: 'precioVenta', label: 'Precio Venta', required: false },
  { id: 'precioAlquilerTemporadaAlta', label: 'Precio Alquiler (Alta)', required: false },
  { id: 'metrosConstruidos', label: 'M2 Construidos', required: false },
  { id: 'descripcion', label: 'Descripción', required: false },
  { id: 'caracteristicas', label: 'Características (separadas por coma)', required: false },
];

export default function MigradorEntidades() {
  const [step, setStep] = useState('choice'); // choice, mapping, processing_prep, processing, finished
  const [method, setMethod] = useState(null); // csv, drive, folder
  
  // CSV State
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  
  // Progress State
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);

  // Local Folder & Drive State
  const [folderGroups, setFolderGroups] = useState({});
  const [driveFolderId, setDriveFolderId] = useState('');

  // ── CSV HANDLERS ─────────────────────────────────────────────────────────
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setCsvHeaders(Object.keys(results.data[0] || {}));
        
        // Auto-mapping intuitivo
        const initialMapping = {};
        Object.keys(results.data[0] || {}).forEach(header => {
          const lower = header.toLowerCase();
          const match = MAPPABLE_FIELDS.find(f => 
            lower.includes(f.id.toLowerCase()) || 
            lower.includes(f.label.toLowerCase())
          );
          if (match) initialMapping[match.id] = header;
        });
        setMapping(initialMapping);
        setStep('mapping');
        setMethod('csv');
      }
    });
  };

  // ── LOCAL FOLDER HANDLERS ────────────────────────────────────────────────
  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Agrupar por la primera subcarpeta
    const groups = {};
    files.forEach(file => {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length < 2) return; // Archivo en la raíz del seleccionador
      
      const propertySubfolder = parts[1]; // El nombre de la carpeta de la propiedad
      if (!groups[propertySubfolder]) groups[propertySubfolder] = [];
      groups[propertySubfolder].push(file);
    });

    setFolderGroups(groups);
    setMethod('folder');
    setStep('processing_prep');
  };

  const startFolderMigration = async () => {
    setStep('processing');
    const groupNames = Object.keys(folderGroups);
    setProgress({ current: 0, total: groupNames.length });
    setLogs([]);
    setErrors([]);

    for (let i = 0; i < groupNames.length; i++) {
      const folderName = groupNames[i];
      const files = folderGroups[folderName];
      const dossier = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
      const photos = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name));

      setLogs(prev => [`Escaneando inteligencia para: ${folderName}...`, ...prev]);

      try {
        let propertyData = { 
          nombre: folderName, 
          tipo: 'VENTA',
          zona: 'No especificada',
          habitaciones: 0,
          banos: 0,
          metrosConstruidos: 0,
        }; 

        // 1. Analizar el dossier con IA si existe
        if (dossier) {
          const formData = new FormData();
          formData.append('pdf', dossier);
          const resAnalisis = await fetch(`${BASE_URL}/propiedades/analizar-pdf`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
            body: formData
          });
          if (resAnalisis.ok) {
            const result = await resAnalisis.json();
            propertyData = { ...propertyData, ...result.datos };
            if (!propertyData.zona) propertyData.zona = 'No especificada';
            if (!propertyData.habitaciones) propertyData.habitaciones = 0;
            if (!propertyData.banos) propertyData.banos = 0;
            if (!propertyData.metrosConstruidos) propertyData.metrosConstruidos = 0;
          }
        }

        // 2. Crear la propiedad
        const resCreate = await fetch(`${BASE_URL}/propiedades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(propertyData)
        });

        if (!resCreate.ok) {
          const errData = await resCreate.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Error creando ${folderName}`);
        }
        
        const property = await resCreate.json();

        // 3. Subir fotos
        if (photos.length > 0) {
          setLogs(prev => [`Sincronizando ${photos.length} fotos para ${folderName}...`, ...prev]);
          for (const photo of photos) {
            const photoFormData = new FormData();
            photoFormData.append('file', photo);
            await fetch(`${BASE_URL}/propiedades/${property.id}/fotos`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
              body: photoFormData
            });
          }
        }

        setLogs(prev => [`Operación exitosa: ${folderName}`, ...prev]);
      } catch (err) {
        setErrors(prev => [...prev, `${folderName}: ${err.message}`]);
      }

      setProgress(prev => ({ ...prev, current: i + 1 }));
      await new Promise(r => setTimeout(r, 100));
    }

    setStep('finished');
    toast.success('Carpetas sincronizadas exitosamente');
  };

  const startMigration = async () => {
    setStep('processing');
    setProgress({ current: 0, total: csvData.length });
    setLogs([]);
    setErrors([]);

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const propertyData = {};
      
      Object.entries(mapping).forEach(([crmField, csvColumn]) => {
        propertyData[crmField] = row[csvColumn];
      });

      if (propertyData.habitaciones) propertyData.habitaciones = parseInt(propertyData.habitaciones);
      if (propertyData.banos) propertyData.banos = parseInt(propertyData.banos);
      if (propertyData.precioVenta) propertyData.precioVenta = parseFloat(propertyData.precioVenta);
      
      try {
        const res = await fetch(`${BASE_URL}/propiedades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(propertyData)
        });

        if (!res.ok) throw new Error('Cruce de datos fallido');
        
        const created = await res.json();
        setLogs(prev => [`Archivo procesado: ${propertyData.nombre || 'Anon'} (${created.referencia})`, ...prev].slice(0, 50));
      } catch (err) {
        setErrors(prev => [...prev, `${propertyData.nombre || 'Fila ' + (i+1)}: ${err.message}`]);
      }
      
      setProgress(prev => ({ ...prev, current: i + 1 }));
      await new Promise(r => setTimeout(r, 100));
    }

    setStep('finished');
    toast.success('Importación finalizada');
  };

  // ── DRIVE HANDLERS ───────────────────────────────────────────────────────
  const startDriveMigration = async () => {
    if (!driveFolderId) return toast.error('Ingresa un ID de Google Drive válido');
    setStep('processing');
    setLogs([`Estableciendo conexión segura con Google Drive...`]);
    setErrors([]);
    
    try {
      const res = await fetch(`${BASE_URL}/migracion/drive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ folderId: driveFolderId })
      });

      if (!res.ok) throw new Error('Intercepción rechazada');
      
      const result = await res.json();
      setLogs(prev => [`Balance: ${result.processed} propiedades creadas, ${result.errors} fallos.`, ...prev]);
    } catch (err) {
      setErrors(prev => [err.message]);
    }
    
    setStep('finished');
  };

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header className="page-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Importación de Catálogo
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1.1rem' }}>
          Transfiere tu inventario inmobiliario al sistema inteligente de manera rápida. Selecciona el formato de origen de tus datos.
        </p>
      </header>

      {/* ── STEP: CHOICE ─────────────────────────────────────────────────── */}
      {step === 'choice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <label className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '40px 20px', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileSpreadsheet size={36} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Base de Datos CSV</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Sube un archivo CSV exportado desde otro CRM (Kyero, Idealista, etc.) o desde tu propio Excel.
            </p>
          </label>

          <label className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '40px 20px', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input type="file" webkitdirectory="" onChange={handleFolderUpload} style={{ display: 'none' }} />
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FolderSearch size={36} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Carpeta Local</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Sube una carpeta que contenga subcarpetas por propiedad con sus fotos y PDFs. Extraeremos los datos con IA.
            </p>
          </label>

          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Cloud size={36} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Google Drive</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Conecta directamente con la carpeta de Drive donde almacenas las propiedades.
            </p>
            
            <div style={{ width: '100%', position: 'relative', marginBottom: '15px' }}>
              <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="ID o URL de la Carpeta" 
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                value={driveFolderId}
                onChange={(e) => {
                  let val = e.target.value;
                  const match = val.match(/folders\/([a-zA-Z0-9_-]+)/);
                  if (match) val = match[1];
                  setDriveFolderId(val);
                }}
              />
            </div>
            
            <button 
              onClick={startDriveMigration}
              disabled={!driveFolderId}
              className="btn btn-primary w-100"
              style={{ justifyContent: 'center' }}
            >
              Conectar e Importar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PROCESSING PREP (Confirmación carpetas) ────────────────── */}
      {step === 'processing_prep' && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FolderSearch size={32} />
            </div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginBottom: '10px' }}>
              Estructura Analizada
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Hemos detectado <strong>{Object.keys(folderGroups).length} carpetas</strong> de propiedades. El sistema extraerá los datos críticos mediante IA y sincronizará las fotos.
            </p>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginBottom: '30px', background: 'var(--bg-primary)' }}>
            {Object.keys(folderGroups).map(name => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{name}</span>
                <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{folderGroups[name].length} archivos</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button onClick={() => setStep('choice')} className="btn btn-secondary">Cancelar</button>
            <button onClick={startFolderMigration} className="btn btn-primary">
              Comenzar Importación <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: MAPPING ────────────────────────────────────────────────── */}
      {step === 'mapping' && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Mapeo de Columnas</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Empareja las columnas de tu CSV con los campos del CRM</p>
              </div>
            </div>
            <div className="badge" style={{ background: 'var(--bg-primary)', fontSize: '1rem', padding: '8px 16px' }}>
              {csvData.length} filas detectadas
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '30px' }}>
            {MAPPABLE_FIELDS.map(field => (
              <div key={field.id} className="form-group">
                <label className={`form-label ${field.required ? 'required' : ''}`}>
                  {field.label}
                </label>
                <select 
                  className="form-input"
                  value={mapping[field.id] || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, [field.id]: e.target.value }))}
                >
                  <option value="">-- Ignorar este campo --</option>
                  {csvHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setStep('choice')} className="btn btn-secondary">Cancelar</button>
            <button 
              onClick={startMigration}
              disabled={!mapping.nombre || !mapping.tipo}
              className="btn btn-primary"
            >
              Importar Datos <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PROCESSING ─────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', padding: '50px 40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={48} className="spin" style={{ color: 'var(--primary)' }} />
          </div>
          
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '10px' }}>Procesando Importación</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Por favor, no cierres esta ventana. Estamos importando los datos al sistema central.
          </p>
          
          <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: '10px', height: '8px', marginBottom: '15px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: 'var(--primary)', 
                width: `${(progress.current / (progress.total || 1)) * 100}%`,
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '40px', fontWeight: '500' }}>
            <span>{progress.current} / {progress.total} Registros</span>
            <span>{Math.round((progress.current / (progress.total || 1)) * 100)}% Completado</span>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '20px', height: '200px', overflowY: 'auto', textAlign: 'left', fontSize: '0.85rem', fontFamily: 'monospace', border: '1px solid var(--border)' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ color: 'var(--primary)', marginRight: '8px' }}>{'>'}</span> {log}
              </div>
            ))}
            {errors.map((error, i) => (
              <div key={i} style={{ color: 'var(--danger)', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP: FINISHED ──────────────────────────────────────────────── */}
      {step === 'finished' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
            <CheckCircle2 size={40} />
          </div>
          
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '15px' }}>¡Importación Exitosa!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '30px' }}>
            Se han volcado exitosamente <strong>{progress.total} registros</strong> en tu catálogo.
          </p>

          {errors.length > 0 && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '15px', borderRadius: '8px', marginBottom: '30px', fontSize: '0.9rem' }}>
              Registramos {errors.length} alertas durante el proceso. Puedes revisarlas en los logs.
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button 
              onClick={() => {
                setStep('choice');
                setCsvData([]);
                setFolderGroups({});
                setDriveFolderId('');
              }}
              className="btn btn-secondary"
            >
              Hacer otra importación
            </button>
            <a href="/propiedades" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Database size={18} /> Ver Catálogo
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
