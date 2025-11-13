import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './Chart.module.css';

// 1. Registramos los módulos para Barras
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function BarChart({ title, subtitle, data: chartData }) {
  // 3. Opciones
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // No mostramos leyenda en la de barras
      },
    },
    scales: {
      y: {
        beginAtZero: true,
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
        {/* 4. Renderizamos el componente Bar */}
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default BarChart;