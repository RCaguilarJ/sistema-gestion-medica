import React from 'react';
import styles from './Layout.module.css';
import { Outlet, NavLink } from 'react-router-dom'; // <-- Quitamos useNavigate
// import { useAuth } from '../../hooks/AuthContext.jsx'; // <-- ELIMINADO
import { 
  FaTachometerAlt, FaUsers, FaUpload, FaFileAlt, FaCog 
} from 'react-icons/fa'; // <-- Quitamos FaSignOutAlt
import logoAmd from '../../assets/img/logo.png'; 

function Layout() {
  // const { logout } = useAuth(); // <-- ELIMINADO
  // const navigate = useNavigate(); 
  
  // const handleLogout = () => { ... }; // <-- ELIMINADO

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <img src={logoAmd} alt="Logo AMD" className={styles.navbarLogo} />
        
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
          
          {/* Botón de Logout ELIMINADO */}
        </div>
      </nav>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;