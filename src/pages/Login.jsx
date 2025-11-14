import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../hooks/AuthContext.jsx'; 
import { useNavigate } from 'react-router-dom'; // <--- 1. IMPORTAR
import Button from '../components/ui/Button.jsx';
import logo from '../assets/img/logo.png'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate(); // <--- 2. INICIALIZAR

  // Mostrar siempre el botón para crear el primer usuario
  const showCreateAdmin = true;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    const success = await login(email, password);
    
    if (success) {
      navigate('/'); // <--- 3. REDIRIGIR
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
    }
  };

  // (El resto de tu JSX de <form> y <div>s se queda igual)
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Logo Asociación" className={styles.logo} />
        <h1 className={styles.title}>Plataforma Administrativa</h1>
        <p className={styles.subtitle}>Sistema de Gestión Médica y Nutricional</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="userType">Tipo de Usuario</label>
            <select id="userType" className={styles.select}>
              <option>Administrador</option>
              <option>Doctor</option>
              <option>Nutriólogo</option>
            </select>
          </div>
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
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className={styles.submitButton}>
            Iniciar Sesión
          </button>
        </form>
        <a href="#" className={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </a>
        {showCreateAdmin && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/crear-admin-temporal')}
            >
              Crear primer usuario (Administrador)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;