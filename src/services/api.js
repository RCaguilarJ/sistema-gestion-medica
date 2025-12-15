import axios from "axios";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE URL BASE
// Usamos la dirección absoluta del backend porque está en un subdominio distinto ('back')
// Esto asegura que tanto en desarrollo como en producción se apunte al servidor correcto.
// ---------------------------------------------------------------------------
const baseURL = 'https://back.diabetesjalisco.org/api';

const api = axios.create({
  baseURL: baseURL,
});

// Interceptor para agregar el Token de sesión automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;