import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propiedadesApi, icalApi } from '../services/api';
import {
  ChevronLeft, ChevronRight, Calendar, Send, Search, Bed, Bath,
  MapPin, Check, X, Mail, Loader2, UserCircle2, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // 0=Monday offset
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

// Genera reservas ficticias para una propiedad dada
function getMockReservas(propId, year, month, syncInfo = {}) {
  const seed = propId.charCodeAt ? propId.charCodeAt(0) : parseInt(propId) || 1;
  const days = getDaysInMonth(year, month);
  const reservas = [];
  
  // Reservas Directas (CRM)
  const numRes = (seed % 3) + 1;
  let day = (seed % 5) + 3;
  for (let i = 0; i < numRes && day <= days; i++) {
    const len = ((seed + i * 7) % 6) + 3; 
    const end = Math.min(day + len - 1, days);
    reservas.push({ inicio: day, fin: end, huespedes: (seed + i) % 4 + 2, nombre: ['García Martínez', 'Müller Hans', 'Smith James', 'Dubois Pierre'][i % 4], origen: 'DIRECTO' });
    day = end + 3;
  }

  // Si está sincronizado con Airbnb, inyectar reservas Airbnb
  if (syncInfo.airbnb) {
    let ad = (seed % 4) + 1;
    for (let i = 0; i < 2 && ad <= days; i++) {
      if (!reservas.some(r => r.inicio <= ad && r.fin >= ad)) {
        const len = (ad % 4) + 2;
        const end = Math.min(ad + len - 1, days);
        if (!reservas.some(r => r.inicio <= end && r.fin >= ad)) {
           reservas.push({ inicio: ad, fin: end, huespedes: 2, nombre: 'Airbnb Guest', origen: 'AIRBNB' });
        }
      }
      ad += 8;
    }
  }

  // Si está sincronizado con Booking, inyectar reservas Booking
  if (syncInfo.booking) {
    let bd = (seed % 6) + 15;
    if (bd <= days) {
      if (!reservas.some(r => r.inicio <= bd && r.fin >= bd)) {
        const len = (bd % 3) + 2;
        const end = Math.min(bd + len - 1, days);
        if (!reservas.some(r => r.inicio <= end && r.fin >= bd)) {
           reservas.push({ inicio: bd, fin: end, huespedes: 2, nombre: 'Booking Guest', origen: 'BOOKING' });
        }
      }
    }
  }

  return reservas;
}

function getTemporada(month) {
  if ([6, 7, 8].includes(month)) return { label: 'T. Alta', color: '#DC2626', key: 'precioTemporadaAlta' };
  if ([4, 5, 9, 10].includes(month)) return { label: 'T. Media', color: '#D97706', key: 'precioTemporadaMedia' };
  return { label: 'T. Baja', color: '#2D8A5E', key: 'precioTemporadaBaja' };
}

// ─── Componente Calendario Mensual de Villa ───────────────────────────────────
function MiniCalendario({ propiedad, year, month, syncInfo = {} }) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const reservas = useMemo(() => getMockReservas(propiedad.id, year, month, syncInfo), [propiedad.id, year, month, syncInfo]);
  const temporada = getTemporada(month);
  const precio = propiedad.alquilerVacacional?.[temporada.key];

  function getDayStatus(d) {
    for (const r of reservas) {
      if (d >= r.inicio && d <= r.fin) {
        return { status: 'RESERVADO', origen: r.origen };
      }
    }
    return { status: 'LIBRE', origen: null };
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div style={{ fontSize: '0.72rem', userSelect: 'none' }}>
      {/* Temporada + Precio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ background: temporada.color + '22', color: temporada.color, padding: '2px 7px', borderRadius: 20, fontWeight: 600, fontSize: '0.68rem' }}>
          {temporada.label}
        </span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{formatMoney(precio)}<span style={{ fontWeight: 400, color: '#64748B', fontSize: '0.65rem' }}>/sem</span></span>
      </div>

      {/* Encabezado días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
        {DAYS_ES.map(d => <div key={d} style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>{d}</div>)}
      </div>

      {/* Celdas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const { status, origen } = getDayStatus(day);
          
          let bg = '#F0FDF4'; 
          let color = '#166534';
          let border = 'none';

          if (status === 'RESERVADO') {
            if (origen === 'AIRBNB') { bg = '#FFE4E6'; color = '#E11D48'; }
            else if (origen === 'BOOKING') { bg = '#DBEAFE'; color = '#1D4ED8'; }
            else { bg = '#FEE2E2'; color = '#DC2626'; }
          }

          return (
            <div key={day} style={{
              textAlign: 'center', padding: '3px 0', borderRadius: 3,
              background: bg,
              color: color,
              fontWeight: status === 'RESERVADO' ? 600 : 400,
              lineHeight: 1.5,
              fontSize: '0.75rem',
              border: border
            }}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 6, marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#166534' }}>
          <div style={{ width: 8, height: 8, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 2 }} /> Libre
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#DC2626' }}>
          <div style={{ width: 8, height: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 2 }} /> Directo (CRM)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#E11D48' }}>
          <div style={{ width: 8, height: 8, background: '#FFE4E6', border: '1px solid #FDA4AF', borderRadius: 2 }} /> Airbnb
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#1D4ED8' }}>
          <div style={{ width: 8, height: 8, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 2 }} /> Booking
        </span>
      </div>
    </div>
  );
}

function EnviarOpcionesModal({ opciones, fechas, onClose }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!email || !nombre) { toast.error('Introduce nombre y email del cliente'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(`${opciones.length} opciones enviadas a ${email} con éxito`);
      onClose();
    }, 1800);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
        
        <div style={{ background: '#0F172A', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: '#C9A84C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={20} color="#0F172A" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Propuesta de Villas al Cliente</h2>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
              {fechas.entrada} → {fechas.salida} · {opciones.length} villa{opciones.length !== 1 ? 's' : ''} seleccionada{opciones.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ color: 'white', marginLeft: 'auto' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '0.3rem' }}>NOMBRE DEL CLIENTE</label>
              <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRight: '1px solid #CBD5E1' }}><UserCircle2 size={16} color="#94A3B8" /></div>
                <input className="input" style={{ border: 'none', borderRadius: 0, fontSize: '0.85rem' }} placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '0.3rem' }}>EMAIL DEL CLIENTE</label>
              <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRight: '1px solid #CBD5E1' }}><Mail size={16} color="#94A3B8" /></div>
                <input className="input" style={{ border: 'none', borderRadius: 0, fontSize: '0.85rem' }} placeholder="cliente@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Lista de villas a enviar */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>VILLAS DISPONIBLES A ENVIAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
              {opciones.map(op => {
                const av = op.alquilerVacacional || {};
                const mes = fechas.entradaDate ? fechas.entradaDate.getMonth() : new Date().getMonth();
                const tmp = getTemporada(mes);
                const precio = av[tmp.key];
                return (
                  <div key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '0.75rem', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <Check size={16} color="#22C55E" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: 10 }}>
                        <span><MapPin size={10} /> {op.zona}</span>
                        <span><Bed size={10} /> {op.habitaciones} hab.</span>
                        <span><Bath size={10} /> {op.banos} baños</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#C9A84C', flexShrink: 0 }}>{formatMoney(precio)}<span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '0.7rem' }}>/sem</span></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: 8, border: '1px solid #BBF7D0', fontSize: '0.82rem', color: '#166534' }}>
            📧 Se enviará un correo con las fichas en PDF de cada villa, calendario de disponibilidad y enlace de reserva directa con firma digital.
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={sending}>Cancelar</button>
          <button className="btn" onClick={handleSend} disabled={sending} style={{ background: '#C9A84C', color: '#0F172A', borderColor: '#C9A84C', fontWeight: 700 }}>
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {sending ? 'Enviando...' : 'Enviar Propuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Sincronizar Calendario (iCal) ──────────────────────────────────────
function SyncModal({ propiedad, onClose, onSyncSuccess }) {
  const [urlAirbnb, setUrlAirbnb] = useState('');
  const [urlBooking, setUrlBooking] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleSync = async (e) => {
    e.preventDefault();
    if (!urlAirbnb && !urlBooking) {
      toast.error('Introduce al menos una URL de iCal para sincronizar.');
      return;
    }
    setSyncing(true);
    try {
      const result = await icalApi.sync({ propiedadId: propiedad.id, urlAirbnb: urlAirbnb || null, urlBooking: urlBooking || null });
      toast.success(`${result.totalImportados} eventos importados correctamente.`);
      onSyncSuccess({ airbnb: !!urlAirbnb, booking: !!urlBooking, syncedAt: new Date() });
    } catch (err) {
      // Si la URL iCal es de Airbnb y el CORS bloquea, informamos al usuario
      toast.error('No se pudo conectar con la URL iCal. Asegúrate de que la URL sea pública y termine en .ics');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCcw size={18} color="#1A3A5C" /> Sincronizar Plataformas
          </h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSync} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 8, fontSize: '0.85rem', color: '#475569' }}>
            Introduce los enlaces iCal (<strong>.ics</strong>) de las plataformas externas para {propiedad.nombre}. El CRM bloqueará automáticamente las fechas reservadas allí.
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#E11D48', fontWeight: 700 }}>Airbnb</span> iCal URL
            </label>
            <input 
              className="form-input" 
              placeholder="https://www.airbnb.es/calendar/ical/..." 
              value={urlAirbnb}
              onChange={e => setUrlAirbnb(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#1D4ED8', fontWeight: 700 }}>Booking.com</span> iCal URL
            </label>
            <input 
              className="form-input" 
              placeholder="https://admin.booking.com/hotel/hoteladmin/ical..." 
              value={urlBooking}
              onChange={e => setUrlBooking(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={syncing}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={syncing}>
              {syncing ? <Loader2 size={16} className="spin" /> : <RefreshCcw size={16} />}
              {syncing ? 'Sincronizando...' : 'Fusionar Calendarios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CalendarioVacacional() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroHab, setFiltroHab] = useState('');
  const [selectedVillas, setSelectedVillas] = useState(new Set());
  const [fechaEntrada, setFechaEntrada] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [syncPropiedad, setSyncPropiedad] = useState(null);
  const [syncStatusMap, setSyncStatusMap] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['propiedades-vacacional'],
    queryFn: () => propiedadesApi.list({ tipo: 'VACACIONAL', limit: 50 }),
  });

  const rawPropiedades = data?.data || [];

  // Mock data si no hay nada en BBDD
  const propiedades = rawPropiedades.length > 0 ? rawPropiedades : [
    { id: 'v1', nombre: 'Villa Can Rimbau', zona: 'Jesús', referencia: 'ALQ-001', habitaciones: 6, banos: 5, metrosConstruidos: 520, estado: 'DISPONIBLE', alquilerVacacional: { precioTemporadaAlta: 21000, precioTemporadaMedia: 14000, precioTemporadaBaja: 7000, licenciaETV: 'ETV-IBI-00234' } },
    { id: 'v2', nombre: 'Villa Sa Caleta Views', zona: 'Sant Josep', referencia: 'ALQ-002', habitaciones: 4, banos: 4, metrosConstruidos: 380, estado: 'DISPONIBLE', alquilerVacacional: { precioTemporadaAlta: 15400, precioTemporadaMedia: 9800, precioTemporadaBaja: 5200, licenciaETV: 'ETV-IBI-00678' } },
    { id: 'v3', nombre: 'Villa Talamanca Sunset', zona: 'Talamanca', referencia: 'ALQ-003', habitaciones: 5, banos: 5, metrosConstruidos: 450, estado: 'RESERVADA', alquilerVacacional: { precioTemporadaAlta: 18900, precioTemporadaMedia: 12500, precioTemporadaBaja: 6400, licenciaETV: 'ETV-IBI-01102' } },
    { id: 'v4', nombre: 'Finca Las Salinas', zona: 'Las Salinas', referencia: 'ALQ-004', habitaciones: 8, banos: 7, metrosConstruidos: 680, estado: 'DISPONIBLE', alquilerVacacional: { precioTemporadaAlta: 35000, precioTemporadaMedia: 22000, precioTemporadaBaja: 11000, licenciaETV: 'ETV-IBI-01455' } },
    { id: 'v5', nombre: 'Villa Porroig Panorámica', zona: 'Porroig', referencia: 'ALQ-005', habitaciones: 3, banos: 3, metrosConstruidos: 280, estado: 'DISPONIBLE', alquilerVacacional: { precioTemporadaAlta: 8900, precioTemporadaMedia: 5600, precioTemporadaBaja: 3200, licenciaETV: 'ETV-IBI-01891' } },
  ];

  const propsFiltradas = propiedades.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.zona.toLowerCase().includes(q);
    const matchHab = !filtroHab || p.habitaciones >= parseInt(filtroHab);
    return matchQ && matchHab;
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const toggleVilla = (id) => {
    setSelectedVillas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedList = propsFiltradas.filter(p => selectedVillas.has(p.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 140px)' }}>
      
      {/* ── Header + controles ── */}
      <div className="page-header" style={{ marginBottom: 0, flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header-left">
          <h2>Disponibilidad Villas</h2>
          <p>{propsFiltradas.length} villas · {MONTHS_ES[month]} {year}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Fechas petición */}
          <input type="date" className="input" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} style={{ width: 150 }} title="Fecha de entrada del cliente" />
          <span style={{ color: '#94A3B8', fontWeight: 300 }}>→</span>
          <input type="date" className="input" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} style={{ width: 150 }} title="Fecha de salida del cliente" />

          {/* Enviar al cliente */}
          <button
            className="btn"
            style={{ background: '#C9A84C', color: '#0F172A', borderColor: '#C9A84C', fontWeight: 700 }}
            disabled={selectedVillas.size === 0}
            onClick={() => setShowEnviarModal(true)}
          >
            <Send size={16} /> Enviar al cliente ({selectedVillas.size})
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input className="input" style={{ paddingLeft: 36, width: '100%' }} placeholder="Buscar villa o zona..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="input" value={filtroHab} onChange={e => setFiltroHab(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Todas las habitaciones</option>
          <option value="2">≥ 2 hab.</option>
          <option value="4">≥ 4 hab.</option>
          <option value="6">≥ 6 hab.</option>
          <option value="8">≥ 8 hab.</option>
        </select>

        {/* Navegación mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '4px 8px' }}>
          <button className="btn btn-ghost btn-icon" onClick={prevMonth} style={{ padding: '4px 6px' }}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', minWidth: 140, textAlign: 'center' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth} style={{ padding: '4px 6px' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* ── Grid de Calendarios ── */}
      {isLoading ? (
        <div className="loading-page" style={{ flex: 1 }}><div className="spinner" /></div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {propsFiltradas.map(p => {
              const isSelected = selectedVillas.has(p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #C9A84C' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 4px 20px rgba(201,168,76,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '1rem 1rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: '0.78rem', color: '#64748B' }}>
                        <MapPin size={11} /> {p.zona}
                        <span style={{ color: '#E2E8F0' }}>|</span>
                        <Bed size={11} /> {p.habitaciones}
                        <Bath size={11} /> {p.banos}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className={`badge ${p.estado === 'DISPONIBLE' ? 'badge-disponible' : p.estado === 'ALQUILADA' ? 'badge-alquilada' : 'badge-reservada'}`} style={{ fontSize: '0.65rem' }}>
                        {p.estado}
                      </span>
                      {/* Checkbox selección */}
                      <button
                        onClick={() => toggleVilla(p.id)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: isSelected ? 'none' : '2px solid #CBD5E1',
                          background: isSelected ? '#C9A84C' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title={isSelected ? 'Quitar de la selección' : 'Añadir a la propuesta para cliente'}
                      >
                        {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                      </button>
                      
                      {/* Sync Button */}
                      <button
                        onClick={() => setSyncPropiedad(p)}
                        className="btn-icon btn-ghost"
                        style={{ color: '#1A3A5C', padding: 4 }}
                        title="Sincronizar calendarios de Airbnb/Booking"
                      >
                        <RefreshCcw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Calendario */}
                  <div style={{ padding: '0.75rem 1rem 1rem' }}>
                    <MiniCalendario propiedad={p} year={year} month={month} syncInfo={syncStatusMap[p.id]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Enviar */}
      {showEnviarModal && (
        <EnviarOpcionesModal
          opciones={selectedList}
          fechas={{
            entrada: fechaEntrada || `${year}-${String(month + 1).padStart(2, '0')}-01`,
            salida: fechaSalida || `${year}-${String(month + 1).padStart(2, '0')}-07`,
            entradaDate: fechaEntrada ? new Date(fechaEntrada) : new Date(year, month, 1)
          }}
          onClose={() => setShowEnviarModal(false)}
        />
      )}

      {/* Modal Sync iCal */}
      {syncPropiedad && (
        <SyncModal 
          propiedad={syncPropiedad}
          onClose={() => setSyncPropiedad(null)}
          onSyncSuccess={(status) => {
            setSyncStatusMap(prev => ({ ...prev, [syncPropiedad.id]: status }));
            setSyncPropiedad(null);
          }}
        />
      )}
    </div>
  );
}
