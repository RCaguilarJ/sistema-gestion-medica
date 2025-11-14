import React, { useState, useEffect } from 'react';
import styles from './Pacientes.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import { FaSearch, FaPlus, FaEye, FaSpinner } from 'react-icons/fa';

// --- 1. IMPORTAR LO QUE NECESITAMOS ---
import Modal from '../components/ui/Modal.jsx';
import { getPacientes, createPaciente } from '../services/pacienteService.js';

// --- Formulario para el Modal ---
// (Usamos los mismos estilos 'formGroup' que en Configuracion)
import formStyles from './Configuracion.module.css'; 

const FormularioNuevoPaciente = ({ onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [riesgo, setRiesgo] = useState('Bajo');
  const [estatus, setEstatus] = useState('Activo');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Preparamos los datos del paciente
    const pacienteData = {
      nombre,
      curp,
      municipio,
      riesgo,
      estatus,
      // (Podemos añadir hba1c, imc, etc. aquí)
    };

    try {
      const data = await createPaciente(pacienteData);
      if (data) {
        onSuccess(); // Cierra el modal y refresca la lista
      } else {
        setError('No se pudo crear el paciente. Revisa los datos.');
      }
    } catch (err) {
      setError('Error al crear el paciente. Intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={formStyles.formGroup}>
        <label htmlFor="nombre">Nombre Completo</label>
        <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="curp">CURP</label>
        <input type="text" id="curp" value={curp} onChange={(e) => setCurp(e.target.value)} required />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="municipio">Municipio</label>
        <input type="text" id="municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={formStyles.formGroup}>
          <label htmlFor="riesgo">Riesgo</label>
          <select id="riesgo" value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
            <option value="Bajo">Bajo</option>
            <option value="Medio">Medio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="estatus">Estatus</label>
          <select id="estatus" value={estatus} onChange={(e) => setEstatus(e.target.value)}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Crear Paciente</Button>
      </div>
    </form>
  );
};


// --- Componente Principal de la Página ---
function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // --- 2. ESTADO PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 3. FUNCIÓN REUTILIZABLE PARA CARGAR PACIENTES ---
  const cargarPacientes = async () => {
    setIsLoading(true);
    const data = await getPacientes();
    setPacientes(data);
    setIsLoading(false);
  };

  // Cargar pacientes al montar el componente
  useEffect(() => {
    cargarPacientes();
  }, []); // El array vacío [] significa que esto se ejecuta 1 sola vez

  // Detectar vista móvil para render alternativo (tarjetas)
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Callback para cuando se crea un paciente
  const handlePacienteCreado = () => {
    setIsModalOpen(false); // Cierra el modal
    alert('¡Paciente creado exitosamente!');
    cargarPacientes(); // Vuelve a cargar la lista de pacientes
  };

  // Función para dar estilo al HbA1c
  const getHba1cStyle = (riesgo) => {
    if (riesgo === 'Alto') return styles.hba1cAlto;
    if (riesgo === 'Medio') return styles.hba1cMedio;
    return styles.hba1cBajo;
  };

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
          <p>No se encontraron pacientes. ¡Haz clic en "Nuevo Paciente" para agregar el primero!</p>
        </div>
      );
    }
    
    // En móvil renderizamos tarjetas con la info más relevante
    if (isMobileView) {
      return (
        <div className={styles.patientList}>
          {pacientes.map((p) => (
            <Card key={p.id}>
              <div className={styles.patientCard}>
                <div className={styles.patientCardMain}>
                  <div className={styles.pacienteNombre}>{p.nombre}</div>
                  <div className={styles.patientCardMeta}>
                    <div><strong>CURP:</strong> {p.curp}</div>
                    <div><strong>Municipio:</strong> {p.municipio || 'N/A'}</div>
                    <div><strong>HbA1c:</strong> {p.hba1c ? `${p.hba1c}%` : 'N/A'}</div>
                  </div>
                </div>
                <div className={styles.patientCardActions}>
                  <div className={styles.patientTags}>
                    <Tag label={p.riesgo || 'N/A'} />
                    <Tag label={p.estatus || 'N/A'} />
                  </div>
                  <div>
                    <FaEye className={styles.accionIcon} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className={styles.tableContainer}>
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
            {pacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td>
                  <div className={styles.pacienteNombre}>{paciente.nombre}</div>
                </td>
                <td>{paciente.curp}</td>
                <td>{paciente.municipio}</td>
                <td className={getHba1cStyle(paciente.riesgo)}>{paciente.hba1c || 'N/A'}%</td>
                <td>{paciente.imc || 'N/A'}</td>
                <td><Tag label={paciente.riesgo || 'N/A'} /></td>
                <td><Tag label={paciente.estatus || 'N/A'} /></td>
                <td>{paciente.ultimaVisita ? new Date(paciente.ultimaVisita).toLocaleDateString() : 'N/A'}</td>
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
          <p className={styles.subtitle}>Total: {pacientes.length} pacientes</p>
        </div>
        
        {/* --- 4. CONECTAMOS EL BOTÓN PARA ABRIR EL MODAL --- */}
        <Button onClick={() => setIsModalOpen(true)}>
          <FaPlus />
          Nuevo Paciente
        </Button>
      </div>

      <div className={styles.filterBar}>
         {/* ... (tus filtros) ... */}
      </div>

      {renderTabla()}

      {/* --- 5. AÑADIMOS EL MODAL AL FINAL --- */}
      <Modal 
        title="Crear Nuevo Paciente"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <FormularioNuevoPaciente 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handlePacienteCreado}
        />
      </Modal>
    </div>
  );
}

export default Pacientes;