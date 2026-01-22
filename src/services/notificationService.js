import api from "./api.js";

const ensureLeadingSlash = (path) => (path.startsWith("/") ? path : `/${path}`);

const buildUrl = (path) => {
  const base = api.defaults.baseURL || "http://localhost:4000/api"; // Ensure fallback to localhost
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}${ensureLeadingSlash(path)}`;
};

export const fetchPendingNotifications = async () => {
  const response = await api.get("/notifications/poll");
  return response.data || [];
};

export const openNotificationStream = ({ onOpen, onMessage, onError } = {}) => {
  const token = localStorage.getItem("token");
  if (!token || typeof EventSource === "undefined") {
    if (onError) {
      onError(new Error("SSE no soportado"));
    }
    return null;
  }

  const streamUrl = `${buildUrl("/notifications/stream")}?token=${encodeURIComponent(token)}`;
 const eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    if (onOpen) onOpen();
  };

  eventSource.onmessage = (event) => {
    if (!onMessage) return;
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Error parseando notificación SSE:", error);
    }
  };

  eventSource.onerror = (error) => {
    if (onError) onError(error);
  };

  return () => eventSource.close();
};

export const enqueueNotification = async (payload) => {
  const response = await api.post("/notifications/queue", payload);
  return response.data;
};
