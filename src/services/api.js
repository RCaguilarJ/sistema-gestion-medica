import axios from "axios";


// CONFIGURACIÓN DE LA URL BASE (Backend)
// -----------------------------------------------------------------------------
//Usar esta línea para producción
// const baseURL = 'https://back.diabetesjalisco.org/api';

// Esta lína es para trabajar en puebas locales 
const baseURL = "http://localhost:4000/api";

// -----------------------------------------------------------------------------

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el Token de sesión automáticamente a cada petición

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;