import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from './Reportes.module.css';
import { FaFileAlt, FaFileMedical, FaCalendarCheck, FaMapMarkedAlt, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { getPacientes } from '../services/pacienteService.js';

// --- Definición de Plantillas ---
const templates = [
  { id: 'general', title: 'Reporte General de Beneficiarios', desc: 'Lista completa con datos demográficos y clínicos.', icon: <FaFileAlt /> },
  { id: 'glucemico', title: 'Reporte de Control Glucémico', desc: 'HbA1c y metas de control por paciente.', icon: <FaFileMedical /> },
  { id: 'adherencia', title: 'Reporte de Adherencia', desc: 'Asistencia a citas y seguimiento de tratamiento.', icon: <FaCalendarCheck /> },
  { id: 'municipio', title: 'Reporte por Municipio', desc: 'Distribución geográfica de beneficiarios.', icon: <FaMapMarkedAlt /> },
  { id: 'riesgo', title: 'Reporte de Pacientes en Riesgo', desc: 'Listado de pacientes que requieren atención prioritaria.', icon: <FaExclamationTriangle /> },
];

const municipiosJalisco = ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Tlajomulco de Zúñiga", "El Salto"]; // (Puedes importar la lista completa si quieres)

function Reportes() {
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [pacientes, setPacientes] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, altoRiesgo: 0, municipios: 0 });
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [municipio, setMunicipio] = useState('Todos');

  // Cargar datos reales
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getPacientes();
        setPacientes(data);
        
        // Calcular Resumen
        const activos = data.filter(p => p.estatus === 'Activo').length;
        const altoRiesgo = data.filter(p => {
            const hba1c = parseFloat(p.hba1c);
            return p.riesgo === 'Alto' || (!isNaN(hba1c) && hba1c > 9);
        }).length;
        const munis = new Set(data.map(p => p.municipio).filter(Boolean)).size;

        setStats({ total: data.length, activos, altoRiesgo, municipios: munis });
      } catch (err) {
        console.error("Error cargando datos para reportes:", err);
      }
    };
    loadData();
  }, []);

  // --- LÓGICA DE GENERACIÓN DE EXCEL ---
  const handleDownload = () => {
    // 1. Filtrar datos (Básico por municipio y fechas si existen)
    let filteredData = pacientes.filter(p => {
        if (municipio !== 'Todos' && p.municipio !== municipio) return false;
        // Aquí podrías agregar lógica de fechas usando p.createdAt o p.fechaDiagnostico
        return true;
    });

    // 2. Mapear columnas según la plantilla seleccionada
    let excelData = [];
    
    switch (selectedTemplate) {
        case 'general':
            excelData = filteredData.map(p => ({
                ID: p.id, Nombre: p.nombre, CURP: p.curp, Edad: p.edad || '-', 
                Género: p.genero, Municipio: p.municipio, Teléfono: p.celular || p.telefono, 
                Estatus: p.estatus
            }));
            break;
        case 'glucemico':
            excelData = filteredData.map(p => ({
                ID: p.id, Nombre: p.nombre, TipoDiabetes: p.tipoDiabetes, 
                'HbA1c Actual (%)': p.hba1c, 'Última Medición': p.ultimaVisita || '-',
                Estado: parseFloat(p.hba1c) < 7 ? 'Controlado' : 'Descontrolado'
            }));
            break;
        case 'riesgo':
            excelData = filteredData
                .filter(p => p.riesgo === 'Alto' || parseFloat(p.hba1c) > 9)
                .map(p => ({
                    ID: p.id, Nombre: p.nombre, Riesgo: p.riesgo, 'HbA1c': p.hba1c,
                    Teléfono: p.celular, 'Motivo Alerta': parseFloat(p.hba1c) > 9 ? 'Glucosa Crítica' : 'Valoración Médica'
                }));
            break;
        default: // Por defecto exportamos general
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
        <h1 className={styles.title}>Generación de Reportes</h1>
        <p className={styles.subtitle}>Exporta datos y estadísticas en formato Excel</p>
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
                    <label className={styles.label}>Formato de Exportación</label>
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
            <p>Formato: .XLSX • {municipio === 'Todos' ? 'Todos los municipios' : municipio} • Datos actuales</p>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownload}>
            <FaDownload /> Generar y Descargar
        </button>
      </div>
    </div>
  );
}

export default Reportes;