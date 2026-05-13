const STORAGE_KEY = "pacientes_recientes_v1";
const MAX_ENTRIES = 200;

const hasStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeId = (id) => {
  if (id === null || id === undefined) return null;
  const str = String(id).trim();
  return str ? str : null;
};

const readStore = () => {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  if (!hasStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const parseDateValue = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getPacientesRecientesSnapshot = () => readStore();

export const markPacienteReciente = (id, timestamp = Date.now()) => {
  const pacienteId = normalizeId(id);
  if (!pacienteId) return;

  const store = readStore();
  const safeTs = Number.isFinite(Number(timestamp)) ? Number(timestamp) : Date.now();
  store[pacienteId] = safeTs;

  const entries = Object.entries(store).filter(([, value]) => Number.isFinite(Number(value)));
  entries.sort((a, b) => Number(b[1]) - Number(a[1]));
  const trimmed = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
  writeStore(trimmed);
};

export const getPacienteRecienteTimestamp = (id) => {
  const pacienteId = normalizeId(id);
  if (!pacienteId) return 0;
  const store = readStore();
  const value = store[pacienteId];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

export const getPacienteRecencyStamp = (paciente, recientesSnapshot = null) => {
  if (!paciente) return 0;
  const pacienteKey = normalizeId(paciente.id ?? paciente.pacienteId);
  const serverTs = parseDateValue(
    paciente.ultimaEdicion ||
      paciente.ultimaActualizacion ||
      paciente.fechaActualizacion ||
      paciente.fechaModificacion ||
      paciente.updatedAt ||
      paciente.updated_at
  );

  const localTs = recientesSnapshot
    ? Number(recientesSnapshot[pacienteKey || ""]) || 0
    : getPacienteRecienteTimestamp(pacienteKey);

  return Math.max(serverTs || 0, localTs || 0);
};
