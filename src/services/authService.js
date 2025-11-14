import api from './api.js'; // Importamos nuestra instancia de Axios actualizada

/**
 * Intenta iniciar sesión en nuestro backend de Express.
 */
export const login = async (email, password) => {
  try {
    // 1. CAMBIO: La ruta ahora es '/auth/login' (en lugar de '/auth/local')
    const response = await api.post('/auth/login', {
      // 2. CAMBIO: Nuestro backend espera 'email' (en lugar de 'identifier')
      email: email, 
      password: password,
    });

    // 3. CAMBIO: Nuestro backend devuelve 'token' (en lugar de 'jwt')
    const { token, user } = response.data;
    
    // Guardamos los datos en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Devolvemos los datos para que AuthContext los use
    return { jwt: token, user }; // (Lo devolvemos como 'jwt' para que AuthContext no se rompa)

  } catch (error) {
    const message = error.response?.data?.message || 'Error desconocido';
    console.error('Error en el login:', message);
    return null; 
  }
};

/**
 * Cierra la sesión del usuario.
 * (Esta función no cambia, sigue siendo correcta)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Intenta registrar un nuevo usuario en nuestro backend de Express.
 */
export const register = async (username, email, password) => {
  try {
    // 1. CAMBIO: La ruta ahora es '/auth/register'
    const response = await api.post('/auth/register', {
      username: username,
      email: email,
      password: password,
    });
    
    // 2. CAMBIO: Nuestro backend devuelve 'token'
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { jwt: token, user }; // (Lo devolvemos como 'jwt')

  } catch (error) {
    const message = error.response?.data?.message || 'Error desconocido';
    console.error('Error en el registro:', message);
    return null;
  }
};