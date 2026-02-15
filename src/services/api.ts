import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
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
