import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';
import DetallePacientePage from './pages/DetallePacientePage.jsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
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

function login() {
  return <RouterProvider router={router} />;
}

export default login;
