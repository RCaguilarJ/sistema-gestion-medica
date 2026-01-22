import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from './Reportes.module.css';
import { FaFileAlt, FaFileMedical, FaCalendarCheck, FaMapMarkedAlt, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { getPacientes } from '../services/pacienteService.js';
import { getCitasPortal } from '../services/consultaCitaService.js';

// --- Definicion de Plantillas ---
const templates = [
  { id: 'general', title: 'Reporte General de Beneficiarios', desc: 'Lista completa con datos demograficos y clinicos.', icon: <FaFileAlt /> },
  { id: 'glucemico', title: 'Reporte de Control Glucemico', desc: 'HbA1c y metas de control por paciente.', icon: <FaFileMedical /> },
  { id: 'adherencia', title: 'Reporte de Adherencia', desc: 'Asistencia a citas y seguimiento de tratamiento.', icon: <FaCalendarCheck /> },
  { id: 'municipio', title: 'Reporte por Municipio', desc: 'Distribucion geografica de beneficiarios.', icon: <FaMapMarkedAlt /> },
  { id: 'riesgo', title: 'Reporte de Pacientes en Riesgo', desc: 'Listado de pacientes que requieren atencion prioritaria.', icon: <FaExclamationTriangle /> },
];

const municipiosJalisco = ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonala", "Tlajomulco de Zuniga", "El Salto"]; // (Puedes importar la lista completa si quieres)

function Reportes() {
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, altoRiesgo: 0, municipios: 0 });
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [municipio, setMunicipio] = useState('Todos');

  // Cargar datos reales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pacientesData, citasData] = await Promise.all([
          getPacientes(),
          getCitasPortal(),
        ]);
        setPacientes(pacientesData);
        setCitas(citasData);
        
        // Calcular Resumen
        const activos = pacientesData.filter(p => p.estatus === 'Activo').length;
        const altoRiesgo = pacientesData.filter(p => {
            const hba1c = parseFloat(p.hba1c);
            return p.riesgo === 'Alto' || (!isNaN(hba1c) && hba1c > 9);
        }).length;
        const munis = new Set(pacientesData.map(p => p.municipio).filter(Boolean)).size;

        setStats({ total: pacientesData.length, activos, altoRiesgo, municipios: munis });
      } catch (err) {
        console.error("Error cargando datos para reportes:", err);
      }
    };
    loadData();
  }, []);

  const getPacienteDate = (paciente) => paciente?.fechaConsulta;

  const getCitaDate = (cita) => (
    cita?.fechaHora
    || cita?.fecha_cita
    || cita?.fechaCita
    || cita?.fecha
  );

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isWithinRange = (date, from, to) => {
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const buildMunicipioSummary = (data) => {
    const counts = data.reduce((acc, paciente) => {
      const muni = paciente?.municipio || 'Sin municipio';
      acc[muni] = (acc[muni] || 0) + 1;
      return acc;
    }, {});
    const total = data.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([muni, count]) => ({
        Municipio: muni,
        Beneficiarios: count,
        Porcentaje: `${Math.round((count / total) * 100)}%`,
      }));
  };

  // --- LOGICA DE GENERACION DE EXCEL ---
  const handleDownload = () => {
    const fromDate = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const toDate = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;
    const hasDateFilter = Boolean(fromDate || toDate);

    const filteredData = pacientes.filter(p => {
        if (municipio !== 'Todos' && p.municipio !== municipio) return false;
        if (!hasDateFilter) return true;
        const date = parseDate(getPacienteDate(p));
        return isWithinRange(date, fromDate, toDate);
    });

    const pacientesById = new Map(
      pacientes.map((paciente) => [String(paciente.id), paciente])
    );

    // 2. Mapear columnas segun la plantilla seleccionada
    let excelData = [];
    
    switch (selectedTemplate) {
        case 'general':
            excelData = filteredData.map(p => ({
                ID: p.id, Nombre: p.nombre, CURP: p.curp, Edad: p.edad || '-', 
                Genero: p.genero, Municipio: p.municipio, Telefono: p.celular || p.telefono, 
                Estatus: p.estatus
            }));
            break;
        case 'glucemico':
            excelData = filteredData.map(p => ({
                ID: p.id, Nombre: p.nombre, TipoDiabetes: p.tipoDiabetes, 
                'HbA1c Actual (%)': p.hba1c, 'Ultima Medicion': p.ultimaVisita || '-',
                Estado: parseFloat(p.hba1c) < 7 ? 'Controlado' : 'Descontrolado'
            }));
            break;
        case 'adherencia':
            excelData = citas
              .filter((cita) => {
                const date = parseDate(getCitaDate(cita));
                if (hasDateFilter && !isWithinRange(date, fromDate, toDate)) return false;
                if (municipio === 'Todos') return true;
                const pacienteId = cita.pacienteId || cita.usuarioId;
                const paciente = pacientesById.get(String(pacienteId));
                return paciente?.municipio === municipio;
              })
              .map((cita) => ({
                ID: cita.id,
                Paciente: cita.pacienteNombre || cita.pacienteEmail || `Paciente #${cita.pacienteId ?? 'N/A'}`,
                Especialista: cita.medicoNombre || `Especialista #${cita.medicoId ?? 'N/A'}`,
                Fecha: getCitaDate(cita) ? new Date(getCitaDate(cita)).toLocaleString('es-MX') : '-',
                Estado: cita.estado || 'Pendiente',
              }));
            break;
        case 'municipio':
            excelData = buildMunicipioSummary(filteredData);
            break;
        case 'riesgo':
            excelData = filteredData
                .filter(p => p.riesgo === 'Alto' || parseFloat(p.hba1c) > 9)
                .map(p => ({
                    ID: p.id, Nombre: p.nombre, Riesgo: p.riesgo, 'HbA1c': p.hba1c,
                    Telefono: p.celular, 'Motivo Alerta': parseFloat(p.hba1c) > 9 ? 'Glucosa Critica' : 'Valoracion Medica'
                }));
            break;
        default:
            excelData = filteredData.map(p => ({ ID: p.id, Nombre: p.nombre, CURP: p.curp }));
    }

    if (excelData.length === 0) {
        alert("No hay datos para generar este reporte con los filtros actuales.");
        return;
    }

    // 3. Crear Libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    // 4. Descargar
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    const templateName = templates.find(t => t.id === selectedTemplate).title;
    saveAs(dataBlob, `${templateName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Generacion de Reportes</h1>
        <p className={styles.subtitle}>Exporta datos y estadisticas en formato Excel</p>
      </div>

      <div className={styles.layout}>
        {/* COLUMNA IZQUIERDA: Plantillas y Filtros */}
        <div>
            {/* Grid de Plantillas */}
            <h2 className={styles.sectionTitle}>Plantillas de Reportes</h2>
            <div className={styles.templatesGrid}>
                {templates.map(t => (
                    <div 
                        key={t.id} 
                        className={`${styles.reportCard} ${selectedTemplate === t.id ? styles.activeCard : ''}`}
                        onClick={() => setSelectedTemplate(t.id)}
                    >
                        <div className={styles.iconWrapper}>{t.icon}</div>
                        <div>
                            <h4 className={styles.cardTitle}>{t.title}</h4>
                            <p className={styles.cardDesc}>{t.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className={styles.filtersCard}>
                <h2 className={styles.sectionTitle}>Filtros de Reporte</h2>
                <p className={styles.sectionText}>Personaliza el contenido del reporte</p>
                
                <div className={styles.filterRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha Desde</label>
                        <input type="date" className={styles.input} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha Hasta</label>
                        <input type="date" className={styles.input} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Municipio</label>
                        <select className={styles.select} value={municipio} onChange={e => setMunicipio(e.target.value)}>
                            <option value="Todos">Todos los municipios</option>
                            {municipiosJalisco.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className={styles.formGroup} style={{maxWidth: '300px'}}>
                    <label className={styles.label}>Formato de Exportacion</label>
                    <select className={styles.select} disabled>
                        <option>Excel (.xlsx)</option>
                    </select>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: Resumen */}
        <div>
            <div className={styles.summaryCard}>
                <h2 className={styles.sectionTitle}>Resumen de Datos</h2>
                <ul className={styles.summaryList}>
                    <li className={styles.summaryItem}>
                        <span>Total Pacientes</span>
                        <span className={styles.summaryVal}>{stats.total}</span>
                    </li>
                    <li className={styles.summaryItem}>
                        <span>Activos</span>
                        <span className={styles.summaryVal}>{stats.activos}</span>
                    </li>
                    <li className={styles.summaryItem}>
                        <span>Alto Riesgo</span>
                        <span className={`${styles.summaryVal} ${styles.redText}`}>{stats.altoRiesgo}</span>
                    </li>
                    <li className={styles.summaryItem}>
                        <span>Municipios</span>
                        <span className={styles.summaryVal}>{stats.municipios}</span>
                    </li>
                </ul>
            </div>
        </div>
      </div>

      {/* BARRA FLOTANTE INFERIOR */}
      <div className={styles.bottomBar}>
        <div className={styles.barInfo}>
            <h4>{templates.find(t => t.id === selectedTemplate)?.title}</h4>
            <p>Formato: .XLSX | {municipio === 'Todos' ? 'Todos los municipios' : municipio} | Datos actuales</p>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownload}>
            <FaDownload /> Generar y Descargar
        </button>
      </div>
    </div>
  );
}

export default Reportes;
