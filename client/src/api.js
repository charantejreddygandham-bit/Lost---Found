import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong.';
export const imgUrl = (file) => (file ? `/uploads/${file}` : null);
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export default api;
