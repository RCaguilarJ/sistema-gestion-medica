// src/services/pacienteService.js
import api from "./api.js";

export const getPacientes = async () => {
  const res = await api.get("/pacientes");
  return res.data || [];
};

export const createPaciente = async (pacienteData) => {
  const res = await api.post("/pacientes", pacienteData);
  return res.data;
};

export const getPacienteById = async (id) => {
  const res = await api.get(`/pacientes/${id}`);
  return res.data;
};

export const updatePaciente = async (id, pacienteData) => {
  const res = await api.put(`/pacientes/${id}`, pacienteData);
  return res.data;
};

export const deletePaciente = async (id) => {
  const res = await api.delete(`/pacientes/${id}`);
  return res.data;
};

export const getAllPacientesByDoctor = async (doctorId) => {
  const res = await api.get(`/pacientes/especialista/${doctorId}`);
  return res.data || [];
};
