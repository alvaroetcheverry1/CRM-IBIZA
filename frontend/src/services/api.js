import { MOCK_DATA } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function delay(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Devuelve el token JWT guardado en localStorage */
function getToken() {
  return localStorage.getItem('accessToken');
}

/** Cierra la sesión y redirige al login (salvo que ya estemos en páginas públicas). */
function forzarLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  const publicas = ['/login', '/registro', '/panel-interno'];
  if (!publicas.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
}

// Evita disparar varios refresh en paralelo: si ya hay uno en curso, se reutiliza.
let refreshPromise = null;

/**
 * Intenta renovar el access token usando el refreshToken guardado.
 * Devuelve el nuevo accessToken, o null si no se pudo renovar.
 */
async function intentarRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          return data.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        // Se limpia tras resolver para permitir futuros refresh.
        setTimeout(() => { refreshPromise = null; }, 0);
      }
    })();
  }
  return refreshPromise;
}

/** Helper para llamadas HTTP autenticadas al backend real */
export async function apiCall(path, options = {}, _reintento = false) {
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
      // Token caducado: intentar refrescar y reintentar la petición una sola vez.
      const esExpirado = body.code === 'TOKEN_EXPIRED';
      if (esExpirado && !_reintento) {
        const nuevoToken = await intentarRefresh();
        if (nuevoToken) {
          return apiCall(path, options, true);
        }
      }
      // Sin refresh posible (o ya reintentado): cerrar sesión.
      forzarLogout();
    }
    throw new Error(body.error || body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Helper para subidas multipart (FormData) */
export async function apiUpload(path, formData, _reintento = false) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (body.code === 'TOKEN_EXPIRED' && !_reintento) {
        const nuevoToken = await intentarRefresh();
        if (nuevoToken) return apiUpload(path, formData, true);
      }
      forzarLogout();
    }
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
    return await apiCall(`/dashboard?meses=${meses}`);
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
    return await apiCall(`/propiedades/${id}`);
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
      console.error('Propietarios API error:', err.message);
      throw err;
    }
  },
  get: async (id) => {
    return await apiCall(`/propietarios/${id}`);
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
      console.error('Clientes API error:', err.message);
      throw err;
    }
  },
  get: async (id) => {
    return await apiCall(`/clientes/${id}`);
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
    } catch (err) {
      console.error('Documentos API error:', err.message);
      throw err;
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
  list: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return await apiCall(`/pagos${qs ? '?' + qs : ''}`);
  },
  update: async (id, data) => {
    return await apiCall(`/pagos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
};

// Facturas — CRUD real contra el backend (/api/facturas).
export const facturasApi = {
  list: async () => apiCall('/facturas'),
  create: async (data) => apiCall('/facturas', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) => apiCall(`/facturas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) => apiCall(`/facturas/${id}`, { method: 'DELETE' }),
  uploadToDrive: async (blob, filename) => {
    const formData = new FormData();
    formData.append('factura', blob, filename);
    return await apiUpload('/facturas/upload', formData);
  },
};

export const propuestasApi = {
  enviarDisponibilidad: (data) => apiCall('/propuestas/enviar-disponibilidad', { method: 'POST', body: JSON.stringify(data) }),
};

export const suscripcionesApi = {
  getPlanes: () => apiCall('/suscripciones/planes'),
  getMi: () => apiCall('/suscripciones/mi'),
  checkout: (planId) => apiCall('/suscripciones/checkout', { method: 'POST', body: JSON.stringify({ planId }) }),
  portal: () => apiCall('/suscripciones/portal', { method: 'POST', body: JSON.stringify({}) }),
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

