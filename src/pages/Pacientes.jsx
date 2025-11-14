import React from 'react'; // <--- Quitamos useState y useEffect
import styles from './Pacientes.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import { FaSearch, FaPlus, FaEye } from 'react-icons/fa'; // <-- Quitamos FaSpinner

// <-- 1. IMPORTAR SERVICIO ELIMINADO
// import { getPacientes } from '../services/pacienteService.js'; 

// --- 2. VOLVEMOS A AÑADIR LOS MOCK DATA ---
const mockPacientes = [
  {
    id: 1,
    nombre: 'Roberto García Pérez',
    meta: '39 años • Masculino',
    curp: 'GARP850615HOCLMR89',
    municipio: 'Guadalajara',
    hba1c: 9.2,
    imc: 31.5,
    riesgo: 'Alto',
    estatus: 'Activo',
    ultimaVisita: '14/10/2024',
  },
  {
    id: 2,
    nombre: 'Carmen López Martínez',
    meta: '52 años • Femenino',
    curp: 'LOMC520808AHOCRJT05',
    municipio: 'Zapopan',
    hba1c: 6.5,
    imc: 26.8,
    riesgo: 'Bajo',
    estatus: 'Activo',
    ultimaVisita: '19/10/2024',
  },
];
// -------------------------------------

// Función para dar estilo al HbA1c
const getHba1cStyle = (riesgo) => {
  if (riesgo === 'Alto') return styles.hba1cAlto;
  if (riesgo === 'Medio') return styles.hba1cMedio;
  return styles.hba1cBajo;
};

function Pacientes() {
  // --- 3. ELIMINAMOS LOS ESTADOS Y useEffect ---
  // const [pacientes, setPacientes] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  // useEffect(...)

  // --- 4. RENDERIZADO SIMPLIFICADO ---
  const renderTabla = () => {
    // (Eliminamos la lógica de isLoading y length === 0)
    
    return (
      <div className={styles.tableContainer}> {/* Usamos styles en lugar de tableStyles */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CURP</th>
              <th>Municipio</th>
              <th>HbA1c</th>
              <th>IMC</th>
              <th>Riesgo</th>
              <th>Estatus</th>
              <th>Última Visita</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* 5. Usamos 'mockPacientes' de nuevo */}
            {mockPacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td>
                  <div className={styles.pacienteNombre}>{paciente.nombre}</div>
                  <div className={styles.pacienteMeta}>{paciente.meta}</div>
                </td>
                <td>{paciente.curp}</td>
                <td>{paciente.municipio}</td>
                <td className={getHba1cStyle(paciente.riesgo)}>{paciente.hba1c}%</td>
                <td>{paciente.imc}</td>
                <td><Tag label={paciente.riesgo} /></td>
                <td><Tag label={paciente.estatus} /></td>
                <td>{paciente.ultimaVisita}</td>
                <td>
                  <FaEye className={styles.accionIcon} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Pacientes</h1>
          <p className={styles.subtitle}>Total: {mockPacientes.length} pacientes</p>
        </div>
        <Button>
          <FaPlus />
          Nuevo Paciente
        </Button>
      </div>

      <div className={styles.filterBar}>
        {/* ... (filtros) ... */}
      </div>

      {renderTabla()}
    </div>
  );
}

export default Pacientes;