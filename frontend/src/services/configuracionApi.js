import { apiCall, apiUpload } from './api';

export const configuracionApi = {
  get: async () => {
    const res = await apiCall('/configuracion');
    return res.data;
  },
  save: async (data) => {
    const res = await apiCall('/configuracion', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiUpload('/configuracion/upload', formData);
  }
};
