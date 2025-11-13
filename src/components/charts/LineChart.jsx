import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './Chart.module.css';

// 1. Registramos los módulos para Líneas
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LineChart({ title, subtitle, data: chartData }) {
  // 3. Opciones (con dos ejes Y)
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom', // Leyenda abajo, como en tu diseño
      },
    },
    scales: {
      y: { // Eje Y Izquierdo (para Adherencia %)
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100, // %
      },
      y1: { // Eje Y Derecho (para HbA1c)
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false, // No dibujar cuadrícula de este eje
        },
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
        {/* 4. Renderizamos el componente Line */}
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default LineChart;