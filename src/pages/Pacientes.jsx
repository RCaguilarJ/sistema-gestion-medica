import React, { useState, useEffect } from 'react'; // <-- 1. IMPORTAR useState y useEffect
import styles from './Pacientes.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';

// Importamos los íconos
import { FaSearch, FaPlus, FaEye, FaSpinner } from 'react-icons/fa'; // <-- Añadimos FaSpinner

// <-- 2. IMPORTAR NUESTRO SERVICIO DE API
import { getPacientes } from '../services/pacienteService.js';

// --- (BORRAMOS LOS MOCK DATA QUE ESTABAN AQUÍ) ---

// Función para dar estilo al HbA1c
const getHba1cStyle = (riesgo) => {
  if (riesgo === 'Alto') return styles.hba1cAlto;
  if (riesgo === 'Medio') return styles.hba1cMedio;
  return styles.hba1cBajo;
};

function Pacientes() {
  // --- 3. CREAR ESTADOS ---
  // Un estado para guardar los pacientes que vienen de la API
  const [pacientes, setPacientes] = useState([]);
  // Un estado para saber si estamos "Cargando"
  const [isLoading, setIsLoading] = useState(true);

  // --- 4. LLAMAR A LA API AL CARGAR LA PÁGINA ---
  useEffect(() => {
    // Definimos una función async para cargar los datos
    const cargarPacientes = async () => {
      setIsLoading(true); // Empezamos a cargar
      const data = await getPacientes();
      setPacientes(data);
      setIsLoading(false); // Terminamos de cargar
    };
    
    cargarPacientes(); // Llamamos a la función
  }, []); // El array vacío [] significa que esto se ejecuta 1 sola vez

  // --- 5. RENDERIZADO CONDICIONAL ---
  
  // Función para mostrar la tabla o un mensaje de carga
  const renderTabla = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <FaSpinner className={styles.spinner} />
          <p>Cargando pacientes...</p>
        </div>
      );
    }

    if (pacientes.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>No se encontraron pacientes. ¡Intenta agregar uno en Strapi!</p>
        </div>
      );
    }
    
    // Si no estamos cargando y hay pacientes, mostramos la tabla
    return (
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
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
            {/* 6. Usamos el estado 'pacientes', NO 'mockPacientes' */}
            {pacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td>
                  <div className={tableStyles.pacienteNombre}>{paciente.nombre}</div>
                  {/* (Necesitaremos añadir edad y genero a Strapi para esto) */}
                  {/* <div className={tableStyles.pacienteMeta}>{paciente.meta}</div> */}
                </td>
                <td>{paciente.curp}</td>
                <td>{paciente.municipio}</td>
                <td className={getHba1cStyle(paciente.riesgo)}>{paciente.hba1c}%</td>
                <td>{paciente.imc}</td>
                <td><Tag label={paciente.riesgo} /></td>
                <td><Tag label={paciente.estatus} /></td>
                <td>{new Date(paciente.ultimaVisita).toLocaleDateString()}</td>
                <td>
                  <FaEye className={tableStyles.accionIcon} />
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
      {/* 1. Encabezado */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Pacientes</h1>
          <p className={styles.subtitle}>Total: {pacientes.length} pacientes</p>
        </div>
        <Button>
          <FaPlus />
          Nuevo Paciente
        </Button>
      </div>

      {/* 2. Filtros (Siguen igual) */}
      <div className={styles.filterBar}>
        {/* ... (filtros) ... */}
      </div>

      {/* 3. Tabla (Ahora llama a nuestra función) */}
      {renderTabla()}
    </div>
  );
}

export default Pacientes;