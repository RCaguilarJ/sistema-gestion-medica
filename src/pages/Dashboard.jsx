import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import Card from '../components/ui/Card.jsx';
import PieChart from '../components/charts/PieChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import { getDashboardStats } from '../services/dashboardService.js'; 
import { 
  FaUsers, 
  FaHeartbeat, 
  FaChartLine, 
  FaExclamationTriangle 
} from 'react-icons/fa';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  const pieDataHba1c = {
    labels: ['Controlado (<7%)', 'Riesgo (7-9%)', 'Sin Control (>9%)'],
    datasets: [{
      data: stats.hba1c, 
      backgroundColor: ['#00C49F', '#FFBB28', '#FF8042'], 
      borderWidth: 0,
    }],
  };

  const pieDataImc = {
    labels: ['Normal', 'Sobrepeso', 'Obesidad'],
    datasets: [{
      data: stats.imc, 
      backgroundColor: ['#00C49F', '#FFBB28', '#FF8042'],
      borderWidth: 0,
    }],
  };

  const barDataMunicipios = {
    labels: stats.municipios.labels, 
    datasets: [{
      label: 'Beneficiarios',
      data: stats.municipios.data, 
      backgroundColor: '#3B82F6', 
      borderRadius: 4,
    }],
  };

  const lineDataMock = {
    labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
    datasets: [
      { 
        label: 'Adherencia (%)', 
        data: [65, 70, 72, 75, 78], 
        borderColor: '#00C49F', 
        backgroundColor: 'rgba(0, 196, 159, 0.1)', 
        yAxisID: 'y' 
      },
      { 
        label: 'HbA1c Promedio', 
        data: [8.2, 8.1, 8.0, 7.8, 7.5], 
        borderColor: '#FF8042', 
        backgroundColor: 'rgba(255, 128, 66, 0.1)', 
        yAxisID: 'y1' 
      },
    ],
  };

  const renderSeverityTag = (tipo) => {
    const isHigh = tipo === 'Alta';
    const style = {
      padding: '4px 12px',
      borderRadius: '12px',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '0.75rem',
      backgroundColor: isHigh ? '#DC3545' : '#FFC107',
      textTransform: 'uppercase'
    };
    return <span style={style}>{tipo}</span>;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Panel de Control Administrativo</h1>
        <p className={styles.subtitle}>
          Vista general basada en {stats.kpis.total} beneficiarios registrados
        </p>
      </div>

      <div className={styles.gridContainer}>
        
        {/* --- FILA 1: KPIs --- */}
        <div className={styles.kpi1}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#e6f7ff', padding: '10px', borderRadius: '50%' }}>
                  <FaUsers size={24} color="#007bff" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
                      {stats.kpis.total}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      Total Beneficiarios
                    </p>
                </div>
            </div>
          </Card>
        </div>
        
        <div className={styles.kpi2}>
            <Card>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#e6fffa', padding: '10px', borderRadius: '50%' }}>
                  <FaHeartbeat size={24} color="#00C49F" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
                      {stats.kpis.activos}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      Pacientes Activos
                    </p>
                </div>
            </div>
            </Card>
        </div>
        
        <div className={styles.kpi3}>
          <Card>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff7e6', padding: '10px', borderRadius: '50%' }}>
                  <FaChartLine size={24} color="#FFBB28" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>78%</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Adherencia Global</p>
                </div>
            </div>
          </Card>
        </div>

        <div className={styles.kpi4}>
          <Card>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff1f0', padding: '10px', borderRadius: '50%' }}>
                  <FaExclamationTriangle size={24} color="#DC3545" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#DC3545' }}>
                      {stats.hba1c[2]} 
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      {/* CORRECCIÓN AQUÍ: Usamos &gt; en lugar de > */}
                      Sin Control (&gt;9%)
                    </p>
                </div>
            </div>
          </Card>
        </div>

        {/* --- FILA 2: Gráficas de Pastel --- */}
        <div className={styles.pie1}>
          <Card>
            <PieChart 
              title="Distribución Control Glucémico (HbA1c)" 
              subtitle="Clasificación por rangos de control"
              data={pieDataHba1c} 
            />
          </Card>
        </div>
        <div className={styles.pie2}>
          <Card>
            <PieChart 
              title="Distribución IMC" 
              subtitle="Estado nutricional de beneficiarios"
              data={pieDataImc} 
            />
          </Card>
        </div>

        {/* --- FILA 3: Barras y Líneas --- */}
        <div className={styles.barChart}>
          <Card>
            <BarChart 
              title="Beneficiarios por Municipio" 
              subtitle="Top 5 municipios con más pacientes"
              data={barDataMunicipios} 
            />
          </Card>
        </div>
        <div className={styles.lineChart}>
          <Card>
            <LineChart 
              title="Tendencias Mensuales" 
              subtitle="HbA1c promedio y adherencia"
              data={lineDataMock} 
            />
          </Card>
        </div>

        {/* --- FILA 4: Alertas y Pendientes --- */}
        <div className={styles.alerts}>
          <Card>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              Alertas y Pendientes
            </h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Pacientes que requieren atención inmediata
            </p>

            {stats.alertas && stats.alertas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {stats.alertas.map((alerta, idx) => (
                        <div key={idx} style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '1rem',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            borderLeft: '4px solid #DC3545',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <FaExclamationTriangle color="#DC3545" size={18} />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#333' }}>
                                      {alerta.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                      {alerta.mensaje}
                                    </div>
                                </div>
                            </div>
                            {renderSeverityTag(alerta.tipo)}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: '#888', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px',
                  border: '1px dashed #e5e7eb'
                }}>
                    <p style={{ margin: 0 }}>✅ Todo en orden. No hay alertas críticas por el momento.</p>
                </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;