// src/services/pacienteService.js
import api from './api.js';

// Función para obtener TODOS los pacientes
export const getPacientes = async () => {
  try {
    // 1. Esto ahora llama a tu backend: GET http://localhost:4000/api/pacientes
    const response = await api.get('/pacientes');
    
    // 2. ¡YA NO NECESITAMOS LIMPIAR!
    // Nuestro nuevo backend devuelve un array simple: [{...}, {...}]
    return response.data; 

  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
    return []; 
  }
};

// (Aquí pondremos createPaciente, updatePaciente, etc.)