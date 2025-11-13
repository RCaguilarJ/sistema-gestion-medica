import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. IMPORTAR useNavigate
import * as authService from '../services/authService'; 
import api from '../services/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // <--- 2. INICIALIZAR useNavigate

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data) {
      setUser(data.user);
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`;
      navigate('/'); // <--- 3. AÑADIR REDIRECCIÓN AL DASHBOARD
      return true;
    }
    return false;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login'); // <--- 4. AÑADIR REDIRECCIÓN AL LOGIN
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};