import api from './api';

// Función para obtener TODOS los pacientes
export const getPacientes = async () => {
  try {
    // Hacemos una petición GET a 'http://localhost:1337/api/pacientes'
    const response = await api.get('/pacientes');
    
    /*
     Los datos de Strapi vienen en un formato un poco anidado:
     response.data = {
       data: [
         { id: 1, attributes: { nombre: 'Juan', ... } },
         { id: 2, attributes: { nombre: 'Ana', ... } }
       ],
       meta: { ... }
     }
     Vamos a "limpiar" esto para que sea más fácil de usar en React.
    */
    
    const pacientes = response.data.data.map(item => ({
      id: item.id,
      ...item.attributes 
    }));
    
    return pacientes;

  } catch (error) {
    console.error('Error al obtener los pacientes:', error);
    // Devolvemos un array vacío en caso de error
    return []; 
  }
};

// (Aquí pondremos luego createPaciente, updatePaciente, etc.)