import React from 'react';
import styles from './Modal.module.css';
import { FaTimes } from 'react-icons/fa';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Fondo oscuro
    <div className={styles.overlay} onClick={onClose}>
      {/* Contenedor blanco (detenemos la propagación para que no se cierre al hacer clic) */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </div>

        {/* Contenido (aquí irá nuestro formulario) */}
        <div className={styles.modalContent}>
          {children}
        </div>
        
      </div>
    </div>
  );
}

export default Modal;