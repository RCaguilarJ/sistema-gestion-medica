import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthContext.jsx';

// Mapa de rutas y sus roles permitidos
const ROUTE_PERMISSIONS = {
  '/app': ['DOCTOR', 'NUTRIOLOGO', 'ADMINISTRADOR', 'ADMIN'],
  '/app/configuracion': ['ADMINISTRADOR', 'ADMIN'],
  '/app/pacientes': ['DOCTOR', 'NUTRIOLOGO', 'ADMINISTRADOR', 'ADMIN'],
  '/app/reportes': ['DOCTOR', 'NUTRIOLOGO', 'ADMINISTRADOR', 'ADMIN'],
  '/app/importar': ['ADMINISTRADOR', 'ADMIN'],
  '/app/dashboard': ['DOCTOR', 'NUTRIOLOGO', 'ADMINISTRADOR', 'ADMIN'],
};

function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Si no está autenticado, redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Obtener la ruta actual
  const currentPath = location.pathname;

  // Intentar resolver la clave de permisos más cercana (soporta subrutas)
  const matchedKey = Object.keys(ROUTE_PERMISSIONS).find((key) =>
    currentPath === key || currentPath.startsWith(key + '/') || (key === '/app' && currentPath.startsWith('/app'))
  );

  const requiredRoles = matchedKey ? ROUTE_PERMISSIONS[matchedKey] : null;

  // Normalizar roles (trim + mayúsculas) y permitir coincidencias flexibles (p.ej. ADMIN dentro de ADMINISTRADOR)
  const userRoleNormalized = (user?.role || '').toUpperCase().trim();
  const requiredRolesNormalized = requiredRoles ? requiredRoles.map(r => r.toUpperCase().trim()) : null;
  const hasAccess = !requiredRolesNormalized || (user && requiredRolesNormalized.some(rr => rr === userRoleNormalized || userRoleNormalized.includes(rr) || rr.includes(userRoleNormalized)));

  // Debugging temporal
  console.log('Ruta actual:', location.pathname);
  console.log('Rol usuario (normalizado):', userRoleNormalized);
  console.log('Permisos requeridos (normalizados):', requiredRolesNormalized);
  console.log('¿Tiene acceso?:', hasAccess);

  if (requiredRoles && !hasAccess) {
    // Si no tiene permiso, redirige al dashboard
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
