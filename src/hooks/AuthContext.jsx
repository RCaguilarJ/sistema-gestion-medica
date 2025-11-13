import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService'; // Importa todo desde authService
import api from '../services/api'; // Importamos la instancia de Axios

// 1. Crear el Contexto
const AuthContext = createContext(null);

// 2. Crear el Proveedor (AuthProvider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 3. Revisar si ya existe un token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      // ¡IMPORTANTE! Aplicar el token a todas las peticiones futuras de Axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // 4. Función de Login para que la usen los componentes
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data) {
      setUser(data.user);
      setIsAuthenticated(true);
      // Aplicar el token a Axios para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`;
      return true;
    }
    return false;
  };

  // 5. Función de Logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Borramos el token de los headers de Axios
    delete api.defaults.headers.common['Authorization'];
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 6. Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};