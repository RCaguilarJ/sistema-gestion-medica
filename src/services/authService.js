// src/services/authService.js
import api from "./api.js";

export const login = async (email, password) => {
  try {
    // La ruta ahora es '/auth/login'
    const response = await api.post("/auth/login", {
      email: email, // El backend espera 'email'
      password: password,
    });

    const { token, user } = response.data; // El backend devuelve 'token'

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { jwt: token, user }; // Lo devolvemos como 'jwt' para que AuthContext no se rompa
  } catch (error) {
    const message = error.response?.data?.message || "Error desconocido";
    console.error("Error en el login:", message);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// src/services/authService.js

/**
 * Intenta registrar un nuevo usuario en nuestro backend de Express.
 * (ACTUALIZADO para incluir 'role')
 */
export const register = async (username, email, password, role) => {
  try {
    const response = await api.post("/auth/register", {
      username: username,
      email: email,
      password: password,
      role: role, // <-- ¡Añadido!
    });

    const { token, user } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { jwt: token, user };
  } catch (error) {
    const message = error.response?.data?.message || "Error desconocido";
    console.error("Error en el registro:", message);
    return null;
  }
};
