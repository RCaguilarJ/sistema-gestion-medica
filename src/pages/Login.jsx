import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../hooks/AuthContext.jsx'; 
import { useNavigate } from 'react-router-dom';
import logo from '../assets/img/logo.png'; 


function EyeIcon({ open, ...props }) {
  // SVG simple de ojo abierto/cerrado
  return open ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="12" rx="8" ry="5" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="12" rx="8" ry="5" />
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const success = await login(email, password);

    if (success) {
      // CORRECCIÓN: Navegar directamente a la ruta base de la app
      navigate('/app'); 
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>Plataforma Médica</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.formGroup} style={{ position: 'relative' }}>
            <label>Contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 38 }}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: 10,
                top: 38,
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                height: 28
              }}
              tabIndex={0}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" className={styles.submitButton}>Entrar</button>
        </form>
      </div>
    </div>
  );
}
export default Login;