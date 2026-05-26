import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthContext.jsx';
import { canAccessAdminTools, isAdminRole, isFinanceRole } from '../../utils/roles.js';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

export function AccessTokenRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessAdminTools(user)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export function FinanceRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminRole(user?.role) && !isFinanceRole(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export function CitasRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminRole(user?.role) || isFinanceRole(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
