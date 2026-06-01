import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { clientesApi } from '../services/api';
import { 
  Bot, Radar, Search, Play, Pause, Globe, CheckCircle2, 
  MapPin, SlidersHorizontal, ArrowRight, DownloadCloud, Loader2, DollarSign, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgenteScraper() {
  const queryClient = useQueryClient();
  
  // Parámetros de búsqueda
  const [plataforma, setPlataforma] = useState('idealista');
  const [zona, setZona] = useState('Ibiza');
  const [customUrls, setCustomUrls] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [habMin, setHabMin] = useState('');
  const [objetivo, setObjetivo] = useState('Captar Propietarios (particulares vendiendo)');
  
  // Estado del motor
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  
  // Resultados y logs
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [importingId, setImportingId] = useState(null);
  const logsEndRef = useRef(null);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Polling del estado del Job en el backend
  useEffect(() => {
    let intervalId;
    
    if (isRunning && currentJobId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/scraper/status/${currentJobId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
          const data = await response.json();
          
          if (data.ok && data.job) {
            // Actualizar logs solo con los nuevos
            setLogs(prevLogs => {
              const currentLogTexts = new Set(prevLogs.map(l => l.text));
              const newLogs = data.job.logs
                .filter(log => !currentLogTexts.has(log))
                .map(log => ({ 
                  id: Date.now() + Math.random(), 
                  time: new Date().toLocaleTimeString(), 
                  text: log, 
                  type: log.includes('❌') ? 'error' : log.includes('✅') ? 'success' : log.includes('⚠️') ? 'warning' : 'info' 
                }));
              return [...prevLogs, ...newLogs];
            });

            // Si el trabajo terminó
            if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
              setIsRunning(false);
              setCurrentJobId(null);
              clearInterval(intervalId);
              
              if (data.job.results && data.job.results.length > 0) {
                setResults(data.job.results);
                toast.success(`Extracción finalizada: ${data.job.results.length} perfiles capturados.`);
              }
            }
          }
        } catch (error) {
          console.error("Error consultando estado del scraper:", error);
        }
      }, 3000); // Polling cada 3 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentJobId]);

  const startScraping = async () => {
    if (!zona.trim()) return toast.error('Introduce una zona de búsqueda');

    setIsRunning(true);
    setLogs([]);
    setResults([]);
    addLog(`🚀 SOLICITANDO INICIO DE MOTOR DE SCRAPING EN BACKEND`, 'system');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/scraper/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          plataforma,
          zona,
          customUrls,
          precioMax,
          habMin,
          objetivo
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor');
      }

      setCurrentJobId(data.jobId);
      addLog(`📡 Job asignado en backend: ${data.jobId}`, 'thinking');
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      setIsRunning(false);
      toast.error('No se pudo iniciar el scraper');
    }
  };

  const importMutation = useMutation({
    mutationFn: (lead) => clientesApi.create({
      nombre: lead.nombre,
      apellidos: lead.apellidos,
      email: lead.email,
      telefono: lead.telefono,
      tipo: lead.tipo,
      estado: 'NUEVO',
      origen: lead.origen,
      presupuesto: lead.presupuesto || 0,
      zonaInteres: lead.zonaInteres
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  const handleImport = async (lead) => {
    setImportingId(lead.id);
    try {
      await importMutation.mutateAsync(lead);
      toast.success(`${lead.nombre} importado al CRM`);
      setResults(prev => prev.filter(r => r.id !== lead.id));
    } catch (error) {
      toast.error('Error importando lead');
    } finally {
      setImportingId(null);
    }
  };

  const handleImportAll = async () => {
    for (let lead of results) {
      await handleImport(lead);
      await new Promise(r => setTimeout(r, 400));
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1A3A5C, #0D1B2A)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <Radar size={22} />
            </div>
            <h2 style={{ margin: 0 }}>Agente Captador (Scraping Inteligente)</h2>
          </div>
          <p>Motor de extracción real. Configura los parámetros y conecta con la API de extracción en segundo plano.</p>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
        
        {/* PANEL DE CONFIGURACIÓN */}
        <div className="card" style={{ padding: '1.5rem', opacity: isRunning ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A3A5C' }}>
            <SlidersHorizontal size={18} /> Parámetros de Extracción
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Plataforma Objetivo
            </label>
            <select 
              className="form-select"
              value={plataforma}
              onChange={e => setPlataforma(e.target.value)}
              disabled={isRunning}
            >
              <option value="idealista">Idealista (España)</option>
              <option value="fotocasa">Fotocasa</option>
              <option value="airbnb">Airbnb (Anfitriones)</option>
              <option value="facebook">Facebook Marketplace / Grupos</option>
              <option value="custom">URL Personalizada / Otros sitios</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              URLs Específicas (Opcional)
            </label>
            <textarea 
              className="form-input"
              value={customUrls}
              onChange={e => setCustomUrls(e.target.value)}
              disabled={isRunning}
              placeholder="https://www.linkedin.com/in/...&#10;https://x.com/perfil..."
              style={{ width: '100%', minHeight: '60px', padding: '0.75rem', fontSize: '0.82rem', fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>Pega una o varias URLs separadas por línea.</div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              Zona de Escaneo Exacta
            </label>
            <input 
              type="text"
              className="form-input"
              value={zona}
              onChange={e => setZona(e.target.value)}
              disabled={isRunning}
              placeholder="Ej. Ibiza, Santa Eulària..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> 
                Precio Máx. (€)
              </label>
              <input 
                type="number"
                className="form-input"
                value={precioMax}
                onChange={e => setPrecioMax(e.target.value)}
                disabled={isRunning}
                placeholder="Ej. 1500000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                <Home size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> 
                Habitaciones Min.
              </label>
              <input 
                type="number"
                className="form-input"
                value={habMin}
                onChange={e => setHabMin(e.target.value)}
                disabled={isRunning}
                placeholder="Ej. 3"
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Filtro Algorítmico
            </label>
            <select 
              className="form-select"
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
              disabled={isRunning}
            >
              <option>Excluir Agencias (Solo Particulares)</option>
              <option>Detectar Inversores (Multianuncio)</option>
              <option>Todos los listados (Crudo)</option>
            </select>
          </div>

          <button 
            onClick={startScraping}
            disabled={isRunning}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', fontSize: '0.95rem', background: '#10B981', borderColor: '#10B981' }}
          >
            {isRunning ? (
              <><Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Ejecutando en Servidor...</>
            ) : (
              <><Globe size={18} style={{ marginRight: 8 }} /> Ejecutar Extractor Real</>
            )}
          </button>
        </div>

        {/* PANEL DERECHO: CONSOLA Y RESULTADOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Consola en vivo */}
          <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', padding: '0' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'uppercase', color: '#94A3B8' }}>
                <Search size={14} color="#10B981" /> Consola de Extracción en Backend
              </h3>
              {isRunning && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#10B981' }}><div className="spinner" style={{ width: 10, height: 10, borderTopColor: 'transparent', borderColor: '#10B981' }}/> Conectado</span>}
            </div>
            
            <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {logs.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Globe size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Motor inactivo. Los logs del backend aparecerán aquí.</p>
                </div>
              ) : (
                logs.map(log => {
                  let color = '#94A3B8';
                  let fontWeight = 400;
                  
                  if (log.type === 'system') { color = '#38BDF8'; fontWeight = 700; }
                  if (log.type === 'success') { color = '#4ADE80'; }
                  if (log.type === 'error') { color = '#F87171'; }
                  if (log.type === 'warning') { color = '#FBBF24'; }
                  if (log.type === 'thinking') { color = '#A78BFA'; }
                  
                  return (
                    <div key={log.id} style={{ marginBottom: '0.2rem', color, fontWeight }}>
                      <span style={{ color: '#475569', marginRight: '8px', fontSize: '0.7rem' }}>[{log.time}]</span>
                      {log.text}
                    </div>
                  )
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Resultados de Extracción */}
          {results.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1A3A5C', fontSize: '1.1rem' }}>Perfiles Extraídos ({results.length})</h3>
                <button 
                  onClick={handleImportAll} 
                  className="btn btn-outline btn-sm"
                  style={{ color: '#1A3A5C', borderColor: '#1A3A5C' }}
                >
                  <DownloadCloud size={14} /> Importar Todos
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {results.map(lead => (
                  <div key={lead.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '1rem', background: '#F8FAFC', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, background: '#1A3A5C', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {lead.nombre ? lead.nombre[0] : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{lead.nombre} {lead.apellidos}</div>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: '#E2E8F0', color: '#475569', fontWeight: 600 }}>{lead.origen}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: '1rem', marginBottom: 6 }}>
                        <span>📱 {lead.telefono || 'Sin teléfono'}</span>
                        <span>✉️ {lead.email || 'Sin email'}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1A3A5C', background: '#EFF6FF', padding: '6px 10px', borderRadius: 4, fontStyle: 'italic' }}>
                        {lead.comentarios}
                      </div>
                    </div>
                    <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleImport(lead)}
                        disabled={importingId === lead.id}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {importingId === lead.id ? <Loader2 size={14} className="spin" /> : <ArrowRight size={14} />} Importar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
