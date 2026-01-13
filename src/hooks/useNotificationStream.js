import { useEffect, useRef, useState } from "react";
import { fetchPendingNotifications, openNotificationStream } from "../services/notificationService.js";

const MAX_ITEMS = 50;

const dedupeAndSort = (existing, incoming) => {
  const byId = new Map();
  [...incoming, ...existing].forEach((item) => {
    if (!item || !item.id) return;
    byId.set(item.id, item);
  });
  const sorted = Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  return sorted.slice(0, MAX_ITEMS);
};

const mapStatus = {
  idle: "idle",
  connecting: "connecting",
  connected: "connected",
  reconnecting: "reconnecting",
  error: "error",
  unsupported: "unsupported",
};

export default function useNotificationStream(options = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? 15000;
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState(mapStatus.idle);
  const [error, setError] = useState(null);
  const streamStopRef = useRef(null);
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const publish = (items) => {
      if (!mountedRef.current || !items || !items.length) return;
      setNotifications((prev) => dedupeAndSort(prev, items));
    };

    const poll = async () => {
      try {
        const data = await fetchPendingNotifications();
        publish(data);
        if (data.length && mountedRef.current) {
          setStatus(mapStatus.connected);
        }
      } catch (pollError) {
        console.error("Error en polling de notificaciones:", pollError);
        if (mountedRef.current) {
          setError(pollError);
          setStatus(mapStatus.error);
        }
      }
    };

    const startPoller = () => {
      if (pollTimerRef.current) return;
      pollTimerRef.current = window.setInterval(poll, pollIntervalMs);
    };

    const stopPoller = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const stopStream = () => {
      if (streamStopRef.current) {
        try {
          streamStopRef.current();
        } catch (streamCloseError) {
          console.warn("Error cerrando stream SSE", streamCloseError);
        }
        streamStopRef.current = null;
      }
    };

    const startStream = () => {
      if (typeof EventSource === "undefined") {
        setStatus(mapStatus.unsupported);
        startPoller();
        return;
      }
      setStatus(mapStatus.connecting);
      streamStopRef.current = openNotificationStream({
        onOpen: () => {
          if (!mountedRef.current) return;
          setStatus(mapStatus.connected);
          stopPoller();
        },
        onMessage: (payload) => {
          publish([payload]);
        },
        onError: (streamError) => {
          console.warn("SSE notificaciones en error, usando polling", streamError);
          if (!mountedRef.current) return;
          setError(streamError);
          setStatus(mapStatus.reconnecting);
          stopStream();
          startPoller();
        },
      });
      if (!streamStopRef.current) {
        startPoller();
      }
    };

    const bootstrap = async () => {
      await poll();
      startStream();
    };

    bootstrap();

    return () => {
      mountedRef.current = false;
      stopStream();
      stopPoller();
    };
  }, [pollIntervalMs]);

  const clearNotifications = () => setNotifications([]);

  return {
    notifications,
    status,
    error,
    clearNotifications,
  };
}
