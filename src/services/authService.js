// src/services/authService.js
import api from "./api.js";

const parseJsonIfNeeded = (payload) => {
  if (typeof payload !== "string") return payload;

  const trimmed = payload.trim();
  if (!trimmed) return payload;

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
};

const extractAuthPayload = (rawPayload) => {
  const payload = parseJsonIfNeeded(rawPayload);
  const nestedPayload =
    payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : null;
  const source = nestedPayload || payload || {};

  const token =
    source.token ||
    source.jwt ||
    source.accessToken ||
    source.access_token ||
    payload?.token ||
    payload?.jwt ||
    payload?.accessToken ||
    payload?.access_token ||
    null;

  const user = source.user || source.usuario || payload?.user || payload?.usuario || null;

  return { payload, token, user };
};

const buildMissingTokenError = (response, payload) => {
  const responsePreview =
    typeof payload === "string"
      ? payload.slice(0, 200)
      : JSON.stringify(payload || {}).slice(0, 200);

  const error = new Error("La respuesta del servidor no incluye un token");
  error.status = response?.status;
  error.responseData = payload;
  error.responsePreview = responsePreview;
  error.contentType = response?.headers?.["content-type"];
  error.requestUrl = response?.config?.url;
  return error;
};

const getErrorMessage = (error, respData) =>
  respData?.message ||
  respData?.error ||
  error.message ||
  "Error desconocido";

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { payload, token, user } = extractAuthPayload(response.data);

    if (!token) {
      throw buildMissingTokenError(response, payload);
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { jwt: token, user };
  } catch (error) {
    const status = error.status || error.response?.status;
    const respData = error.responseData ?? error.response?.data;
    const message = getErrorMessage(error, respData);
    console.error("Error en el login:", {
      status,
      message,
      respData,
      contentType: error.contentType || error.response?.headers?.["content-type"],
      responsePreview: error.responsePreview,
      url: error.requestUrl || error.config?.url,
    });
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const register = async (nombre, username, email, password, role, options = {}) => {
  const { persistSession = true } = options;

  try {
    const normalizedRole = (role || "").toUpperCase();
    const response = await api.post("/auth/register", {
      nombre,
      username,
      email,
      password,
      role: normalizedRole,
    });

    const { payload, token, user } = extractAuthPayload(response.data);

    if (!token && persistSession) {
      throw buildMissingTokenError(response, payload);
    }

    if (persistSession && token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

    return { jwt: token, user };
  } catch (error) {
    const status = error.status || error.response?.status;
    const respData = error.responseData ?? error.response?.data;
    const message = getErrorMessage(error, respData);
    console.error("Error en el registro:", {
      status,
      message,
      respData,
      contentType: error.contentType || error.response?.headers?.["content-type"],
      responsePreview: error.responsePreview,
      url: error.requestUrl || error.config?.url,
    });
    return null;
  }
};
