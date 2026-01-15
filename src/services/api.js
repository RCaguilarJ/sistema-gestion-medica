import axios from "axios";


const baseURL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: baseURL,
});

// Interceptor para agregar el Token de sesión automáticamente a cada petición
api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined" && window.localStorage) {
    token = localStorage.getItem("token");
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;