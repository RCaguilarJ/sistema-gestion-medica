import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Importamos nuestro hook

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Si el usuario no está autenticado, lo redirige a /login
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza el contenido de la ruta (el <Outlet>)
  return <Outlet />;
}

export default ProtectedRoute;