import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://nimvu-be-nest.onrender.com',
  // Usar 127.0.0.1 (IPv4) en vez de 'localhost': en Windows 'localhost' resuelve
  // primero a IPv6 (::1) y puede chocar con otro dev server en el mismo puerto.
  baseURL: 'http://127.0.0.1:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors if needed (e.g. for auth token)
// Add interceptors if needed (e.g. for user auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If data is FormData, let browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access. Redirecting to login...');
      // Optional: Clear token and redirect
      // localStorage.removeItem('token');
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
