import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // --- RUTA TEMPORAL PÚBLICA ---
    // Esta ruta nos da acceso al layout y a la página de Configuración
    // SIN la protección de <ProtectedRoute />.
    path: '/crear-admin-temporal', 
    element: <Layout />, 
    children: [{ index: true, element: <Configuracion /> }]
  },
  {
    // --- RUTAS PROTEGIDAS (El resto de la app) ---
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'pacientes', element: <Pacientes /> },
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