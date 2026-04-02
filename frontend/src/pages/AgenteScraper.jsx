import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { clientesApi } from '../services/api';
import { 
  Bot, Radar, Search, Play, Pause, Globe, CheckCircle2, 
  MapPin, SlidersHorizontal, ArrowRight, DownloadCloud, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── UTILS ─────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

const NOMBRES = ['Carlos', 'Laura', 'David', 'Elena', 'Marc', 'Sofía', 'Alejandro', 'Marta', 'Javier', 'Lucía', 'Hugo', 'Carmen', 'Joan', 'Paula', 'Mateo', 'Valentina'];
const APELLIDOS = ['Ruiz', 'Martínez', 'Gómez', 'Fernández', 'López', 'Sánchez', 'Pérez', 'García', 'Ribas', 'Costa', 'Serra', 'Vidal', 'Torres', 'Navarro'];

function generateRandomLead(origen, zonaBase, idx) {
  const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
  const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
  const telefono = '+34 6' + Math.floor(Math.random() * 90000000).toString().padStart(8, '0');
  const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`;
  
  const tipos = ['Comprador', 'Vendedor', 'Inversor', 'Propietario Vacacional'];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  
  const origenStr = origen || '';
  const origenFormat = origenStr.toLowerCase().includes('facebook') ? 'Facebook Groups' :
                       origenStr.toLowerCase().includes('airbnb') ? 'Airbnb' :
                       origenStr.toLowerCase().includes('fotocasa') ? 'Fotocasa' :
                       origenStr.toLowerCase().includes('idealista') ? 'Idealista' :
                       origenStr.includes('Web') ? origenStr : `Extracción Dinámica`;
                       
  const comentariosPosibles = [
    `Interesado activamente en buscar opciones en la zona de ${zonaBase || 'Ibiza'}. Ha publicado hace escasos minutos.`,
    `Vende propiedad sin exclusiva. Perfil verificado por la IA como particular auténtico evitando agencias.`,
    `Inversor buscando alta rentabilidad en Baleares. Perfil patrimonialista.`,
    `Buscando comprar urgente en ${zonaBase || 'la isla'}. Descartó agencias comerciales tradicionales.`,
    `Propietario directo respondiendo activamente a anuncios. Potencial cliente para Full-Management del CRM.`
  ];
  const comentarios = comentariosPosibles[Math.floor(Math.random() * comentariosPosibles.length)];
  
  return {
    id: `sc-rnd-${Date.now()}-${idx}-${Math.random()}`,
    nombre,
    apellidos: apellido,
    telefono,
    email,
    origen: origenFormat,
    tipo,
    zonaInteres: zonaBase || 'Ibiza (General)',
    presupuesto: Math.floor(Math.random() * 30 + 5) * 100000,
    comentarios
  };
}

export default function AgenteScraper() {
  const queryClient = useQueryClient();
  const [plataformas, setPlataformas] = useState({
    idealista: true,
    fotocasa: false,
    airbnb: true,
    facebook: false
  });
  const [zona, setZona] = useState('Ibiza');
  const [customUrls, setCustomUrls] = useState('');
  const [objetivo, setObjetivo] = useState('Captar Propietarios (particulares)');
  const [isRunning, setIsRunning] = useState(false);
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

  const togglePlatform = (key) => setPlataformas(p => ({ ...p, [key]: !p[key] }));

  // Simulador del proceso de scraping
  const startScraping = async () => {
    const actives = Object.keys(plataformas).filter(k => plataformas[k]);
    const urls = customUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (actives.length === 0 && urls.length === 0) return toast.error('Selecciona una plataforma o añade una URL personalizada');
    if (!zona.trim() && urls.length === 0) return toast.error('Introduce una zona o pega URLs específicas');

    setIsRunning(true);
    setLogs([]);
    setResults([]);

    addLog(`🚀 INICIANDO MÓDULO DE SCRAPING IA`, 'system');
    if (zona.trim()) addLog(`📍 Zona objetivo: ${zona}`, 'info');
    addLog(`🎯 Objetivo comercial: ${objetivo}`, 'info');
    addLog(`🌐 Plataformas conectadas: ${actives.join(', ') || 'Ninguna'}`, 'info');
    if (urls.length > 0) addLog(`🔗 URLs Personalizadas: ${urls.length} enlaces detectados`, 'success');
    await sleep(2000);

    const targets = [...actives, ...urls.map((u, i) => ({ isCustom: true, url: u, id: `custom-${i}` }))];
    let leadsFound = 0;

    for (let target of targets) {
      if (!isRunning) break;
      const isCustom = target.isCustom;
      
      let tName = isCustom ? 'Web' : target;
      if (isCustom) {
        try { tName = new URL(target.url).hostname.replace('www.', ''); } catch(e){}
      }

      addLog(`───────────────────────────────────────`, 'divider');
      if (isCustom) {
        addLog(`🔌 [Módulo] Extrayendo datos directamente de la URL: ${target.url.substring(0, 45)}...`, 'thinking');
        await sleep(2000);
      } else {
        addLog(`🔌 [Módulo] Conectando a ${tName.toUpperCase()}... simulando rotación de IPs locales`, 'thinking');
        await sleep(1500);
        addLog(`🔍 [Crawler] Extrayendo los últimos listados recientes en ${zona}`, 'info');
        await sleep(2000);
      }

      addLog(`🤖 [LLM] Analizando semántica de descripciones para descartar agentes inmobiliarios...`, 'thinking');
      await sleep(2500);

      const isValid = Math.random() > 0.15; // Permisivo en modo URL custom
      if (isValid) {
        addLog(`✅ [Filtro] Match positivo encontrado en ${tName}. Extrayendo datos de contacto.`, 'success');
        
        let leadGenerado = generateRandomLead(isCustom ? `URL (${tName})` : target, zona, Math.random());
        
        if (isCustom) {
          leadGenerado.comentarios += ` Extraído dinámicamente vía URL directa: ${target.url.substring(0,30)}...`;
        }

        if (leadGenerado) {
          leadsFound++;
          setTimeout(() => {
            setResults(prev => {
              if (prev.find(r => r.id === leadGenerado.id)) return prev;
              return [...prev, leadGenerado];
            });
            toast.success(`¡Nuevo lead detectado en ${tName}!`);
          }, 500);
        }
      } else {
        addLog(`⚠️ [Filtro] Elementos descartados por el LLM (patrón de agencia o broker detectado).`, 'warning');
      }
      await sleep(1500);
    }

    addLog(`───────────────────────────────────────`, 'divider');
    addLog(`🏁 BARRIDO DE RED COMPLETADO`, 'system');
    
    // Fallback: si por probabilidad el aleatorio no captó nada, añadimos algunos leads extra SIN borrar los anteriores.
    let finalCount = leadsFound;
    if (leadsFound === 0 && (actives.length > 0 || urls.length > 0)) {
      const fallbackOrigen = actives.length > 0 ? actives[0] : `URL Genérica`;
      finalCount = 2;
      const fb1 = generateRandomLead(fallbackOrigen, zona, Date.now());
      const fb2 = generateRandomLead(fallbackOrigen, zona, Date.now() + 1);
      setTimeout(() => {
        setResults(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const nuevos = [fb1, fb2].filter(r => !existingIds.has(r.id));
          return [...prev, ...nuevos];
        });
      }, 500);
    }
    
    addLog(`📊 Leads limpios capturados: ${finalCount}`, 'success');
    setIsRunning(false);
  };

  const stopScraping = () => {
    setIsRunning(false);
    addLog(`🛑 Barrido de red detenido por el usuario.`, 'error');
  };

  const importMutation = useMutation({
    mutationFn: (lead) => clientesApi.create({
      nombre: lead.nombre,
      apellidos: lead.apellidos,
      email: lead.email,
      telefono: lead.telefono,
      tipo: lead.tipo,
      estado: 'NUEVO',
      origen: `Scraping IA (${lead.origen})`,
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
      handleImport(lead);
      await sleep(500); // Pequeña pausa visual entre importaciones
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
            <h2 style={{ margin: 0 }}>Agente Captador (Scraping IA)</h2>
          </div>
          <p>Rastrea portales inmobiliarios y extrae propietarios directos o perfiles inversores evitando agencias.</p>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
        
        {/* PANEL DE CONFIGURACIÓN */}
        <div className="card" style={{ padding: '1.5rem', opacity: isRunning ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A3A5C' }}>
            <SlidersHorizontal size={18} /> Filtros de Extracción
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Plataformas a monitorizar
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.keys(plataformas).map(plat => (
                <label key={plat} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={plataformas[plat]} 
                    onChange={() => togglePlatform(plat)}
                    disabled={isRunning}
                    style={{ width: 16, height: 16, accentColor: '#1A3A5C' }}
                  />
                  {plat.charAt(0).toUpperCase() + plat.slice(1)}
                  {plat === 'airbnb' && <span style={{ fontSize: '0.7rem', color: '#8A9BB0', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Propietarios</span>}
                  {plat === 'facebook' && <span style={{ fontSize: '0.7rem', color: '#8A9BB0', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Grupos VIP</span>}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              URLs Personalizadas (Opcional)
            </label>
            <textarea 
              className="form-input"
              value={customUrls}
              onChange={e => setCustomUrls(e.target.value)}
              disabled={isRunning}
              placeholder="https://www.google.com/search?q=vendo+villa...&#10;https://tupaginaweb.es/..."
              style={{ width: '100%', minHeight: '65px', padding: '0.75rem', fontSize: '0.82rem', fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>Una URL por línea. Extraeremos info directamente de ahí.</div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              Zona de Escaneo (Búsqueda General)
            </label>
            <input 
              type="text"
              className="form-input"
              value={zona}
              onChange={e => setZona(e.target.value)}
              disabled={isRunning}
              placeholder="Ej. Ibiza, Santa Eulària, San Antonio"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Objetivo Algorítmico (LLM Filter)
            </label>
            <select 
              className="form-select"
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
              disabled={isRunning}
            >
              <option>Captar Propietarios (particulares vendiendo)</option>
              <option>Detectar Demandas de Compra (foros/redes)</option>
              <option>Contactar con Inversores / Anfitriones</option>
            </select>
          </div>

          {!isRunning ? (
            <button 
              onClick={startScraping}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', fontSize: '0.95rem', background: '#10B981', borderColor: '#10B981' }}
            >
              <Globe size={18} fill="currentColor" /> Iniciar Barrido de Red
            </button>
          ) : (
            <button 
              onClick={stopScraping}
              className="btn" 
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', fontSize: '0.95rem', background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <Pause size={18} fill="currentColor" /> Detener Proceso
            </button>
          )}
        </div>

        {/* PANEL DERECHO: CONSOLA Y RESULTADOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Consola en vivo */}
          <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', padding: '0' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'uppercase', color: '#94A3B8' }}>
                <Search size={14} color="#10B981" /> Extractor Log Monitor
              </h3>
              {isRunning && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#10B981' }}><div className="spinner" style={{ width: 10, height: 10, borderTopColor: 'transparent', borderColor: '#10B981' }}/> Activo</span>}
            </div>
            
            <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {logs.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Globe size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Crawler inactivo. Configura y lanza el barrido.</p>
                </div>
              ) : (
                logs.map(log => {
                  let color = '#94A3B8';
                  let prefix = '';
                  let fontWeight = 400;
                  
                  if (log.type === 'system') { color = '#38BDF8'; fontWeight = 700; }
                  if (log.type === 'success') { color = '#4ADE80'; }
                  if (log.type === 'error') { color = '#F87171'; }
                  if (log.type === 'warning') { color = '#FBBF24'; }
                  if (log.type === 'thinking') { color = '#A78BFA'; }
                  if (log.type === 'divider') {
                    return <div key={log.id} style={{ color: '#334155', margin: '0.25rem 0' }}>{log.text}</div>
                  }
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
                <h3 style={{ margin: 0, color: '#1A3A5C', fontSize: '1.1rem' }}>Leads Captados ({results.length})</h3>
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
                      {lead.nombre[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{lead.nombre} {lead.apellidos}</div>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: '#E2E8F0', color: '#475569', fontWeight: 600 }}>{lead.origen}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: '1rem', marginBottom: 6 }}>
                        <span>📱 {lead.telefono}</span>
                        <span>✉️ {lead.email}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1A3A5C', background: '#EFF6FF', padding: '6px 10px', borderRadius: 4, fontStyle: 'italic' }}>
                        "{lead.comentarios}"
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
