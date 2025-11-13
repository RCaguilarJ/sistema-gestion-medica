import React, { useState, useEffect, useRef } from 'react'; // <--- 1. IMPORTAR useRef
import styles from './Importar.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Stepper from '../components/ui/Stepper.jsx';

// Importamos íconos
import {
  FaFileUpload,
  FaInfoCircle,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';

// --- Sub-componentes para cada paso ---

// ---------------------------------
// PASO 1: SELECCIONAR ARCHIVO (ACTUALIZADO)
// ---------------------------------
const Step1 = ({ onNext }) => {
  // 2. Creamos una referencia para el input de archivo
  const fileInputRef = useRef(null);

  // 3. Esta función "dispara" el clic en el input oculto
  const handleSelectFileClick = (e) => {
    // Detenemos la propagación si se hizo clic en el botón
    // para evitar que el div también lo dispare.
    e.stopPropagation(); 
    fileInputRef.current.click();
  };

  // 4. Esta función se ejecuta cuando el usuario selecciona un archivo
  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name);
      // Aquí guardaríamos el archivo en un estado
      // y podríamos avanzar al siguiente paso
      // onNext(); // (Descomentar para avanzar automáticamente)
    }
  };

  return (
    <Card>
      <h2 className={styles.stepTitle}>Paso 1: Seleccionar Archivo</h2>
      <p className={styles.stepSubtitle}>Carga el archivo Excel con los datos de beneficiarios</p>

      <div className={styles.infoBox}>
        <FaInfoCircle />
        <span>El archivo debe contener las siguientes columnas: NOMBRE, CURP, EDAD, GENERO, MUNICIPIO...</span>
      </div>

      {/* 5. Hacemos que toda la zona sea clickeable */}
      <div className={styles.dropzone} onClick={() => fileInputRef.current.click()}>
        <FaFileUpload className={styles.dropzoneIcon} />
        <div>Arrastra tu archivo aquí o haz clic para seleccionar</div>
        
        {/* 6. Nuestro botón bonito ahora dispara el clic */}
        <Button 
          variant="dark" 
          style={{ marginTop: '1rem' }}
          onClick={handleSelectFileClick} 
        >
          Seleccionar Archivo
        </Button>

        <div className={styles.dropzoneFormats}>Formatos soportados: .xlsx, .xls (Máx. 10MB)</div>
      </div>

      {/* 7. EL INPUT REAL (OCULTO) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }} // Lo ocultamos
        accept=".xlsx, .xls" // Aceptamos solo Excel
      />

      <div className={styles.navigation}>
        <span />
        {/* Dejamos este botón por ahora para simular el avance */}
        <Button onClick={onNext}>Simular Carga y Continuar</Button>
      </div>
    </Card>
  );
};

// ---------------------------------
// PASO 2: MAPEO DE COLUMNAS
// ---------------------------------
const Step2 = ({ onBack, onNext }) => (
  <Card>
    <h2 className={styles.stepTitle}>Paso 2: Mapeo de Columnas</h2>
    <p className={styles.stepSubtitle}>Verifica la correspondencia entre columnas del Excel y campos del sistema</p>

    <div className={styles.infoBox}>
      <FaInfoCircle />
      <span>Se detectaron automáticamente 7 columnas. Revisa el mapeo antes de continuar.</span>
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
          <tr>
            <td>NOMBRE</td>
            <td>Nombre del Paciente</td>
            <td><span className={styles.tagValido}><FaCheckCircle /> Válido</span></td>
          </tr>
          <tr>
            <td>CURP</td>
            <td>CURP</td>
            <td><span className={styles.tagValido}><FaCheckCircle /> Válido</span></td>
          </tr>
          <tr>
            <td>EDAD</td>
            <td>Edad</td>
            <td><span className={styles.tagValido}><FaCheckCircle /> Válido</span></td>
          </tr>
          <tr>
            <td>MUNICIPIO</td>
            <td>Municipio</td>
            <td><span className={styles.tagAdvertencia}><FaExclamationTriangle /> Advertencia</span></td>
          </tr>
          {/* ... más filas ... */}
        </tbody>
      </table>
    </div>

    <div className={styles.navigation}>
      <Button onClick={onBack} variant="secondary">Volver</Button>
      <Button onClick={onNext}>Continuar a Validación</Button>
    </div>
  </Card>
);

// ---------------------------------
// PASO 3: VALIDANDO DATOS
// ---------------------------------
const Step3 = () => (
  <Card>
    <div className={styles.loadingStep}>
      <FaSpinner className={styles.spinner} />
      <h2 className={styles.stepTitle} style={{ marginTop: '2rem' }}>Validando Datos</h2>
      <p className={styles.stepSubtitle}>Verificando calidad y consistencia de los datos...</p>
      <div className={styles.progressBar}>
        <div className={styles.progressInner}></div>
      </div>
      <p className={styles.loadingText}>Validando 150 registros...</p>
    </div>
  </Card>
);

// ---------------------------------
// PASO 4: RESUMEN DE VALIDACIÓN
// ---------------------------------
const Step4 = ({ onBack, onNext }) => (
  <Card>
    <h2 className={styles.stepTitle}>Paso 4: Resumen de Validación</h2>
    <p className={styles.stepSubtitle}>Revisa los resultados antes de importar</p>

    <div className={styles.summaryGrid}>
      <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
        <span className={styles.summaryNumber}>150</span>
        <span className={styles.summaryLabel}>Registros Totales</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
        <span className={styles.summaryNumber}>142</span>
        <span className={styles.summaryLabel}>Válidos</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardYellow}`}>
        <span className={styles.summaryNumber}>6</span>
        <span className={styles.summaryLabel}>Advertencias</span>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
        <span className={styles.summaryNumber}>2</span>
        <span className={styles.summaryLabel}>Errores</span>
      </div>
    </div>

    <div className={styles.infoBox}>
      <FaTimesCircle style={{ color: '#de350b' }} />
      <span>Se encontraron 2 errores que deben corregirse antes de importar.</span>
    </div>

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
          <tr>
            <td>25</td>
            <td>Carlos Ramirez</td>
            <td>-</td>
            <td><span className={styles.tagError}><FaTimesCircle /> Error</span></td>
            <td>CURP requerido</td>
          </tr>
          <tr>
            <td>40</td>
            <td>Ana Martinez Ruiz</td>
            <td>MARA881123MCRTRM2</td>
            <td><span className={styles.tagAdvertencia}><FaExclamationTriangle /> Advertencia</span></td>
            <td>Municipio no encontrado en catálogo</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className={styles.navigation}>
      <Button onClick={onBack} variant="secondary">Volver</Button>
      <Button onClick={onNext}>Importar 142 Registros</Button>
    </div>
  </Card>
);

// ---------------------------------
// PASO 5: IMPORTACIÓN COMPLETA
// ---------------------------------
const Step5 = ({ onFinish }) => (
  <Card>
    <div className={styles.completeStep}>
      <FaCheckCircle className={styles.completeIcon} />
      <h2 className={styles.stepTitle}>Importación Completa</h2>
      <p className={styles.stepSubtitle}>Se importaron 142 registros exitosamente.</p>
      <Button onClick={onFinish}>Finalizar</Button>
    </div>
  </Card>
);

// --- Componente Principal ---

function Importar() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    setCurrentStep(1); // Reinicia al primer paso
  };

  // Simulación de carga para el Paso 3
  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        handleNext(); // Mueve al Paso 4 después de 2 segundos
      }, 2000);
      return () => clearTimeout(timer); // Limpia el timer
    }
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 onNext={handleNext} />;
      case 2:
        return <Step2 onBack={handleBack} onNext={handleNext} />;
      case 3:
        return <Step3 />; // No tiene botones, pasa automático
      case 4:
        return <Step4 onBack={handleBack} onNext={handleNext} />;
      case 5:
        return <Step5 onFinish={handleFinish} />;
      default:
        return <Step1 onNext={handleNext} />;
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Importar Datos desde Excel</h1>
      <p className={styles.subtitle}>Carga y valida información de beneficiarios desde archivo Excel</p>

      <Stepper currentStep={currentStep} totalSteps={5} />

      {renderStep()}
    </div>
  );
}

export default Importar;