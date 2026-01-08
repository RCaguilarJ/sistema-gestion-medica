import axios from "axios";


// CONFIGURACIÓN DE LA URL BASE (Backend)
// -----------------------------------------------------------------------------
//Usar esta línea para producción
// const baseURL = 'https://back.diabetesjalisco.org/api';

// Preferencia: usar la URL de la API definida en `REACT_APP_API_URL` (por ejemplo la API PHP).
// Si no está definida, usar la API de Node de desarrollo por defecto.
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

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