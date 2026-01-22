// src/services/authService.js
import api from "./api.js";

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email: email, // El backend espera 'email'
      password: password,
    });

    const { token: tokenFromApi, jwt: jwtFromApi, user } = response.data || {};
    const token = tokenFromApi || jwtFromApi;

    if (!token) {
      throw new Error("La respuesta del servidor no incluye un token");
    }

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
export const register = async (nombre, username, email, password, role, options = {}) => {
  const { persistSession = true } = options;
  try {
    const normalizedRole = (role || '').toUpperCase();
    const response = await api.post("/auth/register", {
      nombre: nombre,
      username: username,
      email: email,
      password: password,
      role: normalizedRole,
    });

    const { token: tokenFromApi, jwt: jwtFromApi, user } = response.data || {};
    const token = tokenFromApi || jwtFromApi;

    if (!token && persistSession) {
      throw new Error("La respuesta del servidor no incluye un token");
    }

    if (persistSession && token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

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
