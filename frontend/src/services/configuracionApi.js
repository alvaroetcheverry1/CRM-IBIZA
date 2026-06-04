import api from './api';

export const configuracionApi = {
  get: async () => {
    const res = await api.get('/configuracion');
    return res.data;
  },
  save: async (data) => {
    const res = await api.post('/configuracion', data);
    return res.data;
  }
};
