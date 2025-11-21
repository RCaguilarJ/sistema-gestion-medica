// src/services/consultaCitaService.js
import api from './api.js'; // Instancia de Axios configurada con baseURL

// --- SERVICIOS PARA HISTORIAL CLÍNICO (CONSULTAS) ---

/**
 * Obtiene el historial de consultas de un paciente específico.
 * Llama a: GET /api/consultas/paciente/:pacienteId
 */
export const getConsultasByPaciente = async (pacienteId) => {
  try {
    const response = await api.get(`/consultas/paciente/${pacienteId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener consultas del paciente ${pacienteId}:`, error);
    throw error.response?.data || new Error("Error al cargar historial clínico.");
  }
};

/**
 * Registra una nueva consulta para un paciente.
 * Llama a: POST /api/consultas/paciente/:pacienteId
 */
export const createConsulta = async (pacienteId, consultaData) => {
  try {
    const response = await api.post(`/consultas/paciente/${pacienteId}`, consultaData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear consulta para el paciente ${pacienteId}:`, error);
    throw error.response?.data || new Error("Error al registrar nueva consulta.");
  }
};

/**
 * Obtiene el detalle de una consulta específica.
 * Llama a: GET /api/consultas/:id
 */
export const getConsultaDetail = async (consultaId) => {
  try {
    const response = await api.get(`/consultas/${consultaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de consulta ${consultaId}:`, error);
    throw error.response?.data || new Error("Error al cargar detalle de consulta.");
  }
};

// --- SERVICIOS PARA CITAS ---

/**
 * Obtiene las citas programadas de un paciente (próximas e históricas).
 * Llama a: GET /api/citas/paciente/:pacienteId
 * Devuelve { proximasCitas: [], historialCitas: [] }
 */
export const getCitasByPaciente = async (pacienteId) => {
  try {
    const response = await api.get(`/citas/paciente/${pacienteId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener citas del paciente ${pacienteId}:`, error);
    throw error.response?.data || new Error("Error al cargar citas.");
  }
};

/**
 * Agendar una nueva cita.
 * Llama a: POST /api/citas/paciente/:pacienteId
 */
export const createCita = async (pacienteId, citaData) => {
  try {
    const response = await api.post(`/citas/paciente/${pacienteId}`, citaData);
    return response.data;
  } catch (error) {
    console.error(`Error al agendar cita para el paciente ${pacienteId}:`, error);
    throw error.response?.data || new Error("Error al agendar la cita.");
  }
};

/**
 * Actualiza el estado de una cita (Confirmada, Cancelada, Completada).
 * Llama a: PUT /api/citas/:id/estado
 */
export const updateCitaEstado = async (citaId, nuevoEstado) => {
  try {
    const response = await api.put(`/citas/${citaId}/estado`, { estado: nuevoEstado });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el estado de la cita ${citaId}:`, error);
    throw error.response?.data || new Error("Error al actualizar el estado.");
  }
};
