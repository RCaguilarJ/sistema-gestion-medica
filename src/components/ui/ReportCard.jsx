import React from 'react';
import styles from './ReportCard.module.css';
import { FaFileAlt } from 'react-icons/fa'; // Ícono genérico

function ReportCard({ title, description, isActive, onClick }) {
  return (
    <div 
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={onClick}
    >
      <FaFileAlt className={styles.icon} />
      <div>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export default ReportCard;