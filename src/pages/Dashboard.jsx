import React from 'react';
import styles from './Dashboard.module.css';
import Card from '../components/ui/Card.jsx';

// 1. Importamos nuestros nuevos componentes de gráficas
import PieChart from '../components/charts/PieChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';

// --- DATOS DE EJEMPLO (MOCK DATA) ---

// Datos para la primera Gráfica de Pastel (Control Glucémico)
const pieData1 = {
  labels: ['Controlado', 'No Controlado', 'Riesgo'],
  datasets: [
    {
      label: 'Pacientes',
      data: [12, 19, 3], // Datos de ejemplo
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)', // Verde
        'rgba(255, 99, 132, 0.6)', // Rojo
        'rgba(255, 206, 86, 0.6)', // Amarillo
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

// Datos para la Gráfica de Barras (Beneficiarios por Municipio)
const barData = {
  labels: ['Guadalajara', 'Zapopan', 'Tlaquepaque'],
  datasets: [
    {
      label: 'Beneficiarios',
      data: [12, 19, 7], // Datos de ejemplo
      backgroundColor: 'rgba(54, 162, 235, 0.6)', // Azul
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    },
  ],
};

// Datos para la Gráfica de Líneas (Tendencias)
const lineData = {
  labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
  datasets: [
    {
      label: 'Adherencia (%)',
      data: [65, 70, 72, 75, 78], // Datos de ejemplo
      borderColor: 'rgb(75, 192, 192)', // Verde
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      yAxisID: 'y', // Asignar al eje Y izquierdo
    },
    {
      label: 'HbA1c Promedio',
      data: [8.2, 8.1, 8.0, 7.8, 7.5], // Datos de ejemplo
      borderColor: 'rgb(255, 99, 132)', // Rojo
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      yAxisID: 'y1', // Asignar al eje Y derecho
    },
  ],
};
// -------------------------------------

function Dashboard() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Panel de Control Administrativo</h1>
        <p className={styles.subtitle}>
          Vista general de beneficiarios y programas
        </p>
      </div>

      <div className={styles.gridContainer}>
        {/* Fila 1: KPIs (Aún como texto) */}
        <div className={styles.kpi1}><Card>KPI 1: Total Beneficiarios</Card></div>
        <div className={styles.kpi2}><Card>KPI 2: Control Glucémico</Card></div>
        <div className={styles.kpi3}><Card>KPI 3: Adherencia</Card></div>
        <div className={styles.kpi4}><Card>KPI 4: Pacientes en Riesgo</Card></div>

        {/* Fila 2: Gráficas de Pastel (¡AHORA SON REALES!) */}
        <div className={styles.pie1}>
          <Card>
            <PieChart
              title="Distribución Control Glucémico (HbA1c)"
              subtitle="Clasificación por rangos de control"
              data={pieData1}
            />
          </Card>
        </div>
        <div className={styles.pie2}>
          <Card>
            <PieChart
              title="Distribución IMC"
              subtitle="Estado nutricional de beneficiarios"
              data={pieData1} // Re-usamos los mismos datos, puedes cambiarlos
            />
          </Card>
        </div>

        {/* Fila 3: Gráficas de Barras y Líneas (¡AHORA SON REALES!) */}
        <div className={styles.barChart}>
          <Card>
            <BarChart
              title="Beneficiarios por Municipio"
              subtitle="Top 5 municipios con más pacientes"
              data={barData}
            />
          </Card>
        </div>
        <div className={styles.lineChart}>
          <Card>
            <LineChart
              title="Tendencias Mensuales"
              subtitle="HbA1c promedio y adherencia"
              data={lineData}
            />
          </Card>
        </div>

        {/* Fila 4: Alertas (Aún como texto) */}
        <div className={styles.alerts}>
          <Card>Alertas y Pendientes</Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;