import React from 'react';
import styles from './Layout.module.css';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // <-- 1. IMPORTAR HOOK
import { 
  FaTachometerAlt, FaUsers, FaUpload, FaFileAlt, FaCog, FaSignOutAlt 
} from 'react-icons/fa';
import logoAmd from '../../assets/img/logo.png'; 

function Layout() {
  const { logout } = useAuth(); // <-- 2. OBTENER FUNCIÓN LOGOUT

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <img src={logoAmd} alt="Logo AMD" className={styles.navbarLogo} />
        <div className={styles.navLinks}>
          {/* ... (Todos tus NavLinks) ... */}
        </div>

        <div className={styles.navbarUser}>
          <span>Administrador Sistema</span>
          <div className={styles.userAvatar}>AS</div>
          
          {/* 3. AÑADIR BOTÓN DE LOGOUT */}
          <button onClick={logout} className={styles.logoutButton}>
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