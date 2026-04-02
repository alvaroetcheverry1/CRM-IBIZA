import { useState, useRef, useEffect } from 'react';
import { 
  CalendarClock, UserPlus, StopCircle, PlayCircle, Bot,
  MessageSquare, CheckCircle, MapPin, Users, CalendarCheck, 
  Settings, ArrowRight, Clock, User, Edit3, X, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const DEMO_PROPERTIES = ['Villa Can Rimbau', 'Ático Marina Botafoch', 'Finca San Lorenzo', 'Villa Talamanca Sunset'];
const DEMO_LEADS = ['Carlos Ruiz', 'Laura Martínez', 'David Gómez', 'Elena Fernández', 'Marc Serra'];
const TIMES = ['10:00 AM', '11:45 AM', '13:00 PM', '16:30 PM', '18:00 PM'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function AgenteSetter() {
  const [agentes, setAgentes] = useState([
    { id: 1, nombre: 'Javier Costa', zona: 'Ibiza Sur / Centro', estado: 'Disponible' },
    { id: 2, nombre: 'Marta Ribas', zona: 'Santa Eulària / Norte', estado: 'Disponible' }
  ]);
  const [citas, setCitas] = useState([
    { id: 'c1', cliente: 'Sofía Vidal', comercial: 'Javier Costa', propiedad: 'Villa Cala Conta', fecha: '28 de Marzo', hora: '10:30 AM' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const [nuevoAgente, setNuevoAgente] = useState({ nombre: '', zona: '' });
  const [syncStatus, setSyncStatus] = useState({ 1: true });
  const [editingCita, setEditingCita] = useState(null);
  const [editForm, setEditForm] = useState({ fecha: '', hora: '' });
  const logsEndRef = useRef(null);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleAddAgente = (e) => {
    e.preventDefault();
    if (!nuevoAgente.nombre || !nuevoAgente.zona) return toast.error('Rellena nombre y zona');
    setAgentes([...agentes, { id: Date.now(), nombre: nuevoAgente.nombre, zona: nuevoAgente.zona, estado: 'Disponible' }]);
    setNuevoAgente({ nombre: '', zona: '' });
    toast.success('Agente añadido al Roster');
  };

  const deleteAgente = (id) => {
    setAgentes(agentes.filter(a => a.id !== id));
  };

  const getGCalLink = (cita) => {
    const text = encodeURIComponent(`Visita: ${cita.propiedad} - ${cita.cliente}`);
    const details = encodeURIComponent(`Liderada por: ${cita.comercial}\nAgendada Automáticamente por CRM Setter IA.`);
    // Simple format para rellenar campos en GCal al abrir el link
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
  };

  const handleSaveReschedule = () => {
    if (!editForm.fecha || !editForm.hora) return toast.error('Introduce fecha y hora');
    setCitas(citas.map(c => c.id === editingCita.id ? { ...c, fecha: editForm.fecha, hora: editForm.hora } : c));
    toast.success('Cita reprogramada y sincronizada en GCalendar');
    
    // Simular que el agente IA notifica por WhatsApp el cambio
    addLog(`───────────────────────────────────────`, 'divider');
    addLog(`🔄 [Sincronización Agenda] Cambio manual detectado en cita de ${editingCita.cliente}`, 'warning');
    addLog(`📱 [WhatsApp IA] Hola ${editingCita.cliente.split(' ')[0]}, el comercial se ha retrasado un pelín. Hemos pospuesto nuestra visita para ${editingCita.propiedad} al ${editForm.fecha} a las ${editForm.hora}. Nos vemos allí!`, 'quote');
    
    setEditingCita(null);
  };

  const startSetter = async () => {
    if (agentes.length === 0) return toast.error('Añade al menos un comercial al equipo primero');
    setIsRunning(true);
    setLogs([]);

    addLog(`🚀 INICIANDO AGENTE SETTER (SCHEDULER IA)`, 'system');
    addLog(`👥 Comerciales físicos disponibles para hoy: ${agentes.length}`, 'info');
    await sleep(2000);

    for (let i = 0; i < 3; i++) {
      if (!isRunning) break;
      const lead = DEMO_LEADS[Math.floor(Math.random() * DEMO_LEADS.length)];
      const propiedad = DEMO_PROPERTIES[Math.floor(Math.random() * DEMO_PROPERTIES.length)];
      const agente = agentes[Math.floor(Math.random() * agentes.length)];
      const hora = TIMES[Math.floor(Math.random() * TIMES.length)];
      const dia = DAYS[Math.floor(Math.random() * DAYS.length)];

      addLog(`───────────────────────────────────────`, 'divider');
      addLog(`🔍 [Pipeline] Lead seleccionado: ${lead} (Interesado en ${propiedad})`, 'info');
      await sleep(1500);

      addLog(`📱 [WhatsApp IA] Hola ${lead.split(' ')[0]}, vi que te interesó ${propiedad}. ¿Te gustaría visitarla?`, 'quote');
      await sleep(2000);
      addLog(`💬 [Cliente] Sí, me encantaría verla. ¿Tienen hueco esta semana?`, 'quoteUser');
      await sleep(1500);

      addLog(`🤖 [LLM] Reconociendo intención de visita. Buscando huecos en calendario de equipo...`, 'thinking');
      await sleep(2000);

      addLog(`📱 [WhatsApp IA] Genial. Teniendo en cuenta la zona, nuestro experto ${agente.nombre} puede enseñártela el ${dia} a las ${hora}. ¿Te encaja?`, 'quote');
      await sleep(2500);

      const isSuccess = Math.random() > 0.2; // Alta probabilidad de cierre para la demo
      if (isSuccess) {
        addLog(`💬 [Cliente] Perfecto, nos vemos el ${dia} a las ${hora}.`, 'quoteUser');
        await sleep(1500);
        
        addLog(`✅ [Sistema] Cita Confirmada. Sincronizando en Calendar de ${agente.nombre}...`, 'success');
        
        // Registrar la cita dinámicamente
        setCitas(prev => [...prev, {
          id: `cita-${Date.now()}-${i}`,
          cliente: lead,
          comercial: agente.nombre,
          propiedad: propiedad,
          fecha: dia,
          hora: hora
        }]);
        toast.success(`Cita agendada para ${agente.nombre}`);
      } else {
        addLog(`💬 [Cliente] Uf, esa hora me va mal. Mejor lo dejamos para la semana que viene.`, 'quoteUser');
        await sleep(1000);
        addLog(`⚠️ [Sistema] Lead requiere reprogramación / Follow up en 7 días.`, 'warning');
      }
      
      await sleep(2000);
    }

    addLog(`───────────────────────────────────────`, 'divider');
    addLog(`🏁 CICLO SETTER FINALIZADO AUTOMÁTICAMENTE`, 'system');
    setIsRunning(false);
  };

  const stopSetter = () => {
    setIsRunning(false);
    addLog(`🛑 Ejecución manual detenida.`, 'error');
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1A3A5C, #0D1B2A)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <CalendarClock size={22} />
            </div>
            <h2 style={{ margin: 0 }}>Agente Setter (Agendador de Citas)</h2>
          </div>
          <p>La IA chatea con los leads entrantes y les agenda visitas automáticamente cuadrando los huecos de tus comerciales.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: GESTOR DE EQUIPO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Panel Roster */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A3A5C' }}>
              <Users size={18} /> Equipo Comercial Físico
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {agentes.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>No hay comerciales en el equipo. Añade al menos uno para iniciar.</div>
              ) : (
                agentes.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 600 }}>{a.nombre[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>{a.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}><MapPin size={10} /> {a.zona}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {syncStatus[a.id] ? (
                         <span style={{ fontSize: '0.65rem', color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }} title="Sincronizado vía OAuth">
                           <CheckCircle size={10} /> GCal Conectado
                         </span>
                      ) : (
                         <button onClick={() => {toast.success('Calendario emparejado automaíticamente (Demo)'); setSyncStatus({...syncStatus, [a.id]: true})}} style={{ fontSize: '0.65rem', color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                           <Calendar size={10}/> Conectar GCal
                         </button>
                      )}
                      <button onClick={() => deleteAgente(a.id)} className="btn-icon btn-ghost" style={{ color: '#EF4444' }} title="Eliminar Asignación">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddAgente} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: '#475569' }}>Añadir Comercial</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input required className="form-input" placeholder="Nombre (ej. Lucía Fernández)" value={nuevoAgente.nombre} onChange={e => setNuevoAgente({...nuevoAgente, nombre: e.target.value})} disabled={isRunning} />
                <input required className="form-input" placeholder="Zona (ej. Toda la isla)" value={nuevoAgente.zona} onChange={e => setNuevoAgente({...nuevoAgente, zona: e.target.value})} disabled={isRunning} />
                <button type="submit" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }} disabled={isRunning}><UserPlus size={14}/> Añadir Agente</button>
              </div>
            </form>
          </div>

          {/* Botón de Control Módulo */}
          <div className="card" style={{ padding: '1.5rem' }}>
            {!isRunning ? (
              <button onClick={startSetter} className="btn btn-primary" style={{ width: '100%', padding: '1rem', background: '#8B5CF6', borderColor: '#8B5CF6' }}>
                <PlayCircle size={18} fill="currentColor" /> Iniciar Setter Automático
              </button>
            ) : (
              <button onClick={stopSetter} className="btn" style={{ width: '100%', padding: '1rem', background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}>
                <StopCircle size={18} fill="currentColor" /> Detener Agendador
              </button>
            )}
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
              Al iniciar, el Setter IA intentará contactar con los Leads para agendarles. Consumirá el calendario del equipo superior.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: CONSOLA Y CITAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Consola en vivo */}
          <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', padding: '0' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'uppercase', color: '#94A3B8' }}>
                <MessageSquare size={14} color="#8B5CF6" /> Setter Terminal Log
              </h3>
              {isRunning && <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'transparent', borderColor: '#8B5CF6' }}/>}
            </div>
            
            <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {logs.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <CalendarClock size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Setter inactivo. En espera de instrucciones.</p>
                </div>
              ) : (
                logs.map(log => {
                  let color = '#94A3B8';
                  let fontWeight = 400;
                  
                  if (log.type === 'system') { color = '#C4B5FD'; fontWeight = 700; }
                  if (log.type === 'success') { color = '#4ADE80'; }
                  if (log.type === 'error') { color = '#F87171'; }
                  if (log.type === 'warning') { color = '#FBBF24'; }
                  if (log.type === 'thinking') { color = '#A78BFA'; }
                  if (log.type === 'quote') { color = '#E2E8F0'; fontWeight = 600; } 
                  if (log.type === 'quoteUser') { color = '#D1D5DB'; fontStyle = 'italic'; }
                  
                  if (log.type === 'divider') {
                    return <div key={log.id} style={{ color: '#334155', margin: '0.25rem 0' }}>{log.text}</div>
                  }
                  return (
                    <div key={log.id} style={{ marginBottom: '0.2rem', color, fontWeight, paddingLeft: (log.type==='quote'||log.type==='quoteUser')?12:0, borderLeft: (log.type==='quote')?'2px solid #8B5CF6':(log.type==='quoteUser'?'2px solid #CBD5E1':'none') }}>
                      <span style={{ color: '#475569', marginRight: '8px', fontSize: '0.7rem' }}>[{log.time}]</span>
                      {log.text}
                    </div>
                  )
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Agenda de Próximas Citas */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A3A5C' }}>
              <CalendarCheck size={20} /> Agenda Citas Programadas
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {citas.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center', padding: '2rem 0' }}>Aún no hay citas agendadas por la IA</div>
              ) : (
                citas.map(cita => (
                  <div key={cita.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ width: 44, height: 44, background: '#EFF6FF', color: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{cita.cliente}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B5CF6', background: '#EDE9FE', padding: '2px 8px', borderRadius: 12 }}>
                          {cita.fecha} · {cita.hora}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {cita.comercial} (Agente)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {cita.propiedad}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                        <a href={getGCalLink(cita)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6, borderColor: '#E2E8F0', color: '#475569' }}>
                          <Calendar size={12} /> Añadir a GCalendar
                        </a>
                        <button onClick={() => { setEditingCita(cita); setEditForm({ fecha: cita.fecha, hora: cita.hora }); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
                          <Edit3 size={12} /> Reprogramar Cita
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
      {/* MODAL REPROGRAMAR CITA */}
      {editingCita && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 12, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1A3A5C', fontSize: '1.1rem' }}>
                <Edit3 size={18} /> Reprogramar Calendario
              </h3>
              <button onClick={() => setEditingCita(null)} className="btn-icon btn-ghost"><X size={18} /></button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Modificar la fecha de la visita de <strong>{editingCita.cliente}</strong> para <strong>{editingCita.propiedad}</strong> obligará a la IA a notificar al cliente del cambio horario por WhatsApp.
            </p>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nueva Fecha</label>
              <input type="text" placeholder="Ej. Jueves 12, Mañana, 25 Nov" className="form-input" value={editForm.fecha} onChange={e => setEditForm({...editForm, fecha: e.target.value})} />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nueva Hora</label>
              <input type="text" placeholder="Ej. 18:00 PM" className="form-input" value={editForm.hora} onChange={e => setEditForm({...editForm, hora: e.target.value})} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setEditingCita(null)}>Descartar</button>
              <button className="btn btn-primary" onClick={handleSaveReschedule} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10B981', borderColor: '#10B981' }}>
                <Clock size={16}/> Guardar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
