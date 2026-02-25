import api from "./api.js";

export const getPsicologia = async (pacienteId) => {
  const res = await api.get(`/psicologia/${pacienteId}`);
  return res.data || {
    sesiones: [],
    evaluaciones: [],
    objetivos: [],
    estrategias: [],
    notas: [],
  };
};

export const createPsicologiaSesion = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/sesiones`, payload);
  return res.data;
};

export const createPsicologiaEvaluacion = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/evaluaciones`, payload);
  return res.data;
};

export const createPsicologiaObjetivo = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/objetivos`, payload);
  return res.data;
};

export const createPsicologiaEstrategia = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/estrategias`, payload);
  return res.data;
};

export const createPsicologiaNota = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/notas`, payload);
  return res.data;
};
