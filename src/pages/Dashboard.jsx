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
import { isFinanceRole } from '../utils/roles.js';
import {
  FaUsers,
  FaHeartbeat,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCheckCircle,
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

const normalizeText = (value) => (
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
);

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

const getPacienteEstadoPago = (paciente) => (
  paciente?.estadoPago
  ?? paciente?.estado_pago
  ?? paciente?.estadoFinanciero
  ?? paciente?.estado_financiero
  ?? ''
);

const getPacienteMembresia = (paciente) => (
  paciente?.perfilFinanciero?.membresia
  ?? paciente?.tipoMembresia
  ?? paciente?.tipo_membresia
  ?? ''
);

const hasFinancialTracking = (paciente) => (
  Boolean(getPacienteMembresia(paciente) || getPacienteEstadoPago(paciente))
);

const normalizePaymentStatus = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return 'Sin registro';
  if (['pagado', 'pagada', 'si', 'true', '1'].includes(normalized)) return 'Pagado';
  if (normalized === 'parcial') return 'Parcial';
  if (normalized === 'exento') return 'Exento';
  if (['pendiente', 'no pagado', 'no pagada', 'no', 'false', '0'].includes(normalized)) return 'Pendiente';
  if (normalized === 'atrasado') return 'Atrasado';
  if (normalized === 'vencido') return 'Vencido';
  if (normalized === 'moroso') return 'Moroso';
  if (['suspendido', 'suspendida'].includes(normalized)) return 'Suspendido';
  if (['baja', 'inactivo'].includes(normalized)) return 'Baja';
  return value.toString().trim();
};

const getFinanceStatusGroup = (status) => {
  const normalized = normalizePaymentStatus(status);
  if (['Vencido', 'Moroso', 'Atrasado', 'Suspendido', 'Baja'].includes(normalized)) {
    return 'danger';
  }
  if (['Pendiente', 'Parcial', 'Sin registro'].includes(normalized)) {
    return 'warning';
  }
  if (['Pagado', 'Exento'].includes(normalized)) {
    return 'success';
  }
  return 'warning';
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

const buildClinicalStats = (pacientes, citas) => {
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
      labels: ['Controlado (<7%)', 'Precaucion (7-9%)', 'Riesgo alto (>9%)'],
      data: [hba1cControlado, hba1cPrecaucion, hba1cRiesgo],
      colors: ['#00c49f', '#ffbb28', '#ef4444'],
    },
    imc: {
      labels: ['Normal', 'Sobrepeso', 'Obesidad'],
      data: [imcNormal, imcSobrepeso, imcObesidad],
      colors: ['#00c49f', '#ffbb28', '#fb923c'],
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

const buildAdministrativeStats = (pacientes) => {
  const safePacientes = Array.isArray(pacientes) ? pacientes : [];
  const trackedPatients = safePacientes.filter(hasFinancialTracking);

  const financeRows = trackedPatients.map((paciente) => {
    const paymentStatus = normalizePaymentStatus(getPacienteEstadoPago(paciente));
    const paymentGroup = getFinanceStatusGroup(paymentStatus);
    const membership = getPacienteMembresia(paciente) || 'Sin membresia';
    const patientDate = parseDate(getPacienteDate(paciente));

    return {
      ...paciente,
      paymentStatus,
      paymentGroup,
      membership,
      patientDate,
    };
  });

  const summaryCounts = financeRows.reduce((acc, paciente) => {
    acc[paciente.paymentGroup] += 1;
    return acc;
  }, { danger: 0, warning: 0, success: 0 });

  const detailedStatusOrder = ['Pagado', 'Exento', 'Pendiente', 'Parcial', 'Vencido', 'Atrasado', 'Moroso', 'Suspendido', 'Baja', 'Sin registro'];
  const detailedStatusCounts = financeRows.reduce((acc, paciente) => {
    acc[paciente.paymentStatus] = (acc[paciente.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  const membershipCounts = financeRows.reduce((acc, paciente) => {
    acc[paciente.membership] = (acc[paciente.membership] || 0) + 1;
    return acc;
  }, {});

  const financialBuckets = buildMonthlyBuckets(6).map(({ key, label }) => ({
    key,
    label,
    successCount: 0,
    warningCount: 0,
    dangerCount: 0,
    total: 0,
  }));

  const bucketMap = financialBuckets.reduce((acc, bucket) => {
    acc[bucket.key] = bucket;
    return acc;
  }, {});

  financeRows.forEach((paciente) => {
    if (!paciente.patientDate) return;
    const key = `${paciente.patientDate.getFullYear()}-${paciente.patientDate.getMonth()}`;
    const bucket = bucketMap[key];
    if (!bucket) return;

    bucket.total += 1;
    if (paciente.paymentGroup === 'danger') bucket.dangerCount += 1;
    if (paciente.paymentGroup === 'warning') bucket.warningCount += 1;
    if (paciente.paymentGroup === 'success') bucket.successCount += 1;
  });

  const currentBucket = financialBuckets[financialBuckets.length - 1];
  const previousBucket = financialBuckets[financialBuckets.length - 2];
  const successCount = summaryCounts.success;
  const warningCount = summaryCounts.warning;
  const dangerCount = summaryCounts.danger;
  const trackedTotal = financeRows.length;
  const successPercentage = trackedTotal > 0 ? Math.round((successCount / trackedTotal) * 100) : 0;
  const warningPercentage = trackedTotal > 0 ? Math.round((warningCount / trackedTotal) * 100) : 0;
  const dangerTrend = (currentBucket?.dangerCount || 0) - (previousBucket?.dangerCount || 0);

  const financePriority = {
    danger: 3,
    warning: 2,
    success: 1,
  };

  const alerts = financeRows
    .filter((paciente) => paciente.paymentGroup !== 'success')
    .sort((left, right) => {
      const priorityDiff = financePriority[right.paymentGroup] - financePriority[left.paymentGroup];
      if (priorityDiff !== 0) return priorityDiff;
      return (right.patientDate?.getTime() || 0) - (left.patientDate?.getTime() || 0);
    })
    .slice(0, 5)
    .map((paciente) => ({
      nombre: paciente?.nombre || `Paciente #${paciente?.id ?? 'N/A'}`,
      mensaje: `${paciente.paymentStatus} · ${paciente.membership}`,
      tipo: paciente.paymentGroup === 'danger' ? 'Urgente' : 'Seguimiento',
    }));

  const detailedLabels = detailedStatusOrder.filter((status) => detailedStatusCounts[status] > 0);
  const financeStatusColors = {
    Pagado: '#22c55e',
    Exento: '#16a34a',
    Pendiente: '#f59e0b',
    Parcial: '#fbbf24',
    Vencido: '#ef4444',
    Atrasado: '#f97316',
    Moroso: '#dc2626',
    Suspendido: '#b91c1c',
    Baja: '#991b1b',
    'Sin registro': '#f59e0b',
  };
  const detailedColors = detailedLabels.map((status) => (
    financeStatusColors[status] || '#6b7280'
  ));

  const topMemberships = Object.entries(membershipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    kpis: {
      totalBeneficiarios: safePacientes.length,
      trackedPatients: trackedTotal,
      successCount,
      successPercentage,
      warningCount,
      warningPercentage,
      dangerCount,
      dangerTrend,
    },
    hba1c: {
      labels: ['Membresia vencida', 'Por regularizar', 'Al corriente'],
      data: [dangerCount, warningCount, successCount],
      colors: ['#ef4444', '#f59e0b', '#22c55e'],
    },
    imc: {
      labels: detailedLabels,
      data: detailedLabels.map((status) => detailedStatusCounts[status]),
      colors: detailedColors,
    },
    municipios: {
      labels: topMemberships.map(([label]) => label),
      data: topMemberships.map(([, value]) => value),
    },
    tendencias: {
      labels: financialBuckets.map((bucket) => bucket.label),
      danger: financialBuckets.map((bucket) => bucket.dangerCount),
      warning: financialBuckets.map((bucket) => bucket.warningCount),
      successRate: financialBuckets.map((bucket) => (bucket.total > 0 ? Math.round((bucket.successCount / bucket.total) * 100) : 0)),
    },
    alertas: alerts,
  };
};

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }, [user]);

  const isPsych = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return role === 'PSICOLOGO' || role === 'PSY';
  }, [user]);

  const hasNativeFinanceRole = useMemo(() => isFinanceRole(user?.role), [user]);

  const isAdministrativeDashboard = (isAdmin || hasNativeFinanceRole) && !isPsych;

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
            hba1c: {
              labels: data?.hba1c?.labels || [],
              data: data?.hba1c?.data || [],
              colors: ['#00c49f', '#ffbb28', '#ef4444'],
            },
            imc: {
              labels: data?.imc?.labels || [],
              data: data?.imc?.data || [],
              colors: ['#00c49f', '#ffbb28', '#fb923c'],
            },
            municipios: data?.municipios || { labels: [], data: [] },
            tendencias: data?.tendencias || { labels: [], riesgo: [], adherencia: [] },
            alertas: Array.isArray(data?.alertas) ? data.alertas : [],
          };
          setStats(normalized);
        } else {
          const pacientesPromise = isAdministrativeDashboard
            ? getPacientes()
            : user?.id
              ? getAllPacientesByDoctor(user.id)
              : Promise.resolve([]);

          const citasPromise = isAdministrativeDashboard
            ? getCitasPortal()
            : user?.id
              ? getCitasPortal(user.id)
              : Promise.resolve([]);

          const [pacientesData, citasData] = await Promise.all([pacientesPromise, citasPromise]);
          setStats(
            isAdministrativeDashboard
              ? buildAdministrativeStats(pacientesData)
              : buildClinicalStats(pacientesData, citasData),
          );
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(
          isAdministrativeDashboard
            ? buildAdministrativeStats([])
            : buildClinicalStats([], []),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdministrativeDashboard, isPsych, user]);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  const headerTitle = isPsych
    ? 'Panel Psicologico'
    : isAdministrativeDashboard
      ? 'Panel Administrativo'
      : 'Panel de Control Administrativo';

  const headerSubtitle = isAdministrativeDashboard
    ? `Vista financiera basada en ${stats.kpis.trackedPatients} pacientes con seguimiento`
    : `Vista general basada en ${stats.kpis.total} beneficiarios registrados`;

  const kpiCards = isAdministrativeDashboard
    ? [
        {
          icon: <FaUsers size={24} color="#0f766e" />,
          bg: '#ccfbf1',
          value: stats.kpis.trackedPatients,
          label: 'Pacientes con seguimiento financiero',
          sub: `${stats.kpis.totalBeneficiarios} beneficiarios totales`,
          subColor: '#0f766e',
          style: styles.kpi1,
        },
        {
          icon: <FaHeartbeat size={24} color="#22c55e" />,
          bg: '#ecfdf3',
          value: `${stats.kpis.successPercentage}%`,
          label: 'Pacientes al corriente',
          sub: `${stats.kpis.successCount} pacientes`,
          subColor: '#15803d',
          style: styles.kpi2,
        },
        {
          icon: <FaCalendarAlt size={24} color="#f59e0b" />,
          bg: '#fff7ed',
          value: `${stats.kpis.warningPercentage}%`,
          label: 'Pacientes por regularizar',
          sub: `${stats.kpis.warningCount} pacientes`,
          subColor: '#b45309',
          style: styles.kpi3,
        },
        {
          icon: <FaExclamationTriangle size={22} color="#ef4444" />,
          bg: '#fee2e2',
          value: stats.kpis.dangerCount,
          label: 'Membresias vencidas',
          sub: `${stats.kpis.dangerTrend >= 0 ? `+${stats.kpis.dangerTrend}` : stats.kpis.dangerTrend} vs mes anterior`,
          subColor: '#b91c1c',
          style: styles.kpi4,
        },
      ]
    : [
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
              label: 'Adherencia promedio',
              sub: 'Sesiones psicologicas',
              subColor: '#6b7280',
              style: styles.kpi2,
            }
          : {
              icon: <FaHeartbeat size={24} color="#10b981" />,
              bg: '#ecfdf3',
              value: `${stats.kpis.controlGlucemico}%`,
              label: 'Control glucemico',
              sub: `${stats.kpis.controlGlucemicoCount} controlados`,
              subColor: '#6b7280',
              style: styles.kpi2,
            },
        isPsych
          ? {
              icon: <FaCalendarAlt size={24} color="#f97316" />,
              bg: '#fff7ed',
              value: stats.hba1c.data?.reduce((a, b) => a + b, 0) || 0,
              label: 'Sesiones registradas',
              sub: 'Ultimos meses',
              subColor: '#6b7280',
              style: styles.kpi3,
            }
          : {
              icon: <FaCalendarAlt size={24} color="#f97316" />,
              bg: '#fff7ed',
              value: `${stats.kpis.asistencia}%`,
              label: 'Asistencia a citas programadas',
              sub: `${stats.kpis.asistenciaCount} de ${stats.kpis.citasProgramadas}`,
              subColor: '#6b7280',
              style: styles.kpi3,
            },
        {
          icon: <FaExclamationTriangle size={22} color="#ef4444" />,
          bg: '#fee2e2',
          value: stats.kpis.riesgo,
          label: isPsych ? 'Estres alto' : 'Pacientes en riesgo',
          sub: isPsych
            ? 'Sesiones con estres elevado'
            : `${stats.kpis.riesgoTrend >= 0 ? `+${stats.kpis.riesgoTrend}` : stats.kpis.riesgoTrend} vs semana anterior`,
          subColor: '#b91c1c',
          style: styles.kpi4,
        },
      ];

  const pie1Title = isPsych
    ? 'Distribucion estado de animo'
    : isAdministrativeDashboard
      ? 'Semaforo de membresias'
      : 'Distribucion control glucemico';
  const pie1Subtitle = isPsych
    ? 'Sesiones psicologicas'
    : isAdministrativeDashboard
      ? 'Rojo: vencidas · Amarillo: por regularizar · Verde: al corriente'
      : 'Clasificacion HbA1c';

  const pie2Title = isPsych
    ? 'Distribucion estres'
    : isAdministrativeDashboard
      ? 'Desglose de estados financieros'
      : 'Distribucion IMC';
  const pie2Subtitle = isPsych
    ? 'Niveles de estres'
    : isAdministrativeDashboard
      ? 'Misma semantica que la vista financiera'
      : 'Estado nutricional';

  const barChartTitle = isPsych
    ? 'Pacientes por municipio'
    : isAdministrativeDashboard
      ? 'Pacientes por membresia'
      : 'Beneficiarios por municipio';
  const barChartSubtitle = isAdministrativeDashboard
    ? 'Top 5 membresias con seguimiento'
    : 'Top 5';

  const lineChartTitle = isAdministrativeDashboard
    ? 'Tendencia mensual de cobranza'
    : 'Tendencias mensuales';
  const lineChartSubtitle = isPsych
    ? 'Estres y adherencia'
    : isAdministrativeDashboard
      ? 'Vencidas, por regularizar y porcentaje al corriente'
      : 'HbA1c y adherencia';

  const lineDatasets = isAdministrativeDashboard
    ? [
        {
          label: 'Membresias vencidas',
          data: stats.tendencias.danger,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          yAxisID: 'y1',
          tension: 0.35,
        },
        {
          label: 'Por regularizar',
          data: stats.tendencias.warning,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          yAxisID: 'y1',
          tension: 0.35,
        },
        {
          label: 'Al corriente',
          data: stats.tendencias.successRate,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          yAxisID: 'y',
          tension: 0.35,
        },
      ]
    : [
        {
          label: isPsych ? 'Estres alto' : 'Riesgo alto',
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
      ];

  return (
    <div className={styles.responsiveWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{headerTitle}</h1>
        <p className={styles.subtitle}>{headerSubtitle}</p>
      </div>

      <div className={styles.gridContainer}>
        {kpiCards.map((kpi) => (
          <div className={kpi.style} key={kpi.label}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: kpi.bg, padding: '12px', borderRadius: '50%' }}>
                  {kpi.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', wordBreak: 'break-word' }}>{kpi.value}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', wordBreak: 'break-word' }}>{kpi.label}</p>
                  {kpi.sub && (
                    <p style={{ margin: '0.2rem 0 0', color: kpi.subColor || '#888', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {kpi.sub}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}

        <div className={styles.pie1}>
          <Card>
            <PieChart
              title={pie1Title}
              subtitle={pie1Subtitle}
              data={{
                labels: stats.hba1c.labels,
                datasets: [
                  {
                    data: stats.hba1c.data,
                    backgroundColor: stats.hba1c.colors,
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.pie2}>
          <Card>
            <PieChart
              title={pie2Title}
              subtitle={pie2Subtitle}
              data={{
                labels: stats.imc.labels,
                datasets: [
                  {
                    data: stats.imc.data,
                    backgroundColor: stats.imc.colors,
                  },
                ],
              }}
            />
          </Card>
        </div>

        <div className={styles.barChart}>
          <Card>
            <BarChart
              title={barChartTitle}
              subtitle={barChartSubtitle}
              data={{
                labels: stats.municipios.labels,
                datasets: [
                  {
                    label: isAdministrativeDashboard ? 'Pacientes' : 'Beneficiarios',
                    data: stats.municipios.data,
                    backgroundColor: isAdministrativeDashboard ? '#0f766e' : '#3b82f6',
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
              title={lineChartTitle}
              subtitle={lineChartSubtitle}
              data={{
                labels: stats.tendencias.labels,
                datasets: lineDatasets,
              }}
            />
          </Card>
        </div>

        <div className={styles.alerts}>
          <Card>
            <div className={styles.cardHeader}>
              <h3>Alertas y pendientes</h3>
              <p>{isAdministrativeDashboard ? 'Pacientes que requieren regularizacion financiera' : 'Pacientes que requieren atencion inmediata'}</p>
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
