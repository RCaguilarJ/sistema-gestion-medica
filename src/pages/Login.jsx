import React, { useState } from 'react';
import styles from './Login.module.css';

// 1. Importamos nuestro hook useAuth
import { useAuth } from '../hooks/useAuth';

import logo from '../assets/img/logo.png'; 

function Login() {
  const [email, setEmail] = useState(''); // Empezamos con inputs vacíos
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // 2. Obtenemos la función 'login' del contexto
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    // 3. Llamamos a la función 'login' del contexto
    const success = await login(email, password);
    
    if (!success) {
      setError('Correo electrónico o contraseña incorrectos.');
    }
    // (La redirección ahora ocurre DENTRO de la función 'login' del hook)
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Logo Asociación" className={styles.logo} />
        {/* ... (títulos) ... */}
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
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className={styles.submitButton}>
            Iniciar Sesión
          </button>
        </form>
        {/* ... (link de olvidar contraseña) ... */}
      </div>
    </div>
  );
}

export default Login;