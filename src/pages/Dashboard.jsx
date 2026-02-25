import React, { useEffect, useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import Card from '../components/ui/Card.jsx';
import PieChart from '../components/charts/PieChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import { useAuth } from '../hooks/AuthContext.jsx';
import { getAllPacientesByDoctor, getPacientes } from '../services/pacienteService.js';
import { getCitasPortal } from '../services/consultaCitaService.js';
import { getDashboardStats } from '../services/dashboardService.js';
import { 
  FaUsers, 
  FaHeartbeat, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCheckCircle
} from 'react-icons/fa';

const normalizeCitaEstado = (estado) => {
  if (!estado) return 'Pendiente';
  const normalized = estado.toString().trim().toLowerCase();
  if (normalized === 'pendiente') return 'Pendiente';
  if (normalized === 'confirmada') return 'Confirmada';
  if (normalized === 'cancelada') return 'Cancelada';
  if (normalized === 'completada') return 'Completada';
  if (normalized === 'programada') return 'Programada';
  return estado.toString();
};

const parseImc = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseHba1c = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getImcCategoria = (imc) => {
  if (imc === null) return 'Sin dato';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
};

const getPacienteDate = (paciente) => (
  paciente?.ultimaVisita || paciente?.fechaConsulta || paciente?.fechaDiagnostico
);

const getCitaDate = (cita) => (
  cita?.fechaHora || cita?.fecha_cita || cita?.fechaCita || cita?.fecha
);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildMonthlyBuckets = (monthsBack = 5) => {
  const now = new Date();
  const buckets = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('es-MX', { month: 'short' }),
      riskCount: 0,
      attended: 0,
      total: 0,
    });
  }

  return buckets;
};

const buildAdminStats = (pacientes, citas) => {
  const safePacientes = Array.isArray(pacientes) ? pacientes : [];
  const safeCitas = Array.isArray(citas) ? citas : [];

  const hba1cValues = safePacientes
    .map((paciente) => parseHba1c(paciente?.hba1c))
    .filter((value) => value !== null);
  const totalHba1c = hba1cValues.length || 0;
  const hba1cControlado = hba1cValues.filter((value) => value < 7).length;
  const hba1cPrecaucion = hba1cValues.filter((value) => value >= 7 && value <= 9).length;
  const hba1cRiesgo = hba1cValues.filter((value) => value > 9).length;

  const imcValues = safePacientes
    .map((paciente) => parseImc(paciente?.imc))
    .filter((value) => value !== null);
  const imcNormal = imcValues.filter((value) => getImcCategoria(value) === 'Normal').length;
  const imcSobrepeso = imcValues.filter((value) => getImcCategoria(value) === 'Sobrepeso').length;
  const imcObesidad = imcValues.filter((value) => getImcCategoria(value) === 'Obesidad').length;

  const municipios = safePacientes.reduce((acc, paciente) => {
    const municipio = paciente?.municipio || 'Sin municipio';
    acc[municipio] = (acc[municipio] || 0) + 1;
    return acc;
  }, {});
  const municipioTop = Object.entries(municipios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const citasProgramadas = safeCitas.filter((cita) => normalizeCitaEstado(cita?.estado) !== 'Cancelada');
  const citasAsistidas = citasProgramadas.filter((cita) => {
    const estado = normalizeCitaEstado(cita?.estado);
    return estado === 'Confirmada' || estado === 'Completada';
  });

  const riesgoPacientes = safePacientes.filter((paciente) => {
    const hba1c = parseHba1c(paciente?.hba1c);
    return paciente?.riesgo === 'Alto' || (hba1c !== null && hba1c > 9);
  });

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - 6);
  const previousStart = new Date(now);
  previousStart.setDate(now.getDate() - 13);

  const riesgoSemanaActual = riesgoPacientes.filter((paciente) => {
    const date = parseDate(getPacienteDate(paciente));
    return date && date >= currentStart;
  }).length;
  const riesgoSemanaAnterior = riesgoPacientes.filter((paciente) => {
    const date = parseDate(getPacienteDate(paciente));
    return date && date >= previousStart && date < currentStart;
  }).length;

  const buckets = buildMonthlyBuckets(5);
  const bucketMap = buckets.reduce((acc, bucket) => {
    acc[bucket.key] = bucket;
    return acc;
  }, {});

  riesgoPacientes.forEach((paciente) => {
    const date = parseDate(getPacienteDate(paciente));
    if (!date) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = bucketMap[key];
    if (bucket) bucket.riskCount += 1;
  });

  safeCitas.forEach((cita) => {
    const date = parseDate(getCitaDate(cita));
    if (!date) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = bucketMap[key];
    if (!bucket) return;
    const estado = normalizeCitaEstado(cita?.estado);
    if (estado === 'Cancelada') return;
    bucket.total += 1;
    if (estado === 'Confirmada' || estado === 'Completada') {
      bucket.attended += 1;
    }
  });

  return {
    kpis: {
      total: safePacientes.length,
      controlGlucemico: totalHba1c > 0 ? Math.round((hba1cControlado / totalHba1c) * 100) : 0,
      controlGlucemicoCount: hba1cControlado,
      asistencia: citasProgramadas.length > 0
        ? Math.round((citasAsistidas.length / citasProgramadas.length) * 100)
        : 0,
      asistenciaCount: citasAsistidas.length,
      citasProgramadas: citasProgramadas.length,
      riesgo: riesgoPacientes.length,
      riesgoTrend: riesgoSemanaActual - riesgoSemanaAnterior,
    },
    hba1c: {
      labels: ['Controlado (<7%)', 'Precaucion (7-9%)', 'Riesgo Alto (>9%)'],
      data: [hba1cControlado, hba1cPrecaucion, hba1cRiesgo],
    },
    imc: {
      labels: ['Normal', 'Sobrepeso', 'Obesidad'],
      data: [imcNormal, imcSobrepeso, imcObesidad],
    },
    municipios: {
      labels: municipioTop.map(([label]) => label),
      data: municipioTop.map(([, value]) => value),
    },
    tendencias: {
      labels: buckets.map((bucket) => bucket.label),
      riesgo: buckets.map((bucket) => bucket.riskCount),
      adherencia: buckets.map((bucket) => (bucket.total > 0 ? Math.round((bucket.attended / bucket.total) * 100) : 0)),
    },
    alertas: riesgoPacientes.slice(0, 5).map((paciente) => {
      const hba1c = parseHba1c(paciente?.hba1c);
      return {
        nombre: paciente?.nombre || `Paciente #${paciente?.id ?? 'N/A'}`,
        mensaje: hba1c !== null && hba1c > 9 ? 'HbA1c critica' : 'Riesgo alto',
        tipo: 'Alta',
      };
    }),
  };
};

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = useMemo(() => (user?.role || '').toUpperCase() === 'ADMIN', [user]);
  const isPsych = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return role === 'PSICOLOGO' || role === 'PSY';
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (isPsych) {
          const data = await getDashboardStats();
          const normalized = {
            kpis: {
              total: data?.kpis?.total || 0,
              controlGlucemico: data?.adherencia || 0,
              controlGlucemicoCount: 0,
              asistencia: data?.adherencia || 0,
              asistenciaCount: 0,
              citasProgramadas: 0,
              riesgo: (data?.imc?.labels || []).includes('Alto')
                ? data.imc.data[data.imc.labels.indexOf('Alto')] || 0
                : 0,
              riesgoTrend: 0,
            },
            hba1c: data?.hba1c || { labels: [], data: [] },
            imc: data?.imc || { labels: [], data: [] },
            municipios: data?.municipios || { labels: [], data: [] },
            tendencias: data?.tendencias || { labels: [], riesgo: [], adherencia: [] },
            alertas: Array.isArray(data?.alertas) ? data.alertas : [],
          };
          setStats(normalized);
        } else {
          const pacientesPromise = isAdmin
            ? getPacientes()
            : user?.id
              ? getAllPacientesByDoctor(user.id)
              : Promise.resolve([]);
          const citasPromise = isAdmin
            ? getCitasPortal()
            : user?.id
              ? getCitasPortal(user.id)
              : Promise.resolve([]);

          const [pacientesData, citasData] = await Promise.all([pacientesPromise, citasPromise]);
          setStats(buildAdminStats(pacientesData, citasData));
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, user]);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className={styles.responsiveWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{isPsych ? 'Panel Psicologico' : 'Panel de Control Administrativo'}</h1>
        <p className={styles.subtitle}>
          Vista general basada en {stats.kpis.total} beneficiarios registrados
        </p>
      </div>

      <div className={styles.gridContainer}>
        {/* KPIs */}
        {[
          {
            icon: <FaUsers size={24} color="#007bff" />,
            bg: '#e6f7ff',
            value: stats.kpis.total,
            label: 'Total Beneficiarios',
            style: styles.kpi1,
          },
          isPsych
            ? {
                icon: <FaHeartbeat size={24} color="#10b981" />,
                bg: '#ecfdf3',
                value: `${stats.kpis.asistencia}%`,
                label: 'Adherencia Promedio',
                sub: 'Sesiones psicologicas',
                style: styles.kpi2,
              }
            : {
                icon: <FaHeartbeat size={24} color="#10b981" />,
                bg: '#ecfdf3',
                value: `${stats.kpis.controlGlucemico}%`,
                label: 'Control Glucemico',
                sub: `${stats.kpis.controlGlucemicoCount} controlados`,
                style: styles.kpi2,
              },
          isPsych
            ? {
                icon: <FaCalendarAlt size={24} color="#f97316" />,
                bg: '#fff7ed',
                value: stats.hba1c.data?.reduce((a, b) => a + b, 0) || 0,
                label: 'Sesiones Registradas',
                sub: 'Ultimos meses',
                style: styles.kpi3,
              }
            : {
                icon: <FaCalendarAlt size={24} color="#f97316" />,
                bg: '#fff7ed',
                value: `${stats.kpis.asistencia}%`,
                label: 'Asistencia a citas programadas',
                sub: `${stats.kpis.asistenciaCount} de ${stats.kpis.citasProgramadas}`,
                style: styles.kpi3,
              },
          {
            icon: <FaExclamationTriangle size={22} color="#ef4444" />,
            bg: '#fee2e2',
            value: stats.kpis.riesgo,
            label: isPsych ? 'Estrés Alto' : 'Pacientes en Riesgo',
            sub: isPsych
              ? 'Sesiones con estrés elevado'
              : `${stats.kpis.riesgoTrend >= 0 ? `+${stats.kpis.riesgoTrend}` : stats.kpis.riesgoTrend} vs semana anterior`,
            style: styles.kpi4,
          },
        ].map((kpi, idx) => (
          <div className={kpi.style} key={kpi.label}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: kpi.bg, padding: '12px', borderRadius: '50%' }}>
                  {kpi.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', wordBreak: 'break-word' }}>{kpi.value}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', wordBreak: 'break-word' }}>{kpi.label}</p>
                  {kpi.sub && <p style={{ margin: '0.2rem 0 0', color: idx === 3 ? '#ef4444' : '#888', fontSize: '0.8rem', wordBreak: 'break-word' }}>{kpi.sub}</p>}
                </div>
              </div>
            </Card>
          </div>
        ))}

        {/* Gráficas y alertas */}
        <div className={styles.pie1}>
          <Card>
            <PieChart
              title={isPsych ? 'Distribucion Estado de Animo' : 'Distribucion Control Glucemico'}
              subtitle={isPsych ? 'Sesiones psicologicas' : 'Clasificacion HbA1c'}
              data={{
                labels: stats.hba1c.labels,
                datasets: [
                  {
                    data: stats.hba1c.data,
                    backgroundColor: ['#00c49f', '#ffbb28', '#ef4444'],
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.pie2}>
          <Card>
            <PieChart
              title={isPsych ? 'Distribucion Estres' : 'Distribucion IMC'}
              subtitle={isPsych ? 'Niveles de estres' : 'Estado nutricional'}
              data={{
                labels: stats.imc.labels,
                datasets: [
                  {
                    data: stats.imc.data,
                    backgroundColor: ['#00c49f', '#ffbb28', '#fb923c'],
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.barChart}>
          <Card>
            <BarChart
              title={isPsych ? 'Pacientes por Municipio' : 'Beneficiarios por Municipio'}
              subtitle="Top 5"
              data={{
                labels: stats.municipios.labels,
                datasets: [
                  {
                    label: 'Beneficiarios',
                    data: stats.municipios.data,
                    backgroundColor: '#3b82f6',
                    borderRadius: 8,
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.lineChart}>
          <Card>
            <LineChart
              title="Tendencias Mensuales"
              subtitle={isPsych ? 'Estres y Adherencia' : 'HbA1c y Adherencia'}
              data={{
                labels: stats.tendencias.labels,
                datasets: [
                  {
                    label: isPsych ? 'Estres Alto' : 'Riesgo Alto',
                    data: stats.tendencias.riesgo,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    yAxisID: 'y1',
                    tension: 0.35,
                  },
                  {
                    label: 'Adherencia',
                    data: stats.tendencias.adherencia,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    yAxisID: 'y',
                    tension: 0.35,
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.alerts}>
          <Card>
            <div className={styles.cardHeader}>
              <h3>Alertas y Pendientes</h3>
              <p>Pacientes que requieren atencion inmediata</p>
            </div>
            {stats.alertas.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '2rem 0', color: '#6b7280', flexWrap: 'wrap' }}>
                <FaCheckCircle color="#16a34a" />
                <span>Todo en orden.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {stats.alertas.map((alerta, index) => (
                  <div
                    key={`${alerta.nombre}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #fecaca',
                      borderLeft: '4px solid #ef4444',
                      background: '#fff5f5',
                      padding: '0.8rem 1rem',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>{alerta.nombre}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', wordBreak: 'break-word' }}>{alerta.mensaje}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', wordBreak: 'break-word' }}>{alerta.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
