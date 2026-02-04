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
  // DEV: usa proxy de Vite
  // PROD: usa VITE_API_URL y fuerza sufijo /api; si falta, cae a /api en mismo origen
  baseURL: import.meta.env.DEV ? "/api" : prodBaseUrl || "/api",
});

// Interceptor para token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
