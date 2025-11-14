import axios from 'axios';

// Creamos una instancia de Axios con la configuración base
const api = axios.create({
  // 1. CAMBIO: Apuntamos a nuestro nuevo backend de Express
  baseURL: 'http://localhost:4000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  2. IMPORTANTE:
  Nuestro AuthContext.jsx 
  ya está configurado para añadir el token de autorización
  a este 'api' después del login. ¡No necesitamos cambiar nada más aquí!
*/

export default api;