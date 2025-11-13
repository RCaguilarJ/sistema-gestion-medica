import axios from 'axios';

// Creamos una instancia de Axios con la configuración base de Strapi
const api = axios.create({
  // Esta es la URL de tu backend de Strapi
  baseURL: 'http://localhost:1337/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  Más adelante, cuando implementemos el Login, aquí es donde
  agregaremos el "token" de autorización a todas las peticiones.
*/

export default api;