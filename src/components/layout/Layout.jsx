import React from 'react';
import styles from './Layout.module.css';
import { Outlet, NavLink, useNavigate } from 'react-router-dom'; // <--- 1. IMPORTAR useNavigate
import { useAuth } from '../../hooks/AuthContext.jsx';
import { 
  FaTachometerAlt, FaUsers, FaUpload, FaFileAlt, FaCog, FaSignOutAlt 
} from 'react-icons/fa';
import logoAmd from '../../assets/img/logo.png'; 

function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate(); // <--- 2. INICIALIZAR useNavigate

  // 3. Creamos una función para manejar el logout
  const handleLogout = () => {
    logout();
    navigate('/login'); // <--- 4. REDIRIGIMOS AL LOGIN
  };

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <img src={logoAmd} alt="Logo AMD" className={styles.navbarLogo} />
        
        {/* FALTABAN TUS NAVLINKS. LOS HE AÑADIDO DE VUELTA. */}
        <div className={styles.navLinks}>
          <NavLink to="/" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaTachometerAlt /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/pacientes" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaUsers /> <span>Pacientes</span>
          </NavLink>
          <NavLink to="/importar" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaUpload /> <span>Importar</span>
          </NavLink>
          <NavLink to="/reportes" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaFileAlt /> <span>Reportes</span>
          </NavLink>
          <NavLink to="/configuracion" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaCog /> <span>Configuración</span>
          </NavLink>
        </div>

        <div className={styles.navbarUser}>
          <span>Administrador Sistema</span>
          <div className={styles.userAvatar}>AS</div>
          
          {/* 5. Usamos la nueva función handleLogout */}
          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt />
          </button>
        </div>
      </nav>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;