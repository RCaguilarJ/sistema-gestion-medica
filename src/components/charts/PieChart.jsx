import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from './Chart.module.css';

// 1. Registramos los módulos de Chart.js necesarios para Pie
ChartJS.register(ArcElement, Tooltip, Legend);

// Componente de Gráfica de Pastel
function PieChart({ title, subtitle, data: chartData }) {
  // 3. Opciones de la gráfica
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Importante para que respete la altura del CSS
    plugins: {
      legend: {
        display: true, // Mostramos la leyenda (puedes ponerla en 'bottom')
        position: 'bottom',
      },
    },
  };

  return (
    <div>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.chartContainer}>
        {/* 4. Renderizamos el componente Pie de la librería */}
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

export default PieChart;