import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Settings, CheckCircle2, QrCode, Zap, Send, UserPlus, X } from 'lucide-react';
import { whatsappApi } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function WhatsAppBot() {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! Nos encanta la Villa en Talamanca. ¿Estará disponible para la primera semana de agosto?', sender: 'client', time: '10:42' }
  ]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: leadsRecientes = [] } = useQuery({
    queryKey: ['whatsapp-leads'],
    queryFn: whatsappApi.getLeadsRecientes,
    enabled: isConnected,
    refetchInterval: 15000,
  });

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setIsConnected(true);
      toast.success('🟢 Sofía IA conectada al CRM');
    }, 2000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const texto = input.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now(), text: texto, sender: 'client', time: now };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    const newHistory = [...conversationHistory, { role: 'user', content: texto }];
    setConversationHistory(newHistory);

    try {
      const data = await whatsappApi.sendMessage({ message: texto, conversationHistory: newHistory });

      const botMsg = {
        id: Date.now() + 1,
        text: data.respuesta,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
      setConversationHistory(h => [...h, { role: 'assistant', content: data.respuesta }]);

      // Auto-crear lead si detectó email o teléfono
      if (data.tieneContacto && data.datosDetectados) {
        const { email, telefono } = data.datosDetectados;
        try {
          const leadResult = await whatsappApi.guardarLead({
            email,
            telefono,
            mensaje: texto,
            nombre: 'Lead WhatsApp',
          });
          if (leadResult.nuevo) {
            toast.success('🎯 Nuevo lead creado automáticamente desde WhatsApp');
            queryClient.invalidateQueries(['whatsapp-leads']);
          }
        } catch { /* silencioso */ }
      }
    } catch {
      // Fallback si el backend no está disponible
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '¡Entendido! Déjeme verificar esa información con nuestro equipo. ¿Podría facilitarme su correo electrónico para enviarle los detalles? 🌴',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 420px', gap: '2rem', height: 'calc(100vh - 140px)' }}>
      {/* Columna Izquierda: Configuración + Leads */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>

        {/* Estado de Conexión */}
        <div className="card" style={{ background: isConnected ? '#F0FDF4' : '#FFFFFF', borderColor: isConnected ? '#BBF7D0' : '#E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: isConnected ? '#22C55E' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Sofía IA — WhatsApp Bot
                  {isConnected && <CheckCircle2 size={16} color="#22C55E" />}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  {isConnected ? 'IA conectada con contexto de propiedades en tiempo real' : 'Activa Sofía para responder consultas automáticamente'}
                </p>
              </div>
            </div>
            {!isConnected ? (
              <button className="btn" onClick={handleConnect} disabled={connecting} style={{ background: '#25D366', color: 'white', borderColor: '#25D366' }}>
                {connecting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <QrCode size={16} />}
                {connecting ? 'Conectando...' : 'Activar Sofía'}
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsConnected(false)} style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* Ajustes del Bot */}
        <div className="card" style={{ opacity: isConnected ? 1 : 0.6, pointerEvents: isConnected ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <Settings size={20} color="#1A3A5C" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A' }}>Personalidad de Sofía IA</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Prompt de Sistema</label>
              <textarea
                className="input" rows="3"
                defaultValue={"Eres Sofía, asistente de Ibiza Luxury Dreams. Pre-cualifica clientes de lujo con elegancia. Usa el tono apropiado según el cliente. Nunca des precios sin pedir el email."}
                style={{ lineHeight: 1.5, fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Modo de actuación</label>
                <select className="input" style={{ fontSize: '0.85rem' }}>
                  <option>Triaje y Captación de Lead</option>
                  <option>Soporte a Huéspedes</option>
                  <option>Cierre de Agendas</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Delegar a humano</label>
                <select className="input" style={{ fontSize: '0.85rem' }}>
                  <option>Si presupuesto &gt; 1M €</option>
                  <option>Si cliente lo solicita</option>
                  <option>Nunca (Bot 100%)</option>
                </select>
              </div>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '0.9rem', border: '1px solid #E2E8F0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Zap color="#C9A84C" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '0.88rem' }}>Auto-Lead: Activo 🟢</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                  Cuando Sofía detecta email o teléfono en la conversación, crea el lead automáticamente en la sección «Clientes».
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Leads Capturados */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <UserPlus size={18} color="#1A3A5C" /> Leads Capturados por WhatsApp
            </h3>
            <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{leadsRecientes.length}</span>
          </div>
          {leadsRecientes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leadsRecientes.slice(0, 5).map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                    {l.nombre?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nombre}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{l.email || l.telefono || 'Sin datos'}</div>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>NUEVO</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
              <MessageCircle size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Cuando un cliente comparta su email en el chat, aparecerá aquí automáticamente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Simulador WhatsApp */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 360, height: 720, background: '#0B141A', borderRadius: 40, border: '12px solid #334155',
          overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 25, background: '#334155', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
          <div style={{ background: '#202C33', padding: '2.5rem 1rem 0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 12, color: 'white', borderBottom: '1px solid #313D45' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
              ILD
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Ibiza Luxury Dreams</div>
              <div style={{ color: isConnected ? '#22C55E' : '#8696A0', fontSize: '0.72rem' }}>{isConnected ? '● Sofía IA activa' : 'Desconectado'}</div>
            </div>
          </div>

          <div style={{ flex: 1, background: '#0B141A', backgroundImage: 'radial-gradient(circle at 1px 1px, #1A2730 1px, transparent 0)', backgroundSize: '20px 20px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#202C33', color: '#8696A0', alignSelf: 'center', padding: '4px 12px', borderRadius: 12, fontSize: '0.72rem' }}>Hoy</div>
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} style={{
                  background: isBot ? '#202C33' : '#005C4B',
                  color: '#E9EDEF', padding: '8px 12px', borderRadius: 12,
                  borderTopLeftRadius: isBot ? 0 : 12, borderTopRightRadius: isBot ? 12 : 0,
                  maxWidth: '85%', alignSelf: isBot ? 'flex-start' : 'flex-end',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                }}>
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>{m.text}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: 4 }}>{m.time}</div>
                </div>
              );
            })}
            {isTyping && (
              <div style={{ background: '#202C33', padding: '8px 14px', borderRadius: 12, borderTopLeftRadius: 0, alignSelf: 'flex-start', color: '#8696A0', fontSize: '0.82rem' }}>
                Sofía está escribiendo<span style={{ animation: 'pulse 1s infinite' }}>...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form style={{ background: '#202C33', padding: '0.75rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }} onSubmit={handleSend}>
            <input
              style={{ flex: 1, background: '#2A3942', border: 'none', borderRadius: 20, padding: '10px 16px', color: 'white', fontSize: '0.92rem', outline: 'none' }}
              placeholder={isConnected ? 'Simula un mensaje de cliente...' : 'Activa Sofía primero'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected || !input.trim()} style={{ background: '#00A884', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: isConnected && input.trim() ? 'pointer' : 'not-allowed', opacity: (isConnected && input.trim()) ? 1 : 0.4 }}>
              <Send size={17} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
