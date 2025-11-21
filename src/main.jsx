// Ruta: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';

// Páginas
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import DetallePacientePage from './pages/DetallePacientePage.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';

// Componente auxiliar para redirigir si ya está logueado
const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  // Si ya está autenticado, mándalo al dashboard automáticamente
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <Login />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />, // Usamos el componente inteligente
  },
  {
    path: '/',
    // Redirige automáticamente al login al entrar a la raíz
    element: <Navigate to="/login" replace />,
  },
  // Rutas protegidas
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'pacientes', element: <Pacientes /> },
          { path: 'pacientes/:id', element: <DetallePacientePage /> },
          { path: 'importar', element: <Importar /> },
          { path: 'reportes', element: <Reportes /> },
          { path: 'configuracion', element: <Configuracion /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);