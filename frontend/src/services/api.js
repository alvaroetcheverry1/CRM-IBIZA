import { MOCK_DATA } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function delay(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Devuelve el token JWT guardado en localStorage */
function getToken() {
  return localStorage.getItem('accessToken');
}

/** Helper para llamadas HTTP autenticadas al backend real */
export async function apiCall(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/registro') {
        window.location.href = '/login';
      }
    }
    throw new Error(body.error || body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Helper para subidas multipart (FormData) */
export async function apiUpload(path, formData) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  loginGoogle: async (credential) => {
    return await apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },
  loginEmail: async (email, password) => {
    return await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (datos) => {
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },
  devLogin: async () => {
    return await apiCall('/auth/dev-login', { method: 'POST', body: JSON.stringify({}) });
  },
  refresh: async (refreshToken) => {
    return await apiCall('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  },
  me: async () => {
    return await apiCall('/auth/me');
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  getAgencias: () => apiCall('/admin/agencias'),
  getAgencia: (id) => apiCall(`/admin/agencias/${id}`),
  createAgencia: (data) => apiCall('/admin/agencias', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => apiCall('/admin/stats'),
  activarAgencia: (id, plan) => apiCall(`/admin/agencias/${id}/activar`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  suspenderAgencia: (id, motivo) => apiCall(`/admin/agencias/${id}/suspender`, { method: 'PUT', body: JSON.stringify({ motivo }) }),
  cambiarPlan: (id, plan) => apiCall(`/admin/agencias/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  eliminarAgencia: (id) => apiCall(`/admin/agencias/${id}`, { method: 'DELETE' }),
};

// ─── Usuarios API ─────────────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => apiCall('/usuarios'),
  create: (data) => apiCall('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/usuarios/${id}`, { method: 'DELETE' }),
};

// ─── Dashboard ────────────────────────────────────────────
export const dashboardApi = {
  getStats: async (meses = 12) => {
    try {
      return await apiCall(`/dashboard?meses=${meses}`);
    } catch {
      await delay();
      return MOCK_DATA.dashboard;
    }
  },
};

// ─── Propiedades ──────────────────────────────────────────
export const propiedadesApi = {
  list: async (params = {}) => {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return await apiCall(`/propiedades${qs ? '?' + qs : ''}`);
    } catch (err) {
      console.error('Propiedades API error:', err.message);
      throw err;
    }
  },
  get: async (id) => {
    try {
      return await apiCall(`/propiedades/${id}`);
    } catch (err) {
      console.warn('Propiedad get error, usando mock:', err.message);
      await delay();
      const found = MOCK_DATA.propiedades.find(p => p.id === id);
      if (!found) throw new Error(`Propiedad ${id} no encontrada en mock`);
      return found;
    }
  },
  create: async (data) => {
    return await apiCall('/propiedades', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id, data) => {
    return await apiCall(`/propiedades/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id) => {
    return await apiCall(`/propiedades/${id}`, { method: 'DELETE' });
  },
  generarDescripcion: async (id, notas) => {
    return await apiCall(`/propiedades/${id}/generar-descripcion`, { method: 'POST', body: JSON.stringify({ notas }) });
  },
};

// ─── Propietarios ─────────────────────────────────────────
export const propietariosApi = {
  list: async (params = {}) => {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return await apiCall(`/propietarios${qs ? '?' + qs : ''}`);
    } catch (err) {
      console.warn('Propietarios API error, usando mock:', err.message);
      await delay();
      let data = [...MOCK_DATA.propietarios];
      if (params.categoria) data = data.filter(p => p.categoria === params.categoria);
      return { data, meta: { total: data.length } };
    }
  },
  get: async (id) => {
    try {
      return await apiCall(`/propietarios/${id}`);
    } catch {
      await delay();
      return MOCK_DATA.propietarios.find(p => p.id === id);
    }
  },
  create: async (data) => {
    return await apiCall('/propietarios', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id, data) => {
    return await apiCall(`/propietarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id) => {
    return await apiCall(`/propietarios/${id}`, { method: 'DELETE' });
  },
};

export const clientesApi = {
  list: async (params = {}) => {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return await apiCall(`/clientes${qs ? '?' + qs : ''}`);
    } catch (err) {
      console.warn('Clientes API error, usando mock:', err.message);
      await delay();
      let data = [...MOCK_DATA.clientes];
      if (params.estado) data = data.filter(c => c.estado === params.estado);
      if (params.tipo) data = data.filter(c => c.tipo === params.tipo);
      return { data, meta: { total: data.length } };
    }
  },
  get: async (id) => {
    try {
      return await apiCall(`/clientes/${id}`);
    } catch {
      await delay();
      return MOCK_DATA.clientes.find(c => c.id === id);
    }
  },
  create: async (data) => {
    return await apiCall('/clientes', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id, data) => {
    return await apiCall(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id) => {
    return await apiCall(`/clientes/${id}`, { method: 'DELETE' });
  },
  addActividad: async (id, data) => {
    return await apiCall(`/clientes/${id}/actividades`, { method: 'POST', body: JSON.stringify(data) });
  },
};

// ─── Documentos ───────────────────────────────────────────
export const documentosApi = {
  list: async (params = {}) => {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return await apiCall(`/documentos${qs ? '?' + qs : ''}`);
    } catch {
      await delay();
      return { data: MOCK_DATA.documentos };
    }
  },
  upload: async (formData) => {
    return await apiUpload('/documentos/upload', formData);
  },
  uploadDossier: async (formData) => {
    return await apiUpload('/documentos/dossier', formData);
  },
  createNota: async ({ titulo, contenido, propiedadId, propiedadNombre, tipoDoc, regenDesc }) => {
    return await apiCall('/documentos/nota', {
      method: 'POST',
      body: JSON.stringify({ titulo, contenido, propiedadId, tipo: tipoDoc, regenDesc }),
    });
  },
  delete: async (id) => {
    return await apiCall(`/documentos/${id}`, { method: 'DELETE' });
  },
};

// ─── Reservas ─────────────────────────────────────────────
export const reservasApi = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return apiCall(`/reservas${qs ? '?' + qs : ''}`);
  },
  create: async (data) => {
    return apiCall('/reservas', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id, data) => {
    return apiCall(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id) => {
    return apiCall(`/reservas/${id}`, { method: 'DELETE' });
  },
};

// ─── Pagos ────────────────────────────────────────────────
export const pagosApi = {
  list: async () => {
    await delay(300);
    return { data: MOCK_DATA.pagos };
  },
  update: async (_id, data) => { await delay(); return data; },
};

export const facturasApi = {
  list: async () => {
    await delay(500);
    return { data: MOCK_DATA.facturas };
  },
  create: async (data) => {
    await delay(600);
    const newDoc = {
      ...data,
      id: `f-${Date.now()}`,
      numero: `F-${new Date().getFullYear()}-${String(MOCK_DATA.facturas.length + 1).padStart(3, '0')}`
    };
    MOCK_DATA.facturas.unshift(newDoc);
    return newDoc;
  },
  update: async (id, data) => {
    await delay(500);
    const idx = MOCK_DATA.facturas.findIndex(f => f.id === id);
    if (idx >= 0) {
      MOCK_DATA.facturas[idx] = { ...MOCK_DATA.facturas[idx], ...data };
      return MOCK_DATA.facturas[idx];
    }
    throw new Error('Not found');
  },
  delete: async (id) => {
    await delay(400);
    MOCK_DATA.facturas = MOCK_DATA.facturas.filter(f => f.id !== id);
    return { success: true };
  },
  uploadToDrive: async (blob, filename) => {
    const formData = new FormData();
    formData.append('factura', blob, filename);
    try {
      return await apiUpload('/facturas/upload', formData);
    } catch {
      await delay(1500);
      return {
        success: true,
        message: 'Factura subida exitosamente a Google Drive (Mock).',
        url: `https://drive.google.com/mock/${filename}`
      };
    }
  }
};

export const propuestasApi = {
  enviarDisponibilidad: (data) => apiCall('/propuestas/enviar-disponibilidad', { method: 'POST', body: JSON.stringify(data) }),
};

export const matchmakingApi = {
  getMatches: (propiedadId) => apiCall(`/matchmaking/${propiedadId}`),
  getMatchesForCliente: (clienteId) => apiCall(`/matchmaking/cliente/${clienteId}`),
  generarPitch: (data) => apiCall('/matchmaking/generar-pitch', { method: 'POST', body: JSON.stringify(data) }),
  enviarDossier: (data) => apiCall('/matchmaking/enviar-dossier', { method: 'POST', body: JSON.stringify(data) }),
};

export const icalApi = {
  sync: (data) => apiCall('/ical/sync', { method: 'POST', body: JSON.stringify(data) }),
  getReservas: (propiedadId) => apiCall(`/ical/${propiedadId}`),
};

export const tareasApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return apiCall(`/tareas${qs ? '?' + qs : ''}`);
  },
  create: (data) => apiCall('/tareas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/tareas/${id}`, { method: 'DELETE' }),
};

// ─── Actividades / Historial ──────────────────────────────────
export const actividadesApi = {
  list: async (params = {}) => {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return await apiCall(`/actividades${qs ? '?' + qs : ''}`);
    } catch (err) {
      console.warn('Actividades API error:', err.message);
      return { data: [] };
    }
  },
  create: async (data) => {
    return await apiCall('/actividades', { method: 'POST', body: JSON.stringify(data) });
  },
  delete: async (id) => {
    return await apiCall(`/actividades/${id}`, { method: 'DELETE' });
  },
};

export const whatsappApi = {
  sendMessage: (data) => apiCall('/whatsapp/message', { method: 'POST', body: JSON.stringify(data) }),
  guardarLead: (data) => apiCall('/whatsapp/guardar-lead', { method: 'POST', body: JSON.stringify(data) }),
  getLeadsRecientes: () => apiCall('/whatsapp/leads-recientes'),
  getHistorial: (clienteId) => apiCall(`/whatsapp/historial/${clienteId}`),
  enviarMensajeReal: (clienteId, mensaje) => apiCall('/whatsapp/enviar', { method: 'POST', body: JSON.stringify({ clienteId, mensaje }) })
};

// ─── Catálogos Inteligentes ─────────────────────────────────
export const catalogosApi = {
  list: () => apiCall('/catalogos'),
  create: (data) => apiCall('/catalogos', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/catalogos/${id}`, { method: 'DELETE' }),
  getPublic: (token) => apiCall(`/catalogos/public/${token}`),
};

export default {};

