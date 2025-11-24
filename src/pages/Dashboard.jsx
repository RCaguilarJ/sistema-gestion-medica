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

  // --- CÁLCULOS KPI 2 (Control Glucémico) ---
  const totalConHba1c = stats.hba1c.reduce((a, b) => a + b, 0);
  const pacientesControlados = stats.hba1c[0];
  const porcentajeControl = totalConHba1c > 0 
    ? Math.round((pacientesControlados / totalConHba1c) * 100) 
    : 0;

  // --- CONFIG GRÁFICAS ---
  const pieDataHba1c = {
    labels: ['Controlado (<7%)', 'Precaución (7-9%)', 'Riesgo Alto (>9%)'],
    datasets: [{
      data: stats.hba1c, 
      backgroundColor: ['#00C49F', '#FFBB28', '#DC3545'], 
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

  // Gráfica de línea (Tendencias visuales)
  const currentRisk = stats.hba1c[2]; 
  const prevRisk = currentRisk + 2; 

  const lineDataMock = {
    labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
    datasets: [
      { 
        label: 'Riesgo Alto', 
        data: [prevRisk + 1, prevRisk - 1, prevRisk + 2, prevRisk, currentRisk], 
        borderColor: '#DC3545', 
        backgroundColor: 'rgba(220, 53, 69, 0.1)', 
        fill: true,
        tension: 0.4,
        yAxisID: 'y' 
      },
      { 
        label: 'Adherencia', 
        data: [60, 65, 62, 70, stats.adherencia], // Conectamos el último punto al real
        borderColor: '#FFBB28', 
        backgroundColor: 'rgba(255, 187, 40, 0.1)', 
        tension: 0.4,
        yAxisID: 'y1' 
      },
    ],
  };

  const renderSeverityTag = (tipo) => {
    const isHigh = tipo === 'Alta';
    return (
        <span style={{
            padding: '4px 12px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem',
            backgroundColor: isHigh ? '#DC3545' : '#FFC107', textTransform: 'uppercase'
        }}>
            {tipo}
        </span>
    );
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
        
        {/* KPI 1: Total */}
        <div className={styles.kpi1}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#e6f7ff', padding: '12px', borderRadius: '50%' }}>
                  <FaUsers size={24} color="#007bff" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>{stats.kpis.total}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Beneficiarios</p>
                </div>
            </div>
          </Card>
        </div>
        
        {/* KPI 2: Control Glucémico */}
        <div className={styles.kpi2}>
            <Card>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ backgroundColor: '#e6fffa', padding: '12px', borderRadius: '50%', marginTop: '5px' }}>
                  <FaHeartbeat size={24} color="#00C49F" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', lineHeight: '1' }}>
                      {porcentajeControl}%
                    </h3>
                    <p style={{ margin: '5px 0 2px 0', color: '#333', fontWeight: '600', fontSize: '0.9rem' }}>
                     Control Glucémico
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                      {pacientesControlados} controlados
                    </p>
                </div>
            </div>
            </Card>
        </div>
        
        {/* --- KPI 3: ADHERENCIA (ACTUALIZADO ESTILO IMAGEN) --- */}
        <div className={styles.kpi3}>
          <Card>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Ícono Amarillo con Fondo Amarillo Claro */}
                <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '50%', marginTop: '5px' }}>
                  <FaChartLine size={24} color="#FFBB28" />
                </div>
                
                <div>
                    {/* Porcentaje Grande y Negro */}
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#000', lineHeight: '1' }}>
                        {stats.adherencia}%
                    </h3>
                    
                    {/* Etiqueta Gris Oscuro */}
                    <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '0.95rem', fontWeight: '500' }}>
                       Asistencia a citas programadas
                    </p>
                </div>
            </div>
          </Card>
        </div>

        {/* KPI 4: Riesgo */}
        <div className={styles.kpi4}>
          <Card>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff1f0', padding: '12px', borderRadius: '50%', marginTop: '5px' }}>
                  <FaExclamationTriangle size={24} color="#DC3545" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#DC3545', lineHeight: '1' }}>
                      {stats.hba1c[2]} 
                    </h3>
                    <p style={{ margin: '5px 0 2px 0', color: '#333', fontWeight: '600', fontSize: '0.9rem' }}>
                      Pacientes en Riesgo
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>Requieren atención</p>
                    <p style={{ margin: '5px 0 0 0', color: '#DC3545', fontSize: '0.75rem', fontWeight: '600' }}>
                      ↘ -2 vs semana anterior
                    </p>
                </div>
            </div>
          </Card>
        </div>

        {/* GRÁFICAS */}
        <div className={styles.pie1}><Card><PieChart title="Distribución Control Glucémico" subtitle="Clasificación HbA1c" data={pieDataHba1c} /></Card></div>
        <div className={styles.pie2}><Card><PieChart title="Distribución IMC" subtitle="Estado nutricional" data={pieDataImc} /></Card></div>
        <div className={styles.barChart}><Card><BarChart title="Beneficiarios por Municipio" subtitle="Top 5" data={barDataMunicipios} /></Card></div>
        <div className={styles.lineChart}><Card><LineChart title="Tendencias Mensuales" subtitle="HbA1c y Adherencia" data={lineDataMock} /></Card></div>

        {/* ALERTAS */}
        <div className={styles.alerts}>
          <Card>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Alertas y Pendientes</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pacientes que requieren atención inmediata</p>
            {stats.alertas && stats.alertas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {stats.alertas.map((alerta, idx) => (
                        <div key={idx} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', borderLeft: '4px solid #DC3545'}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <FaExclamationTriangle color="#DC3545" size={18} />
                                <div><div style={{ fontWeight: '600', color: '#333' }}>{alerta.nombre}</div><div style={{ fontSize: '0.85rem', color: '#666' }}>{alerta.mensaje}</div></div>
                            </div>
                            {renderSeverityTag(alerta.tipo)}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{padding: '3rem', textAlign: 'center', color: '#888', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb'}}><p style={{ margin: 0 }}>✅ Todo en orden.</p></div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;