import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../hooks/AuthContext.jsx'; 
import { useNavigate } from 'react-router-dom'; // <--- AÑADIDO
import logo from '../assets/img/logo.png'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate(); // <--- AÑADIDO

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const success = await login(email, password);

    if (success) {
      navigate('/'); // <--- AÑADIDO
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
    }
  };

  // (El resto de tu JSX se queda igual)
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Logo Asociación" className={styles.logo} />
        <h1 className={styles.title}>Plataforma Administrativa</h1>
        <p className={styles.subtitle}>Sistema de Gestión Médica y Nutricional</p>
        <form onSubmit={handleSubmit}>
          {/* ... (resto del formulario) ... */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email" id="email" className={styles.input}
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password" id="password" className={styles.input}
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className={styles.submitButton}>Iniciar Sesión</button>
        </form>
        <a href="#" className={styles.forgotPassword}>¿Olvidaste tu contraseña?</a>
      </div>
    </div>
  );
}
export default Login;