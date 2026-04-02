import axios from 'axios';

// Creamos una instancia base de Axios
export const api = axios.create({
  baseURL: 'http://localhost:3000', // Apunta a nuestro backend de NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});

// EL INTERCEPTOR: Se ejecuta antes de cada petición
api.interceptors.request.use(
  (config) => {
    // Buscamos el token en la bóveda del navegador
    const token = localStorage.getItem('devtrack_token');
    
    // Si existe, lo inyectamos en los Headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

