import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './Importar.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Stepper from '../components/ui/Stepper.jsx';

import {
  FaFileUpload,
  FaInfoCircle,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';

const REQUIRED_COLUMNS = [
  'NOMBRE',
  'CURP',
  'EDAD',
  'GENERO',
  'MUNICIPIO',
  'TELEFONO',
  'CELULAR',
  'FECHA_DIAGNOSTICO',
  'FECHA_CONSULTA',
];

const COLUMN_LABELS = {
  NOMBRE: 'Nombre del Paciente',
  CURP: 'CURP',
  EDAD: 'Edad',
  GENERO: 'Genero',
  MUNICIPIO: 'Municipio',
  TELEFONO: 'Telefono',
  CELULAR: 'Celular',
  FECHA_DIAGNOSTICO: 'Fecha de Diagnostico',
  FECHA_CONSULTA: 'Fecha de Consulta',
};

const normalizeHeader = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  return String(value).trim() === '';
};

const buildMappingRows = (headers, normalizedHeaders) => {
  const headerMap = new Map();
  normalizedHeaders.forEach((key, idx) => {
    if (!headerMap.has(key)) headerMap.set(key, headers[idx] || key);
  });

  return REQUIRED_COLUMNS.map((col) => {
    const exists = headerMap.has(col);
    return {
      excelColumn: exists ? headerMap.get(col) : col,
      systemField: COLUMN_LABELS[col] || col,
      status: exists ? 'valid' : 'error',
    };
  });
};

const buildValidation = (rows, normalizedHeaders) => {
  const missingHeaders = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));
  const hasMissingHeaders = missingHeaders.length > 0;
  const preview = [];
  let errors = 0;
  let warnings = 0;
  let valids = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const observations = [];
    let status = 'valid';

    if (hasMissingHeaders) {
      observations.push(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      status = 'error';
    } else {
      const missingFields = REQUIRED_COLUMNS.filter((col) => isEmptyValue(row[col]));
      if (missingFields.length > 0) {
        observations.push(`Campos requeridos vacios: ${missingFields.join(', ')}`);
        status = 'warning';
      }
    }

    if (status === 'error') errors += 1;
    else if (status === 'warning') warnings += 1;
    else valids += 1;

    if (preview.length < 4) {
      preview.push({
        fila: rowNumber,
        nombre: row.NOMBRE || '-',
        curp: row.CURP || '-',
        status,
        observaciones: observations[0] || '-',
      });
    }
  });

  if (hasMissingHeaders && rows.length === 0) {
    errors = missingHeaders.length;
  }

  return {
    total: rows.length,
    valid: valids,
    warnings,
    errors,
    missingHeaders,
    preview,
  };
};

const Step1 = ({
  onNext,
  onFileLoaded,
  fileMeta,
  uploadProgress,
  canContinue,
}) => {
  const fileInputRef = useRef(null);

  const handleSelectFileClick = (event) => {
    event.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileLoaded(file);
    }
  };

  return (
    <Card>
      <h2 className={styles.stepTitle}>Paso 1: Seleccionar Archivo</h2>
      <p className={styles.stepSubtitle}>Carga el archivo Excel con los datos de beneficiarios</p>

      <div className={styles.infoBox}>
        <FaInfoCircle />
        <span>
          El archivo debe contener las siguientes columnas: {REQUIRED_COLUMNS.join(', ')}
        </span>
      </div>

      <div className={styles.dropzone} onClick={() => fileInputRef.current.click()}>
        <FaFileUpload className={styles.dropzoneIcon} />
        <div>Arrastra tu archivo aqui o haz clic para seleccionar</div>

        <Button
          variant="dark"
          style={{ marginTop: '1rem' }}
          onClick={handleSelectFileClick}
          type="button"
        >
          Seleccionar Archivo
        </Button>

        <div className={styles.dropzoneFormats}>Formatos soportados: .xlsx, .xls (Max. 10MB)</div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
      />

      {fileMeta && (
        <div className={styles.uploadStatus}>
          <div className={styles.uploadMeta}>
            <span>{fileMeta.name}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className={styles.uploadBar}>
            <div className={styles.uploadBarFill} style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <div className={styles.navigation}>
        <span />
        <Button onClick={onNext} disabled={!canContinue}>
          Cargar y continuar
        </Button>
      </div>
    </Card>
  );
};

const Step2 = ({ onBack, onNext, mappingRows, detectedCount, showToast }) => (
  <Card>
    <h2 className={styles.stepTitle}>Paso 2: Mapeo de Columnas</h2>
    <p className={styles.stepSubtitle}>Verifica la correspondencia entre columnas del Excel y campos del sistema</p>

    <div className={styles.infoBox}>
      <FaInfoCircle />
      <span>
        Se detectaron automaticamente {detectedCount} columnas. Revisa el mapeo antes de continuar.
      </span>
    </div>

    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Columna en Excel</th>
            <th>Campo del Sistema</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {mappingRows.map((row) => (
            <tr key={row.systemField}>
              <td>{row.excelColumn}</td>
              <td>{row.systemField}</td>
              <td>
                {row.status === 'valid' ? (
                  <span className={styles.tagValido}><FaCheckCircle /> Valido</span>
                ) : (
                  <span className={styles.tagError}><FaTimesCircle /> Error</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className={styles.navigation}>
      <Button onClick={onBack} variant="secondary">Volver</Button>
      <Button onClick={onNext}>Continuar a Validacion</Button>
    </div>

    {showToast && (
      <div className={styles.uploadToast}>
        <FaCheckCircle /> Archivo cargado correctamente
      </div>
    )}
  </Card>
);

const Step3 = ({ total }) => (
  <Card>
    <div className={styles.loadingStep}>
      <FaSpinner className={styles.spinner} />
      <h2 className={styles.stepTitle} style={{ marginTop: '2rem' }}>Validando Datos</h2>
      <p className={styles.stepSubtitle}>Verificando calidad y consistencia de los datos...</p>
      <div className={styles.progressBar}>
        <div className={styles.progressInner}></div>
      </div>
      <p className={styles.loadingText}>Validando {total} registros...</p>
    </div>
  </Card>
);

const Step4 = ({ onBack, onNext, summary, preview, canImport }) => (
  <Card>
    <h2 className={styles.stepTitle}>Paso 4: Resumen de Validacion</h2>
    <p className={styles.stepSubtitle}>Revisa los resultados antes de importar</p>

    <div className={styles.summaryGrid}>
      <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
        <span className={styles.summaryNumber}>{summary.total}</span>
        <span className={styles.summaryLabel}>Registros Totales</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
        <span className={styles.summaryNumber}>{summary.valid}</span>
        <span className={styles.summaryLabel}>Validos</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardYellow}`}>
        <span className={styles.summaryNumber}>{summary.warnings}</span>
        <span className={styles.summaryLabel}>Advertencias</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
        <span className={styles.summaryNumber}>{summary.errors}</span>
        <span className={styles.summaryLabel}>Errores</span>
      </div>
    </div>

    {(summary.errors > 0 || summary.warnings > 0) ? (
      <div className={styles.infoBox}>
        <FaTimesCircle style={{ color: '#de350b' }} />
        <span>No se puede importar hasta corregir errores o advertencias.</span>
      </div>
    ) : (
      <div className={styles.infoBox}>
        <FaCheckCircle style={{ color: '#00875a' }} />
        <span>Todo listo para importar.</span>
      </div>
    )}

    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fila</th>
            <th>Nombre</th>
            <th>CURP</th>
            <th>Estado</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {preview.length > 0 ? (
            preview.map((row) => (
              <tr key={row.fila}>
                <td>{row.fila}</td>
                <td>{row.nombre}</td>
                <td>{row.curp}</td>
                <td>
                  {row.status === 'valid' && (
                    <span className={styles.tagValido}><FaCheckCircle /> Valido</span>
                  )}
                  {row.status === 'warning' && (
                    <span className={styles.tagAdvertencia}><FaExclamationTriangle /> Advertencia</span>
                  )}
                  {row.status === 'error' && (
                    <span className={styles.tagError}><FaTimesCircle /> Error</span>
                  )}
                </td>
                <td>{row.observaciones}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                No hay registros para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className={styles.navigation}>
      <Button onClick={onBack} variant="secondary">Volver</Button>
      <Button onClick={onNext} disabled={!canImport}>
        Importar {summary.valid} Registros
      </Button>
    </div>
  </Card>
);

const Step5 = ({ onFinish, importedCount }) => (
  <Card>
    <div className={styles.completeStep}>
      <FaCheckCircle className={styles.completeIcon} />
      <h2 className={styles.stepTitle}>!Importacion exitosa!</h2>
      <p className={styles.stepSubtitle}>Se importaron {importedCount} registros exitosamente.</p>
      <Button onClick={onFinish}>Finalizar</Button>
    </div>
  </Card>
);

function Importar() {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileMeta, setFileMeta] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [normalizedHeaders, setNormalizedHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [demoMode, setDemoMode] = useState(() => {
    const stored = localStorage.getItem('demoImportMode');
    return stored ? stored === 'true' : true;
  });
  const [validation, setValidation] = useState({
    total: 0,
    valid: 0,
    warnings: 0,
    errors: 0,
    missingHeaders: [],
    preview: [],
  });
  const [showToast, setShowToast] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    setCurrentStep(1);
  };

  const handleImport = () => {
    if (demoMode) {
      localStorage.setItem('demoImportRows', JSON.stringify(rows));
    }
    handleNext();
  };

  const handleFileLoaded = (file) => {
    setUploadProgress(10);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const headerRow = rawRows[0] || [];
        const parsedHeaders = headerRow.map((item) => (item || '').toString().trim());
        const parsedNormalized = parsedHeaders.map(normalizeHeader);

        const dataRows = rawRows.slice(1).filter((row) =>
          row.some((cell) => !isEmptyValue(cell))
        );

        const parsedRows = dataRows.map((row) => {
          const record = {};
          parsedNormalized.forEach((key, idx) => {
            if (!key) return;
            record[key] = row[idx];
          });
          return record;
        });

        setFileMeta({ name: file.name, size: file.size });
        setHeaders(parsedHeaders);
        setNormalizedHeaders(parsedNormalized);
        setRows(parsedRows);
        setValidation(buildValidation(parsedRows, parsedNormalized));
        setUploadProgress(100);
        setShowToast(true);
      } catch (error) {
        console.error('Error leyendo archivo:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        handleNext();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('demoImportMode', String(demoMode));
  }, [demoMode]);

  const mappingRows = buildMappingRows(headers, normalizedHeaders);
  const canContinue = Boolean(fileMeta);
  const canImport = validation.errors === 0 && validation.warnings === 0 && validation.total > 0;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            onNext={handleNext}
            onFileLoaded={handleFileLoaded}
            fileMeta={fileMeta}
            uploadProgress={uploadProgress}
            canContinue={canContinue}
          />
        );
      case 2:
        return (
          <Step2
            onBack={handleBack}
            onNext={handleNext}
            mappingRows={mappingRows}
            detectedCount={normalizedHeaders.filter(Boolean).length}
            showToast={showToast}
          />
        );
      case 3:
        return <Step3 total={validation.total} />;
      case 4:
        return (
          <Step4
            onBack={handleBack}
            onNext={handleImport}
            summary={validation}
            preview={validation.preview}
            canImport={canImport}
          />
        );
      case 5:
        return <Step5 onFinish={handleFinish} importedCount={validation.valid} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Importar Datos desde Excel</h1>
          <p className={styles.subtitle}>Carga y valida informacion de beneficiarios desde archivo Excel</p>
        </div>
      </div>

      <Stepper currentStep={currentStep} totalSteps={5} />

      {renderStep()}
    </div>
  );
}

export default Importar;
