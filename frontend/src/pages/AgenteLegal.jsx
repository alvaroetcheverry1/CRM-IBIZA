import { useState, useRef, useEffect } from 'react';
import { 
  Scale, FileSignature, Fingerprint, FileText, Cloud, 
  CheckCircle, Loader2, ArrowRight, User, Home, Download, FileCheck, Search, ShieldCheck, Bot, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const TIPO_CONTRATO = ['Contrato de Arras', 'Compraventa Final', 'Alquiler Vacacional (ETV)', 'Alquiler Larga Duración', 'Mandato de Venta sin Exclusiva'];

export default function AgenteLegal() {
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'); // Agencia Real Estate Placeholder
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedProp, setSelectedProp] = useState('');
  const [propietario, setPropietario] = useState('');
  const [precio, setPrecio] = useState('');
  const [selectedType, setSelectedType] = useState('Contrato de Arras');
  const [clausulaExtra, setClausulaExtra] = useState('');
  
  const [fase, setFase] = useState('IDLE'); // IDLE | DRAFTING | DRAFTED | SIGNING | SECURED
  const [contratoTexto, setContratoTexto] = useState('');
  const [signStatus, setSignStatus] = useState({ cliente: false, propietario: false });
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [contratoTexto]);

  const redactarContrato = async () => {
    if (!selectedLead || !selectedProp) return toast.error('Rellena al menos el Cliente y la Propiedad.');
    
    setFase('DRAFTING');
    setContratoTexto('');
    setSignStatus({ cliente: false, propietario: false });
    
    const propName = propietario || 'IBIZA LUXURY DREAMS S.L. (VENDEDOR/ARRENDADOR)';
    const amount = precio || 'la cantidad estipulada entre ambas partes';

    const baseText = [
      `[MODELO EXCLUSIVO - REVISIÓN LEGAL IA]`,
      `\nCONTRATO PRIVADO DE ${selectedType.toUpperCase()}`,
      `\nEn Eivissa, Islas Baleares, a ${new Date().toLocaleDateString('es-ES')}.`,
      `\nREUNIDOS:`,
      `De una parte, la entidad/particular ${propName}.`,
      `\nY de otra parte, D/Dña. ${selectedLead} (Actuando como CLIENTE).`,
      `\nMANIFIESTAN:`,
      `I. Que la Parte Vendedora/Arrendadora tiene derechos sobre el inmueble: "${selectedProp}".`,
      `II. Que el Cliente formaliza la operación por un importe de ${amount}.`,
      `III. Que ambas partes reconocen gozar de plena capacidad legal para suscribir este acuerdo a través de medios telemáticos (Ley 6/2020 de firma electrónica cruzada).`,
      `\nCLÁUSULAS:`,
      `PRIMERA: El objeto de este contrato recae de forma unívoca y en su estado actual sobre "${selectedProp}".`,
      `SEGUNDA: El pago correspondiente a ${amount} se verificará por las cuentas IBAN designadas al efecto por el Gestor.`,
      `TERCERA: El Cliente declara conocer que la firma de este documento digital será vinculante.`,
      clausulaExtra ? `CUARTA (Ampliación Particular): ${clausulaExtra}` : null,
      `\nFIRMAS DIGITALES:\nEste documento carece de firma húmeda pero garantiza el rastro y consenso por la plataforma CRM.`
    ].filter(Boolean);

    let currentText = '';
    for (const paragraph of baseText) {
      const words = paragraph.split(' ');
      for (const word of words) {
        currentText += word + ' ';
        setContratoTexto(currentText);
        await sleep(Math.random() * 40 + 10); 
      }
      currentText += '\n';
      setContratoTexto(currentText);
      await sleep(350);
    }

    setFase('DRAFTED');
    toast.success('Borrador redactado por NLP inteligente completado.');
  };

  const iniciarFirmaDigital = async () => {
    if (fase !== 'DRAFTED') return;
    setFase('SIGNING');
    
    toast('Enviando peticiones de firma DocuSign a móviles...', { icon: '📲' });
    await sleep(3000);
    
    setSignStatus(prev => ({ ...prev, cliente: true }));
    toast.success(`¡${selectedLead.split(' ')[0]} ha validado el contrato con Firma Biométrica!`);
    await sleep(2500);
    
    setSignStatus(prev => ({ ...prev, propietario: true }));
    toast.success(`¡Gestor de Parquing/Propietario ha ratificado la firma final!`);
    await sleep(1500);

    setFase('SECURED');
    toast.success('Subida automatizada a GDrive [inmoCrm/05_Contratos] completada.', { icon: '☁️' });
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1A3A5C, #0D1B2A)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <Scale size={22} />
            </div>
            <h2 style={{ margin: 0 }}>AI Closer (Gestor Legal y Firmas)</h2>
          </div>
          <p>Un LLM especializado en Derecho Inmobiliario cruzará los datos de la propiedad y el cliente creando borradores legales y lanzando firmas digitales certificadas.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
        
        {/* PARTE 1: CONFIG DE LA OPERACIÓN */}
        <div className="card" style={{ padding: '1.5rem', opacity: (fase==='IDLE' || fase==='DRAFTED') ? 1 : 0.6, transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A3A5C', marginTop: 0 }}>
            <FileText size={18} /> Preparar Deal Manual
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Logo Encabezado (URL)</label>
            <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} placeholder="https://..." value={logoUrl} onChange={e => setLogoUrl(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Cliente (Nombre, DNI...)</label>
            <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} placeholder="Ej. Marc Serra, X-123456" value={selectedLead} onChange={e => setSelectedLead(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Propiedad / Inmueble</label>
            <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} placeholder="Ej. Villa Can Rimbau" value={selectedProp} onChange={e => setSelectedProp(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Propietario</label>
              <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} placeholder="Opcional" value={propietario} onChange={e => setPropietario(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Importe/Precio</label>
              <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} placeholder="Ej. 1.200.000€" value={precio} onChange={e => setPrecio(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Tipo Legal</label>
            <select className="form-select" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={fase !== 'IDLE' && fase !== 'DRAFTED'}>
              {TIPO_CONTRATO.map(ctype => <option key={ctype} value={ctype}>{ctype}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Cláusula Adicional Extendida</label>
            <textarea 
              className="form-input" 
              style={{ fontSize: '0.8rem', minHeight: '60px' }}
              placeholder="Ej. El alquiler incluye..."
              value={clausulaExtra}
              onChange={e => setClausulaExtra(e.target.value)}
              disabled={fase !== 'IDLE' && fase !== 'DRAFTED'}
            />
          </div>

          {fase !== 'DRAFTING' && fase !== 'SIGNING' && (
            <button onClick={redactarContrato} className="btn btn-primary" style={{ width: '100%', background: '#1A3A5C', borderColor: '#1A3A5C' }}>
              <Bot size={16} /> Redactar Contrato IA
            </button>
          )}

          {fase === 'DRAFTING' && (
            <button disabled className="btn btn-primary" style={{ width: '100%', background: '#1A3A5C', borderColor: '#1A3A5C' }}>
              <Loader2 size={16} className="spin" /> IA Redactando Texto...
            </button>
          )}
        </div>

        {/* PARTE 2: VISOR IA EDITOR (Smart Docs) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC', padding: 0, height: '600px', border: '1px solid #E2E8F0' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
               <FileSignature size={16} color="#3B82F6"/> Vista Doc (Autocompletado RAG)
            </div>
            {fase === 'SECURED' && <span style={{ fontSize: '0.7rem', color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Inmutable</span>}
          </div>
          
          <div 
            style={{ 
              flex: 1, padding: '2.5rem', background: '#FFFFFF', margin: '0 1.5rem 1.5rem', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowY: 'auto',
              border: '1px solid #F1F5F9', position: 'relative'
            }}
          >
            {fase === 'IDLE' ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, flexDirection: 'column' }}>
                <Scale size={48} />
                <p style={{ marginTop: '1rem', fontFamily: 'sans-serif' }}>Esperando Datos y Redacción IA</p>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '100%' }}>
                {logoUrl && (
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={logoUrl} alt="Agencia Logo" style={{ maxHeight: '70px', maxWidth: '300px', objectFit: 'contain' }} />
                  </div>
                )}
                
                {fase === 'DRAFTED' ? (
                  <textarea 
                    value={contratoTexto}
                    onChange={e => setContratoTexto(e.target.value)}
                    style={{
                      width: '100%', height: 'calc(100% - 100px)', border: 0, outline: 'none', resize: 'none',
                      fontFamily: '"Times New Roman", Times, serif', fontSize: '1.05rem', lineHeight: 1.6,
                      color: '#334155', background: 'transparent'
                    }}
                  />
                ) : (
                  <div style={{
                    fontFamily: '"Times New Roman", Times, serif', fontSize: '1.05rem', lineHeight: 1.6,
                    color: '#334155', whiteSpace: 'pre-wrap'
                  }}>{contratoTexto}</div>
                )}
              </div>
            )}
            
            {/* Editor Highlight Focus Helper */}
            {fase === 'DRAFTED' && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
                <Edit3 size={10} /> Editable Manualmente
              </div>
            )}
          </div>
        </div>

        {/* PARTE 3: PIPELINE DE FIRMA (Digital Signing Flow) */}
        <div className="card" style={{ padding: '1.5rem', background: '#1E293B', color: 'white' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
            <Fingerprint size={18} color="#60A5FA" /> Pipeline Digital Sign
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, bottom: 20, left: 15, width: 2, background: '#334155', zIndex: 0 }}></div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1, opacity: (fase!=='IDLE' ? 1 : 0.4) }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: (fase==='DRAFTED'||fase==='SIGNING'||fase==='SECURED') ? '#3B82F6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Borrador IA Compilado</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Contrato generado sin errores humanos.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1, opacity: (fase==='SIGNING'||fase==='SECURED' ? 1 : 0.4) }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: signStatus.cliente ? '#10B981' : (fase==='SIGNING' ? '#F59E0B' : '#334155'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Firma Cliente Comprador/Inquilino</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{signStatus.cliente ? 'Trazabilidad e ID verificados.' : 'Esperando traza biométrica móvil.'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1, opacity: (fase==='SIGNING'||fase==='SECURED' ? 1 : 0.4) }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: signStatus.propietario ? '#10B981' : (signStatus.cliente ? '#F59E0B' : '#334155'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Firma Propietario / Agencia</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{signStatus.propietario ? 'Apertura de plica y cierre autorizado.' : 'En cola de lectura interna de agencia.'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1, opacity: (fase==='SECURED' ? 1 : 0.4) }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: fase==='SECURED' ? '#8B5CF6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cloud size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sincronización Cloud</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Google Drive \u003E 05_Contratos (Inmutable)</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
            {fase === 'DRAFTED' && (
              <button onClick={iniciarFirmaDigital} className="btn" style={{ width: '100%', background: '#3B82F6', color: 'white', borderColor: '#3B82F6', display: 'flex', justifyContent: 'center' }}>
                <Fingerprint size={16}/> Enviar a App de Firma Múltiple
              </button>
            )}
            {fase === 'SIGNING' && (
              <button disabled className="btn" style={{ width: '100%', background: '#F59E0B', color: 'white', borderColor: '#F59E0B', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={16} className="spin" /> Monitorizando Intervinientes...
              </button>
            )}
            {fase === 'SECURED' && (
              <button onClick={() => window.open('#', '_blank')} className="btn" style={{ width: '100%', background: '#10B981', color: 'white', borderColor: '#10B981', display: 'flex', justifyContent: 'center' }}>
                <ShieldCheck size={16}/> Ver PDF Cifrado de Cierre
              </button>
            )}
            {(fase === 'IDLE' || fase === 'DRAFTING') && (
              <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
                El pipeline de cierre operará cuando haya un documento base formulado.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
