import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 1. IMPORTACIONES DE AUTH ELIMINADAS
// import { AuthProvider } from './hooks/AuthContext.jsx';
// import ProtectedRoute from './components/layout/ProtectedRoute';

// Importamos todas las páginas
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';

// 2. RUTAS SIMPLIFICADAS
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />, // El Layout es ahora la ruta principal
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'pacientes', element: <Pacientes /> },
      { path: 'importar', element: <Importar /> },
      { path: 'reportes', element: <Reportes /> },
      { path: 'configuracion', element: <Configuracion /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. YA NO NECESITAMOS AUTHPROVIDER */}
    <RouterProvider router={router} />
  </React.StrictMode>
);