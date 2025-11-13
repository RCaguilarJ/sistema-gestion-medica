import React from 'react';
import styles from './Tag.module.css';

function Tag({ label }) {
  const getColor = () => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === 'activo') return styles.green;
    if (lowerLabel === 'inactivo') return styles.grey;
    if (lowerLabel === 'alto') return styles.red;
    if (lowerLabel === 'medio') return styles.yellow;
    if (lowerLabel === 'bajo') return styles.green;
    return styles.grey;
  };

  return <span className={`${styles.tag} ${getColor()}`}>{label}</span>;
}

export default Tag;