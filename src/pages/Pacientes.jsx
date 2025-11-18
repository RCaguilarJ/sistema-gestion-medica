import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Importado para la navegación
import styles from './Pacientes.module.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import { FaSearch, FaPlus, FaEye, FaSpinner, FaEdit, FaTimesCircle, FaSave } from 'react-icons/fa'; // Iconos actualizados
import Modal from '../components/ui/Modal.jsx';
import DetallePacienteModal from '../components/ui/DetallePacienteModal.jsx';
import { getPacientes, createPaciente } from '../services/pacienteService.js';
import formStyles from './Configuracion.module.css'; // Reutilizamos los estilos base

// --- Función Helper para Limpieza (Movida fuera para claridad, o mantenida aquí si es pequeña) ---
const cleanAndNormalizeData = (data) => {
    const cleanedData = { ...data };
    
    // 1. Eliminar campos vacíos, nulos o indefinidos
    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    // 2. Conversiones a número (solo si el campo existe después de la limpieza)
    if (cleanedData.estaturaCm) cleanedData.estaturaCm = parseInt(cleanedData.estaturaCm, 10);
    if (cleanedData.pesoKg) cleanedData.pesoKg = parseFloat(cleanedData.pesoKg);
    // Nota: imc y hba1c podrían calcularse en el backend o frontend, pero por ahora solo se envían si existen.
    
    return cleanedData;
};


// --- Formulario Nuevo/Edición Paciente ---
// (Mismo componente de creación, ahora con la corrección del submit)
const FormularioNuevoPaciente = ({ onClose, onSuccess }) => {
  
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
    // Nota: imc y hba1c se manejan en el backend o se ingresan en edición, no en creación inicial aquí
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true); // Bloquear botón

    // --- CORRECCIÓN CLAVE ---
    const pacienteData = cleanAndNormalizeData(formData);
    // -----------------------

    try {
      await createPaciente(pacienteData);
      onSuccess(); // Cierra el modal y refresca la lista
      
    } catch (err) {
      // Manejo de errores más detallado
      const details = err.details || [err.message || 'Error desconocido al crear paciente.'];
      if (details.some(d => d.includes('curp'))) {
          setError('Validation error: El CURP ya está registrado o es inválido.');
      } else if (details.some(d => d.includes('email'))) {
          setError('Validation error: El Email ya está registrado o es inválido.');
      } else {
          setError(`Error al crear paciente: ${details.join(', ')}`);
      }
    } finally {
        setIsSaving(false); // Desbloquear botón
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.responsiveForm}>
      {/* ... (Todo el HTML del formulario de creación es el mismo) ... */}
      <h3 className={styles.formSectionTitle}>Datos Generales</h3>
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
        {/* Aquí puedes agregar campos de configuración (estatus/riesgo) si se crean desde el inicio */}
      </div>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
            <FaPlus /> {isSaving ? 'Creando...' : 'Crear Paciente'}
        </Button>
      </div>
    </form>
  );
};


// --- Componente Principal de la Página ---
function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Agregamos la instancia de useNavigate
  const navigate = useNavigate();

  const cargarPacientes = async () => {
    setIsLoading(true);
    try {
        const data = await getPacientes();
        setPacientes(data);
    } catch (err) {
        console.error('Error cargando pacientes:', err);
        setPacientes([]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handlePacienteCreado = () => {
    setIsModalOpen(false);
    alert('¡Paciente creado exitosamente!');
    cargarPacientes(); 
  };
  
  // --- FUNCIÓN ACTUALIZADA PARA NAVEGAR ---
  const handleVerDetalle = (pacienteId) => {
    if (isMobileView) {
      // abrir modal con detalle ligero
      setSelectedPacienteId(pacienteId);
      setMobileDetailOpen(true);
    } else {
      // Navega a la ruta dinámica: /pacientes/123
      navigate(`/pacientes/${pacienteId}`);
    }
  };
  // ---------------------------------------

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
                  {/* LLAMADA A LA FUNCIÓN DE NAVEGACIÓN */}
                  <div 
                    onClick={() => handleVerDetalle(paciente.id)}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                    title="Ver Expediente / Editar"
                  >
                      <FaEye className={styles.accionIcon} />
                  </div>
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
        {/* Aquí van los filtros */}
      </div>

      {renderTabla()}

      {/* Modal para Crear Paciente */}
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

      {/* Modal ligero para mobile: detalle rápido */}
      <DetallePacienteModal
        pacienteId={selectedPacienteId}
        isOpen={mobileDetailOpen}
        onClose={() => { setMobileDetailOpen(false); setSelectedPacienteId(null); }}
      />
    </div>
  );
}

export default Pacientes;