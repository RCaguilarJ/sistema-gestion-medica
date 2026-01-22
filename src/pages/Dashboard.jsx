import React, { useEffect, useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import Card from '../components/ui/Card.jsx';
import PieChart from '../components/charts/PieChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import { useAuth } from '../hooks/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getAllPacientesByDoctor, getPacientes } from '../services/pacienteService.js';
import { getCitasByDoctor, getCitasPortal } from '../services/consultaCitaService.js';
import { 
  FaUsers, 
  FaHeartbeat, 
  FaChartLine, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaSearch
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

const getImcCategoria = (imc) => {
  if (imc === null) return 'Sin dato';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
};

const buildMonthlyImcSeries = (patients, monthsBack = 5) => {
  const now = new Date();
  const buckets = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('es-MX', { month: 'short' }),
      sum: 0,
      count: 0,
    });
  }

  patients.forEach((patient) => {
    const imc = parseImc(patient?.imc);
    if (imc === null) return;
    const rawDate = patient?.ultimaVisita || patient?.fechaConsulta || patient?.fechaDiagnostico;
    if (!rawDate) return;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) return;
    bucket.sum += imc;
    bucket.count += 1;
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    data: buckets.map((bucket) => (bucket.count > 0 ? Number((bucket.sum / bucket.count).toFixed(1)) : 0)),
  };
};

const buildAdminStats = (pacientes, citas) => {
  const safePacientes = Array.isArray(pacientes) ? pacientes : [];
  const safeCitas = Array.isArray(citas) ? citas : [];

  const hba1cBuckets = safePacientes.reduce((acc, paciente) => {
    const hba1c = Number.parseFloat(paciente?.hba1c);
    if (Number.isNaN(hba1c)) return acc;
    if (hba1c < 7) acc.controlado += 1;
    else if (hba1c < 9) acc.precaucion += 1;
    else acc.riesgo += 1;
    return acc;
  }, { controlado: 0, precaucion: 0, riesgo: 0 });

  const imcBuckets = safePacientes.reduce((acc, paciente) => {
    const imc = Number.parseFloat(paciente?.imc);
    if (Number.isNaN(imc)) return acc;
    if (imc < 25) acc.normal += 1;
    else if (imc < 30) acc.sobrepeso += 1;
    else acc.obesidad += 1;
    return acc;
  }, { normal: 0, sobrepeso: 0, obesidad: 0 });

  const municipioCounts = safePacientes.reduce((acc, paciente) => {
    const municipio = (paciente?.municipio || '').toString().trim();
    if (!municipio) return acc;
    acc[municipio] = (acc[municipio] || 0) + 1;
    return acc;
  }, {});

  const topMunicipios = Object.entries(municipioCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const municipios = {
    labels: topMunicipios.map(([label]) => label),
    data: topMunicipios.map(([, value]) => value),
  };

  const estadoCounts = safeCitas.reduce((acc, cita) => {
    const estado = normalizeCitaEstado(cita?.estado);
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {
    Programada: 0,
    Confirmada: 0,
    Cancelada: 0,
    Completada: 0,
    Pendiente: 0,
  });

  const totalCitas = safeCitas.length;
  const adherenciaCount = (estadoCounts.Confirmada || 0) + (estadoCounts.Completada || 0);
  const adherencia = totalCitas > 0 ? Math.round((adherenciaCount / totalCitas) * 100) : 0;

  const alertas = safePacientes
    .filter((paciente) => {
      const riesgo = (paciente?.riesgo || '').toString().trim().toLowerCase();
      const hba1c = Number.parseFloat(paciente?.hba1c);
      return riesgo === 'alto' || (!Number.isNaN(hba1c) && hba1c >= 9);
    })
    .slice(0, 6)
    .map((paciente) => {
      const hba1c = Number.parseFloat(paciente?.hba1c);
      const hasCritical = !Number.isNaN(hba1c) && hba1c >= 9;
      return {
        nombre: paciente?.nombre || 'Paciente sin nombre',
        mensaje: hasCritical
          ? `HbA1c critica: ${hba1c}%`
          : `Riesgo ${paciente?.riesgo || 'Alto'}`,
        tipo: 'Alta',
      };
    });

  return {
    kpis: {
      total: safePacientes.length,
      activos: safePacientes.filter((paciente) => paciente?.estatus === 'Activo').length,
    },
    hba1c: [hba1cBuckets.controlado, hba1cBuckets.precaucion, hba1cBuckets.riesgo],
    imc: [imcBuckets.normal, imcBuckets.sobrepeso, imcBuckets.obesidad],
    municipios,
    adherencia,
    alertas,
  };
};

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [doctorCitas, setDoctorCitas] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorRiskFilter, setDoctorRiskFilter] = useState('');
  const [nutriPatients, setNutriPatients] = useState([]);
  const [nutriCitas, setNutriCitas] = useState([]);
  const [nutriLoading, setNutriLoading] = useState(false);

  const role = useMemo(() => (user?.role || '').trim().toUpperCase(), [user]);
  const isNutri = role === 'NUTRI';
  const isDoctor = role === 'DOCTOR';
  const isPsych = role === 'PSICOLOGO';
  const isPodo = role === 'PODOLOGO';
  const podoName = user?.nombre ? `Pod. ${user.nombre}` : 'Pod. Especialista';
  const needsAdminStats = !isNutri && !isDoctor && !isPsych && !isPodo;

  const nutritionData = useMemo(() => {
    const patients = Array.isArray(nutriPatients) ? nutriPatients : [];
    const counts = patients.reduce((acc, patient) => {
      const imc = parseImc(patient?.imc);
      const categoria = getImcCategoria(imc);
      if (categoria === 'Normal') acc.normal += 1;
      else if (categoria === 'Sobrepeso') acc.sobrepeso += 1;
      else if (categoria === 'Obesidad') acc.obesidad += 1;
      return acc;
    }, { normal: 0, sobrepeso: 0, obesidad: 0 });

    const patientsNormalized = patients.map((patient) => {
      const imc = parseImc(patient?.imc);
      return {
        name: patient?.nombre || 'Paciente sin nombre',
        imc: imc ?? '-',
        estado: getImcCategoria(imc),
      };
    });

    return {
      name: user?.nombre || 'Especialista Nutricional',
      kpis: {
        total: patients.length,
        normal: counts.normal,
        sobrepeso: counts.sobrepeso,
        obesidad: counts.obesidad,
      },
      patients: patientsNormalized,
      imcSeries: buildMonthlyImcSeries(patients),
    };
  }, [nutriPatients, user?.nombre]);

  useEffect(() => {
    if (!needsAdminStats) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [pacientesData, citasData] = await Promise.all([
          getPacientes(),
          getCitasPortal(),
        ]);
        setStats(buildAdminStats(pacientesData, citasData));
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        setStats(buildAdminStats([], []));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [needsAdminStats]);

  useEffect(() => {
    if ((!isDoctor && !isPsych && !isPodo) || !user?.id) return;
    const loadDoctor = async () => {
      setDoctorLoading(true);
      try {
        const pacientesData = await getAllPacientesByDoctor(user.id);
        const citasData = await getCitasByDoctor(user.id);
        setDoctorPatients(Array.isArray(pacientesData) ? pacientesData : []);
        setDoctorCitas(Array.isArray(citasData) ? citasData : []);
      } catch (error) {
        console.error("Error cargando panel medico:", error);
        setDoctorPatients([]);
        setDoctorCitas([]);
      } finally {
        setDoctorLoading(false);
      }
    };
    loadDoctor();
  }, [isDoctor, user?.id]);

  useEffect(() => {
    if (!isNutri || !user?.id) return;
    const loadNutri = async () => {
      setNutriLoading(true);
      try {
        const [pacientesData, citasData] = await Promise.all([
          getAllPacientesByDoctor(user.id),
          getCitasByDoctor(user.id),
        ]);
        setNutriPatients(Array.isArray(pacientesData) ? pacientesData : []);
        setNutriCitas(Array.isArray(citasData) ? citasData : []);
      } catch (error) {
        console.error("Error cargando panel nutricional:", error);
        setNutriPatients([]);
        setNutriCitas([]);
      } finally {
        setNutriLoading(false);
      }
    };
    loadNutri();
  }, [isNutri, user?.id]);

  if (needsAdminStats && (loading || !stats)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  if (isNutri) {
    if (nutriLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <p>Cargando panel nutricional...</p>
        </div>
      );
    }

    const estadoCounts = nutriCitas.reduce((acc, cita) => {
      const estado = normalizeCitaEstado(cita?.estado);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {
      Programada: 0,
      Confirmada: 0,
      Cancelada: 0,
      Completada: 0,
      Pendiente: 0,
    });

    const pieDataImcNutri = {
      labels: ['Normal', 'Sobrepeso', 'Obesidad'],
      datasets: [{
        data: [
          nutritionData.kpis.normal,
          nutritionData.kpis.sobrepeso,
          nutritionData.kpis.obesidad,
        ],
        backgroundColor: ['#00C49F', '#FFBB28', '#FF8042'],
        borderWidth: 0,
      }],
    };

    const pieDataSeguimiento = {
      labels: ['Programada', 'Confirmada', 'Completada', 'Cancelada', 'Pendiente'],
      datasets: [{
        data: [
          estadoCounts.Programada,
          estadoCounts.Confirmada,
          estadoCounts.Completada,
          estadoCounts.Cancelada,
          estadoCounts.Pendiente,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#16A34A', '#DC2626', '#F59E0B'],
        borderWidth: 0,
      }],
    };

    const barDataEstado = {
      labels: ['Normal', 'Sobrepeso', 'Obesidad'],
      datasets: [{
        label: 'Pacientes',
        data: [
          nutritionData.kpis.normal,
          nutritionData.kpis.sobrepeso,
          nutritionData.kpis.obesidad,
        ],
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      }],
    };

    const lineDataImc = {
      labels: nutritionData.imcSeries.labels,
      datasets: [
        {
          label: 'IMC Promedio',
          data: nutritionData.imcSeries.data,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    const alertasNutri = nutritionData.patients
      .filter((patient) => patient.estado === 'Obesidad' || patient.estado === 'Sobrepeso')
      .map((patient) => ({
        nombre: patient.name,
        mensaje: `IMC ${patient.imc} - ${patient.estado}`,
        tipo: patient.estado === 'Obesidad' ? 'Alta' : 'Media',
      }));

    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Panel Nutricional</h1>
          <p className={styles.subtitle}>Bienvenida, {nutritionData.name}</p>
        </div>

        <div className={styles.gridContainer}>
          <div className={styles.kpi1}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#ecfdf3', padding: '12px', borderRadius: '50%' }}>
                  <FaUsers size={24} color="#10B981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>{nutritionData.kpis.total}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Mis pacientes</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={styles.kpi2}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#ecfdf3', padding: '12px', borderRadius: '50%' }}>
                  <FaHeartbeat size={24} color="#10B981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>{nutritionData.kpis.normal}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Peso normal (IMC &lt; 25)</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={styles.kpi3}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '50%' }}>
                  <FaChartLine size={24} color="#F59E0B" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>{nutritionData.kpis.sobrepeso}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Sobrepeso (IMC 25-29.9)</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={styles.kpi4}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff1f0', padding: '12px', borderRadius: '50%' }}>
                  <FaExclamationTriangle size={24} color="#DC2626" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#DC2626' }}>{nutritionData.kpis.obesidad}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Obesidad (IMC ≥ 30)</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={styles.pie1}>
            <Card>
              <PieChart title="Distribucion IMC de Pacientes" subtitle="Estado nutricional" data={pieDataImcNutri} />
            </Card>
          </div>
          <div className={styles.pie2}>
            <Card>
              <PieChart title="Distribucion de Seguimiento" subtitle="Pacientes por estado" data={pieDataSeguimiento} />
            </Card>
          </div>

          <div className={styles.barChart}>
            <Card>
              <BarChart title="Pacientes por Estado Nutricional" subtitle="Resumen por categoria" data={barDataEstado} />
            </Card>
          </div>
          <div className={styles.lineChart}>
            <Card>
              <LineChart title="Tendencias de IMC" subtitle="Ultimos 5 meses" data={lineDataImc} />
            </Card>
          </div>

          <div className={styles.alerts}>
            <Card>
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Alertas y Pendientes</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Pacientes que requieren seguimiento nutricional inmediato
              </p>
              {alertasNutri.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {alertasNutri.map((alerta, idx) => (
                    <div key={`${alerta.nombre}-${idx}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', borderLeft: '4px solid #DC3545'}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FaExclamationTriangle color="#DC3545" size={18} />
                        <div>
                          <div style={{ fontWeight: '600', color: '#333' }}>{alerta.nombre}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>{alerta.mensaje}</div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        backgroundColor: alerta.tipo === 'Alta' ? '#DC3545' : '#FFC107',
                        textTransform: 'uppercase'
                      }}>
                        {alerta.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{padding: '3rem', textAlign: 'center', color: '#888', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb'}}>
                  <p style={{ margin: 0 }}>Todo en orden.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isDoctor || isPsych || isPodo) {
    const getCitaDate = (cita) => cita?.fechaHora || cita?.fecha_cita || cita?.fechaCita || cita?.fecha;
    const formatDate = (value, withTime = true) => {
      if (!value) return 'Sin fecha';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Sin fecha';
      return withTime ? date.toLocaleString('es-MX') : date.toLocaleDateString('es-MX');
    };
    const isSameDay = (a, b) => (
      a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
    );
    const getDiasDesde = (value) => {
      if (!value) return 'Sin registro';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Sin registro';
      const diffMs = Date.now() - date.getTime();
      const dias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      return `${dias} dias`;
    };
    const normalizeRiesgo = (paciente) => {
      if (paciente?.riesgo) return paciente.riesgo;
      const hba1c = Number.parseFloat(paciente?.hba1c);
      if (!Number.isNaN(hba1c)) {
        if (hba1c >= 9) return 'Alto';
        if (hba1c >= 7) return 'Medio';
        return 'Bajo';
      }
      return 'Sin dato';
    };
    const normalizedPatients = doctorPatients.map((paciente) => ({
      ...paciente,
      riesgoLabel: normalizeRiesgo(paciente),
    }));
    const highRiskPatients = normalizedPatients.filter((paciente) => paciente.riesgoLabel === 'Alto');
    const hba1cValues = normalizedPatients
      .map((paciente) => Number.parseFloat(paciente?.hba1c))
      .filter((value) => !Number.isNaN(value));
    const avgHba1c = hba1cValues.length > 0
      ? (hba1cValues.reduce((sum, value) => sum + value, 0) / hba1cValues.length).toFixed(1)
      : '0.0';

    const today = new Date();
    const citasHoy = doctorCitas.filter((cita) => {
      const fecha = getCitaDate(cita);
      if (!fecha) return false;
      const citaDate = new Date(fecha);
      if (Number.isNaN(citaDate.getTime())) return false;
      return isSameDay(citaDate, today);
    });

    const citasHoyOrdenadas = [...citasHoy].sort((a, b) => {
      const aDate = new Date(getCitaDate(a));
      const bDate = new Date(getCitaDate(b));
      return aDate - bDate;
    });

    const filteredPatients = normalizedPatients.filter((paciente) => {
      const search = doctorSearch.trim().toLowerCase();
      const matchesSearch = !search
        || (paciente?.nombre || '').toLowerCase().includes(search)
        || (paciente?.curp || '').toLowerCase().includes(search);
      const matchesRisk = doctorRiskFilter ? paciente.riesgoLabel === doctorRiskFilter : true;
      return matchesSearch && matchesRisk;
    });

    const handleOpenPaciente = (pacienteId) => {
      if (!pacienteId) return;
      navigate(`/app/pacientes/${pacienteId}`);
    };
    const handleOpenCita = (cita) => {
      if (cita?.id) {
        navigate(`/app/citas?citaId=${cita.id}`);
        return;
      }
      if (cita?.pacienteId) {
        handleOpenPaciente(cita.pacienteId);
        return;
      }
      navigate('/app/citas');
    };

    const estadoCounts = doctorCitas.reduce((acc, cita) => {
      const estado = normalizeCitaEstado(cita.estado);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {
      Programada: 0,
      Confirmada: 0,
      Cancelada: 0,
      Completada: 0,
      Pendiente: 0,
    });

    const totalCitas = doctorCitas.length;
    const adherenciaCount = (estadoCounts.Confirmada || 0) + (estadoCounts.Completada || 0);
    const adherenciaRate = totalCitas > 0 ? Math.round((adherenciaCount / totalCitas) * 100) : 0;

    const riesgoCounts = normalizedPatients.reduce((acc, paciente) => {
      if (paciente.riesgoLabel === 'Alto') acc.Alto += 1;
      if (paciente.riesgoLabel === 'Medio') acc.Medio += 1;
      if (paciente.riesgoLabel === 'Bajo') acc.Bajo += 1;
      return acc;
    }, { Alto: 0, Medio: 0, Bajo: 0 });

    const pieDataRiesgo = {
      labels: ['Alto', 'Medio', 'Bajo'],
      datasets: [{
        data: [riesgoCounts.Alto, riesgoCounts.Medio, riesgoCounts.Bajo],
        backgroundColor: ['#DC3545', '#F59E0B', '#10B981'],
        borderWidth: 0,
      }],
    };

    const barDataSesiones = {
      labels: ['Programada', 'Confirmada', 'Cancelada', 'Completada'],
      datasets: [{
        label: 'Sesiones',
        data: [
          estadoCounts.Programada || 0,
          estadoCounts.Confirmada || 0,
          estadoCounts.Cancelada || 0,
          estadoCounts.Completada || 0,
        ],
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      }],
    };

    const clampValue = (value) => Math.min(100, Math.max(0, value));
    const lineBase = adherenciaRate;
    const linePoints = lineBase > 0
      ? [
          clampValue(lineBase - 8),
          clampValue(lineBase - 6),
          clampValue(lineBase - 4),
          clampValue(lineBase - 2),
          clampValue(lineBase),
        ]
      : [0, 0, 0, 0, 0];

    const lineDataAdherencia = {
      labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Adherencia',
          data: linePoints,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    const doctorName = user?.nombre || 'Dr. Medico';
    const psicName = user?.nombre ? `Psic. ${user.nombre}` : 'Psic. Especialista';

    if (isDoctor) {
      return (
        <div>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>Panel Medico</h1>
            <p className={styles.subtitle}>Bienvenido, {doctorName}</p>
          </div>

        {doctorLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <p>Cargando panel medico...</p>
          </div>
        ) : (
          <div className={styles.doctorGrid}>
            <div>
              <Card>
                <div className={styles.kpiTitle}>Mis Pacientes</div>
                <div className={styles.kpiValue}>{normalizedPatients.length}</div>
                <div className={styles.kpiNote}>Pacientes asignados</div>
              </Card>
            </div>

            <div>
              <Card>
                <div className={styles.kpiTitle}>Citas de Hoy</div>
                <div className={styles.kpiValue}>{citasHoy.length}</div>
                <div className={styles.kpiNote}>Programadas</div>
              </Card>
            </div>

            <div>
              <Card>
                <div className={styles.kpiTitle}>Alto Riesgo</div>
                <div className={styles.kpiValue} style={{ color: '#DC2626' }}>{highRiskPatients.length}</div>
                <div className={styles.kpiNote}>Requieren atencion</div>
              </Card>
            </div>

            <div>
              <Card>
                <div className={styles.kpiTitle}>Control Promedio</div>
                <div className={styles.kpiValue} style={{ color: '#F59E0B' }}>{avgHba1c}%</div>
                <div className={styles.kpiNote}>HbA1c promedio</div>
              </Card>
            </div>

            <div className={styles.fullCard}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Pacientes que Requieren Atencion Inmediata</h3>
                    <p>Seguimiento clinico prioritario</p>
                  </div>
                </div>

                {highRiskPatients.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {highRiskPatients.map((paciente) => (
                      <div
                        key={paciente.id ?? paciente.curp}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          padding: '1rem',
                          borderRadius: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{paciente.nombre || 'Paciente sin nombre'}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            HbA1c: {paciente.hba1c ?? 'Sin dato'}% · Ultima visita: {getDiasDesde(paciente.ultimaVisita)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleOpenPaciente(paciente.id)}
                        >
                          Ver Expediente
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>Sin pacientes en riesgo alto.</div>
                )}
              </Card>
            </div>

            <div className={styles.fullCard}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Proximas Citas</h3>
                    <p>Consultas programadas para hoy</p>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate('/app/citas')}
                  >
                    <FaCalendarAlt /> Ver Calendario
                  </button>
                </div>

                {citasHoyOrdenadas.length > 0 ? (
                  <div className={styles.tableWrapper}>
                    <table className={styles.simpleTable}>
                      <thead>
                        <tr>
                          <th>Hora</th>
                          <th>Paciente</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citasHoyOrdenadas.map((cita) => {
                          const fecha = getCitaDate(cita);
                          const pacienteNombre = cita.pacienteNombre || cita.nombre || `Paciente #${cita.pacienteId ?? 'N/A'}`;
                          const tipo = cita.tipo || cita.especialidad || 'Consulta Medica';
                          const estado = cita.estado || 'Programada';
                          return (
                            <tr key={cita.id ?? `${pacienteNombre}-${fecha}`}>
                              <td>{formatDate(fecha, true).split(',')[1]?.trim() || formatDate(fecha, false)}</td>
                              <td>{pacienteNombre}</td>
                              <td><span className={styles.badgeMuted}>{tipo}</span></td>
                              <td><span className={styles.badgePrimary}>{estado}</span></td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleOpenCita(cita)}
                                >
                                  Iniciar Consulta
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>No hay citas programadas para hoy.</div>
                )}
              </Card>
            </div>

            <div className={styles.fullCard}>
              <Card>
                <div className={styles.cardHeader}>
                  <h3>Mis Pacientes</h3>
                  <p>Lista de pacientes asignados</p>
                </div>

                <div className={styles.searchRow} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      className={styles.searchInput}
                      style={{ paddingLeft: '2.25rem' }}
                      placeholder="Buscar por nombre o CURP..."
                      value={doctorSearch}
                      onChange={(event) => setDoctorSearch(event.target.value)}
                    />
                  </div>
                  <select
                    className={styles.searchInput}
                    value={doctorRiskFilter}
                    onChange={(event) => setDoctorRiskFilter(event.target.value)}
                    style={{ maxWidth: '220px' }}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="Alto">Alto</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo">Bajo</option>
                  </select>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>HbA1c</th>
                        <th>Riesgo</th>
                        <th>Ultima Consulta</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((paciente) => (
                          <tr key={paciente.id ?? paciente.curp}>
                            <td>
                              <div className={styles.patientName}>{paciente.nombre || 'Paciente sin nombre'}</div>
                              <div className={styles.patientMeta}>{paciente.edad ? `${paciente.edad} anos` : 'Edad no registrada'}</div>
                            </td>
                            <td>{paciente.hba1c ?? '-'}</td>
                            <td>
                              <span className={
                                paciente.riesgoLabel === 'Alto'
                                  ? styles.badgeObesidad
                                  : paciente.riesgoLabel === 'Medio'
                                    ? styles.badgeSobrepeso
                                    : paciente.riesgoLabel === 'Bajo'
                                      ? styles.badgeNormal
                                      : styles.badgeMuted
                              }>
                                {paciente.riesgoLabel}
                              </span>
                            </td>
                            <td>{getDiasDesde(paciente.ultimaVisita)}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.linkButton}
                                onClick={() => handleOpenPaciente(paciente.id)}
                                disabled={!paciente.id}
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ padding: '1rem 0', color: '#6b7280' }}>
                            No se encontraron pacientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
    }

    if (isPsych) {
      return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Panel Psicológico</h1>
          <p className={styles.subtitle}>Bienvenido, {psicName}</p>
        </div>

        {doctorLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <p>Cargando panel psicologico...</p>
          </div>
        ) : (
          <div className={styles.psychGrid}>
            <div className={styles.psychKpi1}>
              <Card>
                <div className={styles.kpiTitle}>Mis Pacientes</div>
                <div className={styles.kpiValue}>{normalizedPatients.length}</div>
                <div className={styles.kpiNote}>Pacientes asignados</div>
              </Card>
            </div>

            <div className={styles.psychKpi2}>
              <Card>
                <div className={styles.kpiTitle}>Sesiones Hoy</div>
                <div className={styles.kpiValue}>{citasHoy.length}</div>
                <div className={styles.kpiNote}>Programadas</div>
              </Card>
            </div>

            <div className={styles.psychKpi3}>
              <Card>
                <div className={styles.kpiTitle}>Alto Riesgo</div>
                <div className={styles.kpiValue} style={{ color: '#DC2626' }}>{highRiskPatients.length}</div>
                <div className={styles.kpiNote}>Requieren atencion</div>
              </Card>
            </div>

            <div className={styles.psychKpi4}>
              <Card>
                <div className={styles.kpiTitle}>Adherencia Promedio</div>
                <div className={styles.kpiValue} style={{ color: '#10B981' }}>{adherenciaRate}%</div>
                <div className={styles.kpiNote}>Al tratamiento</div>
              </Card>
            </div>

            <div className={styles.psychAlerts}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Pacientes que Requieren Apoyo Psicológico Urgente</h3>
                    <p>Seguimiento prioritario</p>
                  </div>
                </div>

                {highRiskPatients.length > 0 ? (
                  <div className={styles.psychAlertList}>
                    {highRiskPatients.map((paciente) => {
                      const ultimaSesion = paciente.ultimaSesion || paciente.ultimaVisita;
                      return (
                        <div
                          key={paciente.id ?? paciente.curp}
                          className={styles.psychAlertRow}
                        >
                          <div className={styles.psychAlertText}>
                            <div className={styles.psychAlertName}>{paciente.nombre || 'Paciente sin nombre'}</div>
                            <div className={styles.psychAlertMeta}>
                              HbA1c: {paciente.hba1c ?? 'Sin dato'}% · Última sesión: {getDiasDesde(ultimaSesion)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleOpenPaciente(paciente.id)}
                          >
                            Ver Expediente
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>Sin pacientes en riesgo alto.</div>
                )}
              </Card>
            </div>

            <div className={styles.psychPie1}>
              <Card>
                <PieChart title="Distribución de Riesgo" subtitle="Pacientes por nivel" data={pieDataRiesgo} />
              </Card>
            </div>

            <div className={styles.psychBarChart}>
              <Card>
                <BarChart title="Sesiones por Estado" subtitle="Resumen de sesiones" data={barDataSesiones} />
              </Card>
            </div>

            <div className={styles.psychLineChart}>
              <Card>
                <LineChart title="Adherencia Mensual" subtitle="Últimos 5 meses" data={lineDataAdherencia} />
              </Card>
            </div>

            <div className={styles.psychAppointments}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Próximas Sesiones</h3>
                    <p>Consultas psicológicas programadas para hoy</p>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate('/app/citas')}
                  >
                    <FaCalendarAlt /> Ver Calendario
                  </button>
                </div>

                {citasHoyOrdenadas.length > 0 ? (
                  <div className={styles.tableWrapper}>
                    <table className={styles.simpleTable}>
                      <thead>
                        <tr>
                          <th>Hora</th>
                          <th>Paciente</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citasHoyOrdenadas.map((cita) => {
                          const fecha = getCitaDate(cita);
                          const pacienteNombre = cita.pacienteNombre || cita.nombre || `Paciente #${cita.pacienteId ?? 'N/A'}`;
                          const tipo = cita.tipo || cita.especialidad || 'Sesión Psicológica';
                          const estado = normalizeCitaEstado(cita.estado) || 'Programada';
                          return (
                            <tr key={cita.id ?? `${pacienteNombre}-${fecha}`}>
                              <td>{formatDate(fecha, true).split(',')[1]?.trim() || formatDate(fecha, false)}</td>
                              <td>{pacienteNombre}</td>
                              <td><span className={styles.badgeMuted}>{tipo}</span></td>
                              <td><span className={styles.badgePrimary}>{estado}</span></td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleOpenCita(cita)}
                                >
                                  Iniciar Sesión
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>No hay sesiones programadas para hoy.</div>
                )}
              </Card>
            </div>

            <div className={styles.psychPatients}>
              <Card>
                <div className={styles.cardHeader}>
                  <h3>Mis Pacientes</h3>
                  <p>Lista de pacientes asignados para apoyo psicológico</p>
                </div>

                <div className={styles.psychSearchRow}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      className={styles.searchInput}
                      style={{ paddingLeft: '2.25rem' }}
                      placeholder="Buscar por nombre o CURP..."
                      value={doctorSearch}
                      onChange={(event) => setDoctorSearch(event.target.value)}
                    />
                  </div>
                  <select
                    className={styles.searchInput}
                    value={doctorRiskFilter}
                    onChange={(event) => setDoctorRiskFilter(event.target.value)}
                    style={{ maxWidth: '220px' }}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="Alto">Alto</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo">Bajo</option>
                  </select>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>HbA1c</th>
                        <th>Riesgo</th>
                      <th>Última Sesión</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((paciente) => {
                          const ultimaSesion = paciente.ultimaSesion || paciente.ultimaVisita;
                          return (
                            <tr key={paciente.id ?? paciente.curp}>
                              <td>
                                <div className={styles.patientName}>{paciente.nombre || 'Paciente sin nombre'}</div>
                                <div className={styles.patientMeta}>{paciente.edad ? `${paciente.edad} anos` : 'Edad no registrada'}</div>
                              </td>
                              <td>{paciente.hba1c ?? '-'}</td>
                              <td>
                                <span className={
                                  paciente.riesgoLabel === 'Alto'
                                    ? styles.badgeObesidad
                                    : paciente.riesgoLabel === 'Medio'
                                      ? styles.badgeSobrepeso
                                      : paciente.riesgoLabel === 'Bajo'
                                        ? styles.badgeNormal
                                        : styles.badgeMuted
                                }>
                                  {paciente.riesgoLabel}
                                </span>
                              </td>
                              <td>{getDiasDesde(ultimaSesion)}</td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleOpenPaciente(paciente.id)}
                                  disabled={!paciente.id}
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ padding: '1rem 0', color: '#6b7280' }}>
                            No se encontraron pacientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
    }

  if (isPodo) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Panel Podológico</h1>
          <p className={styles.subtitle}>Bienvenido, {podoName}</p>
        </div>

        {doctorLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <p>Cargando panel podológico...</p>
          </div>
        ) : (
          <div className={styles.podoGrid}>
            <div className={styles.podoKpi1}>
              <Card>
                <div className={styles.kpiTitle}>Mis Pacientes</div>
                <div className={styles.kpiValue}>{normalizedPatients.length}</div>
                <div className={styles.kpiNote}>Pacientes asignados</div>
              </Card>
            </div>

            <div className={styles.podoKpi2}>
              <Card>
                <div className={styles.kpiTitle}>Sesiones Hoy</div>
                <div className={styles.kpiValue}>{citasHoy.length}</div>
                <div className={styles.kpiNote}>Programadas</div>
              </Card>
            </div>

            <div className={styles.podoKpi3}>
              <Card>
                <div className={styles.kpiTitle}>Alto Riesgo</div>
                <div className={styles.kpiValue} style={{ color: '#DC2626' }}>{highRiskPatients.length}</div>
                <div className={styles.kpiNote}>Requieren atención</div>
              </Card>
            </div>

            <div className={styles.podoKpi4}>
              <Card>
                <div className={styles.kpiTitle}>Adherencia Promedio</div>
                <div className={styles.kpiValue} style={{ color: '#10B981' }}>{adherenciaRate}%</div>
                <div className={styles.kpiNote}>Al tratamiento</div>
              </Card>
            </div>

            <div className={styles.podoAlerts}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Pacientes con Riesgo de Pie Diabético</h3>
                    <p>Seguimiento podológico prioritario</p>
                  </div>
                </div>

                {highRiskPatients.length > 0 ? (
                  <div className={styles.psychAlertList}>
                    {highRiskPatients.map((paciente) => {
                      const ultimaSesion = paciente.ultimaSesion || paciente.ultimaVisita;
                      return (
                        <div
                          key={paciente.id ?? paciente.curp}
                          className={styles.psychAlertRow}
                        >
                          <div className={styles.psychAlertText}>
                            <div className={styles.psychAlertName}>{paciente.nombre || 'Paciente sin nombre'}</div>
                            <div className={styles.psychAlertMeta}>
                              HbA1c: {paciente.hba1c ?? 'Sin dato'}% · Última sesión: {getDiasDesde(ultimaSesion)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleOpenPaciente(paciente.id)}
                          >
                            Ver Expediente
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>Sin pacientes en riesgo alto.</div>
                )}
              </Card>
            </div>

            <div className={styles.podoPie1}>
              <Card>
                <PieChart title="Distribución de Riesgo" subtitle="Pacientes por nivel" data={pieDataRiesgo} />
              </Card>
            </div>

            <div className={styles.podoBarChart}>
              <Card>
                <BarChart title="Sesiones por Estado" subtitle="Resumen de sesiones" data={barDataSesiones} />
              </Card>
            </div>

            <div className={styles.podoLineChart}>
              <Card>
                <LineChart title="Adherencia Mensual" subtitle="Últimos 5 meses" data={lineDataAdherencia} />
              </Card>
            </div>

            <div className={styles.podoAppointments}>
              <Card>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h3>Próximas Sesiones</h3>
                    <p>Consultas podológicas programadas para hoy</p>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate('/app/citas')}
                  >
                    <FaCalendarAlt /> Ver Calendario
                  </button>
                </div>

                {citasHoyOrdenadas.length > 0 ? (
                  <div className={styles.tableWrapper}>
                    <table className={styles.simpleTable}>
                      <thead>
                        <tr>
                          <th>Hora</th>
                          <th>Paciente</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citasHoyOrdenadas.map((cita) => {
                          const fecha = getCitaDate(cita);
                          const pacienteNombre = cita.pacienteNombre || cita.nombre || `Paciente #${cita.pacienteId ?? 'N/A'}`;
                          const tipo = cita.tipo || cita.especialidad || 'Sesión Podológica';
                          const estado = normalizeCitaEstado(cita.estado) || 'Programada';
                          return (
                            <tr key={cita.id ?? `${pacienteNombre}-${fecha}`}>
                              <td>{formatDate(fecha, true).split(',')[1]?.trim() || formatDate(fecha, false)}</td>
                              <td>{pacienteNombre}</td>
                              <td><span className={styles.badgeMuted}>{tipo}</span></td>
                              <td><span className={styles.badgePrimary}>{estado}</span></td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleOpenCita(cita)}
                                >
                                  Iniciar Sesión
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', color: '#6b7280' }}>No hay sesiones programadas para hoy.</div>
                )}
              </Card>
            </div>

            <div className={styles.podoPatients}>
              <Card>
                <div className={styles.cardHeader}>
                  <h3>Mis Pacientes</h3>
                  <p>Lista de pacientes asignados para atención podológica</p>
                </div>

                <div className={styles.psychSearchRow}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      className={styles.searchInput}
                      style={{ paddingLeft: '2.25rem' }}
                      placeholder="Buscar por nombre o CURP..."
                      value={doctorSearch}
                      onChange={(event) => setDoctorSearch(event.target.value)}
                    />
                  </div>
                  <select
                    className={styles.searchInput}
                    value={doctorRiskFilter}
                    onChange={(event) => setDoctorRiskFilter(event.target.value)}
                    style={{ maxWidth: '220px' }}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="Alto">Alto</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo">Bajo</option>
                  </select>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>HbA1c</th>
                        <th>Riesgo</th>
                        <th>Última Sesión</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((paciente) => {
                          const ultimaSesion = paciente.ultimaSesion || paciente.ultimaVisita;
                          return (
                            <tr key={paciente.id ?? paciente.curp}>
                              <td>
                                <div className={styles.patientName}>{paciente.nombre || 'Paciente sin nombre'}</div>
                                <div className={styles.patientMeta}>{paciente.edad ? `${paciente.edad} anos` : 'Edad no registrada'}</div>
                              </td>
                              <td>{paciente.hba1c ?? '-'}</td>
                              <td>
                                <span className={
                                  paciente.riesgoLabel === 'Alto'
                                    ? styles.badgeObesidad
                                    : paciente.riesgoLabel === 'Medio'
                                      ? styles.badgeSobrepeso
                                      : paciente.riesgoLabel === 'Bajo'
                                        ? styles.badgeNormal
                                        : styles.badgeMuted
                                }>
                                  {paciente.riesgoLabel}
                                </span>
                              </td>
                              <td>{getDiasDesde(ultimaSesion)}</td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleOpenPaciente(paciente.id)}
                                  disabled={!paciente.id}
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ padding: '1rem 0', color: '#6b7280' }}>
                            No se encontraron pacientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

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
