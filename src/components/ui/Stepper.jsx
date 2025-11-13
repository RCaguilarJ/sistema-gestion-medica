import React from 'react';
import styles from './Stepper.module.css';
import { FaCheck } from 'react-icons/fa'; // Importamos el ícono de check

// Un componente pequeño para un solo paso
const Step = ({ number, active, done }) => {
  const getStyle = () => {
    if (active) return styles.circleActive;
    if (done) return styles.circleDone;
    return '';
  };
  return (
    <div className={styles.step}>
      <div className={`${styles.circle} ${getStyle()}`}>
        {done ? <FaCheck /> : number}
      </div>
    </div>
  );
};

// El componente principal del Stepper
function Stepper({ currentStep, totalSteps = 5 }) {
  const steps = [];
  for (let i = 1; i <= totalSteps; i++) {
    steps.push(
      <Step 
        key={i} 
        number={i} 
        active={i === currentStep} 
        done={i < currentStep} 
      />
    );
    if (i < totalSteps) {
      steps.push(
        <div 
          key={`line-${i}`} 
          className={`${styles.line} ${i < currentStep ? styles.lineDone : ''}`} 
        />
      );
    }
  }

  return <div className={styles.stepper}>{steps}</div>;
}

export default Stepper;