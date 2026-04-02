import { useState, useRef, useEffect } from 'react';
import { Bot, Play, Pause, FileText, CheckCircle2, RotateCcw, Send, Settings, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── UTILS ─────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomEl = arr => arr[Math.floor(Math.random() * arr.length)];

// Datos demo precargados para facilitar la prueba
const DEMO_LEADS = `Juan Pérez, juan@empresa.com, +34 600 111 222
María García, maria@inversora.es, +34 622 333 444
Carlos López, carlos.lopez@capital.com, +34 611 999 000`;

const DEMO_PITCH = `Estamos comercializando en exclusiva 'Villa Can Rimbau' en Jesús, Ibiza.
Precio: 8.500.000 €.
Highlights: 6 habitaciones, vistas panorámicas a Dalt Vila y Formentera, diseño contemporáneo, privacidad absoluta.
Objetivo: Conseguir que el cliente reserve una visita presencial o una videollamada esta semana.`;

const POSITIVE_REPLIES = [
  "¡Hola! Suena muy interesante. ¿Tienen el dossier completo de la propiedad?",
  "Justo estoy buscando algo en esa zona. ¿Podemos organizar una videollamada el jueves?",
  "El precio encaja en mi presupuesto. Me gustaría visitarla en mi próximo viaje a Ibiza en dos semanas.",
];

const NEGATIVE_REPLIES = [
  "No me interesa en este momento, gracias.",
  "Se sale un poco de mi presupuesto, estoy buscando algo hasta 5M€.",
  "Acabo de comprar otra propiedad en Mallorca, así que ya no busco.",
];

export default function AgenteComercial() {
  const [leadsInput, setLeadsInput] = useState(DEMO_LEADS);
  const [pitch, setPitch] = useState(DEMO_PITCH);
  const [tone, setTone] = useState('Consultivo y Elegante');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Array de logs para la consola
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll de la consola
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
  };

  const startCampaign = async () => {
    if (!leadsInput.trim() || !pitch.trim()) {
      return toast.error("Faltan contactos o el pitch de ventas");
    }

    // Parsear leads
    const leadsRaw = leadsInput.split('\n').filter(l => l.trim().length > 0);
    const leads = leadsRaw.map(l => {
      const parts = l.split(',').map(p => p.trim());
      return { nombre: parts[0] || 'Contacto', email: parts[1] || 'Sin Email', phone: parts[2] || '' };
    });

    if (leads.length === 0) return toast.error("No se han detectado contactos válidos.");

    setIsRunning(true);
    setLogs([]);
    setProgress({ current: 0, total: leads.length });
    
    addLog(`🚀 INICIANDO CAMPAÑA DE OUTBOUND IA`, 'system');
    addLog(`📊 Contactos cargados: ${leads.length}`, 'info');
    addLog(`🎯 Objetivo: ${pitch.substring(0, 50)}...`, 'info');
    await sleep(1500);

    for (let i = 0; i < leads.length; i++) {
      if (!isRunning) break; // Check if stopped
      const lead = leads[i];
      setProgress(p => ({ ...p, current: i + 1 }));

      addLog(`───────────────────────────────────────`, 'divider');
      addLog(`🤖 [Agente] Analizando perfil de ${lead.nombre}...`, 'thinking');
      await sleep(1200);

      addLog(`✍️ [Agente] Redactando email hiper-personalizado usando tono "${tone}"...`, 'thinking');
      await sleep(1500);

      addLog(`📧 [Sistema] Email enviado a ${lead.email}`, 'success');
      await sleep(1000);

      addLog(`⏳ [Sistema] Esperando respuesta del cliente... (Simulado)`, 'warning');
      await sleep(2500);
      
      // Simular respuesta basada en probabilidad (70% positivo para demo)
      const isPositive = Math.random() > 0.3;
      const reply = isPositive ? randomEl(POSITIVE_REPLIES) : randomEl(NEGATIVE_REPLIES);
      
      addLog(`📩 [Cliente] Nueva respuesta recibida:`, 'info');
      addLog(`"${reply}"`, 'quote');
      await sleep(1500);

      addLog(`🤖 [Agente IA] Analizando sentimiento e intención...`, 'thinking');
      await sleep(1000);

      if (isPositive) {
        addLog(`✅ [Agente IA] Intención Positiva detectada. Clasificando como HOT LEAD.`, 'success');
        await sleep(800);
        addLog(`📆 [Agente IA] Proponiendo fechas en el calendario para videollamada...`, 'thinking');
        await sleep(1000);
        addLog(`📧 [Sistema] Email de follow-up (agenda) enviado a ${lead.email}`, 'success');
      } else {
        addLog(`❌ [Agente IA] Intención Negativa/Descarte.`, 'error');
        await sleep(800);
        addLog(`📧 [Sistema] Email de despedida educada / envío a nurture campaign.`, 'info');
      }
      
      await sleep(1000);
    }

    addLog(`───────────────────────────────────────`, 'divider');
    addLog(`🏁 CAMPAÑA FINALIZADA CON ÉXITO`, 'system');
    setIsRunning(false);
    toast.success("Campaña completada");
  };

  const stopCampaign = () => {
    setIsRunning(false);
    addLog(`🛑 Campaña detenida por el usuario.`, 'error');
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1A3A5C, #0D1B2A)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C' }}>
              <Bot size={22} />
            </div>
            <h2 style={{ margin: 0 }}>Agente Comercial IA (Outbound)</h2>
          </div>
          <p>Automatiza la prospección, envío de correos y negociación inicial con IA generativa.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.2fr', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <div className="card" style={{ padding: '1.5rem', opacity: isRunning ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#C9A84C" /> Configuración de Campaña
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              Listado de Contactos (CSV)
            </label>
            <p style={{ fontSize: '0.75rem', color: '#8A9BB0', marginBottom: '0.5rem' }}>Formato: Nombre, Email, Teléfono (uno por línea)</p>
            <textarea 
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontFamily: 'monospace' }}
              value={leadsInput}
              onChange={e => setLeadsInput(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 
              Producto / Pitch de Ventas
            </label>
            <textarea 
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', lineHeight: 1.5 }}
              value={pitch}
              onChange={e => setPitch(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8A9BB0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tono del Agente
            </label>
            <select 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}
              value={tone}
              onChange={e => setTone(e.target.value)}
              disabled={isRunning}
            >
              <option>Consultivo y Elegante</option>
              <option>Agresivo / Orientado a Cierre</option>
              <option>Amigable y Cercano</option>
              <option>Técnico / Inversor</option>
            </select>
          </div>

          {!isRunning ? (
            <button 
              onClick={startCampaign}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', fontSize: '0.95rem' }}
            >
              <Play size={18} fill="currentColor" /> Iniciar Campaña IA
            </button>
          ) : (
            <button 
              onClick={stopCampaign}
              className="btn" 
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', fontSize: '0.95rem', background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <Pause size={18} fill="currentColor" /> Detener Campaña
            </button>
          )}
        </div>

        {/* PANEL DERECHO: CONSOLA DE EJECUCIÓN */}
        <div className="card" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', padding: '0' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Send size={16} color="#38BDF8" /> Live Output Console
            </h3>
            {progress.total > 0 && (
              <div style={{ fontSize: '0.8rem', background: '#1E293B', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                Lead {progress.current} / {progress.total}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {logs.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Bot size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>El agente comercial está en reposo.</p>
                <p>Configura la campaña y pulsa Iniciar.</p>
              </div>
            ) : (
              logs.map(log => {
                let color = '#94A3B8'; // default
                let prefix = '';
                let fontWeight = 400;
                let fontStyle = 'normal';
                
                if (log.type === 'system') { color = '#38BDF8'; fontWeight = 700; }
                if (log.type === 'success') { color = '#4ADE80'; }
                if (log.type === 'error') { color = '#F87171'; }
                if (log.type === 'warning') { color = '#FBBF24'; }
                if (log.type === 'thinking') { color = '#A78BFA'; }
                if (log.type === 'quote') { color = '#CBD5E1'; fontStyle = 'italic'; }
                
                if (log.type === 'divider') {
                  return <div key={log.id} style={{ color: '#334155', margin: '0.5rem 0' }}>{log.text}</div>
                }

                return (
                  <div key={log.id} style={{ marginBottom: '0.4rem', color }}>
                    <span style={{ color: '#475569', marginRight: '8px', fontSize: '0.75rem' }}>[{log.time}]</span>
                    <span style={{ fontStyle, fontWeight }}>
                      {log.text}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
