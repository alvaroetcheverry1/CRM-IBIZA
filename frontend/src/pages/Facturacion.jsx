import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturasApi, clientesApi, propiedadesApi } from '../services/api';
import { 
  Receipt, Plus, Search, Filter, Download, CloudUpload,
  CheckCircle, Clock, FileText, X, Save, Trash2, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Componentes auxiliares ──────────────────────────────
const ESTADO_BADGE = {
  BORRADOR: { color: '#8A9BB0', bg: '#F1F5F9', label: 'Borrador' },
  PENDIENTE: { color: '#C9A84C', bg: '#FEF9E7', label: 'Pendiente' },
  PAGADA: { color: '#2D8A5E', bg: '#E8F5F0', label: 'Pagada' },
  CANCELADA: { color: '#C0392B', bg: '#FEEFEE', label: 'Cancelada' }
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Modal Generador / Editor de Factura ───────────────────
function FacturaModal({ factura, onClose, onSave, clientes, propiedades }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!factura?.id;

  // Form state
  const [formData, setFormData] = useState({
    numero: factura?.numero || '',
    fechaEmision: factura?.fechaEmision ? factura.fechaEmision.split('T')[0] : new Date().toISOString().split('T')[0],
    fechaVencimiento: factura?.fechaVencimiento ? factura.fechaVencimiento.split('T')[0] : '',
    clienteId: factura?.cliente?.id || '',
    propiedadId: factura?.propiedad?.id || '',
    estado: factura?.estado || 'BORRADOR',
    conceptos: factura?.conceptos || [
      { id: Date.now(), descripcion: '', cantidad: 1, precioUnitario: 0, impuestoPorcentaje: 21 }
    ],
    notas: factura?.notas || ''
  });

  const handleConceptChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      conceptos: prev.conceptos.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const addConcept = () => {
    setFormData(prev => ({
      ...prev,
      conceptos: [...prev.conceptos, { id: Date.now(), descripcion: '', cantidad: 1, precioUnitario: 0, impuestoPorcentaje: 21 }]
    }));
  };

  const removeConcept = (id) => {
    setFormData(prev => ({
      ...prev,
      conceptos: prev.conceptos.filter(c => c.id !== id)
    }));
  };

  // Calculations
  const subtotales = formData.conceptos.map(c => (c.cantidad || 0) * (c.precioUnitario || 0));
  const impuestos = formData.conceptos.map((c, i) => subtotales[i] * ((c.impuestoPorcentaje || 0) / 100));
  
  const subtotalTotal = subtotales.reduce((a, b) => a + b, 0);
  const impuestosTotal = impuestos.reduce((a, b) => a + b, 0);
  const granTotal = subtotalTotal + impuestosTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienteId) {
      toast.error('Selecciona un cliente para la factura');
      return;
    }
    
    setLoading(true);
    
    // Preparar payload
    const cli = clientes.find(c => c.id === formData.clienteId);
    const prop = propiedades.find(p => p.id === formData.propiedadId);
    
    const payload = {
      ...formData,
      fechaEmision: new Date(formData.fechaEmision).toISOString(),
      fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento).toISOString() : null,
      cliente: cli ? { id: cli.id, nombre: cli.nombre, apellidos: cli.apellidos } : null,
      propiedad: prop ? { id: prop.id, nombre: prop.nombre } : null,
      subtotal: subtotalTotal,
      totalImpuestos: impuestosTotal,
      total: granTotal,
    };
    
    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{isEditing ? `Editar Factura ${factura.numero}` : 'Nueva Factura Profesional'}</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '2rem', background: '#F8FAFC' }}>
          
          <form id="factura-form" onSubmit={handleSubmit} className="form-grid">
            
            {/* Box 1: Datos principales */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#1A3A5C', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>Datos Generales</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label required">Cliente</label>
                  <select 
                    className="form-select" 
                    value={formData.clienteId} 
                    onChange={e => setFormData({...formData, clienteId: e.target.value})}
                    required
                  >
                    <option value="">— Seleccionar cliente —</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.apellidos} ({c.email})</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha de Emisión</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.fechaEmision}
                    onChange={e => setFormData({...formData, fechaEmision: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.fechaVencimiento}
                    onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asociar a Propiedad (Opccional)</label>
                  <select 
                    className="form-select" 
                    value={formData.propiedadId} 
                    onChange={e => setFormData({...formData, propiedadId: e.target.value})}
                  >
                    <option value="">— Ninguna —</option>
                    {propiedades.map(p => (
                      <option key={p.id} value={p.id}>{p.referencia} · {p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select" 
                    value={formData.estado} 
                    onChange={e => setFormData({...formData, estado: e.target.value})}
                    style={{
                      fontWeight: 600,
                      color: ESTADO_BADGE[formData.estado]?.color,
                      backgroundColor: ESTADO_BADGE[formData.estado]?.bg
                    }}
                  >
                    {Object.entries(ESTADO_BADGE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Box 2: Conceptos */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <h4 style={{ color: '#1A3A5C', margin: 0 }}>Líneas de Factura</h4>
                <button type="button" onClick={addConcept} className="btn btn-outline btn-sm">
                  <Plus size={14} /> Añadir Concepto
                </button>
              </div>
              
              <div className="table-wrap" style={{ overflow: 'visible', border: 'none' }}>
                <table style={{ minWidth: 700 }}>
                  <thead style={{ background: 'transparent' }}>
                    <tr>
                      <th style={{ width: '45%' }}>Descripción</th>
                      <th style={{ width: '10%' }}>Cant.</th>
                      <th style={{ width: '15%' }}>Precio Unit. (€)</th>
                      <th style={{ width: '12%' }}>Impuesto (%)</th>
                      <th style={{ width: '13%' }}>Total</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.conceptos.map((c, index) => (
                      <tr key={c.id}>
                        <td style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>
                          <input 
                            className="form-input" 
                            placeholder="Ej. Honorarios Venta" 
                            value={c.descripcion}
                            onChange={e => handleConceptChange(c.id, 'descripcion', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input 
                            type="number" 
                            min="1" 
                            step="0.01"
                            className="form-input" 
                            value={c.cantidad}
                            onChange={e => handleConceptChange(c.id, 'cantidad', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-input" 
                            value={c.precioUnitario}
                            onChange={e => handleConceptChange(c.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <select 
                            className="form-select" 
                            value={c.impuestoPorcentaje}
                            onChange={e => handleConceptChange(c.id, 'impuestoPorcentaje', parseFloat(e.target.value) || 0)}
                          >
                            <option value="21">IVA 21%</option>
                            <option value="10">IVA 10%</option>
                            <option value="0">Exento (0%)</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem', fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>
                          {formatMoney((c.cantidad * c.precioUnitario) * (1 + c.impuestoPorcentaje / 100))}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          {formData.conceptos.length > 1 && (
                            <button type="button" onClick={() => removeConcept(c.id)} className="btn-icon btn-ghost" style={{ color: '#C0392B' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <div style={{ width: '300px', background: '#F1F5F9', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#475569' }}>Subtotal:</span>
                    <span style={{ fontWeight: 500 }}>{formatMoney(subtotalTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#475569' }}>Impuestos:</span>
                    <span style={{ fontWeight: 500 }}>{formatMoney(impuestosTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #CBD5E1', fontSize: '1.1rem' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>TOTAL:</span>
                    <span style={{ fontWeight: 700, color: '#1A3A5C' }}>{formatMoney(granTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Notas */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Notas Adicionales (Visibles en la factura)</label>
                <textarea 
                  className="form-textarea" 
                  style={{ minHeight: 80 }}
                  placeholder="Ej. Pago a 30 días mediante transferencia bancaria al IBAN ESXX..."
                  value={formData.notas}
                  onChange={e => setFormData({...formData, notas: e.target.value})}
                />
              </div>
            </div>

          </form>
        </div>

        <div className="modal-footer" style={{ background: '#F8FAFC' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="factura-form" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Procesando...' : 'Guardar Factura'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────
export default function Facturacion() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [facturaEdit, setFacturaEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  // Queries
  const { data: facturasData, isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => facturasApi.list()
  });

  const { data: propData } = useQuery({
    queryKey: ['propiedades-mini'],
    queryFn: () => propiedadesApi.list({ limit: 100 }),
  });

  const { data: cliData } = useQuery({
    queryKey: ['clientes-mini'],
    queryFn: () => clientesApi.list({ limit: 100 }),
  });

  const facturas = facturasData?.data || [];
  const propiedades = propData?.data || [];
  const clientes = cliData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: facturasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura creada exitosamente');
      setModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => facturasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Factura actualizada');
      setModalOpen(false);
    }
  });

  // Derived state & Filtering
  const filteredFacturas = useMemo(() => {
    return facturas.filter(f => 
      f.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [facturas, searchTerm]);

  // KPIs
  const kpis = useMemo(() => {
    let cobrado = 0;
    let pendiente = 0;
    let borrador = 0;
    
    facturas.forEach(f => {
      if (f.estado === 'PAGADA') cobrado += f.total;
      if (f.estado === 'PENDIENTE') pendiente += f.total;
      if (f.estado === 'BORRADOR') borrador++;
    });

    return { cobrado, pendiente, totalEmision: cobrado + pendiente, borrador };
  }, [facturas]);

  const handleSaveFactura = async (payload) => {
    if (facturaEdit?.id) {
      await updateMutation.mutateAsync({ id: facturaEdit.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const openCreateModal = () => {
    setFacturaEdit(null);
    setModalOpen(true);
  };

  const openEditModal = (f) => {
    setFacturaEdit(f);
    setModalOpen(true);
  };

  const handleUploadDrive = async (f, e) => {
    e.stopPropagation();
    setUploadingId(f.id);
    try {
      // Create a dummy PDF blob for demonstration purposes
      const content = `Factura Comercial\nNúmero: ${f.numero}\nCliente: ${f.cliente?.nombre || 'General'}\nTotal: EMT ${f.total}`;
      const blob = new Blob([content], { type: 'application/pdf' });
      const filename = `${f.numero}_${f.cliente?.nombre || 'Cliente'}.pdf`.replace(/\s+/g, '_');
      
      const res = await facturasApi.uploadToDrive(blob, filename);
      toast.success(res.message || 'Factura subida a Google Drive');
      if (res.url && res.url.includes('http')) {
        // En un caso real mostraríamos un link
        console.log('Drive link:', res.url);
      }
    } catch (err) {
      toast.error('Error al subir a Drive');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Facturación y Finanzas</h2>
          <p>Gestiona los cobros, facturas emitidas y honorarios comerciales.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Nueva Factura
          </button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card navy">
          <div className="kpi-icon navy"><Receipt size={20} /></div>
          <div>
            <div className="kpi-value">{formatMoney(kpis.totalEmision)}</div>
            <div className="kpi-label">Total Emisión (Historico)</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckCircle size={20} /></div>
          <div>
            <div className="kpi-value">{formatMoney(kpis.cobrado)}</div>
            <div className="kpi-label">Cobrado (Pagadas)</div>
          </div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-icon gold"><Clock size={20} /></div>
          <div>
            <div className="kpi-value">{formatMoney(kpis.pendiente)}</div>
            <div className="kpi-label">Pendiente de Cobro</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={20} /></div>
          <div>
            <div className="kpi-value">{kpis.borrador}</div>
            <div className="kpi-label">Borradores de factura</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Listado de Facturas</h3>
          <div className="search-input-wrap" style={{ minWidth: 250, margin: 0 }}>
            <Search className="search-icon" size={16} />
            <input 
              className="search-input" 
              placeholder="Buscar por número o cliente..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '0.4rem 1rem 0.4rem 2.2rem' }}
            />
          </div>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8A9BB0' }}>Cargando facturas...</div>
          ) : filteredFacturas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8A9BB0' }}>No se encontraron facturas.</div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Nº Factura</th>
                    <th>Estado</th>
                    <th>Emisión</th>
                    <th>Cliente</th>
                    <th>Propiedad Asoc.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map(f => {
                    const st = ESTADO_BADGE[f.estado] || ESTADO_BADGE.BORRADOR;
                    return (
                      <tr key={f.id} onClick={() => openEditModal(f)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: '#1A3A5C' }}>{f.numero}</td>
                        <td>
                          <span className="badge" style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                        <td>{formatDate(f.fechaEmision)}</td>
                        <td>{f.cliente ? `${f.cliente.nombre} ${f.cliente.apellidos}` : '-'}</td>
                        <td style={{ color: '#8A9BB0' }}>{f.propiedad ? f.propiedad.nombre : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(f.total)}</td>
                        <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                          <button 
                            className="btn-icon btn-ghost" 
                            title="Guardar en Drive (04_Facturas)"
                            onClick={(e) => handleUploadDrive(f, e)}
                            disabled={uploadingId === f.id}
                            style={{ color: '#1A3A5C' }}
                          >
                            {uploadingId === f.id ? <Loader2 size={16} className="spin" /> : <CloudUpload size={16} />}
                          </button>
                          <button 
                            className="btn-icon btn-ghost" 
                            title="Descargar PDF (Simulado)"
                            onClick={(e) => { e.stopPropagation(); toast.success('Descargando factura en PDF...'); }}
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Render Modal */}
      {modalOpen && (
        <FacturaModal
          factura={facturaEdit}
          clientes={clientes}
          propiedades={propiedades}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveFactura}
        />
      )}
    </div>
  );
}
