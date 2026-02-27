import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext.jsx';
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
import {
    getConsultasByPaciente,
    getConsultaDetail,
    createConsulta,
    getCitasByPaciente,
    createCita,
    updateCitaEstado,
} from '../services/consultaCitaService.js';
import { getPacienteById, updatePaciente } from '../services/pacienteService.js';
import {
    getPsicologia,
    createPsicologiaSesion,
    createPsicologiaEvaluacion,
    createPsicologiaObjetivo,
    createPsicologiaEstrategia,
    createPsicologiaNota,
} from '../services/psicologiaService.js';

// --- HELPERS ---

const cleanAndNormalizeData = (data) => {
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
            delete cleanedData[key];
        }
    });
    // Conversiones numÃ©ricas
    if (cleanedData.pesoKg) cleanedData.pesoKg = parseFloat(cleanedData.pesoKg);
    if (cleanedData.estatura) cleanedData.estatura = parseFloat(cleanedData.estatura);
    if (cleanedData.hba1c) cleanedData.hba1c = parseFloat(cleanedData.hba1c);
    if (cleanedData.imc) cleanedData.imc = parseFloat(cleanedData.imc);

    return cleanedData;
};

// FÃ³rmula IMC: Peso / (Estatura * Estatura) en metros
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
            <div className={styles.detailGridTwo}>
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
            <div className={styles.modalFormGrid}>
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

// Modal Agendar Cita (sin asignaciÃ³n de especialista)
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
            payload.medicoId = null; // El backend espera explÃ­citamente el campo en null
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
    const [citas, setCitas] = useState({ proximaCita: null, historialCitas: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user: currentUser } = useAuth();

    const normalizeCitasResponse = (data) => {
        if (Array.isArray(data)) return data;
        if (data && (Array.isArray(data.proximasCitas) || Array.isArray(data.historialCitas))) {
            return [
                ...(Array.isArray(data.proximasCitas) ? data.proximasCitas : []),
                ...(Array.isArray(data.historialCitas) ? data.historialCitas : []),
            ];
        }
        return [];
    };

    const getCitaDoctorId = (cita) => (
        cita?.doctor_id
        ?? cita?.medicoId
        ?? cita?.Medico?.id
        ?? cita?.medico?.id
        ?? null
    );

    const parseFechaHora = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const load = async () => {
        try {
            const data = await getCitasByPaciente(pacienteId);
            const citasList = normalizeCitasResponse(data);
            const filteredByDoctor = currentUser?.id
                ? citasList.filter((c) => getCitaDoctorId(c) === currentUser.id)
                : citasList;

            const now = new Date();
            const proximas = filteredByDoctor
                .filter((c) => {
                    const fecha = parseFechaHora(c.fechaHora);
                    return fecha && fecha >= now;
                })
                .sort((a, b) => parseFechaHora(a.fechaHora) - parseFechaHora(b.fechaHora));

            const historial = filteredByDoctor
                .filter((c) => {
                    const fecha = parseFechaHora(c.fechaHora);
                    return fecha && fecha < now;
                })
                .sort((a, b) => parseFechaHora(b.fechaHora) - parseFechaHora(a.fechaHora));

            setCitas({
                proximaCita: proximas.length > 0 ? proximas[0] : null,
                historialCitas: historial,
            });
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => { load(); }, [pacienteId, currentUser]);

    const handleStatus = async (id, status) => {
        if(window.confirm(`Â¿Cambiar a ${status}?`)) {
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
            <div className={styles.sectionHeaderRow} style={{ marginBottom:'20px' }}>
                <h3>Próximas Citas</h3>
                <Button onClick={() => setIsModalOpen(true)}><FaCalendarAlt /> Agendar</Button>
            </div>
            {citas.proximaCita ? renderCita(citas.proximaCita) : <p>No hay citas próximas.</p>}
            
            <h3 style={{marginTop:'30px'}}>Historial</h3>
            {citas.historialCitas.map(renderCita)}

            <Modal title="Agendar Cita" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalAgendarCita pacienteId={pacienteId} onClose={() => setIsModalOpen(false)} onCitaCreated={load} />
            </Modal>
        </div>
    );
};

const DoctorSeguimientoSection = ({ paciente, onConsultaCreated }) => {
    const [consultas, setConsultas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!paciente?.id) return;
        getConsultasByPaciente(paciente.id).then(setConsultas).catch(console.error);
    }, [paciente?.id, isModalOpen]);

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? '-'
            : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getDoctorName = (consulta) => consulta?.Medico?.nombre || consulta?.medicoNombre || 'Sin especialista';

    const renderMetric = (label, value) => (
        <div className={styles.seguimientoMetric}>
            <span>{label}</span>
            <strong>{value || '-'}</strong>
        </div>
    );

    return (
        <div className={styles.seguimientoContainer}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Historial de Seguimiento</h3>
                    <p className={styles.sectionSubtitle}>Registro de consultas y mediciones</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}><FaPlus /> Nuevo Seguimiento</Button>
            </div>

            {consultas.length === 0 && (
                <div className={styles.emptyStateCard}>No hay seguimientos registrados.</div>
            )}

            <div className={styles.seguimientoList}>
                {consultas.map((consulta) => (
                    <div key={consulta.id} className={styles.seguimientoCard}>
                        <div className={styles.seguimientoTitleRow}>
                            <div>
                                <div className={styles.seguimientoTitle}>Consulta de seguimiento</div>
                                <div className={styles.seguimientoMeta}>
                                    {formatDate(consulta.fechaConsulta)} â€¢ {getDoctorName(consulta)}
                                </div>
                            </div>
                            <Tag label={consulta.estado || 'Pendiente'} />
                        </div>
                        <div className={styles.seguimientoMetricsRow}>
                            {renderMetric('HbA1c', consulta.hba1c ? `${consulta.hba1c}%` : '-')}
                            {renderMetric('Peso', consulta.pesoKg ? `${consulta.pesoKg} kg` : '-')}
                            {renderMetric('Glucosa', consulta.glucosa ? `${consulta.glucosa} mg/dL` : '-')}
                            {renderMetric('Presion', consulta.presionArterial || '-')}
                        </div>
                        <div className={styles.seguimientoNote}>
                            {consulta.hallazgos || consulta.tratamiento || consulta.motivo || 'Sin notas registradas.'}
                        </div>
                    </div>
                ))}
            </div>

            <Modal title="Nuevo Seguimiento" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalNuevaConsulta pacienteId={paciente.id} onClose={() => setIsModalOpen(false)} onConsultaCreated={onConsultaCreated} />
            </Modal>
        </div>
    );
};

const DoctorNotasSection = ({ pacienteId }) => {
    const [consultas, setConsultas] = useState([]);

    useEffect(() => {
        if (!pacienteId) return;
        getConsultasByPaciente(pacienteId).then(setConsultas).catch(console.error);
    }, [pacienteId]);

    const notes = consultas
        .map((consulta) => ({
            id: consulta.id,
            fecha: consulta.fechaConsulta,
            texto: consulta.hallazgos || consulta.tratamiento || consulta.motivo || '',
        }))
        .filter((note) => note.texto);

    return (
        <div className={styles.notasContainer}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Notas Clínicas</h3>
                    <p className={styles.sectionSubtitle}>Observaciones registradas en consultas</p>
                </div>
            </div>
            {notes.length === 0 ? (
                <div className={styles.emptyStateCard}>No hay notas clinicas registradas.</div>
            ) : (
                <div className={styles.notasList}>
                    {notes.map((note) => (
                        <div key={note.id} className={styles.notaCard}>
                            <div className={styles.notaDate}>
                                {note.fecha ? new Date(note.fecha).toLocaleDateString('es-MX') : '-'}
                            </div>
                            <div className={styles.notaText}>{note.texto}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PsicologiaSesionesSection = ({ pacienteId, sesiones, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().slice(0, 10),
        estadoAnimo: '',
        adherencia: '',
        estres: '',
        intervenciones: '',
        notas: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPsicologiaSesion(pacienteId, {
                ...formData,
                adherencia: formData.adherencia ? Number(formData.adherencia) : null,
                estres: formData.estres ? Number(formData.estres) : null,
            });
            setIsModalOpen(false);
            setFormData({
                fecha: new Date().toISOString().slice(0, 10),
                estadoAnimo: '',
                adherencia: '',
                estres: '',
                intervenciones: '',
                notas: '',
            });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? '-'
            : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className={styles.psicoSection}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Historial de Sesiones Psicológicas</h3>
                    <p className={styles.sectionSubtitle}>Registro de sesiones y seguimiento del paciente</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}><FaPlus /> Nueva Sesión</Button>
            </div>

            {sesiones.length === 0 ? (
                <div className={styles.emptyStateCard}>No hay sesiones registradas.</div>
            ) : (
                <div className={styles.seguimientoList}>
                    {sesiones.map((sesion, index) => (
                        <div key={sesion.id} className={styles.psicoSessionCard}>
                            <div className={styles.psicoSessionHeader}>
                                <div className={styles.psicoSessionTitle}>
                                    <span>Sesion #{sesiones.length - index}</span>
                                    <span className={styles.psicoTag}>{sesion.estadoAnimo || 'Sesión'}</span>
                                </div>
                                <div className={styles.psicoSessionMeta}>
                                    {formatDate(sesion.fecha)} • {sesion.psicologoNombre || 'Psicólogo'}
                                </div>
                            </div>
                            <div className={styles.psicoSessionMetrics}>
                                <div>
                                    <span>Adherencia</span>
                                    <strong>{sesion.adherencia ? `${sesion.adherencia}%` : '-'}</strong>
                                </div>
                                <div>
                                    <span>Nivel de Estrés</span>
                                    <strong>{sesion.estres ? `${sesion.estres}/10` : '-'}</strong>
                                </div>
                            </div>
                            <div className={styles.psicoSessionNotes}>
                                {sesion.notas || sesion.intervenciones || 'Sin notas de la sesion.'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal title="Nueva Sesión" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} style={{ padding: '15px' }}>
                    <div className={styles.modalFormGrid}>
                        <div className={formStyles.formGroup}>
                            <label>Fecha</label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Estado de Animo</label>
                            <input name="estadoAnimo" value={formData.estadoAnimo} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Adherencia (%)</label>
                            <input type="number" name="adherencia" value={formData.adherencia} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Estrés (1-10)</label>
                            <input type="number" name="estres" value={formData.estres} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                    </div>
                    <div className={formStyles.formGroup} style={{marginTop:'15px'}}>
                        <label>Intervenciones</label>
                        <textarea rows="3" name="intervenciones" value={formData.intervenciones} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>Notas</label>
                        <textarea rows="3" name="notas" value={formData.notas} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>Guardar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const PsicologiaEvaluacionesSection = ({ pacienteId, evaluaciones, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        fecha: new Date().toISOString().slice(0, 10),
        ansiedadScore: '',
        ansiedadNivel: '',
        depresionScore: '',
        depresionNivel: '',
        autoeficaciaScore: '',
        autoeficaciaNivel: '',
        estrategias: '',
        notas: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPsicologiaEvaluacion(pacienteId, formData);
            setIsModalOpen(false);
            setFormData({
                titulo: '',
                fecha: new Date().toISOString().slice(0, 10),
                ansiedadScore: '',
                ansiedadNivel: '',
                depresionScore: '',
                depresionNivel: '',
                autoeficaciaScore: '',
                autoeficaciaNivel: '',
                estrategias: '',
                notas: '',
            });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-MX');
    };

    return (
        <div className={styles.psicoSection}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Evaluaciones Psicológicas</h3>
                    <p className={styles.sectionSubtitle}>Instrumentos y pruebas aplicadas</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}><FaPlus /> Nueva Evaluacion</Button>
            </div>

            {evaluaciones.length === 0 ? (
                <div className={styles.emptyStateCard}>No hay evaluaciones registradas.</div>
            ) : (
                evaluaciones.map((evaluation) => (
                    <div key={evaluation.id} className={styles.psicoEvalCard}>
                        <div className={styles.psicoEvalHeader}>
                            <div>
                                <h4>{evaluation.titulo}</h4>
                                <p>{formatDate(evaluation.fecha)}</p>
                            </div>
                        </div>
                        <div className={styles.psicoEvalGrid}>
                            <div className={`${styles.psicoEvalMetric} ${styles.psicoTonewarn}`}>
                                <span>Ansiedad</span>
                                <strong>{evaluation.ansiedadScore || '-'}</strong>
                                <small>{evaluation.ansiedadNivel || ''}</small>
                            </div>
                            <div className={`${styles.psicoEvalMetric} ${styles.psicoTonedanger}`}>
                                <span>Depresion</span>
                                <strong>{evaluation.depresionScore || '-'}</strong>
                                <small>{evaluation.depresionNivel || ''}</small>
                            </div>
                            <div className={`${styles.psicoEvalMetric} ${styles.psicoTonesuccess}`}>
                                <span>Autoeficacia</span>
                                <strong>{evaluation.autoeficaciaScore || '-'}</strong>
                                <small>{evaluation.autoeficaciaNivel || ''}</small>
                            </div>
                        </div>
                        <div className={styles.psicoEvalNote}>
                            <strong>Estrategias de afrontamiento:</strong>
                            <p>{evaluation.estrategias || '-'}</p>
                        </div>
                        <div className={styles.psicoEvalNote}>
                            <strong>Notas:</strong>
                            <p>{evaluation.notas || '-'}</p>
                        </div>
                    </div>
                ))
            )}

            <Modal title="Nueva Evaluacion" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} style={{ padding: '15px' }}>
                    <div className={styles.modalFormGrid}>
                        <div className={formStyles.formGroup}>
                            <label>Titulo</label>
                            <input name="titulo" value={formData.titulo} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Fecha</label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Ansiedad score</label>
                            <input name="ansiedadScore" value={formData.ansiedadScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Ansiedad nivel</label>
                            <input name="ansiedadNivel" value={formData.ansiedadNivel} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Depresion score</label>
                            <input name="depresionScore" value={formData.depresionScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Depresion nivel</label>
                            <input name="depresionNivel" value={formData.depresionNivel} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Autoeficacia score</label>
                            <input name="autoeficaciaScore" value={formData.autoeficaciaScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Autoeficacia nivel</label>
                            <input name="autoeficaciaNivel" value={formData.autoeficaciaNivel} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                    </div>
                    <div className={formStyles.formGroup} style={{marginTop:'15px'}}>
                        <label>Estrategias</label>
                        <textarea rows="3" name="estrategias" value={formData.estrategias} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>Notas</label>
                        <textarea rows="3" name="notas" value={formData.notas} onChange={handleChange} style={{width:'100%', padding:'8px'}}></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>Guardar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const PsicologiaPlanSection = ({ pacienteId, objetivos, estrategias, onRefresh }) => {
    const [objectiveOpen, setObjectiveOpen] = useState(false);
    const [strategyOpen, setStrategyOpen] = useState(false);
    const [objectiveForm, setObjectiveForm] = useState({ objetivo: '', progreso: '', tono: 'info' });
    const [strategyForm, setStrategyForm] = useState({ estrategia: '', frecuencia: '', estado: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleObjectiveSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPsicologiaObjetivo(pacienteId, {
                objetivo: objectiveForm.objetivo,
                progreso: objectiveForm.progreso ? Number(objectiveForm.progreso) : null,
                tono: objectiveForm.tono,
            });
            setObjectiveOpen(false);
            setObjectiveForm({ objetivo: '', progreso: '', tono: 'info' });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const handleStrategySubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPsicologiaEstrategia(pacienteId, strategyForm);
            setStrategyOpen(false);
            setStrategyForm({ estrategia: '', frecuencia: '', estado: '' });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.psicoSection}>
            <div>
                <h3 className={styles.sectionTitle}>Plan de Intervencion Psicológica</h3>
                <p className={styles.sectionSubtitle}>Objetivos terapeuticos y estrategias de intervencion</p>
            </div>

            <div className={styles.psicoObjectives}>
                {objetivos.length === 0 && (
                    <div className={styles.emptyStateCard}>No hay objetivos registrados.</div>
                )}
                {objetivos.map((obj) => (
                    <div key={obj.id} className={`${styles.psicoObjectiveCard} ${styles[`psicoObjective${obj.tono || 'info'}`]}`}>
                        <p>{obj.objetivo}</p>
                        <div className={styles.psicoProgressRow}>
                            <span>Progreso: {obj.progreso ?? 0}%</span>
                        </div>
                        <div className={styles.psicoProgressTrack}>
                            <div className={styles.psicoProgressFill} style={{ width: `${obj.progreso ?? 0}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.psicoStrategies}>
                <div className={styles.seguimientoHeaderRow}>
                    <h4>Estrategias de Intervención</h4>
                    <Button onClick={() => setStrategyOpen(true)}><FaPlus /> Nueva Estrategia</Button>
                </div>
                <div className={styles.psicoTable}>
                    <div className={styles.psicoTableHeader}>
                        <span>Estrategia</span>
                        <span>Frecuencia</span>
                        <span>Estado</span>
                    </div>
                    {estrategias.length === 0 && (
                        <div className={styles.psicoTableRow}>
                            <span>Sin estrategias</span>
                            <span>-</span>
                            <span>-</span>
                        </div>
                    )}
                    {estrategias.map((row) => (
                        <div key={row.id} className={styles.psicoTableRow}>
                            <span>{row.estrategia}</span>
                            <span>{row.frecuencia || '-'}</span>
                            <span className={styles.psicoStatus}>{row.estado || '-'}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button className={styles.psicoFullButton} onClick={() => setObjectiveOpen(true)}>
                <FaPlus /> Agregar Nuevo Objetivo
            </Button>

            <Modal title="Nuevo Objetivo" isOpen={objectiveOpen} onClose={() => setObjectiveOpen(false)}>
                <form onSubmit={handleObjectiveSubmit} style={{ padding: '15px' }}>
                    <div className={formStyles.formGroup}>
                        <label>Objetivo</label>
                        <textarea name="objetivo" value={objectiveForm.objetivo} onChange={(e) => setObjectiveForm((p) => ({ ...p, objetivo: e.target.value }))} required rows="3" style={{width:'100%', padding:'8px'}}></textarea>
                    </div>
                    <div className={styles.modalFormGrid}>
                        <div className={formStyles.formGroup}>
                            <label>Progreso (%)</label>
                            <input type="number" name="progreso" value={objectiveForm.progreso} onChange={(e) => setObjectiveForm((p) => ({ ...p, progreso: e.target.value }))} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Tono</label>
                            <select name="tono" value={objectiveForm.tono} onChange={(e) => setObjectiveForm((p) => ({ ...p, tono: e.target.value }))} style={{width:'100%', padding:'8px'}}>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="purple">Purple</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setObjectiveOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>Guardar</Button>
                    </div>
                </form>
            </Modal>

            <Modal title="Nueva Estrategia" isOpen={strategyOpen} onClose={() => setStrategyOpen(false)}>
                <form onSubmit={handleStrategySubmit} style={{ padding: '15px' }}>
                    <div className={styles.modalFormGrid}>
                        <div className={formStyles.formGroup}>
                            <label>Estrategia</label>
                            <input name="estrategia" value={strategyForm.estrategia} onChange={(e) => setStrategyForm((p) => ({ ...p, estrategia: e.target.value }))} required style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Frecuencia</label>
                            <input name="frecuencia" value={strategyForm.frecuencia} onChange={(e) => setStrategyForm((p) => ({ ...p, frecuencia: e.target.value }))} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Estado</label>
                            <input name="estado" value={strategyForm.estado} onChange={(e) => setStrategyForm((p) => ({ ...p, estado: e.target.value }))} style={{width:'100%', padding:'8px'}} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setStrategyOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>Guardar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const PsicologiaNotasSection = ({ pacienteId, notas, onRefresh }) => {
    const [nota, setNota] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const guardarNota = async () => {
        if (!nota.trim()) return;
        setIsSaving(true);
        try {
            await createPsicologiaNota(pacienteId, { nota: nota.trim(), fecha: new Date().toISOString().slice(0, 10) });
            setNota('');
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-MX');
    };

    return (
        <div className={styles.psicoSection}>
            <div>
                <h3 className={styles.sectionTitle}>Notas Clinicas Psicológicas</h3>
                <p className={styles.sectionSubtitle}>Observaciones generales y evolución del paciente</p>
            </div>

            <div className={styles.psicoNotesBox}>
                <textarea
                    className={styles.psicoTextarea}
                    placeholder="Escribe notas clinicas generales sobre el paciente..."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows="4"
                />
                <Button onClick={guardarNota} disabled={isSaving}><FaSave /> Guardar Notas</Button>
            </div>

            <div className={styles.psicoNotesHistory}>
                <h4>Historial de Notas</h4>
                {notas.length === 0 && <div className={styles.emptyStateCard}>No hay notas registradas.</div>}
                {notas.map((item) => (
                    <div key={item.id} className={styles.psicoNoteItem}>
                        <div className={styles.psicoNoteHeader}>
                            <span>{item.psicologoNombre || 'Psicologo'}</span>
                            <span>{formatDate(item.fecha || item.createdAt)}</span>
                        </div>
                        <p>{item.nota}</p>
                    </div>
                ))}
            </div>
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
    const { user: currentUser } = useAuth();
    const role = (currentUser?.role || '').toUpperCase();
    const isDoctor = role === 'DOCTOR';
    const isPsych = role === 'PSICOLOGO' || role === 'PSY';
    const [psicoData, setPsicoData] = useState({
        sesiones: [],
        evaluaciones: [],
        objetivos: [],
        estrategias: [],
        notas: [],
    });

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

    const loadPsicologia = async () => {
        if (!paciente?.id) return;
        try {
            const data = await getPsicologia(paciente.id);
            setPsicoData({
                sesiones: Array.isArray(data?.sesiones) ? data.sesiones : [],
                evaluaciones: Array.isArray(data?.evaluaciones) ? data.evaluaciones : [],
                objetivos: Array.isArray(data?.objetivos) ? data.objetivos : [],
                estrategias: Array.isArray(data?.estrategias) ? data.estrategias : [],
                notas: Array.isArray(data?.notas) ? data.notas : [],
            });
        } finally {
        }
    };

    useEffect(() => {
        if (isPsych && paciente?.id) {
            loadPsicologia();
        }
    }, [isPsych, paciente?.id]);

    const tabs = isPsych
        ? ['generales', 'sesiones', 'evaluaciones', 'plan', 'notas']
        : isDoctor
            ? ['generales', 'clinico', 'citas', 'seguimiento', 'archivos', 'notas']
            : ['generales', 'clinico', 'citas', 'nutricion', 'documentos'];

    const tabLabel = (tab) => {
        if (tab === 'generales') return 'Datos Generales';
        if (tab === 'sesiones') return 'Sesiones Psicológicas';
        if (tab === 'evaluaciones') return 'Evaluaciones';
        if (tab === 'plan') return 'Plan de Intervención';
        if (tab === 'notas' && isPsych) return 'Notas Clínicas';
        return tab;
    };

    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // CÃ¡lculo AutomÃ¡tico IMC en tiempo real
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

    const latestSesion = psicoData.sesiones[0] || null;
    const sesionesCount = psicoData.sesiones.length;

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
            <div className={styles.header}>
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
            {/* Metrica */}
            {isPsych ? (
                <div className={styles.psicoHeader}>
                    <div>
                        <h2>Expediente Psicológico</h2>
                        <p>{paciente.nombre} • {calcularEdad(paciente.fechaNacimiento)} años</p>
                    </div>
                    <Tag label={paciente.riesgo || 'Riesgo Alto'} />
                </div>
            ) : null}

            <div className={styles.metricsGrid}>
                {isPsych ? (
                    <>
                        <div className={styles.psicoMetricCard}>
                            <div className={styles.psicoMetricTitle}>Estado de Animo</div>
                            <h3>{latestSesion?.estadoAnimo || '-'}</h3>
                            <small>Ultima sesiósn</small>
                        </div>
                        <div className={styles.psicoMetricCard}>
                            <div className={styles.psicoMetricTitle}>Adherencia</div>
                            <h3>{latestSesion?.adherencia ? `${latestSesion.adherencia}%` : '-'}</h3>
                            <small>Al tratamiento</small>
                        </div>
                        <div className={styles.psicoMetricCard}>
                            <div className={styles.psicoMetricTitle}>Nivel de Estrés</div>
                            <h3>{latestSesion?.estres ? `${latestSesion.estres}/10` : '-'}</h3>
                            <small>Escala subjetiva</small>
                        </div>
                        <div className={styles.psicoMetricCard}>
                            <div className={styles.psicoMetricTitle}>Sesiones</div>
                            <h3>{sesionesCount}</h3>
                            <small>Total realizadas</small>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.metricCard}><h4>HbA1c</h4><h2>{paciente.hba1c || '-'}%</h2><small>{paciente.riesgo}</small></div>
                        <div className={styles.metricCard}><h4>Última Consulta</h4><h3>{paciente.ultimaVisita ? new Date(paciente.ultimaVisita).toLocaleDateString() : 'N/A'}</h3></div>
                        <div className={styles.metricCard}><h4>IMC</h4><h2>{paciente.imc || '-'}</h2><small>{paciente.pesoKg}kg / {paciente.estatura}m</small></div>
                        <div className={styles.metricCard}><h4>Edad</h4><h2>{calcularEdad(paciente.fechaNacimiento)}</h2><small>{paciente.fechaNacimiento}</small></div>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className={styles.tabContainer}>
                {tabs.map(tab => (
                    <span 
                        key={tab} 
                        className={activeTab === tab ? styles.tabActive : styles.tab}
                        onClick={() => setActiveTab(tab)}
                        style={{textTransform: 'capitalize'}}
                    >
                        {tabLabel(tab)}
                    </span>
                ))}
            </div>

            {/* Contenido Tabs */}
            <div className={styles.contentCard}>
                {isPsych ? (
                    <>
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
                                    {renderField('Calle y Numero', 'calleNumero')}
                                    {renderField('Colonia', 'colonia')}
                                    {renderField('Municipio', 'municipio')}
                                    {renderField('Estado', 'estado')}
                                    {renderField('CP', 'codigoPostal')}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Configuracion</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Estatus', 'estatus', 'select', allowedEstatus.map(v => ({value:v, label:v})))}
                                    {renderField('Riesgo', 'riesgo', 'select', allowedRiesgo.map(v => ({value:v, label:v})))}
                                    {renderField('Grupo/Programa', 'grupo')}
                                    {renderField('Tipo Terapia', 'tipoTerapia')}
                                </div>
                            </form>
                        )}
                        {activeTab === 'sesiones' && (
                            <PsicologiaSesionesSection
                                pacienteId={paciente.id}
                                sesiones={psicoData.sesiones}
                                onRefresh={loadPsicologia}
                            />
                        )}
                        {activeTab === 'evaluaciones' && (
                            <PsicologiaEvaluacionesSection
                                pacienteId={paciente.id}
                                evaluaciones={psicoData.evaluaciones}
                                onRefresh={loadPsicologia}
                            />
                        )}
                        {activeTab === 'plan' && (
                            <PsicologiaPlanSection
                                pacienteId={paciente.id}
                                objetivos={psicoData.objetivos}
                                estrategias={psicoData.estrategias}
                                onRefresh={loadPsicologia}
                            />
                        )}
                        {activeTab === 'notas' && (
                            <PsicologiaNotasSection
                                pacienteId={paciente.id}
                                notas={psicoData.notas}
                                onRefresh={loadPsicologia}
                            />
                        )}
                    </>
                ) : (
                    <>
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
                                    {renderField('Calle y Numero', 'calleNumero')}
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
                                    {renderField('IMC (Auto)', 'imc', 'number', [], {readOnly: true, placeholder:'Automatico'})}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Configuracion</h3>
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

                        {!isDoctor && activeTab === 'nutricion' && <Nutricion pacienteId={paciente.id} pacienteData={paciente} />}
                        {!isDoctor && activeTab === 'documentos' && <Documentos pacienteId={paciente.id} />}

                        {isDoctor && activeTab === 'seguimiento' && (
                            <DoctorSeguimientoSection paciente={paciente} onConsultaCreated={fetchPaciente} />
                        )}
                        {isDoctor && activeTab === 'archivos' && <Documentos pacienteId={paciente.id} />}
                        {isDoctor && activeTab === 'notas' && <DoctorNotasSection pacienteId={paciente.id} />}
                    </>
                )}
            </div>
        </div>
    );
}

// FunciÃ³n auxiliar para edad en la tarjeta
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


