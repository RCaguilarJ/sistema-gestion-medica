import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute, { AdminRoute } from './components/layout/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Importar from './pages/Importar.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuracion from './pages/Configuracion.jsx';
import DetallePacientePage from './pages/DetallePacientePage.jsx';
import Citas from './pages/Citas.jsx';

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
          { path: 'citas', element: <Citas /> },
          { path: 'importar', element: <AdminRoute><Importar /></AdminRoute> },
          { path: 'reportes', element: <AdminRoute><Reportes /></AdminRoute> },
          { path: 'configuracion', element: <AdminRoute><Configuracion /></AdminRoute> },
        ],
      },
    ],
  },
]);

function login() {
  return <RouterProvider router={router} />;
}

export default login;
