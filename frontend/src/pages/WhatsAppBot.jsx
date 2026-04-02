import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Settings, Phone, CheckCircle2, QrCode, Upload, Shield, Zap, Send } from 'lucide-react';

export default function WhatsAppBot() {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! Nos encanta la Villa en Talamanca. ¿Estará disponible para la primera semana de agosto?', sender: 'client', time: '10:42' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const newMsg = { id: Date.now(), text: input, sender: 'client', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '¡Claro! La Villa Can Rimbau está disponible en esas fechas. Su precio es de 14.000€ la semana. ¿Te gustaría que te envíe el Dossier PDF y las opciones para bloquear las fechas? 🌴',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const handleBotReply = () => {
    if (!isConnected) return;
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: '¡Hola! Soy Sofía, la asistente virtual de Ibiza Luxury Dreams. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 450px', gap: '2rem', height: 'calc(100vh - 140px)' }}>
      {/* Columna Izquierda: Configuración */}
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
                  WhatsApp Business API
                  {isConnected && <CheckCircle2 size={16} color="#22C55E" />}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  {isConnected ? 'API conectada correctamente (+34 600 000 000)' : 'Escanea el código QR para vincular tu número de empresa'}
                </p>
              </div>
            </div>
            {!isConnected && (
              <button 
                className="btn" 
                onClick={handleConnect} 
                disabled={connecting}
                style={{ background: '#25D366', color: 'white', borderColor: '#25D366' }}
              >
                {connecting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <QrCode size={16} />}
                {connecting ? 'Conectando...' : 'Vincular Meta API'}
              </button>
            )}
            {isConnected && (
              <button className="btn btn-outline" onClick={() => setIsConnected(false)} style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* Bloque de Ajustes del Bot */}
        <div className="card" style={{ opacity: isConnected ? 1 : 0.6, pointerEvents: isConnected ? 'auto' : 'none', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <Settings size={20} color="#1A3A5C" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A' }}>Ajustes del Asistente (Sofía IA)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Prompt Principal del Sistema (Comportamiento)</label>
              <textarea 
                className="input" 
                rows="4"
                defaultValue={"Eres Sofía, asistente virtual de Ibiza Luxury Dreams. Tu objetivo es pre-cualificar a los clientes interesados en propiedades de alto standing o alquiler vacacional en Ibiza. Eres amable, concisa y elegante. Usa siempre el tono de 'usted' si el cliente lo usa, o tutea con elegancia si el cliente es joven. Nunca des precios que no están en la web sin preguntar el correo electrónico."}
                style={{ lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Modo de Actuación</label>
                <select className="input">
                  <option>Triaje y Captación de Lead</option>
                  <option>Soporte a Inquilinos (Huéspedes)</option>
                  <option>Cierre de Agendas</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Delegación a Humano</label>
                <select className="input">
                  <option>Si presupuesto &gt; 1 Millón €</option>
                  <option>Si el cliente lo solicita explícitamente</option>
                  <option>Nunca (Bot 100%)</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Zap color="#C9A84C" size={24} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '0.9rem' }}>Automatización Activa: Sincronización al CRM</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
                  Cada vez que Sofía detecte un correo electrónico y un teléfono en la conversación, creará automáticamente un Lead en la pestaña "Clientes" y asignará su nivel térmico de interés.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Columna Derecha: Simulador de WhatsApp */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Mockup iPhone */}
        <div style={{ 
          width: 360, height: 720, background: '#0B141A', borderRadius: 40, border: '12px solid #334155', 
          overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Cámara Notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 25, background: '#334155', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
          
          {/* Header WhatsApp */}
          <div style={{ background: '#202C33', padding: '2.5rem 1rem 0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 12, color: 'white', borderBottom: '1px solid #313D45' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              ILD
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Ibiza Luxury Dreams</div>
              <div style={{ color: '#E9EDEF', fontSize: '0.75rem', opacity: 0.8 }}>Bot Inteligencia Artificial</div>
            </div>
          </div>

          {/* Chat Background */}
          <div style={{ 
            flex: 1, 
            background: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundSize: 'cover',
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ background: '#202C33', color: '#8696A0', alignSelf: 'center', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem' }}>
              Hoy
            </div>

            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} style={{ 
                  background: isBot ? '#202C33' : '#005C4B', 
                  color: '#E9EDEF', 
                  padding: '8px 12px', 
                  borderRadius: 12, 
                  borderTopLeftRadius: isBot ? 0 : 12,
                  borderTopRightRadius: isBot ? 12 : 0,
                  maxWidth: '85%',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{m.text}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 4 }}>{m.time}</div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ background: '#202C33', padding: '8px 12px', borderRadius: 12, borderTopLeftRadius: 0, alignSelf: 'flex-start', color: '#8696A0', fontSize: '0.85rem' }}>
                Sofía IA está escribiendo...
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Chat */}
          <form style={{ background: '#202C33', padding: '0.75rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }} onSubmit={handleSend}>
            <input 
              style={{ flex: 1, background: '#2A3942', border: 'none', borderRadius: 20, padding: '10px 16px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
              placeholder={isConnected ? "Escribe un mensaje de prueba..." : "Debes conectar la API primero"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected || !input.trim()} style={{ background: '#00A884', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: isConnected && input.trim() ? 'pointer' : 'not-allowed', opacity: (isConnected && input.trim()) ? 1 : 0.5 }}>
              <Send size={18} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>

        {isConnected && (
          <button className="btn btn-outline" style={{ marginTop: '1.5rem', background: 'white' }} onClick={handleBotReply}>
             🤖 Simular saludo de Sofía
          </button>
        )}
      </div>
    </div>
  );
}
