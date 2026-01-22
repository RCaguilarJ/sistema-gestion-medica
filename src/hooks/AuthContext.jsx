import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService.js'; 
import api from '../services/api.js'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return Boolean(token && storedUser);
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data) {
      setUser(data.user);
      setIsAuthenticated(true);
      const token = data.jwt || data.token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
    return true;
  };

  const register = async (nombre, username, email, password, role) => {
    const data = await authService.register(nombre, username, email, password, role);
    if (data) {
      setUser(data.user);
      setIsAuthenticated(true);
      const token = data.jwt || data.token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
