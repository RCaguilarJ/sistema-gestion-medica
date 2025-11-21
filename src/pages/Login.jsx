import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../hooks/AuthContext.jsx'; 
import { useNavigate } from 'react-router-dom';
import logo from '../assets/img/logo.png'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
          <div className={styles.formGroup}>
            <label>Contraseña</label>
            <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" className={styles.submitButton}>Entrar</button>
        </form>
      </div>
    </div>
  );
}
export default Login;