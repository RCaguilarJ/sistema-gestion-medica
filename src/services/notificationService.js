import api from "./api.js";

export const fetchPendingNotifications = async () => {
  const response = await api.get("/notifications/poll");
  return response.data?.notifications || response.data || [];
};

export const openNotificationStream = ({ onOpen, onMessage, onError } = {}) => {
  void onOpen;
  void onMessage;
  if (onError) {
    onError(new Error("SSE deshabilitado por seguridad"));
  }
  return null;
};

export const enqueueNotification = async (payload) => {
  const response = await api.post("/notifications/queue", payload);
  return response.data;
};
