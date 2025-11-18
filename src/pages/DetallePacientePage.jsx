import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaSave, FaTimesCircle, FaSpinner, FaPlus, FaCalendarAlt, FaEye, FaCalendarCheck } from 'react-icons/fa';
// Asumimos que tus componentes UI (Button, Modal, Card, Tag) y Axios están configurados.
import Button from '../components/ui/Button.jsx'; 
import Modal from '../components/ui/Modal.jsx'; 
import Tag from '../components/ui/Tag.jsx'; 
import Card from '../components/ui/Card.jsx'; 
// Importamos los servicios necesarios
import { getPacienteById, updatePaciente } from '../services/pacienteService.js';
import { 
    getConsultasByPaciente, 
    createConsulta, 
    getConsultaDetail,
    getCitasByPaciente,
    createCita,
    updateCitaEstado,
} from '../services/consultaCitaService.js'; // Servicio combinado (asumido)

// Asumimos que los estilos están disponibles.
import styles from '../components/layout/Layout.module.css'; 
import formStyles from './Configuracion.module.css'; 


// --- DEFINICIONES DE ENUMS (para reusar en selects) ---
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];


// --- HELPER: Limpieza de datos (para el update) ---
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
    if (cleanedData.hba1c) cleanedData.hba1c = parseFloat(cleanedData.hba1c);
    if (cleanedData.imc) cleanedData.imc = parseFloat(cleanedData.imc);

    return cleanedData;
};


// --------------------------------------------------------
// --- MODALES Y SECCIONES DE PESTAÑAS (COMPONENTS) ---
// --------------------------------------------------------

// --- Modal de Ver Detalle de Consulta (image_17716a.png) ---
const ModalVerConsulta = ({ consultaId, onClose }) => {
    const [consulta, setConsulta] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!consultaId) return;
            try {
                setIsLoading(true);
                const data = await getConsultaDetail(consultaId);
                setConsulta(data);
            } catch (err) {
                console.error('Error cargando detalle:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [consultaId]);

    if (isLoading) return <div style={{textAlign: 'center'}}><FaSpinner className={styles.spinner} /> Cargando...</div>;
    if (!consulta) return <p>No se pudo cargar el detalle de la consulta.</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h3 className={formStyles.formSectionTitle} style={{ borderBottom: 'none' }}>Consulta de {new Date(consulta.fechaConsulta).toLocaleDateString()}</h3>
            <div className={formStyles.formGrid}>
                <div className={formStyles.formGroup}>
                    <label>Motivo</label>
                    <p>{consulta.motivo}</p>
                </div>
                <div className={formStyles.formGroup}>
                    <label>Médico/Nutriólogo</label>
                    <p>{consulta.Medico ? consulta.Medico.nombre : 'N/A'}</p>
                </div>
                <div className={formStyles.formGroup}>
                    <label>Peso Registrado</label>
                    <p>{consulta.pesoKg || 'N/A'} kg</p>
                </div>
                <div className={formStyles.formGroup}>
                    <label>HbA1c</label>
                    <p>{consulta.hba1c || 'N/A'}%</p>
                </div>
            </div>
            <h3 className={formStyles.formSectionTitle}>Hallazgos y Tratamiento</h3>
            <div className={formStyles.formGroup}>
                <label>Hallazgos</label>
                <textarea rows="4" value={consulta.hallazgos || 'No hay hallazgos registrados.'} disabled></textarea>
            </div>
            <div className={formStyles.formGroup}>
                <label>Tratamiento</label>
                <textarea rows="4" value={consulta.tratamiento || 'No hay tratamiento registrado.'} disabled></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};


// --- Modal de Nueva Consulta (image_176ea5.png) ---
const ModalNuevaConsulta = ({ pacienteId, onClose, onConsultaCreated }) => {
    const [formData, setFormData] = useState({
        motivo: '', hallazgos: '', tratamiento: '', pesoKg: '', hba1c: '', fechaConsulta: new Date().toISOString().slice(0, 10)
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const dataToSend = cleanAndNormalizeData(formData);
            await createConsulta(pacienteId, dataToSend);
            onConsultaCreated(); // Llama a la función que recarga el historial y cierra el modal
        } catch (err) {
            setError(err.message || 'Error al registrar la consulta. Verifique los datos.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.responsiveForm} style={{ padding: '15px' }}>
            <div className={formStyles.formGrid}>
                <div className={formStyles.formGroup}>
                    <label htmlFor="motivo">Motivo *</label>
                    <input type="text" name="motivo" value={formData.motivo} onChange={handleChange} required />
                </div>
                <div className={formStyles.formGroup}>
                    <label htmlFor="fechaConsulta">Fecha</label>
                    <input type="date" name="fechaConsulta" value={formData.fechaConsulta} onChange={handleChange} required />
                </div>
                <div className={formStyles.formGroup}>
                    <label htmlFor="pesoKg">Peso (kg)</label>
                    <input type="number" step="0.1" name="pesoKg" value={formData.pesoKg} onChange={handleChange} />
                </div>
                <div className={formStyles.formGroup}>
                    <label htmlFor="hba1c">HbA1c (%)</label>
                    <input type="number" step="0.1" name="hba1c" value={formData.hba1c} onChange={handleChange} />
                </div>
            </div>
            <div className={formStyles.formGroup}>
                <label htmlFor="hallazgos">Hallazgos / Notas Clínicas</label>
                <textarea rows="4" name="hallazgos" value={formData.hallazgos} onChange={handleChange}></textarea>
            </div>
            <div className={formStyles.formGroup}>
                <label htmlFor="tratamiento">Tratamiento / Recomendaciones</label>
                <textarea rows="4" name="tratamiento" value={formData.tratamiento} onChange={handleChange}></textarea>
            </div>
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    <FaSave /> {isSaving ? 'Guardando...' : 'Registrar Consulta'}
                </Button>
            </div>
        </form>
    );
};


// --- Modal de Agendar Cita (image_176ec3.png) ---
const ModalAgendarCita = ({ pacienteId, onClose, onCitaCreated }) => {
    // Asumimos que tienes una forma de obtener la lista de médicos/nutriólogos (Users)
    const [formData, setFormData] = useState({
        fechaHora: '', motivo: '', medicoId: '', notas: ''
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // [INTEGRACIÓN FALTANTE]: Cargar lista de User (Médicos/Nutriólogos) para el Select.

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            // Requiere fechaHora, motivo, medicoId
            const dataToSend = cleanAndNormalizeData(formData);
            await createCita(pacienteId, dataToSend);
            onCitaCreated();
        } catch (err) {
            setError(err.message || 'Error al agendar la cita.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.responsiveForm} style={{ padding: '15px' }}>
            <div className={formStyles.formGrid}>
                <div className={formStyles.formGroup}>
                    <label htmlFor="fechaHora">Fecha y Hora *</label>
                    <input type="datetime-local" name="fechaHora" value={formData.fechaHora} onChange={handleChange} required />
                </div>
                <div className={formStyles.formGroup}>
                    <label htmlFor="medicoId">Asignar a *</label>
                    <select name="medicoId" value={formData.medicoId} onChange={handleChange} required>
                        <option value="">Seleccione un Médico/Nutriólogo</option>
                        {/* [INTEGRACIÓN FALTANTE]: Rellenar con la lista de Users */}
                        <option value={1}>Administrador (1)</option> 
                        <option value={2}>Nutriólogo (2)</option>
                    </select>
                </div>
            </div>
            <div className={formStyles.formGroup}>
                <label htmlFor="motivo">Motivo de Cita *</label>
                <input type="text" name="motivo" value={formData.motivo} onChange={handleChange} required />
            </div>
            <div className={formStyles.formGroup}>
                <label htmlFor="notas">Notas Internas</label>
                <textarea rows="3" name="notas" value={formData.notas} onChange={handleChange}></textarea>
            </div>
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    <FaSave /> {isSaving ? 'Agendando...' : 'Agendar Cita'}
                </Button>
            </div>
        </form>
    );
};


// --- SECCIÓN: HISTORIAL CLÍNICO ---
const HistorialClinicoSection = ({ pacienteId, onConsultaCreated }) => {
    const [consultas, setConsultas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalConsultaOpen, setIsModalConsultaOpen] = useState(false);
    const [isViewConsultaOpen, setIsViewConsultaOpen] = useState(false);
    const [selectedConsultaId, setSelectedConsultaId] = useState(null);

    const loadConsultas = async () => {
        setIsLoading(true);
        try {
            const data = await getConsultasByPaciente(pacienteId); 
            setConsultas(data);
        } catch (err) {
            console.error('Error cargando historial clínico:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConsultas();
    }, [pacienteId]);

    const handleConsultaCreated = () => {
        setIsModalConsultaOpen(false);
        loadConsultas(); // Recargar la lista
        onConsultaCreated(); // Notificar al padre para actualizar la última visita
    };
    
    const handleVerConsulta = (consultaId) => {
        setSelectedConsultaId(consultaId);
        setIsViewConsultaOpen(true);
    };
    
    const renderTablaConsultas = () => {
        if (isLoading) {
            return (<div style={{ textAlign: 'center', padding: '4rem' }}><FaSpinner className={styles.spinner} /> <p>Cargando consultas...</p></div>);
        }
        if (consultas.length === 0) {
            return (
                <p style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                    No hay consultas registradas.
                </p>
            );
        }
        
        return (
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Motivo</th>
                            <th>Médico/Nutriólogo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {consultas.map((c) => (
                            <tr key={c.id}>
                                <td>{new Date(c.fechaConsulta).toLocaleDateString()}</td>
                                <td>{c.motivo}</td>
                                <td>{c.Medico ? c.Medico.nombre : 'N/A'}</td>
                                <td>
                                    <div 
                                        onClick={() => handleVerConsulta(c.id)}
                                        style={{ cursor: 'pointer', display: 'inline-block' }}
                                        title="Ver Detalle de Consulta"
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
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <Button onClick={() => setIsModalConsultaOpen(true)} variant="primary">
                    <FaPlus /> Nueva Consulta
                </Button>
            </div>
            
            {renderTablaConsultas()}

            <Modal title="Registrar Nueva Consulta" isOpen={isModalConsultaOpen} onClose={() => setIsModalConsultaOpen(false)} size="large">
                <ModalNuevaConsulta 
                    pacienteId={pacienteId}
                    onClose={() => setIsModalConsultaOpen(false)}
                    onConsultaCreated={handleConsultaCreated}
                />
            </Modal>
            
            <Modal title="Detalle de la Consulta" isOpen={isViewConsultaOpen} onClose={() => setIsViewConsultaOpen(false)} size="large">
                <ModalVerConsulta 
                    consultaId={selectedConsultaId}
                    onClose={() => setIsViewConsultaOpen(false)}
                />
            </Modal>
        </div>
    );
};


// --- SECCIÓN: CITAS ---
const CitasSection = ({ pacienteId }) => {
    const [citas, setCitas] = useState({ proximasCitas: [], historialCitas: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalCitaOpen, setIsModalCitaOpen] = useState(false);
    
    const loadCitas = async () => {
        setIsLoading(true);
        try {
            const data = await getCitasByPaciente(pacienteId);
            setCitas(data);
        } catch (err) {
            console.error('Error cargando citas:', err);
            setCitas({ proximasCitas: [], historialCitas: [] });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCitas();
    }, [pacienteId]);

    const handleCitaCreated = () => {
        setIsModalCitaOpen(false);
        loadCitas();
    };
    
    const handleUpdateCita = async (citaId, nuevoEstado) => {
        if (window.confirm(`¿Está seguro de cambiar el estado de la cita a "${nuevoEstado}"?`)) {
            try {
                await updateCitaEstado(citaId, nuevoEstado);
                loadCitas(); 
            } catch (error) {
                alert(`Error al actualizar la cita: ${error.message}`);
            }
        }
    };
    
    const now = new Date();
    
    // Renderiza la tarjeta de cita (Simulación del diseño de Figma)
    const renderCitaCard = (cita) => (
        <Card key={cita.id} style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            // Colores basados en el estado
            borderLeft: `5px solid ${cita.estado === 'Pendiente' ? '#FFC107' : cita.estado === 'Confirmada' ? '#007BFF' : cita.estado === 'Completada' ? '#28A745' : '#DC3545'}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ margin: 0, color: '#007BFF' }}>{cita.motivo}</h4>
                    <p style={{ margin: '5px 0' }}>
                        <FaCalendarAlt /> **{new Date(cita.fechaHora).toLocaleString()}**
                    </p>
                    <p style={{ fontSize: '0.9em', color: '#666' }}>
                        **Con:** {cita.Medico ? cita.Medico.nombre : 'N/A'}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Tag label={cita.estado} type={cita.estado === 'Pendiente' ? 'warning' : cita.estado === 'Confirmada' ? 'info' : cita.estado === 'Completada' ? 'success' : 'danger'} />
                    
                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        {cita.estado === 'Pendiente' && (
                            <Button onClick={() => handleUpdateCita(cita.id, 'Confirmada')} variant="success" size="small">Confirmar</Button>
                        )}
                        {cita.estado === 'Confirmada' && new Date(cita.fechaHora) < now && (
                            <Button onClick={() => handleUpdateCita(cita.id, 'Completada')} variant="primary" size="small">Finalizar</Button>
                        )}
                        {cita.estado !== 'Cancelada' && cita.estado !== 'Completada' && (
                            <Button onClick={() => handleUpdateCita(cita.id, 'Cancelada')} variant="danger" size="small">Cancelar</Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className={formStyles.formSectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>Gestión de Citas</h3>
                <Button onClick={() => setIsModalCitaOpen(true)} variant="primary">
                    <FaCalendarAlt /> Agendar Cita
                </Button>
            </div>
            
            {isLoading ? (
                 <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <FaSpinner className={styles.spinner} />
                    <p>Cargando citas...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 className={formStyles.formSectionTitle}>Próximas Citas ({citas.proximasCitas.length})</h3>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                        {citas.proximasCitas.length > 0 ? (
                            citas.proximasCitas.map(renderCitaCard)
                        ) : (
                            <p style={{ margin: 0 }}>No hay citas próximas agendadas.</p>
                        )}
                    </div>
                    
                    <h3 className={formStyles.formSectionTitle}>Historial de Citas ({citas.historialCitas.length})</h3>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                        {citas.historialCitas.length > 0 ? (
                            citas.historialCitas.map(renderCitaCard)
                        ) : (
                            <p style={{ margin: 0 }}>No hay historial de citas.</p>
                        )}
                    </div>
                </div>
            )}

            <Modal title="Agendar Nueva Cita" isOpen={isModalCitaOpen} onClose={() => setIsModalCitaOpen(false)} size="medium">
                <ModalAgendarCita 
                    pacienteId={pacienteId}
                    onClose={() => setIsModalCitaOpen(false)}
                    onCitaCreated={handleCitaCreated}
                />
            </Modal>
        </div>
    );
};


// --------------------------------------------------------
// --- COMPONENTE PRINCIPAL: DetallePacientePage ---
// --------------------------------------------------------
function DetallePacientePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState('generales'); 

  // Función para cargar los datos del paciente y actualizar el estado
  const fetchPaciente = async () => {
    try {
        setIsLoading(true);
        const data = await getPacienteById(id);
        
        // Formatear fechas para inputs 'date'
        const fechaNacimiento = data.fechaNacimiento ? data.fechaNacimiento.slice(0, 10) : '';
        const fechaDiagnostico = data.fechaDiagnostico ? data.fechaDiagnostico.slice(0, 10) : '';

        const formattedData = { ...data, fechaNacimiento, fechaDiagnostico };
        setPaciente(formattedData);
        setFormData(formattedData);
        setError('');
        return formattedData;
    } catch (err) {
        setError('Error al cargar los datos del paciente.');
        setPaciente(null);
        setFormData({});
        return null;
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaciente();
  }, [id]);
  
  // Función para forzar la recarga de datos generales (usada después de crear una consulta)
  const handleUpdateUltimaVisita = () => {
      fetchPaciente();
  };


  // Lógica de Edición (handleSave, handleCancel) ... (Mantenemos la lógica de edición en el componente padre)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const dataToSend = cleanAndNormalizeData(formData);
      
      const updatedPaciente = await updatePaciente(id, dataToSend);

      // Recargar datos y salir del modo edición
      setPaciente(updatedPaciente);
      // Reformatear para el estado
      const fechaNacimiento = updatedPaciente.fechaNacimiento ? updatedPaciente.fechaNacimiento.slice(0, 10) : '';
      const fechaDiagnostico = updatedPaciente.fechaDiagnostico ? updatedPaciente.fechaDiagnostico.slice(0, 10) : '';
      setFormData({ ...updatedPaciente, fechaNacimiento, fechaDiagnostico });
      
      setIsEditing(false);
      alert('Paciente actualizado con éxito.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar. Verifique los campos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(paciente); 
    setIsEditing(false);
    setError('');
  };


  // Renderizado de Spinners y Mensajes de Error
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.spinner} />
        <p>Cargando datos del paciente...</p>
      </div>
    );
  }

  if (!paciente || Object.keys(paciente).length === 0) {
      return (
          <div className={styles.container}>
              <h2>No se pudieron cargar los datos del paciente.</h2>
              <p style={{ color: 'red' }}>{error}</p>
              <Button onClick={() => navigate('/pacientes')}>Volver a la lista</Button>
          </div>
      );
  }

  const edad = paciente.fechaNacimiento ? new Date().getFullYear() - new Date(paciente.fechaNacimiento).getFullYear() : 'N/A';

  // Helper para renderizar secciones del formulario (usado por el tab 'generales')
  const renderFormSection = (title, fields) => (
    <div className={styles.contentCard} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff' }}>
      <h3 className={formStyles.formSectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>{title}</h3>
      <div className={formStyles.formGrid}>
        {fields.map((field) => (
          <div className={formStyles.formGroup} key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={!isEditing ? formStyles.disabledInput : ''}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                value={field.value || formData[field.name] || ''} 
                onChange={handleInputChange}
                disabled={!isEditing || field.disabled}
                readOnly={!isEditing || field.disabled}
                step={field.step}
                className={!isEditing || field.disabled ? formStyles.disabledInput : ''}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      
      {/* --- HEADER Y BOTONES DE EDICIÓN --- */}
      <div className={styles.header} style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
        <div className={styles.headerLeft} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button onClick={() => navigate('/pacientes')} variant="secondary" title="Volver a Pacientes" style={{ fontSize: '1.2em', padding: '10px' }}>
            <FaArrowLeft />
          </Button>
          <div className={styles.patientInfo}>
            <h2 style={{ margin: 0 }}>{paciente.nombre}</h2>
            <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>ID: PAT-{paciente.id} - CURP: {paciente.curp}</p>
          </div>
        </div>

        <div className={styles.headerRight} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {error && <span style={{ color: 'red', marginRight: '10px' }}>{error}</span>}
          <span style={{
                padding: '5px 10px',
                borderRadius: '15px',
                fontWeight: 'bold',
                backgroundColor: paciente.estatus === 'Activo' ? '#4CAF50' : '#F44336',
                color: 'white',
            }}>
                {paciente.estatus || 'N/A'}
            </span>
          
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} variant="primary">
                <FaSave /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button onClick={handleCancel} variant="secondary" disabled={isSaving}>
                <FaTimesCircle /> Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <FaEdit /> Editar
            </Button>
          )}
        </div>
      </div>

      {/* --- MÉTRICAS CLÍNICAS (Fila de Cards) --- */}
      {/* ... (Renderizado de Métricas) ... */}
      <div className={styles.metricsGrid} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          marginBottom: '30px' 
      }}>
        {/* Aquí irían tus 4 tarjetas de métricas */}
        {/* Tarjeta 1: HbA1c y Riesgo */}
        <div className={styles.metricCard} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>HbA1c</h4>
          <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: paciente.riesgo === 'Alto' ? 'red' : paciente.riesgo === 'Medio' ? 'orange' : 'green' }}>{paciente.hba1c || '-'}%</p>
          <p style={{ margin: 0, color: '#666' }}>Riesgo: {paciente.riesgo || 'N/A'}</p>
        </div>
        {/* Tarjeta 4: Última Consulta (Actualizada por la nueva lógica de consultas) */}
        <div className={styles.metricCard} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>Última Consulta</h4>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#007BFF' }}>
            {paciente.ultimaVisita ? new Date(paciente.ultimaVisita).toLocaleDateString() : 'N/A'}
          </p>
          <p style={{ margin: 0, color: '#666' }}>Tipo: {paciente.tipoTerapia || 'N/A'}</p>
        </div>
        {/* ... (otras tarjetas) ... */}
        <div className={styles.metricCard} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>IMC</h4>
          <p style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{paciente.imc || '-'}</p>
          <p style={{ margin: 0, color: '#666' }}>{paciente.pesoKg || '-'} kg / {paciente.estaturaCm || '-'} cm</p>
        </div>
         <div className={styles.metricCard} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>Edad</h4>
          <p style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{edad}</p>
          <p style={{ margin: 0, color: '#666' }}>Nacimiento: {paciente.fechaNacimiento || 'N/A'}</p>
        </div>
      </div>

      {/* --- PESTAÑAS (TABS) --- */}
      <div className={styles.tabContainer} style={{ borderBottom: '2px solid #ddd', marginBottom: '20px', display: 'flex' }}>
        {/* La lógica de estilos inline se basa en la definición de activeTab */}
        <span 
            className={activeTab === 'generales' ? styles.tabActive : styles.tab} 
            onClick={() => setActiveTab('generales')}
            style={{ fontWeight: activeTab === 'generales' ? 'bold' : 'normal', borderBottom: activeTab === 'generales' ? '3px solid #007BFF' : 'none', cursor: 'pointer', padding: '10px 20px' }}
        >
            Datos Generales
        </span>
        <span 
            className={activeTab === 'clinico' ? styles.tabActive : styles.tab} 
            onClick={() => setActiveTab('clinico')}
            style={{ fontWeight: activeTab === 'clinico' ? 'bold' : 'normal', borderBottom: activeTab === 'clinico' ? '3px solid #007BFF' : 'none', cursor: 'pointer', padding: '10px 20px' }}
        >
            Historial Clínico
        </span>
        <span 
            className={activeTab === 'citas' ? styles.tabActive : styles.tab} 
            onClick={() => setActiveTab('citas')}
            style={{ fontWeight: activeTab === 'citas' ? 'bold' : 'normal', borderBottom: activeTab === 'citas' ? '3px solid #007BFF' : 'none', cursor: 'pointer', padding: '10px 20px' }}
        >
            Citas
        </span>
      </div>

      {/* --- CONTENIDO CONDICIONAL --- */}
      <div style={{ flexGrow: 1 }}>
        {/* PESTAÑA 1: DATOS GENERALES (Formulario editable/de solo lectura) */}
        {activeTab === 'generales' && (
          <form>
            {renderFormSection('Información Personal', [
              { label: 'Nombre Completo', name: 'nombre', type: 'text' },
              { label: 'CURP', name: 'curp', type: 'text', disabled: true }, 
              { label: 'Fecha de Nacimiento', name: 'fechaNacimiento', type: 'date' },
              { label: 'Edad', name: 'edad', type: 'text', disabled: true, value: edad },
              { label: 'Género', name: 'genero', type: 'select', options: allowedGeneros.map(v => ({ value: v, label: v })) },
              { label: 'Celular', name: 'telefono', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
            ])}

            {renderFormSection('Domicilio', [
              { label: 'Calle y Número', name: 'calleNumero', type: 'text' },
              { label: 'Colonia', name: 'colonia', type: 'text' },
              { label: 'Municipio', name: 'municipio', type: 'text' },
              { label: 'Estado', name: 'estado', type: 'text' },
              { label: 'Código Postal', name: 'codigoPostal', type: 'text' },
            ])}
            
            {renderFormSection('Información Clínica', [
              { label: 'Tipo de Diabetes', name: 'tipoDiabetes', type: 'select', options: allowedTipoDiabetes.map(v => ({ value: v, label: v })) },
              { label: 'Fecha Diagnóstico', name: 'fechaDiagnostico', type: 'date' },
              { label: 'Estatura (cm)', name: 'estaturaCm', type: 'number' },
              { label: 'Peso (kg)', name: 'pesoKg', type: 'number', step: "0.1" },
              { label: 'HbA1c', name: 'hba1c', type: 'number', step: "0.1" },
              { label: 'IMC', name: 'imc', type: 'text', disabled: true, value: paciente.imc || '' }, 
            ])}

            {renderFormSection('Configuración de Sistema', [
              { label: 'Estatus', name: 'estatus', type: 'select', options: allowedEstatus.map(v => ({ value: v, label: v })) },
              { label: 'Riesgo', name: 'riesgo', type: 'select', options: allowedRiesgo.map(v => ({ value: v, label: v })) },
              { label: 'Programa', name: 'programa', type: 'text' },
              { label: 'Tipo de Terapia', name: 'tipoTerapia', type: 'text' },
              { label: 'Nutriólogo Asignado (ID)', name: 'nutriologoId', type: 'number' },
            ])}
          </form>
        )}

        {/* PESTAÑA 2: HISTORIAL CLÍNICO (Nueva sección) */}
        {activeTab === 'clinico' && 
            <HistorialClinicoSection 
                pacienteId={paciente.id} 
                onConsultaCreated={handleUpdateUltimaVisita} 
            />
        }

        {/* PESTAÑA 3: CITAS (Nueva sección) */}
        {activeTab === 'citas' && 
            <CitasSection 
                pacienteId={paciente.id} 
            />
        }
      </div>
      
      {/* Botones Fijos para Edición */}
      {isEditing && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: 0, backgroundColor: '#f4f7f9', padding: '15px', borderTop: '1px solid #ddd', zIndex: 10 }}>
            <Button onClick={handleCancel} variant="secondary" disabled={isSaving}>
                <FaTimesCircle /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} variant="primary">
                <FaSave /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
      )}
    </div>
  );
}

// // Exportamos las listas de ENUMS para reusarlas en el helper
// const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
// const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
// const allowedEstatus = ['Activo', 'Inactivo'];
// const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];


export default DetallePacientePage;