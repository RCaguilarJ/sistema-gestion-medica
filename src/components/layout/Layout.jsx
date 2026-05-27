import React, { useState } from "react";
import styles from "./Layout.module.css";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext.jsx";
import useMediaQuery from "../../hooks/useMediaQuery.js";
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaWallet,
  FaUpload,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import {
  canAccessAdminTools,
  hasFinanceConsoleAccess,
  isAdminRole,
} from "../../utils/roles.js";

import logoAmd from "../../assets/img/logo.png";

function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isLaptopUp = useMediaQuery("(min-width: 769px)");

  const role = (user?.role || "").toUpperCase();
  const isAdmin = isAdminRole(role);
  const hasFinanceConsole = hasFinanceConsoleAccess(user);
  const showCitas = !isAdmin && !hasFinanceConsole;
  const canUseAdminTools = canAccessAdminTools(user);
  const displayName = isLaptopUp && (hasFinanceConsole || (isAdmin && !canUseAdminTools))
    ? "Finanzas"
    : isAdmin && isLaptopUp
      ? "Admin"
      : user?.nombre || "Usuario";

  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <img src={logoAmd} alt="Logo" className={styles.navbarLogo} />

        <button
          aria-label="Abrir menú"
          className={styles.menuButton}
          onClick={toggleMobile}
          type="button"
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ""}`}>
          <NavLink
            onClick={closeMobile}
            to="/app"
            end
            className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
          >
            <FaTachometerAlt /> <span>Dashboard</span>
          </NavLink>

          <NavLink
            onClick={closeMobile}
            to="/app/pacientes"
            className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
          >
            <FaUsers /> <span>Pacientes</span>
          </NavLink>

          {showCitas && (
            <NavLink
              onClick={closeMobile}
              to="/app/citas"
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <FaCalendarAlt /> <span>Citas</span>
            </NavLink>
          )}

          {(isAdmin || hasFinanceConsole) && (
            <NavLink
              onClick={closeMobile}
              to="/app/finanzas"
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <FaWallet /> <span>Finanzas</span>
            </NavLink>
          )}

          {canUseAdminTools && (
            <NavLink
              onClick={closeMobile}
              to="/app/importar"
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <FaUpload /> <span>Importar</span>
            </NavLink>
          )}

          {canUseAdminTools && (
            <NavLink
              onClick={closeMobile}
              to="/app/reportes"
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <FaFileAlt /> <span>Reportes</span>
            </NavLink>
          )}

          {canUseAdminTools && (
            <NavLink
              onClick={closeMobile}
              to="/app/configuracion"
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <FaCog /> <span>Configuración</span>
            </NavLink>
          )}
        </div>

        <div
          className={`${styles.mobileBackdrop} ${mobileOpen ? styles.mobileBackdropOpen : ""}`}
          onClick={closeMobile}
        />

        <div className={styles.navbarUser}>
          <span>{displayName}</span>
          <div className={styles.userAvatar}>{displayName[0]}</div>

          <button onClick={handleLogout} className={styles.logoutButton} type="button">
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
