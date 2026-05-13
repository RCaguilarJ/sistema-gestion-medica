import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  FaCalendarCheck,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFileMedical,
  FaMapMarkedAlt,
} from 'react-icons/fa';
import styles from './Reportes.module.css';
import { useAuth } from '../hooks/AuthContext.jsx';
import { getAllPacientesByDoctor, getPacientes } from '../services/pacienteService.js';
import {
  getCanonicalMunicipioJalisco,
  matchesMunicipioJalisco,
  municipiosJalisco,
} from '../constants/municipiosJalisco.js';

const templates = [
  {
    id: 'general',
    title: 'Reporte General de Beneficiarios',
    desc: 'Exporta pacientes con el encabezado completo segun los filtros seleccionados.',
    icon: <FaFileAlt />,
    sheetName: 'General',
  },
  {
    id: 'glucemico',
    title: 'Reporte de Control Glucemico',
    desc: 'Mantiene el mismo encabezado y prioriza pacientes con datos glucemicos al ordenar.',
    icon: <FaFileMedical />,
    sheetName: 'Control Glucemico',
  },
  {
    id: 'adherencia',
    title: 'Reporte de Adherencia',
    desc: 'Mantiene el mismo encabezado y ordena por fecha de consulta mas reciente.',
    icon: <FaCalendarCheck />,
    sheetName: 'Adherencia',
  },
  {
    id: 'municipio',
    title: 'Reporte por Municipio',
    desc: 'Exporta pacientes del municipio filtrado con el mismo encabezado del reporte.',
    icon: <FaMapMarkedAlt />,
    sheetName: 'Municipio',
  },
  {
    id: 'riesgo',
    title: 'Reporte de Pacientes en Riesgo',
    desc: 'Mantiene el mismo encabezado y prioriza pacientes con mayor riesgo al ordenar.',
    icon: <FaExclamationTriangle />,
    sheetName: 'Pacientes en Riesgo',
  },
];

const ALL_OPTION = 'Todos';
const DEFAULT_FILTERS = {
  fechaDesde: '',
  fechaHasta: '',
  municipio: ALL_OPTION,
  anoNacimiento: ALL_OPTION,
  rangoEdad: ALL_OPTION,
  genero: ALL_OPTION,
  grupo: ALL_OPTION,
  motivoConsulta: ALL_OPTION,
  rangoMes: ALL_OPTION,
};

const AGE_RANGES = [
  { id: '0-17', label: '0 a 17 anos', min: 0, max: 17 },
  { id: '18-29', label: '18 a 29 anos', min: 18, max: 29 },
  { id: '30-39', label: '30 a 39 anos', min: 30, max: 39 },
  { id: '40-49', label: '40 a 49 anos', min: 40, max: 49 },
  { id: '50-59', label: '50 a 59 anos', min: 50, max: 59 },
  { id: '60-69', label: '60 a 69 anos', min: 60, max: 69 },
  { id: '70+', label: '70 anos o mas', min: 70, max: Infinity },
];

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const BIMESTER_OPTIONS = [
  { id: '1-2', label: 'Enero a Febrero', months: [0, 1] },
  { id: '3-4', label: 'Marzo a Abril', months: [2, 3] },
  { id: '5-6', label: 'Mayo a Junio', months: [4, 5] },
  { id: '7-8', label: 'Julio a Agosto', months: [6, 7] },
  { id: '9-10', label: 'Septiembre a Octubre', months: [8, 9] },
  { id: '11-12', label: 'Noviembre a Diciembre', months: [10, 11] },
];

const MONTH_INDEX_BY_KEY = MONTHS.reduce((acc, month, index) => {
  acc[normalizeText(month)] = index;
  return acc;
}, {});

const REPORT_COLUMNS = [
  { header: 'CURP', width: 22, value: (paciente) => getCellValue(paciente.curp) },
  { header: 'NOMBRE DEL PACIENTE', width: 34, value: (paciente) => getCellValue(paciente.nombre) },
  { header: 'EDAD', width: 10, value: (paciente) => getNumericCellValue(getPatientAge(paciente.fechaNacimiento)) },
  { header: 'ANO DE NACIMIENTO', width: 20, value: (paciente) => getNumericCellValue(getBirthYear(paciente.fechaNacimiento)) },
  { header: 'GENERO', width: 16, value: (paciente) => getCellValue(paciente.genero) },
  { header: 'DOMICILIO', width: 28, value: (paciente) => getCellValue(paciente.calleNumero) },
  { header: 'COLONIA', width: 22, value: (paciente) => getCellValue(paciente.colonia) },
  { header: 'MUNICIPIO', width: 24, value: (paciente) => getCellValue(getCanonicalMunicipioJalisco(paciente.municipio) || paciente.municipio) },
  { header: 'CP', width: 12, value: (paciente) => getCellValue(paciente.codigoPostal) },
  { header: 'TELEFONO', width: 18, value: (paciente) => getCellValue(paciente.telefono) },
  { header: 'CELULAR', width: 18, value: (paciente) => getCellValue(paciente.celular) },
  { header: 'GRUPO AL QUE PERTENECE', width: 28, value: (paciente) => getCellValue(paciente.grupo) },
  { header: 'TIPO DE SERVICIO', width: 20, value: (paciente) => getCellValue(paciente.tipoServicio) },
  { header: 'MOTIVO DE CONSULTA', width: 26, value: (paciente) => getCellValue(paciente.motivoConsulta) },
  { header: 'RESPONSABLE', width: 22, value: (paciente) => getCellValue(paciente.responsable) },
  { header: 'TIPO DE TERAPIA', width: 18, value: (paciente) => getCellValue(paciente.tipoTerapia) },
  { header: 'MES', width: 16, value: (paciente) => getCellValue(paciente.mesEstadistico) },
  { header: 'FECHA DE DIAGNOSTICO', width: 18, value: (paciente) => formatDateValue(paciente.fechaDiagnostico) },
  { header: 'FECHA DE CONSULTA', width: 18, value: (paciente) => formatDateValue(getPacienteDate(paciente)) },
];

const collator = new Intl.Collator('es-MX', { sensitivity: 'base' });

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getCellValue(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function getNumericCellValue(value) {
  return Number.isFinite(value) ? value : '-';
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)
      ? `${trimmedValue}T00:00:00`
      : trimmedValue;
    const parsedDate = new Date(normalizedValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDateValue(value) {
  const parsedDate = parseDate(value);
  return parsedDate ? parsedDate.toLocaleDateString('es-MX') : '-';
}

function getPacienteDate(paciente) {
  return (
    paciente?.ultimaVisita
    || paciente?.fechaConsulta
    || paciente?.fechaDiagnostico
    || paciente?.updatedAt
    || paciente?.updated_at
    || ''
  );
}

function getPatientAge(fechaNacimiento) {
  const birthDate = parseDate(fechaNacimiento);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getBirthYear(fechaNacimiento) {
  const birthDate = parseDate(fechaNacimiento);
  return birthDate ? birthDate.getFullYear() : null;
}

function getBirthMonthIndex(fechaNacimiento) {
  const birthDate = parseDate(fechaNacimiento);
  return birthDate ? birthDate.getMonth() : null;
}

function getMesEstadisticoIndex(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue in MONTH_INDEX_BY_KEY ? MONTH_INDEX_BY_KEY[normalizedValue] : null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function isWithinRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function matchesOption(value, selectedValue) {
  if (selectedValue === ALL_OPTION) return true;
  return normalizeText(value) === normalizeText(selectedValue);
}

function compareText(firstValue, secondValue) {
  return collator.compare(firstValue || '', secondValue || '');
}

function compareNumberDesc(firstValue, secondValue) {
  if (firstValue === secondValue) return 0;
  if (firstValue === null || firstValue === undefined) return 1;
  if (secondValue === null || secondValue === undefined) return -1;
  return secondValue - firstValue;
}

function compareDateDesc(firstValue, secondValue) {
  const firstTime = parseDate(firstValue)?.getTime() || 0;
  const secondTime = parseDate(secondValue)?.getTime() || 0;
  return secondTime - firstTime;
}

function getRiskWeight(paciente) {
  const riesgo = normalizeText(paciente?.riesgo);
  if (riesgo === 'alto') return 3;
  if (riesgo === 'medio') return 2;
  if (riesgo === 'bajo') return 1;

  const hba1c = parseNumber(paciente?.hba1c);
  if (hba1c !== null && hba1c > 9) return 3;
  if (hba1c !== null && hba1c >= 7) return 2;
  if (hba1c !== null) return 1;

  return 0;
}

function sortReportPacientes(data, templateId) {
  const sortedData = [...data];

  sortedData.sort((firstPaciente, secondPaciente) => {
    if (templateId === 'municipio') {
      const municipioCompare = compareText(
        getCanonicalMunicipioJalisco(firstPaciente?.municipio) || firstPaciente?.municipio,
        getCanonicalMunicipioJalisco(secondPaciente?.municipio) || secondPaciente?.municipio
      );
      if (municipioCompare !== 0) return municipioCompare;
    }

    if (templateId === 'glucemico') {
      const hba1cCompare = compareNumberDesc(
        parseNumber(firstPaciente?.hba1c),
        parseNumber(secondPaciente?.hba1c)
      );
      if (hba1cCompare !== 0) return hba1cCompare;
    }

    if (templateId === 'adherencia') {
      const dateCompare = compareDateDesc(getPacienteDate(firstPaciente), getPacienteDate(secondPaciente));
      if (dateCompare !== 0) return dateCompare;
    }

    if (templateId === 'riesgo') {
      const riskCompare = compareNumberDesc(getRiskWeight(firstPaciente), getRiskWeight(secondPaciente));
      if (riskCompare !== 0) return riskCompare;
    }

    return compareText(firstPaciente?.nombre, secondPaciente?.nombre);
  });

  return sortedData;
}

function buildUniqueOptionList(values) {
  const uniqueValues = new Map();

  values.forEach((value) => {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) return;

    const normalizedValue = normalizeText(rawValue);
    if (!uniqueValues.has(normalizedValue)) {
      uniqueValues.set(normalizedValue, rawValue);
    }
  });

  return [...uniqueValues.values()].sort((firstValue, secondValue) => compareText(firstValue, secondValue));
}

function buildBirthYearRangeOptions(data) {
  const years = data
    .map((paciente) => getBirthYear(paciente?.fechaNacimiento))
    .filter((year) => Number.isInteger(year));

  if (!years.length) return [];

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const firstRangeYear = Math.floor(minYear / 10) * 10;
  const lastRangeYear = Math.floor(maxYear / 10) * 10;
  const options = [];

  for (let currentYear = lastRangeYear; currentYear >= firstRangeYear; currentYear -= 10) {
    options.push({
      value: `${currentYear}-${currentYear + 9}`,
      label: `${currentYear} a ${currentYear + 9}`,
    });
  }

  return options;
}

function sanitizeFileName(value) {
  return normalizeText(value).replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function Reportes() {
  const { user: currentUser } = useAuth();
  const role = String(currentUser?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [pacientes, setPacientes] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const pacientesData =
          currentUser?.id && !isAdmin
            ? await getAllPacientesByDoctor(currentUser.id)
            : await getPacientes();

        if (!ignore) {
          setPacientes(Array.isArray(pacientesData) ? pacientesData : []);
        }
      } catch (error) {
        console.error('Error cargando datos para reportes:', error);
        if (!ignore) {
          setPacientes([]);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [currentUser?.id, isAdmin]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const dateFromFilter = useMemo(
    () => (filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`) : null),
    [filters.fechaDesde]
  );
  const dateToFilter = useMemo(
    () => (filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59`) : null),
    [filters.fechaHasta]
  );
  const hasDateFilter = Boolean(dateFromFilter || dateToFilter);

  const municipioOptions = useMemo(() => {
    const catalogKeys = new Set(municipiosJalisco.map((municipio) => normalizeText(municipio)));
    const extraMunicipios = buildUniqueOptionList(
      pacientes
        .map((paciente) => getCanonicalMunicipioJalisco(paciente?.municipio) || paciente?.municipio)
        .filter((municipio) => municipio && !catalogKeys.has(normalizeText(municipio)))
    );

    return [...municipiosJalisco, ...extraMunicipios];
  }, [pacientes]);

  const generoOptions = useMemo(
    () => buildUniqueOptionList(pacientes.map((paciente) => paciente?.genero)),
    [pacientes]
  );

  const grupoOptions = useMemo(
    () => buildUniqueOptionList(pacientes.map((paciente) => paciente?.grupo)),
    [pacientes]
  );

  const motivoConsultaOptions = useMemo(
    () => buildUniqueOptionList(pacientes.map((paciente) => paciente?.motivoConsulta)),
    [pacientes]
  );

  const anoNacimientoOptions = useMemo(() => buildBirthYearRangeOptions(pacientes), [pacientes]);

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((paciente) => {
      if (hasDateFilter) {
        const referenciaDate = parseDate(getPacienteDate(paciente));
        if (!isWithinRange(referenciaDate, dateFromFilter, dateToFilter)) {
          return false;
        }
      }

      if (filters.municipio !== ALL_OPTION && !matchesMunicipioJalisco(paciente?.municipio, filters.municipio)) {
        return false;
      }

      if (filters.anoNacimiento !== ALL_OPTION) {
        const birthYear = getBirthYear(paciente?.fechaNacimiento);
        const [rangeStart, rangeEnd] = filters.anoNacimiento
          .split('-')
          .map((value) => Number.parseInt(value, 10));

        if (!Number.isInteger(birthYear) || birthYear < rangeStart || birthYear > rangeEnd) {
          return false;
        }
      }

      if (filters.rangoEdad !== ALL_OPTION) {
        const age = getPatientAge(paciente?.fechaNacimiento);
        const selectedAgeRange = AGE_RANGES.find((range) => range.id === filters.rangoEdad);

        if (!selectedAgeRange || age === null || age < selectedAgeRange.min || age > selectedAgeRange.max) {
          return false;
        }
      }

      if (!matchesOption(paciente?.genero, filters.genero)) return false;
      if (!matchesOption(paciente?.grupo, filters.grupo)) return false;
      if (!matchesOption(paciente?.motivoConsulta, filters.motivoConsulta)) return false;

      if (filters.rangoMes !== ALL_OPTION) {
        const selectedBimester = BIMESTER_OPTIONS.find((range) => range.id === filters.rangoMes);
        const mesIndex = getMesEstadisticoIndex(paciente?.mesEstadistico);
        const birthMonthIndex = getBirthMonthIndex(paciente?.fechaNacimiento);
        const comparableMonth = mesIndex ?? birthMonthIndex;

        if (!selectedBimester || comparableMonth === null || !selectedBimester.months.includes(comparableMonth)) {
          return false;
        }
      }

      return true;
    });
  }, [dateFromFilter, dateToFilter, filters, hasDateFilter, pacientes]);

  const reportPacientes = useMemo(
    () => sortReportPacientes(filteredPacientes, selectedTemplate),
    [filteredPacientes, selectedTemplate]
  );

  const activeFilterLabels = useMemo(() => {
    const labels = [];

    if (filters.fechaDesde) labels.push(`Fecha desde: ${formatDateValue(filters.fechaDesde)}`);
    if (filters.fechaHasta) labels.push(`Fecha hasta: ${formatDateValue(filters.fechaHasta)}`);
    if (filters.municipio !== ALL_OPTION) labels.push(`Municipio: ${filters.municipio}`);

    if (filters.anoNacimiento !== ALL_OPTION) {
      const yearLabel = anoNacimientoOptions.find((option) => option.value === filters.anoNacimiento)?.label || filters.anoNacimiento;
      labels.push(`Ano de nacimiento: ${yearLabel}`);
    }

    if (filters.rangoEdad !== ALL_OPTION) {
      const ageLabel = AGE_RANGES.find((option) => option.id === filters.rangoEdad)?.label || filters.rangoEdad;
      labels.push(`Rango de edad: ${ageLabel}`);
    }

    if (filters.genero !== ALL_OPTION) labels.push(`Genero: ${filters.genero}`);
    if (filters.grupo !== ALL_OPTION) labels.push(`Grupo: ${filters.grupo}`);
    if (filters.motivoConsulta !== ALL_OPTION) labels.push(`Motivo de consulta: ${filters.motivoConsulta}`);

    if (filters.rangoMes !== ALL_OPTION) {
      const monthLabel = BIMESTER_OPTIONS.find((option) => option.id === filters.rangoMes)?.label || filters.rangoMes;
      labels.push(`Rango en mes: ${monthLabel}`);
    }

    return labels;
  }, [anoNacimientoOptions, filters]);

  const selectedTemplateMeta = templates.find((template) => template.id === selectedTemplate) || templates[0];

  const handleDownload = () => {
    if (!reportPacientes.length) {
      alert('No hay pacientes para generar este reporte con los filtros actuales.');
      return;
    }

    const rows = reportPacientes.map((paciente) => REPORT_COLUMNS.map((column) => column.value(paciente)));
    const worksheet = XLSX.utils.aoa_to_sheet([
      REPORT_COLUMNS.map((column) => column.header),
      ...rows,
    ]);

    worksheet['!cols'] = REPORT_COLUMNS.map((column) => ({ wch: column.width }));
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rows.length, c: REPORT_COLUMNS.length - 1 },
      }),
    };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTemplateMeta.sheetName.slice(0, 31));

    const resumenRows = [
      ['Plantilla', selectedTemplateMeta.title],
      ['Registros exportados', reportPacientes.length],
      ['Fecha de exportacion', new Date().toLocaleString('es-MX')],
      ['Filtros activos', activeFilterLabels.length ? activeFilterLabels.join(' | ') : 'Sin filtros'],
    ];
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenRows);
    resumenSheet['!cols'] = [{ wch: 20 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fileDate = new Date().toISOString().slice(0, 10);
    const safeFileName = sanitizeFileName(selectedTemplateMeta.title) || 'reporte_pacientes';

    saveAs(dataBlob, `${safeFileName}_${fileDate}.xlsx`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Generacion de Reportes</h1>
        <p className={styles.subtitle}>Exporta pacientes filtrados en formato Excel con el mismo encabezado en todas las plantillas</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <div className={styles.filtersCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Filtros de Reporte</h2>
                <p className={styles.sectionText}>Primero filtra los pacientes; despues elige la plantilla para descargar el mismo encabezado con ese resultado.</p>
              </div>
              <button type="button" className={styles.clearFiltersBtn} onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>

            <div className={styles.filtersGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fechaDesde">Fecha Desde</label>
                <input
                  id="fechaDesde"
                  name="fechaDesde"
                  type="date"
                  lang="es-MX"
                  className={styles.input}
                  value={filters.fechaDesde}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fechaHasta">Fecha Hasta</label>
                <input
                  id="fechaHasta"
                  name="fechaHasta"
                  type="date"
                  lang="es-MX"
                  className={styles.input}
                  value={filters.fechaHasta}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="municipio">Municipio</label>
                <select
                  id="municipio"
                  name="municipio"
                  className={styles.select}
                  value={filters.municipio}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los municipios</option>
                  {municipioOptions.map((municipio) => (
                    <option key={municipio} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="anoNacimiento">Ano de Nacimiento</label>
                <select
                  id="anoNacimiento"
                  name="anoNacimiento"
                  className={styles.select}
                  value={filters.anoNacimiento}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los años</option>
                  {anoNacimientoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="rangoEdad">Rango de Edad</label>
                <select
                  id="rangoEdad"
                  name="rangoEdad"
                  className={styles.select}
                  value={filters.rangoEdad}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todas las edades</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="genero">Genero</label>
                <select
                  id="genero"
                  name="genero"
                  className={styles.select}
                  value={filters.genero}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los generos</option>
                  {generoOptions.map((genero) => (
                    <option key={genero} value={genero}>
                      {genero}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="grupo">Grupo al que Pertenece</label>
                <select
                  id="grupo"
                  name="grupo"
                  className={styles.select}
                  value={filters.grupo}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los grupos</option>
                  {grupoOptions.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="motivoConsulta">Motivo de Consulta</label>
                <select
                  id="motivoConsulta"
                  name="motivoConsulta"
                  className={styles.select}
                  value={filters.motivoConsulta}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los motivos</option>
                  {motivoConsultaOptions.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="rangoMes">Rango en Mes</label>
                <select
                  id="rangoMes"
                  name="rangoMes"
                  className={styles.select}
                  value={filters.rangoMes}
                  onChange={handleFilterChange}
                >
                  <option value={ALL_OPTION}>Todos los meses</option>
                  {BIMESTER_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className={styles.sectionTitle}>Plantillas de Reportes</h2>
            <div className={styles.templatesGrid}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`${styles.reportCard} ${selectedTemplate === template.id ? styles.activeCard : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className={styles.iconWrapper}>{template.icon}</div>
                  <div>
                    <h4 className={styles.cardTitle}>{template.title}</h4>
                    <p className={styles.cardDesc}>{template.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.barInfo}>
          <h4>{selectedTemplateMeta.title}</h4>
          <p>
            Formato: .XLSX | {reportPacientes.length} pacientes listos para exportar
            {activeFilterLabels.length ? ` | ${activeFilterLabels.length} filtros activos` : ' | Sin filtros adicionales'}
          </p>
        </div>

        <div className={styles.bottomActions}>
          <button type="button" className={styles.downloadBtn} onClick={handleDownload}>
            <FaDownload /> Generar y Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reportes;
