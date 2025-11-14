// src/services/pacienteService.js
import api from './api.js';

// Función para obtener TODOS los pacientes
export const getPacientes = async () => {
  try {
    // Esto llama a: GET http://localhost:4000/api/pacientes
    const response = await api.get('/pacientes');
    
    // Nuestro backend devuelve un array simple, así que lo retornamos
    return response.data; 

  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
    return []; 
  }
};

// --- ¡NUEVA FUNCIÓN! ---
/**
 * Crea un nuevo paciente en la base de datos.
 * @param {object} pacienteData - Los datos del formulario (nombre, curp, etc.)
 */
export const createPaciente = async (pacienteData) => {
  try {
    // Esto llama a: POST http://localhost:4000/api/pacientes
    const response = await api.post('/pacientes', pacienteData);
    
    // Devuelve el nuevo paciente creado
    return response.data;

  } catch (error) {
    const message = error.response?.data?.message || 'Error desconocido al crear paciente';
    console.error('Error al crear el paciente:', message);
    return null; 
  }
};

// (Aquí pondremos updatePaciente, deletePaciente, etc. después)