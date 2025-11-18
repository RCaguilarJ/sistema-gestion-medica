// src/services/userService.js
import api from './api.js';

/**
 * Obtiene la lista de todos los usuarios registrados
 */
export const getUsers = async () => {
  try {
    // Esto llama a: GET http://localhost:4000/api/users
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
};

export default { getUsers };
