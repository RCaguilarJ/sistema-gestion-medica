// src/services/api.js
import axios from "axios";

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "";

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/api")) return withoutTrailingSlash;
  return `${withoutTrailingSlash}/api`;
};

const prodBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  // DEV: usa proxy de Vite (/api)
  // PROD en cPanel: VITE_API_URL vacío → cae a /api (mismo dominio)
  // PROD con dominio externo: usa VITE_API_URL
  baseURL: import.meta.env.DEV ? "/api" : prodBaseUrl || "/api",
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - redirigir a login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
