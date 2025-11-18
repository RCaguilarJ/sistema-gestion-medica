import React, { useState, useEffect } from 'react';
import styles from './Pacientes.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import { FaSearch, FaPlus, FaEye, FaSpinner } from 'react-icons/fa';
import Modal from '../components/ui/Modal.jsx';
import { getPacientes, createPaciente } from '../services/pacienteService.js';
import formStyles from './Configuracion.module.css'; // Reutilizamos los estilos base

// --- Formulario Nuevo/Edición Paciente ---
// Este componente ahora maneja todos los campos del nuevo Figma
const FormularioNuevoPaciente = ({ onClose, onSuccess }) => {
  
  // Usamos un solo estado para todo el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    curp: '',
    fechaNacimiento: '',
    genero: 'Masculino',
    telefono: '',
    email: '',
    calleNumero: '',
    colonia: '',
    municipio: '',
    estado: '',
    codigoPostal: '',
    tipoDiabetes: 'Tipo 2',
    fechaDiagnostico: '',
    estaturaCm: '',
    pesoKg: '',
    estatus: 'Activo',
    riesgo: 'Bajo',
    programa: '',
    tipoTerapia: '',
  });
  const [error, setError] = useState('');

  // Manejador genérico para todos los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Preparamos los datos
    const pacienteData = {
      ...formData,
      // Convertimos a números los que lo necesiten
      estaturaCm: formData.estaturaCm ? parseInt(formData.estaturaCm) : null,
      pesoKg: formData.pesoKg ? parseFloat(formData.pesoKg) : null,
    };

    try {
      const data = await createPaciente(pacienteData);
      if (data) {
        onSuccess(); // Cierra el modal y refresca la lista
      } else {
        setError('No se pudo crear el paciente. Revisa los datos.');
      }
    } catch (err) {
      setError('Error al crear el paciente. El CURP o Email podrían ya existir.');
    }
  };

  return (
    // Usamos styles.responsiveForm para aplicar el media query
    <form onSubmit={handleSubmit} className={styles.responsiveForm}>
      
      <h3 className={styles.formSectionTitle}>Datos Generales</h3>
      {/* Usamos styles.formGrid para el layout responsivo */}
      <div className={styles.formGrid}>
        <div className={formStyles.formGroup}>
          <label htmlFor="nombre">Nombre Completo</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="curp">CURP</label>
          <input type="text" name="curp" value={formData.curp} onChange={handleChange} required />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="genero">Género</label>
          <select name="genero" value={formData.genero} onChange={handleChange}>
            <option>Masculino</option>
            <option>Femenino</option>
            <option>Otro</option>
          </select>
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="telefono">Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="email">Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
      </div>

      <h3 className={styles.formSectionTitle}>Domicilio</h3>
      <div className={styles.formGrid}>
        <div className={`${formStyles.formGroup} ${styles.fullWidthMobile}`}>
          <label htmlFor="calleNumero">Calle y Número</label>
          <input type="text" name="calleNumero" value={formData.calleNumero} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="colonia">Colonia</label>
          <input type="text" name="colonia" value={formData.colonia} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="municipio">Municipio</label>
          <input type="text" name="municipio" value={formData.municipio} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="estado">Estado</label>
          <input type="text" name="estado" value={formData.estado} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="codigoPostal">Código Postal</label>
          <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} />
        </div>
      </div>

      <h3 className={styles.formSectionTitle}>Datos Clínicos</h3>
      <div className={styles.formGrid}>
        <div className={formStyles.formGroup}>
          <label htmlFor="tipoDiabetes">Tipo de Diabetes</label>
          <select name="tipoDiabetes" value={formData.tipoDiabetes} onChange={handleChange}>
            <option>Tipo 2</option>
            <option>Tipo 1</option>
            <option>Gestacional</option>
            <option>Otro</option>
          </select>
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="fechaDiagnostico">Fecha de Diagnóstico</label>
          <input type="date" name="fechaDiagnostico" value={formData.fechaDiagnostico} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="estaturaCm">Estatura (cm)</label>
          <input type="number" name="estaturaCm" value={formData.estaturaCm} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="pesoKg">Peso (kg)</label>
          <input type="number" step="0.1" name="pesoKg" value={formData.pesoKg} onChange={handleChange} />
        </div>
      </div>

      <h3 className={styles.formSectionTitle}>Configuración de Sistema</h3>
      <div className={styles.formGrid}>
        <div className={formStyles.formGroup}>
          <label htmlFor="estatus">Estatus</label>
          <select name="estatus" value={formData.estatus} onChange={handleChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="riesgo">Riesgo</label>
          <select name="riesgo" value={formData.riesgo} onChange={handleChange}>
            <option value="Bajo">Bajo</option>
            <option value="Medio">Medio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="programa">Programa</label>
          <input type="text" name="programa" value={formData.programa} onChange={handleChange} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="tipoTerapia">Tipo de Terapia</label>
          <input type="text" name="tipoTerapia" value={formData.tipoTerapia} onChange={handleChange} />
        </div>
      </div>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarPacientes = async () => {
    setIsLoading(true);
    const data = await getPacientes();
    setPacientes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // defer to the next microtask so we don't call setState synchronously inside the effect
      await Promise.resolve();
      if (!mounted) return;
      setIsLoading(true);
      try {
        const data = await getPacientes();
        if (!mounted) return;
        setPacientes(data);
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePacienteCreado = () => {
    setIsModalOpen(false);
    alert('¡Paciente creado exitosamente!');
    cargarPacientes(); 
  };

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
    
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CURP</th>
              <th>Municipio</th>
              <th>Teléfono</th>
              <th>Riesgo</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td>
                  <div className={styles.pacienteNombre}>{paciente.nombre}</div>
                  <div className={styles.pacienteMeta}>{paciente.email}</div>
                </td>
                <td>{paciente.curp}</td>
                <td>{paciente.municipio}</td>
                <td>{paciente.telefono || 'N/A'}</td>
                <td><Tag label={paciente.riesgo || 'N/A'} /></td>
                <td><Tag label={paciente.estatus || 'N/A'} /></td>
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
        
        <Button onClick={() => setIsModalOpen(true)}>
          <FaPlus />
          Nuevo Paciente
        </Button>
      </div>

      <div className={styles.filterBar}>
        {/* ... (tus filtros) ... */}
      </div>

      {renderTabla()}

      {/* Actualizamos el título del Modal */}
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