// src/services/api.js
import axios from "axios";
import { markPacienteReciente } from "../utils/pacientesRecientes.js";

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "";

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/api")) return withoutTrailingSlash;
  return `${withoutTrailingSlash}/api`;
};

const envBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  // DEV: usa proxy de Vite (/api)
  // PROD en cPanel: VITE_API_URL vacío → cae a /api (mismo dominio)
  // PROD con dominio externo: usa VITE_API_URL
  baseURL: envBaseUrl || "/api",
});

const shouldTrackMutation = (method = "") => {
  const normalized = String(method || "").toLowerCase();
  return normalized === "post" || normalized === "put" || normalized === "patch" || normalized === "delete";
};

const getPathFromUrl = (url) => {
  if (!url) return "";
  return String(url).split("?")[0];
};

const extractPacienteIdFromUrl = (url) => {
  const path = getPathFromUrl(url);
  if (!path) return null;

  const pacienteMatch = path.match(/\/pacientes\/([^/]+)/);
  if (pacienteMatch) {
    const candidate = pacienteMatch[1];
    if (!["especialista", "importar", "exportar", "stats"].includes(candidate)) return candidate;
  }

  const patterns = [
    /\/consultas\/paciente\/([^/]+)/,
    /\/citas\/paciente\/([^/]+)/,
    /\/psicologia\/([^/]+)/,
    /\/nutricion\/([^/]+)/,
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const extractPacienteIdFromPayload = (payload) => {
  if (!payload) return null;
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    const fromForm = payload.get("pacienteId") || payload.get("paciente_id");
    return fromForm ? String(fromForm) : null;
  }
  if (typeof payload === "object") {
    return payload.pacienteId || payload.paciente_id || null;
  }
  return null;
};

const extractPacienteIdFromResponse = (response) => {
  const { config, data } = response || {};
  if (!config || !shouldTrackMutation(config.method)) return null;

  const path = getPathFromUrl(config.url);
  const fromUrl = extractPacienteIdFromUrl(path);
  if (fromUrl) return fromUrl;

  if (path?.includes("/pacientes") && data?.id) return data.id;
  if (path?.includes("/citas/portal") && data?.id) return data.id;

  const nestedId =
    data?.pacienteId ||
    data?.paciente_id ||
    data?.paciente?.id ||
    data?.paciente?.pacienteId ||
    null;
  if (nestedId) return nestedId;

  if (path?.includes("/documentos")) {
    const fromBody = extractPacienteIdFromPayload(config.data);
    if (fromBody) return fromBody;
  }

  return null;
};

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
  (response) => {
    try {
      const pacienteId = extractPacienteIdFromResponse(response);
      if (pacienteId) markPacienteReciente(pacienteId);
    } catch {
      // noop
    }
    return response;
  },
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
