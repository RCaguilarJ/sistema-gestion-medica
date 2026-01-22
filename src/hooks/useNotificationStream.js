import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPendingNotifications,
  openNotificationStream,
} from "../services/notificationService.js";

/**
 * Hook BLINDADO:
 * - Siempre devuelve notifications como arreglo
 * - Nunca retorna undefined
 * - Soporta polling + SSE (si existe)
 * - Si el backend no tiene endpoints (/notifications/*), no rompe el front
 */
export default function useNotificationStream(options = {}) {
  const {
    pollIntervalMs = 12000,
    enabled = true,
    maxItems = 100,
  } = options;

  const [notifications, setNotifications] = useState([]); // ✅ SIEMPRE arreglo
  const [status, setStatus] = useState("idle"); // idle|connecting|connected|reconnecting|error|unsupported|polling

  const stopSseRef = useRef(null);
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(false);

  const safeMaxItems = Number.isFinite(maxItems) ? maxItems : 100;

  const pushMany = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;

    setNotifications((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      // Unifica por id si existe, si no, solo concatena
      const byId = new Map();
      for (const x of prevArr) {
        if (x && (x.id !== undefined && x.id !== null)) byId.set(x.id, x);
      }
      for (const x of items) {
        if (!x) continue;
        if (x.id !== undefined && x.id !== null) byId.set(x.id, x);
      }

      const merged = Array.from(byId.values());

      // Orden por createdAt si existe (desc)
      merged.sort((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      return merged.slice(0, safeMaxItems);
    });
  };

  const pushOne = (item) => {
    if (!item) return;
    pushMany([item]);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();

    // Poll inmediato + interval
    const pollOnce = async () => {
      try {
        // si no existe la ruta, fetchPendingNotifications lanzará error -> atrapamos y no tronamos
        const data = await fetchPendingNotifications();

        // Algunos backends devuelven {data: []} o [] directo
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

        if (!mountedRef.current) return;

        pushMany(items);
        // Si solo estás en polling, marca estado
        if (status !== "connected") setStatus("polling");
      } catch (err) {
        if (!mountedRef.current) return;
        // No tronar: solo marcar error
        setStatus("error");
      }
    };

    pollOnce();

    pollTimerRef.current = setInterval(pollOnce, Math.max(3000, pollIntervalMs));
  };

  const stopSse = () => {
    if (typeof stopSseRef.current === "function") {
      try {
        stopSseRef.current();
      } catch {
        // ignore
      }
    }
    stopSseRef.current = null;
  };

  const startSse = () => {
    stopSse();

    // si no hay EventSource, nos quedamos en polling
    if (typeof EventSource === "undefined") {
      setStatus("unsupported");
      return false;
    }

    setStatus("connecting");

    const stopFn = openNotificationStream({
      onOpen: () => {
        if (!mountedRef.current) return;
        setStatus("connected");
      },
      onMessage: (msg) => {
        if (!mountedRef.current) return;
        pushOne(msg);
      },
      onError: () => {
        if (!mountedRef.current) return;
        // Si SSE falla (404/CORS/etc), caemos a polling sin romper
        setStatus("error");
      },
    });

    if (typeof stopFn !== "function") {
      // openNotificationStream devolvió null (no token / no soportado / etc)
      setStatus("unsupported");
      return false;
    }

    stopSseRef.current = stopFn;
    return true;
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setStatus("idle");
      return () => {
        mountedRef.current = false;
        stopSse();
        stopPolling();
      };
    }

    // ✅ siempre inicia polling para que haya fallback
    startPolling();

    // ✅ intenta SSE (si existe), si falla queda polling funcionando
    startSse();

    return () => {
      mountedRef.current = false;
      stopSse();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollIntervalMs]);

  // ✅ retorno blindado SIEMPRE
  return useMemo(() => {
    return {
      notifications: Array.isArray(notifications) ? notifications : [],
      status,
      // helpers opcionales por si los ocupas
      clear: () => setNotifications([]),
      setAll: (arr) => setNotifications(Array.isArray(arr) ? arr : []),
    };
  }, [notifications, status]);
}
