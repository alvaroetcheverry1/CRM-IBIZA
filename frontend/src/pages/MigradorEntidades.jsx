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
  const [step, setStep] = useState('choice'); // choice, mapping, processing, finished
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

      setLogs(prev => [`🔍 Escaneando inteligencia para: ${folderName}...`, ...prev]);

      try {
        // Inicializar con defaults seguros para los campos requeridos por Prisma
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
            // Asegurarse de que si result.datos trae algún require vacío re-aplicar defaults
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
          console.error(`Error backend [${folderName}]:`, errData);
          throw new Error(errData.message || errData.error || `Error creando ${folderName}`);
        }
        
        const property = await resCreate.json();

        // 3. Subir fotos
        if (photos.length > 0) {
          setLogs(prev => [`📸 Sincronizando ${photos.length} fotos alta res para ${folderName}...`, ...prev]);
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

        setLogs(prev => [`✨ Operación exitosa: ${folderName}`, ...prev]);
      } catch (err) {
        setErrors(prev => [...prev, `${folderName}: ${err.message}`]);
      }

      setProgress(prev => ({ ...prev, current: i + 1 }));
      await new Promise(r => setTimeout(r, 100));
    }

    setStep('finished');
    toast.success('Entramado de carpetas sincronizado con el CRM');
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
        setLogs(prev => [`✅ Archivo procesado: ${propertyData.nombre || 'Anon'} (${created.referencia})`, ...prev].slice(0, 50));
      } catch (err) {
        setErrors(prev => [...prev, `${propertyData.nombre || 'Fila ' + (i+1)}: ${err.message}`]);
      }
      
      setProgress(prev => ({ ...prev, current: i + 1 }));
      await new Promise(r => setTimeout(r, 100));
    }

    setStep('finished');
    toast.success('Matrix de datos construida');
  };

  // ── DRIVE HANDLERS ───────────────────────────────────────────────────────
  const startDriveMigration = async () => {
    if (!driveFolderId) return toast.error('Ingresa un ID de Google Drive válido');
    setStep('processing');
    setLogs([`🚀 Estableciendo conexión segura con Google Drive (ID: ${driveFolderId})...`]);
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

      if (!res.ok) throw new Error('Intercepción rechazada en Node/Drive');
      
      const result = await res.json();
      setLogs(prev => [`📊 Balance: ${result.processed} entidades generadas, ${result.errors} bloqueos.`, ...prev]);
    } catch (err) {
      setErrors(prev => [err.message]);
    }
    
    setStep('finished');
  };

  return (
    <div className="p-10 max-w-6xl mx-auto min-h-screen bg-black/40 rounded-3xl border border-gray-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden my-6">
      <div className="absolute top-0 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <header className="mb-14 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800/50 border border-gray-700/50 rounded-full text-gray-400 text-xs tracking-widest uppercase mb-6 shadow-sm">
          <Sparkles size={14} className="text-amber-400" /> Ibiza Luxury System
        </div>
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 tracking-tight">
          Data Migration Wizard
        </h1>
        <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto leading-relaxed">
          Transfiere tu catálogo inmobiliario al ecosistema Inteligente a través de bases CSV, arquitecturas de carpetas o puentes directos con Google Drive.
        </p>
      </header>

      {/* ── STEP: CHOICE ─────────────────────────────────────────────────── */}
      {step === 'choice' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          
          <label className="group relative bg-[#121212] border border-gray-800/80 rounded-3xl p-8 hover:border-blue-500/50 hover:bg-[#1a1a1b] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <FileSpreadsheet className="text-blue-400 w-10 h-10" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">Archivo CSV</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Formato universal. Ideal para bases exportadas desde Kyero, Idealista, Inmoenter o tu Excel interno.
            </p>
          </label>

          <label className="group relative bg-[#121212] border border-gray-800/80 rounded-3xl p-8 hover:border-emerald-500/50 hover:bg-[#1a1a1b] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* HTML Attribute webkitdirectory enables folder upload on all modern webkit/chromium browsers */}
            <input type="file" webkitdirectory="" onChange={handleFolderUpload} className="hidden" />
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
              <FolderSearch className="text-emerald-400 w-10 h-10" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">Carpeta Local</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Analizaremos recursivamente PDFs como dossiers y cargaremos imágenes en alta resolución automáticamente.
            </p>
          </label>

          <div className="group relative bg-[#121212] border border-gray-800/80 rounded-3xl p-8 hover:border-amber-500/50 hover:bg-[#1a1a1b] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="bg-amber-500/10 border border-amber-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <Cloud className="text-amber-400 w-10 h-10" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">Google Drive</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
              Conexión en la nube. Introduce la URL o ID del directorio raíz que agrupa tus propiedades.
            </p>
            
            <div className="w-full relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <LinkIcon size={16} />
              </div>
              <input 
                type="text" 
                placeholder="ID o URL de la Carpeta" 
                className="w-full bg-black/60 border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none"
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
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
            >
              Iniciar Pasarela <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PROCESSING PREP (Confirmación carpetas) ────────────────── */}
      {step === 'processing_prep' && (
        <div className="bg-[#121212] rounded-3xl p-10 border border-emerald-900/30 shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
            <FolderSearch className="text-emerald-400 w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-extrabold mb-4 tracking-tight">
            Análisis de Estructura Listo
          </h2>
          <p className="text-gray-400 mb-8 font-light text-lg">
            El motor ha mapeado <strong className="text-white">{Object.keys(folderGroups).length} directorios</strong> de propiedades. 
            El CRM Inteligente extraerá los datos críticos mediante IA y sincronizará todo el material gráfico.
          </p>

          <div className="max-h-64 overflow-y-auto mb-10 border border-gray-800/80 rounded-2xl p-2 bg-black/40 fancy-scrollbar">
            {Object.keys(folderGroups).map(name => (
              <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 rounded-xl transition-colors last:border-0 group">
                <span className="text-gray-200 font-medium group-hover:text-emerald-400 transition-colors">{name}</span>
                <span className="text-xs font-mono bg-gray-900 px-3 py-1 rounded-full text-gray-400 border border-gray-800">{folderGroups[name].length} assets</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={() => setStep('choice')} className="px-6 py-3 rounded-xl text-gray-400 font-medium hover:text-white hover:bg-gray-800 transition-all">Abortar</button>
            <button onClick={startFolderMigration} className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
              Ejecutar Extracción <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: MAPPING ────────────────────────────────────────────────── */}
      {step === 'mapping' && (
        <div className="bg-[#121212] rounded-3xl p-10 border border-blue-900/30 shadow-2xl animate-in zoom-in-95 duration-300 relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                <Database className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Ingeniería de Datos</h2>
                <p className="text-gray-400 text-sm">Emparejamiento de nodos CSV</p>
              </div>
            </div>
            <div className="bg-blue-950/40 border border-blue-900/50 px-4 py-2 rounded-full text-sm text-blue-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {csvData.length} records detected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 bg-black/30 p-8 rounded-3xl border border-gray-800/50">
            {MAPPABLE_FIELDS.map(field => (
              <div key={field.id} className="flex flex-col gap-2 group">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                  {field.label} {field.required && <span className="text-red-400 text-xs px-2 py-0.5 bg-red-950/50 rounded-full border border-red-900/30">KEY</span>}
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-200 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none appearance-none transition-all cursor-pointer hover:border-gray-700"
                    value={mapping[field.id] || ''}
                    onChange={(e) => setMapping(prev => ({ ...prev, [field.id]: e.target.value }))}
                  >
                    <option value="" className="text-gray-600">-- Ignorar Nodo --</option>
                    {csvHeaders.map(h => (
                      <option key={h} value={h} className="text-white">{h}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-800/50 pt-8 mt-4">
            <button 
              onClick={() => setStep('choice')}
              className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              Abortar
            </button>
            <button 
              onClick={startMigration}
              disabled={!mapping.nombre || !mapping.tipo}
              className="px-10 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 hover:-translate-y-0.5"
            >
              Inicializar Transferencia <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PROCESSING ─────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="bg-[#121212] rounded-3xl p-12 border border-gray-800 shadow-2xl relative z-10 max-w-3xl mx-auto text-center animate-in zoom-in-95 duration-500">
          <div className="relative w-24 h-24 mx-auto mb-10">
            <div className="absolute inset-0 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-2 border-b-2 border-l-2 border-emerald-500 rounded-full animate-[spin_1.5s_linear_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-white w-8 h-8 animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-4xl font-black mb-3 tracking-tight">Sintetizando Datos</h2>
          <p className="text-gray-400 mb-10 font-light">
            No recargues la página. Estableciendo conexiones inter-dimensionales con el core.
          </p>
          
          <div className="w-full bg-black/60 rounded-full h-3 mb-4 relative overflow-hidden border border-gray-800/50 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)] relative"
              style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mb-12 font-mono uppercase tracking-widest">
            <span>{progress.current} / {progress.total} Assets</span>
            <span className="text-blue-400">{Math.round((progress.current / (progress.total || 1)) * 100)}% Completado</span>
          </div>

          <div className="bg-black/60 rounded-2xl p-6 h-72 overflow-y-auto text-left font-mono text-[11px] border border-gray-800/50 fancy-scrollbar leading-relaxed">
            {logs.map((log, i) => (
              <div key={i} className="mb-3 last:mb-0 pb-3 border-b border-gray-900/50 text-gray-300">
                <span className="text-blue-500 mr-2">{'>'}</span> {log}
              </div>
            ))}
            {errors.map((error, i) => (
              <div key={i} className="text-red-400 mb-3 border-b border-red-900/20 pb-3 flex items-start gap-2 bg-red-950/20 p-3 rounded-lg">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span className="break-words">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP: FINISHED ──────────────────────────────────────────────── */}
      {step === 'finished' && (
        <div className="bg-[#121212] rounded-3xl p-14 border border-emerald-900/30 shadow-2xl relative z-10 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500">
          <div className="relative w-32 h-32 mx-auto mb-10">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 size={64} strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-5xl font-black mb-5 tracking-tight text-white">Transfusión Exitosa</h2>
          <p className="text-gray-400 text-lg mb-12 font-light leading-relaxed">
            Se han volcado exitosamente <strong className="text-white">{progress.total} entidades</strong> al sistema central.
            {errors.length > 0 && <span className="block mt-3 text-red-400 bg-red-950/30 py-2 px-4 rounded-xl border border-red-900/50 border-dashed inline-block">Sin embargo, registramos {errors.length} fallas de integración en el proceso. Consulta los logs para más detalles.</span>}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button 
              onClick={() => window.location.href = '/propiedades'}
              className="px-8 py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1"
            >
              <Database size={18} /> Explorar Catálogo
            </button>
            <button 
              onClick={() => {
                setStep('choice');
                setCsvData([]);
                setFolderGroups({});
                setDriveFolderId('');
              }}
              className="px-8 py-4 rounded-xl font-bold bg-[#1a1a1b] border border-gray-800 text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
            >
              Registrar Nueva Flota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
