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
    const status = error.response?.status;
    const respData = error.response?.data;
    const message = respData?.message || error.message || "Error desconocido";
    console.error("Error en el login:", {
      status,
      message,
      respData,
      url: error.config?.url,
    });
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
 * (ACTUALIZADO para incluir 'nombre' y 'role')
 */
export const register = async (nombre, username, email, password, role) => {
  try {
    const response = await api.post("/auth/register", {
      nombre: nombre,
      username: username,
      email: email,
      password: password,
      role: role,
    });

    const { token, user } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { jwt: token, user };
  } catch (error) {
    const status = error.response?.status;
    const respData = error.response?.data;
    const message = respData?.message || error.message || "Error desconocido";
    console.error("Error en el registro:", {
      status,
      message,
      respData,
      url: error.config?.url,
    });
    return null;
  }
};
