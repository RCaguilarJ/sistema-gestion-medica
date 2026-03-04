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

export const updatePsicologiaSesion = async (pacienteId, sesionId, payload) => {
  const res = await api.put(`/psicologia/${pacienteId}/sesiones/${sesionId}`, payload);
  return res.data;
};

export const deletePsicologiaSesion = async (pacienteId, sesionId) => {
  const res = await api.delete(`/psicologia/${pacienteId}/sesiones/${sesionId}`);
  return res.data;
};

export const createPsicologiaEvaluacion = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/evaluaciones`, payload);
  return res.data;
};

export const updatePsicologiaEvaluacion = async (pacienteId, evaluacionId, payload) => {
  const res = await api.put(`/psicologia/${pacienteId}/evaluaciones/${evaluacionId}`, payload);
  return res.data;
};

export const deletePsicologiaEvaluacion = async (pacienteId, evaluacionId) => {
  const res = await api.delete(`/psicologia/${pacienteId}/evaluaciones/${evaluacionId}`);
  return res.data;
};

export const createPsicologiaObjetivo = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/objetivos`, payload);
  return res.data;
};

export const updatePsicologiaObjetivo = async (pacienteId, objetivoId, payload) => {
  const res = await api.put(`/psicologia/${pacienteId}/objetivos/${objetivoId}`, payload);
  return res.data;
};

export const deletePsicologiaObjetivo = async (pacienteId, objetivoId) => {
  const res = await api.delete(`/psicologia/${pacienteId}/objetivos/${objetivoId}`);
  return res.data;
};

export const createPsicologiaEstrategia = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/estrategias`, payload);
  return res.data;
};

export const updatePsicologiaEstrategia = async (pacienteId, estrategiaId, payload) => {
  const res = await api.put(`/psicologia/${pacienteId}/estrategias/${estrategiaId}`, payload);
  return res.data;
};

export const deletePsicologiaEstrategia = async (pacienteId, estrategiaId) => {
  const res = await api.delete(`/psicologia/${pacienteId}/estrategias/${estrategiaId}`);
  return res.data;
};

export const createPsicologiaNota = async (pacienteId, payload) => {
  const res = await api.post(`/psicologia/${pacienteId}/notas`, payload);
  return res.data;
};

export const updatePsicologiaNota = async (pacienteId, notaId, payload) => {
  const res = await api.put(`/psicologia/${pacienteId}/notas/${notaId}`, payload);
  return res.data;
};

export const deletePsicologiaNota = async (pacienteId, notaId) => {
  const res = await api.delete(`/psicologia/${pacienteId}/notas/${notaId}`);
  return res.data;
};
