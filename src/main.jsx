import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 1. IMPORTAR NUESTRAS HERRAMIENTAS DE AUTENTICACIÓN
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Importamos todas las páginas
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';

// 2. REESTRUCTURAR LAS RUTAS
const router = createBrowserRouter([
  {
    // Ruta pública de Login
    path: '/login',
    element: <Login />,
  },
  {
    // Todas las rutas protegidas irán "dentro" de este elemento
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />, // El Layout contiene la Navbar y el Outlet
        children: [
          // Estas son las páginas que se renderizan dentro del Layout
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
    {/* 3. ENVOLVEMOS TODO EN EL AUTHPROVIDER */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);