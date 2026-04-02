import axios from 'axios';

// Creamos una instancia base de Axios
export const api = axios.create({
  baseURL: 'http://localhost:3000', // Apunta a nuestro backend de NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});

