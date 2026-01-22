// src/services/consultaCitaService.js
import api from "./api.js";

export const getCitasByDoctor = async (medicoId) => {
  const response = await api.get(`/citas/doctor/${medicoId}`);
  return response.data;
};

export const getCitasByPaciente = async (pacienteId) => {
  const response = await api.get(`/citas/paciente/${pacienteId}`);
  return response.data;
};

export const createCita = async (pacienteId, citaData) => {
  const response = await api.post(`/citas/paciente/${pacienteId}`, citaData);
  return response.data;
};

export const updateCitaEstado = async (citaId, nuevoEstado) => {
  const response = await api.put(`/citas/${citaId}/estado`, { estado: nuevoEstado });
  return response.data;
};

export const getCitasAmd = async (medicoId) => {
  const params = medicoId ? { medicoId } : undefined;
  const response = await api.get("/citas/amd", { params });
  return response.data;
};

export const getCitasPortal = async (medicoId) => {
  const params = medicoId ? { medicoId } : undefined;
  const response = await api.get("/citas/portal", { params });
  return response.data;
};

export const updateCitaPortalEstado = async (citaId, nuevoEstado) => {
  const response = await api.put(`/citas/portal/${citaId}/estado`, { estado: nuevoEstado });
  return response.data;
};

export const createPacienteFromCita = async (citaId, pacienteData) => {
  const response = await api.post(`/citas/portal/${citaId}/crear-paciente`, pacienteData);
  return response.data;
};


export const getConsultasByPaciente = async (pacienteId) => {
  const response = await api.get(`/consultas/paciente/${pacienteId}`);
  return response.data;
};

// ✅ ESTE ES EL QUE TE FALTA EN TU ERROR
export const getConsultaDetail = async (consultaId) => {
  const response = await api.get(`/consultas/${consultaId}`);
  return response.data;
};

export const createConsulta = async (pacienteId, consultaData) => {
  const response = await api.post(`/consultas/paciente/${pacienteId}`, consultaData);
  return response.data;
};
