import React from 'react';
import styles from './Button.module.css';

function Button({ children, onClick, variant = 'primary', ...props }) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;