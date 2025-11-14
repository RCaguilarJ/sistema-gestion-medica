import React, { useState } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom'; // <-- Solo importamos useNavigate
// import { useAuth } from '../hooks/AuthContext.jsx'; // <-- ELIMINADO
import logo from '../assets/img/logo.png'; 

function Login() {
  const [email, setEmail] = useState('usuario@amd.org'); // (Valor de ejemplo)
  const [password, setPassword] = useState('********'); // (Valor de ejemplo)
  
  const navigate = useNavigate(); // <-- Inicializamos useNavigate

  const handleSubmit = (event) => {
    event.preventDefault();
    // ¡PARCHE! Simplemente redirigimos al dashboard
    // sin validar con Strapi.
    console.log('Simulando login...');
    navigate('/'); 
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Logo Asociación" className={styles.logo} />

        <h1 className={styles.title}>Plataforma Administrativa</h1>
        <p className={styles.subtitle}>
          Sistema de Gestión Médica y Nutricional
        </p>

        <form onSubmit={handleSubmit}>
          {/* ... (select de tipo de usuario) ... */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Iniciar Sesión
          </button>
        </form>

        <a href="#" className={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </div>
  );
}

export default Login;