// src/services/pacienteService.js

import api from './api.js';


// Función para obtener TODOS los pacientes (solo locales)
export const getPacientes = async () => {
  try {
    const response = await api.get('/pacientes');
    return response.data; 
  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
    throw error; // Propagar el error para manejo en el componente
  }
};

/**
 * Obtiene todos los pacientes (locales y externos) para el doctor actual
 * @param {string|number} doctorId - El ID del doctor/especialista logueado
 */
export async function getAllPacientesByDoctor(doctorId) {
  try {
    const res = await api.get(`/pacientes/todos?doctorId=${doctorId}`);
    return res.data;
  } catch (error) {
    console.error('Error al obtener todos los pacientes:', error);
    throw error;
  }
}

// Función para crear un nuevo paciente
export const createPaciente = async (pacienteData) => {
  try {
    const response = await api.post('/pacientes', pacienteData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error desconocido al crear paciente';
    console.error('Error al crear el paciente:', message);
    // Devuelve el objeto de error para que el componente lo use
    throw error.response?.data || new Error(message); 
  }
};

// --- NUEVAS FUNCIONES ---

/**
 * Obtiene un paciente por su ID.
 * @param {string} id - El ID del paciente.
 */
export const getPacienteById = async (id) => {
  try {
    // Llama a: GET /api/pacientes/:id
    const response = await api.get(`/pacientes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener paciente con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Actualiza la información de un paciente por su ID.
 * @param {string} id - El ID del paciente.
 * @param {object} pacienteData - Los datos a actualizar.
 */
export const updatePaciente = async (id, pacienteData) => {
  try {
    // Llama a: PUT /api/pacientes/:id
    const response = await api.put(`/pacientes/${id}`, pacienteData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error desconocido al actualizar paciente';
    console.error(`Error al actualizar paciente con ID ${id}:`, message);
    // Devuelve el objeto de error para que el componente lo use
    throw error.response?.data || new Error(message);
  }
};