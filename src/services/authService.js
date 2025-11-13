import api from './api'; // Importamos nuestra instancia de Axios

/**
 * Intenta iniciar sesión en Strapi.
 * @param {string} email - El email o username del usuario.
 * @param {string} password - La contraseña del usuario.
 * @returns {object|null} - Objeto con { jwt, user } si es exitoso, o null si falla.
 */
export const login = async (email, password) => {
  try {
    // Strapi usa /api/auth/local para el login
    const response = await api.post('/auth/local', {
      identifier: email, // Strapi usa "identifier" para el email/username
      password: password,
    });

    // Si el login es exitoso, Strapi devuelve un JWT y los datos del usuario
    const { jwt, user } = response.data;
    
    // Guardamos los datos en localStorage para mantener al usuario logueado
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    
    // (Más adelante actualizaremos Axios para que use este token)

    return { jwt, user };

  } catch (error) {
    console.error('Error en el login:', error.response.data.error.message);
    // Devolvemos null para que el componente sepa que falló
    return null; 
  }
};

/**
 * Cierra la sesión del usuario.
 */
export const logout = () => {
  // Simplemente borramos los datos de localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * (Como mencionaste, aquí irá la función para crear usuarios)
 * Intenta registrar un nuevo usuario en Strapi.
 * @param {string} username - Nombre de usuario
 * @param {string} email - Email
 * @param {string} password - Contraseña
 */
export const register = async (username, email, password) => {
  try {
    // Usamos el endpoint que activamos: /api/auth/register
    const response = await api.post('/auth/register', {
      username: username,
      email: email,
      password: password,
      // (Aquí podríamos añadir el "Rol" si Strapi lo permite en el registro público)
    });
    
    // Si el registro es exitoso, también nos loguea
    const { jwt, user } = response.data;
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { jwt, user };

  } catch (error) {
    console.error('Error en el registro:', error.response.data.error.message);
    return null;
  }
};