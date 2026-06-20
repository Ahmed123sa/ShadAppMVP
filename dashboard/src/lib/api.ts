import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('client_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isClient = !!localStorage.getItem('client_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('client_token');
      localStorage.removeItem('client');
      if (typeof window !== 'undefined') window.location.href = isClient ? '/client-login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
