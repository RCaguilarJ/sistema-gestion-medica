import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaSave, FaTimesCircle, FaSpinner, FaCalendarAlt, FaPlus, FaEye } from 'react-icons/fa';
import styles from '../styles/DetallePacientePage.module.css';
import formStyles from '../styles/FormStyles.module.css'; 
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tag from '../components/ui/Tag';
import Card from '../components/ui/Card';

// Componentes de Secciones
import Nutricion from './Nutricion';
import Documentos from './Documentos';

// Servicios
import { getPacienteById, updatePaciente } from '../services/pacienteService';
import {
    getConsultasByPaciente,
    getConsultaDetail,
    createConsulta,
    getCitasByPaciente,
    createCita,
    updateCitaEstado,
} from '../services/consultaCitaService.js';

// --- HELPERS ---

const cleanAndNormalizeData = (data) => {
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
            delete cleanedData[key];
        }
    });
    // Conversiones numéricas
    if (cleanedData.pesoKg) cleanedData.pesoKg = parseFloat(cleanedData.pesoKg);
    if (cleanedData.estatura) cleanedData.estatura = parseFloat(cleanedData.estatura);
    if (cleanedData.hba1c) cleanedData.hba1c = parseFloat(cleanedData.hba1c);
    if (cleanedData.imc) cleanedData.imc = parseFloat(cleanedData.imc);

    return cleanedData;
};

// Fórmula IMC: Peso / (Estatura * Estatura) en metros
const calcularIMC = (peso, estatura) => {
    const p = parseFloat(peso);
    const e = parseFloat(estatura);
    
    if (!p || !e || e === 0) return '';

    const imc = p / (e * e);
    return imc.toFixed(1);
};

// Listas para selectores
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

// --------------------------------------------------------
// --- SUB-COMPONENTES Y MODALES ---
// --------------------------------------------------------

// Modal Ver Detalle de Consulta
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

    if (isLoading) return <div style={{ textAlign: 'center' }}><FaSpinner className="fa-spin" /> Cargando...</div>;
    if (!consulta) return <p>No se pudo cargar el detalle.</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h3 style={{fontSize:'1.1rem', borderBottom: '1px solid #eee', paddingBottom:'10px'}}>Consulta del {new Date(consulta.fechaConsulta).toLocaleDateString()}</h3>
            <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px' }}>
                <div><strong>Motivo:</strong> <p>{consulta.motivo}</p></div>
                <div><strong>Médico:</strong> <p>{consulta.Medico ? consulta.Medico.nombre : 'N/A'}</p></div>
                <div><strong>Peso:</strong> <p>{consulta.pesoKg || 'N/A'} kg</p></div>
                <div><strong>HbA1c:</strong> <p>{consulta.hba1c || 'N/A'}%</p></div>
            </div>
            <div style={{ marginTop:'20px' }}>
                <strong>Hallazgos:</strong>
                <p style={{backgroundColor:'#f9f9f9', padding:'10px', borderRadius:'5px'}}>{consulta.hallazgos || 'Sin notas.'}</p>
            </div>
            <div style={{ marginTop:'15px' }}>
                <strong>Tratamiento:</strong>
                <p style={{backgroundColor:'#f9f9f9', padding:'10px', borderRadius:'5px'}}>{consulta.tratamiento || 'Sin tratamiento.'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

// Modal Nueva Consulta
const ModalNuevaConsulta = ({ pacienteId, onClose, onConsultaCreated }) => {
    const [formData, setFormData] = useState({
        motivo: '', hallazgos: '', tratamiento: '', pesoKg: '', hba1c: '', fechaConsulta: new Date().toISOString().slice(0, 10)
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createConsulta(pacienteId, cleanAndNormalizeData(formData));
            onConsultaCreated();
            onClose();
        } catch (err) {
            alert('Error al registrar consulta');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '15px' }}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                <div className={formStyles.formGroup}>
                    <label>Motivo *</label>
                    <input name="motivo" value={formData.motivo} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                </div>
                <div className={formStyles.formGroup}>
                    <label>Fecha</label>
                    <input type="date" name="fechaConsulta" value={formData.fechaConsulta} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                </div>
                <div className={formStyles.formGroup}>
                    <label>Peso (kg)</label>
                    <input type="number" step="0.1" name="pesoKg" value={formData.pesoKg} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                </div>
                <div className={formStyles.formGroup}>
                    <label>HbA1c (%)</label>
                    <input type="number" step="0.1" name="hba1c" value={formData.hba1c} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                </div>
            </div>
            <div className={formStyles.formGroup} style={{marginTop:'15px'}}>
                <label>Hallazgos</label>
                <textarea rows="3" name="hallazgos" value={formData.hallazgos} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
            </div>
            <div className={formStyles.formGroup}>
                <label>Tratamiento</label>
                <textarea rows="3" name="tratamiento" value={formData.tratamiento} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>Guardar</Button>
            </div>
        </form>
    );
};

// Modal Agendar Cita (sin asignación de especialista)
const ModalAgendarCita = ({ pacienteId, onClose, onCitaCreated }) => {
    const [formData, setFormData] = useState({
        fechaHora: '', motivo: '', notas: ''
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const payload = cleanAndNormalizeData(formData);
            payload.medicoId = null; // El backend espera explícitamente el campo en null
            await createCita(pacienteId, payload);
            onCitaCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al agendar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '15px' }}>
            <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'15px'}}>
                <div className={formStyles.formGroup}>
                    <label>Fecha y Hora *</label>
                    <input type="datetime-local" name="fechaHora" value={formData.fechaHora} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                </div>
            </div>
            <div className={formStyles.formGroup} style={{marginTop:'15px'}}>
                <label>Motivo *</label>
                <input name="motivo" value={formData.motivo} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
            </div>
            <div className={formStyles.formGroup}>
                <label>Notas</label>
                <textarea rows="2" name="notas" value={formData.notas} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
            </div>
            {error && <p style={{color:'red'}}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>Agendar</Button>
            </div>
        </form>
    );
};

// Secciones de Historial y Citas
const HistorialClinicoSection = ({ pacienteId, onConsultaCreated }) => {
    const [consultas, setConsultas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        getConsultasByPaciente(pacienteId).then(setConsultas).catch(console.error);
    }, [pacienteId, isModalOpen]); 

    return (
        <div style={{padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'20px'}}>
                <Button onClick={() => setIsModalOpen(true)}><FaPlus /> Nueva Consulta</Button>
            </div>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Fecha</th><th>Motivo</th><th>Médico</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {consultas.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.fechaConsulta).toLocaleDateString()}</td>
                                <td>{c.motivo}</td>
                                <td>{c.Medico?.nombre || 'N/A'}</td>
                                <td><FaEye style={{cursor:'pointer'}} onClick={() => setSelectedId(c.id)} /></td>
                            </tr>
                        ))}
                        {consultas.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>Sin historial.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal title="Nueva Consulta" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalNuevaConsulta pacienteId={pacienteId} onClose={() => setIsModalOpen(false)} onConsultaCreated={onConsultaCreated} />
            </Modal>
            <Modal title="Detalle" isOpen={!!selectedId} onClose={() => setSelectedId(null)}>
                <ModalVerConsulta consultaId={selectedId} onClose={() => setSelectedId(null)} />
            </Modal>
        </div>
    );
};

const CitasSection = ({ pacienteId }) => {
    const [citas, setCitas] = useState({ proximasCitas: [], historialCitas: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const load = () => getCitasByPaciente(pacienteId).then(setCitas).catch(console.error);
    useEffect(() => { load(); }, [pacienteId]);

    const handleStatus = async (id, status) => {
        if(window.confirm(`¿Cambiar a ${status}?`)) {
            await updateCitaEstado(id, status);
            load();
        }
    };

    const renderCita = (c) => (
        <Card key={c.id} style={{marginBottom:'10px', borderLeft: `4px solid ${c.estado === 'Confirmada' ? 'green' : 'orange'}`}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                    <strong>{c.motivo}</strong><br/>
                    <small>{new Date(c.fechaHora).toLocaleString()} con {c.Medico?.nombre}</small>
                </div>
                <div>
                    <Tag label={c.estado} />
                    {c.estado === 'Pendiente' && <Button size="small" onClick={() => handleStatus(c.id, 'Confirmada')}>Confirmar</Button>}
                </div>
            </div>
        </Card>
    );

    return (
        <div style={{padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <h3>Próximas Citas</h3>
                <Button onClick={() => setIsModalOpen(true)}><FaCalendarAlt /> Agendar</Button>
            </div>
            {citas.proximasCitas.length > 0 ? citas.proximasCitas.map(renderCita) : <p>No hay citas próximas.</p>}
            
            <h3 style={{marginTop:'30px'}}>Historial</h3>
            {citas.historialCitas.map(renderCita)}

            <Modal title="Agendar Cita" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalAgendarCita pacienteId={pacienteId} onClose={() => setIsModalOpen(false)} onCitaCreated={load} />
            </Modal>
        </div>
    );
};

// --------------------------------------------------------
// --- COMPONENTE PRINCIPAL ---
// --------------------------------------------------------

function DetallePacientePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState(null);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('generales');

    const fetchPaciente = async () => {
        setIsLoading(true);
        try {
            const data = await getPacienteById(id);
            setPaciente(data);
            setFormData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPaciente(); }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // Cálculo Automático IMC en tiempo real
        if (name === 'pesoKg' || name === 'estatura') {
            const peso = name === 'pesoKg' ? value : formData.pesoKg;
            const est = name === 'estatura' ? value : formData.estatura;
            newFormData.imc = calcularIMC(peso, est);
        }
        setFormData(newFormData);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updatePaciente(id, cleanAndNormalizeData(formData));
            setPaciente(updated);
            setFormData(updated);
            setIsEditing(false);
            alert("Guardado correctamente");
        } catch (err) {
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className={styles.loadingContainer}><FaSpinner className="fa-spin" /> Cargando...</div>;
    if (!paciente) return <div>No encontrado</div>;

    // Helper para renderizar campos
    const renderField = (label, name, type = 'text', options = [], props = {}) => (
        <div className={formStyles.formGroup}>
            <label>{label}</label>
            {type === 'select' ? (
                <select 
                    name={name} 
                    value={formData[name] || ''} 
                    onChange={handleInputChange} 
                    disabled={!isEditing}
                    className={!isEditing ? formStyles.disabledInput : ''}
                >
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    name={name} 
                    value={formData[name] || ''} 
                    onChange={handleInputChange} 
                    disabled={!isEditing || props.readOnly} 
                    className={(!isEditing || props.readOnly) ? formStyles.disabledInput : ''}
                    {...props} 
                />
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header} style={{justifyContent:'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <Button onClick={() => navigate('/app/pacientes')} variant="secondary"><FaArrowLeft/></Button>
                    <div>
                        <h2 style={{margin:0}}>{paciente.nombre}</h2>
                        <small style={{color:'#666'}}>ID: {paciente.id} - {paciente.curp}</small>
                    </div>
                </div>
                <div>
                    <Tag label={paciente.estatus} />
                    <span style={{margin:'0 10px'}}></span>
                    {isEditing ? (
                        <div style={{display:'inline-flex', gap:'10px'}}>
                            <Button onClick={() => { setIsEditing(false); setFormData(paciente); }} variant="secondary">Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSaving}><FaSave /> Guardar</Button>
                        </div>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}><FaEdit /> Editar</Button>
                    )}
                </div>
            </div>

            {/* Métricas */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}><h4>HbA1c</h4><h2>{paciente.hba1c || '-'}%</h2><small>{paciente.riesgo}</small></div>
                <div className={styles.metricCard}><h4>Última Consulta</h4><h3>{paciente.ultimaVisita ? new Date(paciente.ultimaVisita).toLocaleDateString() : 'N/A'}</h3></div>
                <div className={styles.metricCard}><h4>IMC</h4><h2>{paciente.imc || '-'}</h2><small>{paciente.pesoKg}kg / {paciente.estatura}m</small></div>
                <div className={styles.metricCard}><h4>Edad</h4><h2>{calcularEdad(paciente.fechaNacimiento)}</h2><small>{paciente.fechaNacimiento}</small></div>
            </div>

            {/* Tabs */}
            <div className={styles.tabContainer}>
                {['generales', 'clinico', 'citas', 'nutricion', 'documentos'].map(tab => (
                    <span 
                        key={tab} 
                        className={activeTab === tab ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab(tab)}
                        style={{textTransform: 'capitalize'}}
                    >
                        {tab === 'generales' ? 'Datos Generales' : tab}
                    </span>
                ))}
            </div>

            {/* Contenido Tabs */}
            <div className={styles.contentCard}>
                {activeTab === 'generales' && (
                    <form className={formStyles.formGrid} style={{display:'block'}}>
                        <h3 className={formStyles.formSectionTitle}>Información Personal</h3>
                        <div className={formStyles.formGrid}>
                            {renderField('Nombre Completo', 'nombre')}
                            {renderField('CURP', 'curp')}
                            {renderField('Fecha Nacimiento', 'fechaNacimiento', 'date')}
                            {renderField('Género', 'genero', 'select', allowedGeneros.map(v => ({value:v, label:v})))}
                            {renderField('Celular', 'celular')}
                            {renderField('Email', 'email', 'email')}
                        </div>

                        <h3 className={formStyles.formSectionTitle}>Domicilio</h3>
                        <div className={formStyles.formGrid}>
                            {renderField('Calle y Número', 'calleNumero')}
                            {renderField('Colonia', 'colonia')}
                            {renderField('Municipio', 'municipio')}
                            {renderField('Estado', 'estado')}
                            {renderField('CP', 'codigoPostal')}
                        </div>

                        <h3 className={formStyles.formSectionTitle}>Información Clínica</h3>
                        <div className={formStyles.formGrid}>
                            {renderField('Tipo Diabetes', 'tipoDiabetes', 'select', allowedTipoDiabetes.map(v => ({value:v, label:v})))}
                            {renderField('Fecha Diagnóstico', 'fechaDiagnostico', 'date')}
                            {renderField('Estatura (metros)', 'estatura', 'number', [], {step:'0.01', placeholder:'Ej: 1.65'})}
                            {renderField('Peso (kg)', 'pesoKg', 'number', [], {step:'0.1'})}
                            {renderField('HbA1c', 'hba1c', 'number', [], {step:'0.1'})}
                            {renderField('IMC (Auto)', 'imc', 'number', [], {readOnly: true, placeholder:'Automático'})}
                        </div>

                        <h3 className={formStyles.formSectionTitle}>Configuración</h3>
                        <div className={formStyles.formGrid}>
                            {renderField('Estatus', 'estatus', 'select', allowedEstatus.map(v => ({value:v, label:v})))}
                            {renderField('Riesgo', 'riesgo', 'select', allowedRiesgo.map(v => ({value:v, label:v})))}
                            {renderField('Grupo/Programa', 'grupo')}
                            {renderField('Tipo Terapia', 'tipoTerapia')}
                        </div>
                    </form>
                )}

                {activeTab === 'clinico' && <HistorialClinicoSection pacienteId={paciente.id} onConsultaCreated={fetchPaciente} />}
                {activeTab === 'citas' && <CitasSection pacienteId={paciente.id} />}
                
                {/* CORRECCIÓN IMPORTANTE AQUÍ: */}
                {activeTab === 'nutricion' && <Nutricion pacienteId={paciente.id} pacienteData={paciente} />}
                
                {activeTab === 'documentos' && <Documentos pacienteId={paciente.id} />}
            </div>
        </div>
    );
}

// Función auxiliar para edad en la tarjeta
const calcularEdad = (fecha) => {
    if (!fecha) return '-';
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return edad;
};

export default DetallePacientePage;