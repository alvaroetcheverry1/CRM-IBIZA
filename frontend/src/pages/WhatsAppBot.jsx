import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Settings, CheckCircle2, QrCode, Send, Search, User, Clock, Phone } from 'lucide-react';
import { whatsappApi, clientesApi } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function WhatsAppBot() {
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState('');
  
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  // 1. Cargar lista de clientes
  const { data: clientesData } = useQuery({
    queryKey: ['clientes', 'whatsapp'],
    queryFn: () => clientesApi.list({ limit: 50 }),
  });
  const clientes = clientesData?.data || [];
  
  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (c.apellidos && c.apellidos.toLowerCase().includes(search.toLowerCase())) ||
    (c.telefono && c.telefono.includes(search))
  );

  // 2. Cargar historial del cliente seleccionado
  const { data: historial, isLoading: loadingHistorial } = useQuery({
    queryKey: ['whatsapp-historial', selectedCliente?.id],
    queryFn: () => whatsappApi.getHistorial(selectedCliente.id),
    enabled: !!selectedCliente?.id,
    refetchInterval: 10000, // Refrescar mensajes cada 10s
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historial, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedCliente) return;

    const texto = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      await whatsappApi.enviarMensajeReal(selectedCliente.id, texto);
      // Recargar historial para ver el mensaje enviado
      queryClient.invalidateQueries(['whatsapp-historial', selectedCliente.id]);
    } catch {
      toast.error('Error al enviar el mensaje de WhatsApp. Comprueba que el número sea válido y esté en formato internacional.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', height: 'calc(100vh - 140px)' }}>
      {/* Columna Izquierda: Lista de Chats */}
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', color: '#0F172A' }}>
            <MessageCircle size={20} color="#25D366" /> WhatsApp CRM
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input 
              className="form-input" 
              placeholder="Buscar cliente o número..." 
              style={{ paddingLeft: 36, width: '100%', fontSize: '0.85rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filteredClientes.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCliente(c)}
              style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #F1F5F9', 
                cursor: 'pointer',
                background: selectedCliente?.id === c.id ? '#EFF6FF' : 'white',
                borderLeft: selectedCliente?.id === c.id ? '3px solid #3B82F6' : '3px solid transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>{c.nombre} {c.apellidos}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{c.estado}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={12} /> {c.telefono || 'Sin teléfono'}
              </div>
            </div>
          ))}
          {filteredClientes.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
              No se encontraron clientes.
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Chat Activo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '100%', maxWidth: 700, height: '100%', background: '#E5DDD5', borderRadius: 16, border: '1px solid #CBD5E1',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Cabecera del chat */}
          {selectedCliente ? (
            <>
              <div style={{ background: '#F0F2F5', padding: '1rem', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #D1D5DB' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <User size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#111B21' }}>{selectedCliente.nombre} {selectedCliente.apellidos}</div>
                  <div style={{ color: '#667781', fontSize: '0.8rem' }}>{selectedCliente.telefono || 'Sin teléfono configurado'}</div>
                </div>
              </div>

              {/* Área de mensajes */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                
                {loadingHistorial ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ borderColor: '#25D366', borderTopColor: 'transparent', width: 24, height: 24 }} /></div>
                ) : historial?.length === 0 ? (
                  <div style={{ background: '#FFF3C4', color: '#667781', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.85rem', alignSelf: 'center', textAlign: 'center', maxWidth: '80%' }}>
                    No hay mensajes previos. Envía el primer mensaje para abrir la conversación.
                  </div>
                ) : (
                  historial?.map((m) => {
                    const isBot = m.direccion === 'SALIENTE';
                    return (
                      <div key={m.id} style={{
                        background: isBot ? '#D9FDD3' : '#FFFFFF',
                        color: '#111B21', padding: '8px 12px', borderRadius: 8,
                        borderTopLeftRadius: isBot ? 8 : 0, borderTopRightRadius: isBot ? 0 : 8,
                        maxWidth: '75%', alignSelf: isBot ? 'flex-end' : 'flex-start',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                      }}>
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{m.contenido}</div>
                        <div style={{ fontSize: '0.65rem', color: '#667781', textAlign: 'right', marginTop: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isBot && m.estado && <CheckCircle2 size={12} color={m.estado === 'ENVIADO' ? '#53BDEB' : '#8696A0'} />}
                        </div>
                      </div>
                    );
                  })
                )}

                {isTyping && (
                  <div style={{ background: '#D9FDD3', padding: '8px 14px', borderRadius: 8, borderTopRightRadius: 0, alignSelf: 'flex-end', color: '#8696A0', fontSize: '0.82rem' }}>
                    Enviando<span style={{ animation: 'pulse 1s infinite' }}>...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form style={{ background: '#F0F2F5', padding: '1rem', display: 'flex', gap: 10, alignItems: 'center' }} onSubmit={handleSend}>
                <input
                  style={{ flex: 1, background: 'white', border: 'none', borderRadius: 24, padding: '12px 20px', color: '#111B21', fontSize: '0.95rem', outline: 'none', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}
                  placeholder="Escribe un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" disabled={!input.trim()} style={{ background: '#00A884', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, flexShrink: 0 }}>
                  <Send size={18} style={{ marginLeft: 2 }} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, background: '#F0F2F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8696A0', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={40} color="#94A3B8" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#41525D', fontSize: '1.25rem' }}>WhatsApp CRM Ibiza</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 400 }}>Selecciona un cliente de la lista de la izquierda para ver su historial y enviarle mensajes directamente desde aquí.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
