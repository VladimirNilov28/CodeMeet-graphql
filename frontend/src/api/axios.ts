import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // adjust if backend runs elsewhere
});

// Interceptor to add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null' && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token === 'undefined' || token === 'null') {
    localStorage.removeItem('token');
  }
  return config;
});

export default api;
