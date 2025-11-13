import React, { useState } from 'react';
import styles from './Reportes.module.css';
import Card from '../components/ui/Card.jsx';
import ReportCard from '../components/ui/ReportCard.jsx';
import Button from '../components/ui/Button.jsx';

// Importamos íconos
import { FaDownload } from 'react-icons/fa';

// Datos de las plantillas
const plantillas = [
  { id: 1, title: 'Reporte General de Beneficiarios', desc: 'Lista completa con datos demográficos y clínicos' },
  { id: 2, title: 'Reporte de Control Glucémico', desc: 'HbA1c y metas de control por paciente' },
  { id: 3, title: 'Reporte de Adherencia', desc: 'Asistencia a citas y seguimiento de tratamiento' },
  { id: 4, title: 'Reporte por Municipio', desc: 'Distribución geográfica de beneficiarios' },
  { id: 5, title: 'Reporte de Pacientes en Riesgo', desc: 'Listado de pacientes que requieren atención prioritaria' },
  { id: 6, title: 'Reporte Personalizado', desc: 'Selecciona campos específicos para tu reporte' },
];

function Reportes() {
  const [selectedTemplate, setSelectedTemplate] = useState(1);

  return (
    <div>
      <h1 className={styles.title}>Generación de Reportes</h1>
      <p className={styles.subtitle}>Exporta datos y estadísticas en diferentes formatos</p>

      <div className={styles.pageLayout}>
        {/* Columna Izquierda */}
        <div className={styles.leftColumn}>
          <h2 className={styles.sectionTitle}>Plantillas de Reportes</h2>
          <div className={styles.reportTemplates}>
            {plantillas.map(p => (
              <ReportCard
                key={p.id}
                title={p.title}
                description={p.desc}
                isActive={selectedTemplate === p.id}
                onClick={() => setSelectedTemplate(p.id)}
              />
            ))}
          </div>

          <Card className={styles.filtersCard}>
            <h2 className={styles.sectionTitle}>Filtros de Reporte</h2>
            <p>Personaliza el contenido del reporte</p>
            <div className={styles.filterGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="fechaDesde">Fecha Desde</label>
                <input type="date" id="fechaDesde" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="fechaHasta">Fecha Hasta</label>
                <input type="date" id="fechaHasta" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="municipio">Municipio</label>
                <select id="municipio">
                  <option>Todos los municipios</option>
                  <option>Guadalajara</option>
                  <option>Zapopan</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="formato">Formato de Exportación</label>
                <select id="formato">
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF (.pdf)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha */}
        <div className={styles.rightColumn}>
          <Card>
            <h2 className={styles.sectionTitle}>Resumen de Datos</h2>
            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Pacientes</span>
                <span className={styles.summaryValue}>5</span>
              </li>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Activos</span>
                <span className={styles.summaryValue}>4</span>
              </li>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Alto Riesgo</span>
                <span className={`${styles.summaryValue} ${styles.summaryValueRed}`}>2</span>
              </li>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Municipios</span>
                <span className={styles.summaryValue}>3</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Barra Final */}
      <div className={styles.finalSummary}>
        <div>
          <h3 className={styles.finalTitle}>Reporte General de Beneficiarios</h3>
          <p className={styles.finalMeta}>Formato: .XLSX • Todos los municipios • Todas las fechas</p>
        </div>
        <Button>
          <FaDownload />
          Generar y Descargar
        </Button>
      </div>
    </div>
  );
}

export default Reportes;