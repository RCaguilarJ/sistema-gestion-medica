import React, { useEffect, useRef, useState } from 'react';
import styles from './Layout.module.css';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthContext.jsx';
import { FaTachometerAlt, FaUsers, FaUpload, FaFileAlt, FaCog, FaSignOutAlt, FaBars, FaTimes, FaBell } from 'react-icons/fa';
import logoAmd from '../../assets/img/logo.png'; 
import useNotificationStream from '../../hooks/useNotificationStream.js';

function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const { notifications, status: notificationStatus } = useNotificationStream({ pollIntervalMs: 12000 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [readMap, setReadMap] = useState({});
  const notifWrapperRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen(v => !v);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (event) => {
      if (!notifWrapperRef.current) return;
      if (!notifWrapperRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const toggleNotifications = () => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (!prev && notifications.length) {
        const nextMap = { ...readMap };
        notifications.forEach((item) => {
          nextMap[item.id] = true;
        });
        setReadMap(nextMap);
      }
      return next;
    });
  };

  const unreadCount = notifications.reduce((count, item) => (readMap[item.id] ? count : count + 1), 0);

  const statusLabel = {
    idle: 'Inactivo',
    connecting: 'Conectando…',
    connected: 'Tiempo real activo',
    reconnecting: 'Reconectando…',
    error: 'Sin conexión',
    unsupported: 'Polling automático',
  }[notificationStatus] || 'Sin conexión';

  const statusClassName = {
    idle: styles.notificationStatusIdle,
    connecting: styles.notificationStatusConnecting,
    connected: styles.notificationStatusConnected,
    reconnecting: styles.notificationStatusReconnecting,
    error: styles.notificationStatusError,
    unsupported: styles.notificationStatusPolling,
  }[notificationStatus] || styles.notificationStatusError;

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <img src={logoAmd} alt="Logo AMD" className={styles.navbarLogo} />

        <button aria-label="Abrir menú" className={styles.menuButton} onClick={toggleMobile}>
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ''}`}>
          {/* CORRECCIÓN: Rutas actualizadas con el prefijo /app */}
          <NavLink onClick={closeMobile} to="/app" end className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaTachometerAlt /> <span>Dashboard</span>
          </NavLink>
          <NavLink onClick={closeMobile} to="/app/pacientes" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaUsers /> <span>Pacientes</span>
          </NavLink>
          <NavLink onClick={closeMobile} to="/app/importar" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaUpload /> <span>Importar</span>
          </NavLink>
          <NavLink onClick={closeMobile} to="/app/reportes" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            <FaFileAlt /> <span>Reportes</span>
          </NavLink>
          {isAdmin && (
            <NavLink onClick={closeMobile} to="/app/configuracion" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
              <FaCog /> <span>Configuración</span>
            </NavLink>
          )}
        </div>

        <div className={`${styles.mobileBackdrop} ${mobileOpen ? styles.mobileBackdropOpen : ''}`} onClick={closeMobile} />

        <div className={styles.navbarUser}>
          <div className={styles.notificationWrapper} ref={notifWrapperRef}>
            <button
              type="button"
              className={`${styles.notificationButton} ${notifOpen ? styles.notificationButtonActive : ''}`}
              onClick={toggleNotifications}
              aria-label="Notificaciones"
            >
              <FaBell />
              <span className={`${styles.notificationStatusDot} ${statusClassName}`} title={statusLabel} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className={styles.notificationPanel}>
                <header className={styles.notificationPanelHeader}>
                  <span>Notificaciones</span>
                  <small>{statusLabel}</small>
                </header>
                <div className={styles.notificationList}>
                  {notifications.length === 0 && (
                    <p className={styles.notificationEmpty}>Sin novedades recientes</p>
                  )}
                  {notifications.map((item) => {
                    const title = item.payload?.title || item.type;
                    const message = item.payload?.message || item.payload?.summary || '';
                    const timestamp = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
                    return (
                      <article key={item.id} className={styles.notificationItem}>
                        <h4>{title}</h4>
                        {message && <p>{message}</p>}
                        {timestamp && <time dateTime={item.createdAt}>{timestamp}</time>}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <span>{user?.nombre || 'Usuario'}</span>
          <div className={styles.userAvatar}>{(user?.nombre || 'U')[0]}</div>
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