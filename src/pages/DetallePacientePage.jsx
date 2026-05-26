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
    updateCita,
    updateConsulta,
    deleteConsulta,
    deleteCita,
} from '../services/consultaCitaService.js';
import { getPacienteById, updatePaciente, updatePacienteFinanzas } from '../services/pacienteService.js';
import {
    getPsicologia,
    createPsicologiaSesion,
    createPsicologiaEvaluacion,
    createPsicologiaObjetivo,
    createPsicologiaEstrategia,
    createPsicologiaNota,
    updatePsicologiaSesion,
    updatePsicologiaEvaluacion,
    updatePsicologiaObjetivo,
    updatePsicologiaEstrategia,
    updatePsicologiaNota,
    deletePsicologiaSesion,
    deletePsicologiaEvaluacion,
    deletePsicologiaObjetivo,
    deletePsicologiaEstrategia,
    deletePsicologiaNota,
} from '../services/psicologiaService.js';
import api from '../services/api.js';
import { getCanonicalMunicipioJalisco, municipiosJalisco } from '../constants/municipiosJalisco.js';
import { isReadOnlyRole } from '../utils/roles.js';
import logoAmd from '../assets/img/logo.png';

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
    if (cleanedData.glucosa) cleanedData.glucosa = parseFloat(cleanedData.glucosa);
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

const getCurrentDateInput = () => new Date().toISOString().slice(0, 10);

const getDefaultConsultaForm = () => ({
    motivo: '',
    hallazgos: '',
    tratamiento: '',
    pesoKg: '',
    hba1c: '',
    glucosa: '',
    presionArterial: '',
    fechaConsulta: getCurrentDateInput(),
});

// Listas para selectores
const allowedGeneros = ['Femenino', 'Masculino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];
const allowedTipoTerapia = ['Individual', 'Grupal', 'Familiar'];
const allowedEstadosPago = ['Pagado', 'Pendiente', 'Vencido', 'Atrasado', 'Parcial', 'Exento', 'Cancelado', 'Moroso', 'Suspendido', 'Baja'];
const allowedTiposMembresia = ['Basica', 'Basica B', 'Educativa', 'Completa', 'Completa B'];
const mesesEstadisticos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const grupoSuggestions = ['Grupo Matutino A', 'Grupo Vespertino A', 'Grupo Control Metabolico', 'Grupo Nutricion', 'Grupo Psicologia', 'Adultos Mayores'];
const tipoServicioSuggestions = ['Médico', 'Nutricional', 'Psicológico', 'Mixto', 'Educativo', 'Otro'];
const motivoConsultaSuggestions = ['Primera vez', 'Seguimiento', 'Control glucemico', 'Valoracion nutricional', 'Evaluacion psicologica', 'Revaloracion'];
const responsableSuggestions = ['Paciente', 'Madre', 'Padre', 'Tutor', 'Familiar responsable'];

const getPacienteUltimaVisita = (paciente) => paciente?.ultimaVisita ?? paciente?.fechaConsulta ?? '';
const getPacienteEstadoPago = (paciente) =>
    paciente?.estadoPago
    ?? paciente?.estado_pago
    ?? paciente?.estadoFinanciero
    ?? paciente?.estado_financiero
    ?? '';

const getPacienteMembresia = (paciente) =>
    paciente?.perfilFinanciero?.membresia
    ?? paciente?.tipoMembresia
    ?? paciente?.tipo_membresia
    ?? '';

const getPacienteFinancialPackage = (paciente) =>
    paciente?.perfilFinanciero?.paquete
    ?? null;

const buildFinanceFormState = (membership, paymentStatus) => ({
    tipoMembresia: membership || '',
    estadoPago: paymentStatus || '',
});

const buildPacientePayload = (data) => {
    const cleanedData = cleanAndNormalizeData({
        ...data,
        municipio: getCanonicalMunicipioJalisco(data?.municipio) || data?.municipio,
        ultimaVisita: data?.ultimaVisita ?? getPacienteUltimaVisita(data),
    });

    delete cleanedData.edad;
    delete cleanedData.fechaConsulta;

    return cleanedData;
};

// Normaliza roles que llegan con variantes en español/inglés
const normalizeRole = (role) => {
    const r = (role || '').toString().trim().toUpperCase();
    if (['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR', 'SUPERADMIN', 'SUPER_ADMIN'].includes(r)) return 'ADMIN';
    if (['DOCTOR', 'MEDICO', 'MÉDICO'].includes(r)) return 'DOCTOR';
    if (['PSICOLOGO', 'PSICOLOGA', 'PSICÓLOGO', 'PSICÓLOGA', 'PSY'].includes(r)) return 'PSICOLOGO';
    if (['NUTRIOLOGO', 'NUTRIOLOGA', 'NUTRI'].includes(r)) return 'NUTRI';
    return r;
};

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
                <div><strong>Glucosa:</strong> <p>{consulta.glucosa || 'N/A'} mg/dL</p></div>
                <div><strong>Presión:</strong> <p>{consulta.presionArterial || 'N/A'}</p></div>
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

// Modal Nueva/Editar Consulta
const ModalNuevaConsulta = ({ pacienteId, consulta, onClose, onConsultaSaved }) => {
    const [formData, setFormData] = useState(() => getDefaultConsultaForm());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const defaultForm = getDefaultConsultaForm();
        if (consulta) {
            setFormData({
                motivo: consulta.motivo || '',
                hallazgos: consulta.hallazgos || '',
                tratamiento: consulta.tratamiento || '',
                pesoKg: consulta.pesoKg ?? '',
                hba1c: consulta.hba1c ?? '',
                glucosa: consulta.glucosa ?? '',
                presionArterial: consulta.presionArterial || '',
                fechaConsulta: consulta.fechaConsulta?.slice(0, 10) || defaultForm.fechaConsulta,
            });
        } else {
            setFormData(defaultForm);
        }
    }, [consulta]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (consulta?.id) {
                await updateConsulta(consulta.id, cleanAndNormalizeData(formData));
            } else {
                await createConsulta(pacienteId, cleanAndNormalizeData(formData));
            }
            onConsultaSaved?.();
            onClose();
        } catch {
            alert('Error al guardar la consulta');
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
                <div className={formStyles.formGroup}>
                    <label>Glucosa (mg/dL)</label>
                    <input type="number" step="0.1" name="glucosa" value={formData.glucosa} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                </div>
                <div className={formStyles.formGroup}>
                    <label>Presión arterial</label>
                    <input name="presionArterial" value={formData.presionArterial} onChange={handleChange} placeholder="120/80" style={{width:'100%', padding:'8px'}} />
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

// Modal Agendar / Editar Cita (sin asignaciÃ³n de especialista)
const ModalAgendarCita = ({ pacienteId, cita, onClose, onCitaCreated, defaultMedicoId = null }) => {
    const { user: currentUser } = useAuth();
    const role = (currentUser?.role || '').toUpperCase();
    const isDoctor = role === 'DOCTOR';
    const [formData, setFormData] = useState({
        fechaHora: '', motivo: '', notas: ''
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [medicoIdSeleccionado, setMedicoIdSeleccionado] = useState(defaultMedicoId || (isDoctor ? currentUser?.id : null));
    const [doctores, setDoctores] = useState([]);
    const [cargandoDoctores, setCargandoDoctores] = useState(false);

    const inferMedicoId = (c) => (
        c?.doctor_id
        ?? c?.medicoId
        ?? c?.Medico?.id
        ?? c?.medico?.id
        ?? null
    );

    useEffect(() => {
        if (cita) {
            setFormData({
                fechaHora: (cita.fechaHora || cita.fecha_cita || cita.fecha || '').replace('Z',''),
                motivo: cita.motivo || '',
                notas: cita.notas || ''
            });
            setMedicoIdSeleccionado(inferMedicoId(cita) || defaultMedicoId || (isDoctor ? currentUser?.id : null));
        } else {
            setFormData({ fechaHora: '', motivo: '', notas: '' });
            setMedicoIdSeleccionado(defaultMedicoId || (isDoctor ? currentUser?.id : null));
        }
    }, [cita, defaultMedicoId, isDoctor, currentUser]);

    useEffect(() => {
        if (isDoctor) return;
        const loadDoctors = async () => {
            setCargandoDoctores(true);
            try {
                const res = await api.get('/users/especialistas', { params: { role: 'DOCTOR' } });
                const list = Array.isArray(res.data?.especialistas) ? res.data.especialistas : [];
                setDoctores(list);
                if (!medicoIdSeleccionado && list.length > 0) {
                    setMedicoIdSeleccionado(list[0].id);
                }
            } catch (err) {
                console.error('No se pudo cargar lista de doctores', err);
            } finally {
                setCargandoDoctores(false);
            }
        };
        loadDoctors();
    }, [isDoctor, medicoIdSeleccionado]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const payload = cleanAndNormalizeData(formData);
            const medicoId =
                medicoIdSeleccionado ||
                inferMedicoId(cita) ||
                defaultMedicoId ||
                (isDoctor ? currentUser.id : null);

            if (!medicoId) {
                setError('Debes asignar un médico a la cita.');
                setIsSaving(false);
                return;
            }

            payload.medicoId = medicoId;
            if (cita?.id) {
                await updateCita(cita.id, payload);
            } else {
                await createCita(pacienteId, payload);
            }
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
            {!isDoctor && (
                <div className={formStyles.formGroup} style={{marginTop:'15px'}}>
                    <label>Médico responsable *</label>
                    {cargandoDoctores ? (
                        <p style={{margin:0}}><FaSpinner className="fa-spin" /> Cargando doctores...</p>
                    ) : (
                        <select
                            name="medicoId"
                            value={medicoIdSeleccionado || ''}
                            onChange={(e) => setMedicoIdSeleccionado(Number(e.target.value) || null)}
                            required
                            style={{width:'100%', padding:'8px'}}
                        >
                            <option value="">Seleccione un médico</option>
                            {doctores.map((doc) => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.nombre || `Doctor #${doc.id}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
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
    const [editingConsulta, setEditingConsulta] = useState(null);
    const { user: currentUser } = useAuth();
    const role = (currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    const loadConsultas = React.useCallback(() => {
        getConsultasByPaciente(pacienteId).then(setConsultas).catch(console.error);
    }, [pacienteId]);

    useEffect(() => {
        loadConsultas();
    }, [loadConsultas, isModalOpen]); 

    const startEdit = (consulta) => {
        setEditingConsulta(consulta);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta consulta?')) return;
        try {
            await deleteConsulta(id);
            loadConsultas();
        } catch {
            alert('No se pudo eliminar la consulta');
        }
    };

    return (
        <div style={{padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'20px'}}>
                <Button onClick={() => { setEditingConsulta(null); setIsModalOpen(true); }}><FaPlus /> Nueva Consulta</Button>
            </div>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Fecha</th><th>Motivo</th><th>Médico</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {consultas.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.fechaConsulta).toLocaleDateString('es-MX')}</td>
                                <td>{c.motivo}</td>
                                <td>{c.Medico?.nombre || 'N/A'}</td>
                                <td style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <FaEye style={{cursor:'pointer'}} onClick={() => setSelectedId(c.id)} />
                                    <Button size="xs" onClick={() => startEdit(c)}>Editar</Button>
                                    {isAdmin && (
                                        <Button size="xs" variant="danger" onClick={() => handleDelete(c.id)}>Borrar</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {consultas.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>Sin historial.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal title="Nueva Consulta" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalNuevaConsulta
                    pacienteId={pacienteId}
                    consulta={editingConsulta}
                    onClose={() => { setIsModalOpen(false); setEditingConsulta(null); }}
                    onConsultaSaved={() => { loadConsultas(); onConsultaCreated?.(); }}
                />
            </Modal>
            <Modal title="Detalle" isOpen={!!selectedId} onClose={() => setSelectedId(null)}>
                <ModalVerConsulta consultaId={selectedId} onClose={() => setSelectedId(null)} />
            </Modal>
        </div>
    );
};

const CitasSection = ({ pacienteId, defaultMedicoId = null }) => {
    const [citas, setCitas] = useState({ proximasCitas: [], historialCitas: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCita, setEditingCita] = useState(null);
    const { user: currentUser } = useAuth();
    const role = (currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

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

    const getCitaFecha = (cita) => (
        cita?.fechaHora
        ?? cita?.fecha_cita
        ?? cita?.fecha
        ?? cita?.fechaRegistro
        ?? null
    );

    const parseFechaHora = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const refreshCitas = async () => {
        try {
            const data = await getCitasByPaciente(pacienteId);
            const citasList = normalizeCitasResponse(data);
            const shouldFilterByDoctor = currentUser?.role === 'DOCTOR' && currentUser?.id;
            const filteredByDoctor = shouldFilterByDoctor
                ? citasList.filter((c) => getCitaDoctorId(c) === currentUser.id)
                : citasList;

            const now = new Date();
            const proximas = filteredByDoctor
                .filter((c) => {
                    const fecha = parseFechaHora(getCitaFecha(c));
                    return fecha && fecha >= now;
                })
                .sort((a, b) => parseFechaHora(getCitaFecha(a)) - parseFechaHora(getCitaFecha(b)));

            setCitas({
                proximasCitas: proximas,
                historialCitas: [],
            });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const syncCitas = async () => {
            try {
                const data = await getCitasByPaciente(pacienteId);
                const citasList = normalizeCitasResponse(data);
                const shouldFilterByDoctor = currentUser?.role === 'DOCTOR' && currentUser?.id;
                const filteredByDoctor = shouldFilterByDoctor
                    ? citasList.filter((c) => getCitaDoctorId(c) === currentUser.id)
                    : citasList;

                const now = new Date();
                const proximas = filteredByDoctor
                    .filter((c) => {
                        const fecha = parseFechaHora(getCitaFecha(c));
                        return fecha && fecha >= now;
                    })
                    .sort((a, b) => parseFechaHora(getCitaFecha(a)) - parseFechaHora(getCitaFecha(b)));

                if (!cancelled) {
                    setCitas({
                        proximasCitas: proximas,
                        historialCitas: [],
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                }
            }
        };

        void syncCitas();

        return () => {
            cancelled = true;
        };
    }, [currentUser, pacienteId]);

    const openEditCita = (cita) => {
        setEditingCita(cita);
        setIsModalOpen(true);
    };

    const handleDeleteCita = async (cita) => {
        if (!isAdmin) return;
        if (!window.confirm('¿Eliminar esta cita?')) return;
        try {
            await deleteCita(cita.id);
            await refreshCitas();
        } catch {
            alert('No se pudo eliminar la cita');
        }
    };

    const renderCita = (c) => {
        const fecha = getCitaFecha(c);
        const fechaLabel = fecha ? new Date(fecha).toLocaleString('es-MX') : 'Fecha no disponible';
        const key = c?.source === 'portal' ? `portal-${c.portalId}` : `app-${c.id}`;
        const canEdit = true;
        return (
        <Card key={key} style={{marginBottom:'10px', borderLeft: `4px solid ${c.estado === 'Confirmada' ? 'green' : 'orange'}`}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                    <strong>{c.motivo}</strong><br/>
                    <small>{fechaLabel} con {c.Medico?.nombre || c.medicoNombre || 'N/A'}</small>
                </div>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    {canEdit && <Button size="small" onClick={() => openEditCita(c)}>Editar</Button>}
                    {isAdmin && <Button size="small" variant="danger" onClick={() => handleDeleteCita(c)}>Eliminar</Button>}
                </div>
            </div>
        </Card>
        );
    };

    return (
        <div style={{padding:'20px'}}>
            <div className={styles.sectionHeaderRow} style={{ marginBottom:'20px' }}>
                <h3>Próximas Citas</h3>
                <Button onClick={() => { setEditingCita(null); setIsModalOpen(true); }}><FaCalendarAlt /> Agendar</Button>
            </div>
            {citas.proximasCitas.length > 0
                ? citas.proximasCitas.map(renderCita)
                : <p>No hay citas próximas.</p>}

            <Modal title={editingCita ? "Editar Cita" : "Agendar Cita"} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCita(null); }}>
                <ModalAgendarCita
                    pacienteId={pacienteId}
                    cita={editingCita}
                    defaultMedicoId={defaultMedicoId}
                    onClose={() => { setIsModalOpen(false); setEditingCita(null); }}
                    onCitaCreated={refreshCitas}
                />
            </Modal>
        </div>
    );
};

const DoctorSeguimientoSection = ({ paciente, onConsultaCreated }) => {
    const [consultas, setConsultas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConsulta, setEditingConsulta] = useState(null);
    const { user: currentUser } = useAuth();
    const role = (currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    const loadConsultas = () => {
        if (!paciente?.id) return;
        getConsultasByPaciente(paciente.id).then(setConsultas).catch(console.error);
    };

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

    const startEditSeguimiento = (consulta) => {
        setEditingConsulta(consulta);
        setIsModalOpen(true);
    };

    const handleDeleteConsulta = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('¿Eliminar este seguimiento?')) return;
        try {
            await deleteConsulta(id);
            loadConsultas();
        } catch {
            alert('No se pudo eliminar el seguimiento');
        }
    };

    return (
        <div className={styles.seguimientoContainer}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Historial de Seguimiento</h3>
                    <p className={styles.sectionSubtitle}>Registro de consultas y mediciones</p>
                </div>
                <Button onClick={() => { setEditingConsulta(null); setIsModalOpen(true); }}><FaPlus /> Nuevo Seguimiento</Button>
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
                            <div style={{display:'flex', gap:'6px'}}>
                                <Button size="xs" onClick={() => startEditSeguimiento(consulta)}>Editar</Button>
                                {isAdmin && (
                                    <Button size="xs" variant="danger" onClick={() => handleDeleteConsulta(consulta.id)}>Borrar</Button>
                                )}
                            </div>
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

            <Modal title={editingConsulta ? "Editar Seguimiento" : "Nuevo Seguimiento"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalNuevaConsulta
                    pacienteId={paciente.id}
                    consulta={editingConsulta}
                    onClose={() => { setIsModalOpen(false); setEditingConsulta(null); }}
                    onConsultaSaved={() => { loadConsultas(); onConsultaCreated?.(); }}
                />
            </Modal>
        </div>
    );
};

const DoctorNotasSection = ({ pacienteId }) => {
    const [consultas, setConsultas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nota, setNota] = useState('');
    const [editingNota, setEditingNota] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { user: currentUser } = useAuth();
    const role = normalizeRole(currentUser?.role);
    const isAdmin = role === 'ADMIN';
    const canEdit = role === 'DOCTOR' || isAdmin;
    const canDelete = isAdmin;

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
                {canEdit && <Button onClick={() => { setEditingNota(null); setNota(''); setIsModalOpen(true); }}><FaPlus /> Agregar nota</Button>}
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
                            <div style={{display:'flex', gap:'6px', marginTop:'8px'}}>
                                {canEdit && (
                                    <Button size="xs" variant="secondary" onClick={() => {
                                        setEditingNota(note);
                                        setNota(note.texto || '');
                                        setIsModalOpen(true);
                                    }}><FaEdit /> Editar</Button>
                                )}
                                {canDelete && (
                                    <Button size="xs" variant="danger" onClick={async () => {
                                        if (!window.confirm('¿Eliminar esta nota?')) return;
                                        try {
                                            await deleteConsulta(note.id);
                                            const updated = await getConsultasByPaciente(pacienteId);
                                            setConsultas(updated);
                                        } catch {
                                            alert('No se pudo eliminar la nota');
                                        }
                                    }}><FaTimesCircle /> Borrar</Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Modal title={editingNota ? "Editar Nota Clínica" : "Nueva Nota Clínica"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!nota.trim()) return;
                        setIsSaving(true);
                        try {
                            const payload = {
                                motivo: 'Nota clínica',
                                hallazgos: nota.trim(),
                                fechaConsulta: new Date().toISOString().slice(0, 10),
                            };
                            if (editingNota?.id) {
                                await updateConsulta(editingNota.id, payload);
                            } else {
                                await createConsulta(pacienteId, payload);
                            }
                            const updated = await getConsultasByPaciente(pacienteId);
                            setConsultas(updated);
                            setNota('');
                            setEditingNota(null);
                            setIsModalOpen(false);
                        } catch (err) {
                            console.error(err);
                            alert('Error al guardar nota');
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    style={{ padding: '15px' }}
                >
                    <div className={formStyles.formGroup}>
                        <label>Nota *</label>
                        <textarea
                            rows="4"
                            name="nota"
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px' }}
                        />
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

const PsicologiaSesionesSection = ({ pacienteId, sesiones, onRefresh, canEdit, canDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().slice(0, 10),
        estadoAnimo: '',
        adherencia: '',
        estres: '',
        intervenciones: '',
        notas: '',
    });
    const [editingSesion, setEditingSesion] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const handleDelete = async (sesion) => {
        if (!canDelete) return;
        if (!window.confirm('¿Eliminar esta sesión?')) return;
        try {
            await deletePsicologiaSesion(pacienteId, sesion.id);
            onRefresh();
        } catch {
            alert('No se pudo eliminar la sesión');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                adherencia: formData.adherencia ? Number(formData.adherencia) : null,
                estres: formData.estres ? Number(formData.estres) : null,
            };
            if (editingSesion?.id) {
                await updatePsicologiaSesion(pacienteId, editingSesion.id, payload);
            } else {
                await createPsicologiaSesion(pacienteId, payload);
            }
            setIsModalOpen(false);
            setEditingSesion(null);
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
                <div style={{display:'flex', gap:'10px'}}>
                    <Button onClick={() => { setEditingSesion(null); setIsModalOpen(true); }}><FaPlus /> Nueva Sesión</Button>
                </div>
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
                                <div style={{display:'flex', gap:'6px'}}>
                                    {canEdit && (
                                        <Button size="xs" variant="secondary" onClick={() => {
                                            setEditingSesion(sesion);
                                            setFormData({
                                                fecha: sesion.fecha?.slice(0,10) || new Date().toISOString().slice(0,10),
                                                estadoAnimo: sesion.estadoAnimo || '',
                                                adherencia: sesion.adherencia ?? '',
                                                estres: sesion.estres ?? '',
                                                intervenciones: sesion.intervenciones || '',
                                                notas: sesion.notas || '',
                                            });
                                            setIsModalOpen(true);
                                        }}><FaEdit /> Editar</Button>
                                    )}
                                    {canDelete && (
                                        <Button size="xs" variant="danger" onClick={() => handleDelete(sesion)}>Borrar</Button>
                                    )}
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

            <Modal title={editingSesion ? "Editar Sesión" : "Nueva Sesión"} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSesion(null); }}>
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

const PsicologiaEvaluacionesSection = ({ pacienteId, evaluaciones, onRefresh, canEdit, canDelete }) => {
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
    const [editingEvaluacion, setEditingEvaluacion] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const handleDelete = async (evaluation) => {
        if (!canDelete) return;
        if (!window.confirm('¿Eliminar esta evaluación?')) return;
        try {
            await deletePsicologiaEvaluacion(pacienteId, evaluation.id);
            onRefresh();
        } catch {
            alert('No se pudo eliminar la evaluación');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingEvaluacion?.id) {
                await updatePsicologiaEvaluacion(pacienteId, editingEvaluacion.id, formData);
            } else {
                await createPsicologiaEvaluacion(pacienteId, formData);
            }
            setIsModalOpen(false);
            setEditingEvaluacion(null);
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
                <div style={{display:'flex', gap:'10px'}}>
                    <Button onClick={() => { setEditingEvaluacion(null); setIsModalOpen(true); }}><FaPlus /> Nueva Evaluacion</Button>
                </div>
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
                            <div style={{display:'flex', gap:'6px'}}>
                                {canEdit && (
                                    <Button size="xs" variant="secondary" onClick={() => {
                                        setEditingEvaluacion(evaluation);
                                        setFormData({
                                            titulo: evaluation.titulo || '',
                                            fecha: evaluation.fecha?.slice(0,10) || new Date().toISOString().slice(0,10),
                                            ansiedadScore: evaluation.ansiedadScore || '',
                                            ansiedadNivel: evaluation.ansiedadNivel || '',
                                            depresionScore: evaluation.depresionScore || '',
                                            depresionNivel: evaluation.depresionNivel || '',
                                            autoeficaciaScore: evaluation.autoeficaciaScore || '',
                                            autoeficaciaNivel: evaluation.autoeficaciaNivel || '',
                                            estrategias: evaluation.estrategias || '',
                                            notas: evaluation.notas || '',
                                        });
                                        setIsModalOpen(true);
                                    }}><FaEdit /> Editar</Button>
                                )}
                                {canDelete && (
                                    <Button size="xs" variant="danger" onClick={() => handleDelete(evaluation)}>Borrar</Button>
                                )}
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

            <Modal title={editingEvaluacion ? "Editar Evaluacion" : "Nueva Evaluacion"} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEvaluacion(null); }}>
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
                            <label>Puntaje de Ansiedad</label>
                            <input name="ansiedadScore" value={formData.ansiedadScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Nivel de Ansiedad</label>
                            <input name="ansiedadNivel" value={formData.ansiedadNivel} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Puntaje de Depresión</label>
                            <input name="depresionScore" value={formData.depresionScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Nivel de Depresión</label>
                            <input name="depresionNivel" value={formData.depresionNivel} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Puntaje de Autoeficacia</label>
                            <input name="autoeficaciaScore" value={formData.autoeficaciaScore} onChange={handleChange} style={{width:'100%', padding:'8px'}} />
                        </div>
                        <div className={formStyles.formGroup}>
                            <label>Nivel de Autoeficacia</label>
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

const PsicologiaPlanSection = ({ pacienteId, objetivos, estrategias, onRefresh, canEdit, canDelete }) => {
    const [objectiveOpen, setObjectiveOpen] = useState(false);
    const [strategyOpen, setStrategyOpen] = useState(false);
    const [objectiveForm, setObjectiveForm] = useState({ objetivo: '', progreso: '' });
    const [strategyForm, setStrategyForm] = useState({ estrategia: '', frecuencia: '', estado: '' });
    const [editingObjective, setEditingObjective] = useState(null);
    const [editingStrategy, setEditingStrategy] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const handleDeleteObjective = async (obj) => {
        if (!canDelete) return;
        if (!window.confirm('¿Eliminar este objetivo?')) return;
        try {
            await deletePsicologiaObjetivo(pacienteId, obj.id);
            onRefresh();
        } catch {
            alert('No se pudo eliminar el objetivo');
        }
    };

    const handleDeleteStrategy = async (row) => {
        if (!canDelete) return;
        if (!window.confirm('¿Eliminar esta estrategia?')) return;
        try {
            await deletePsicologiaEstrategia(pacienteId, row.id);
            onRefresh();
        } catch {
            alert('No se pudo eliminar la estrategia');
        }
    };

    const handleObjectiveSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                objetivo: objectiveForm.objetivo,
                progreso: objectiveForm.progreso ? Number(objectiveForm.progreso) : null,
            };
            if (editingObjective?.id) {
                await updatePsicologiaObjetivo(pacienteId, editingObjective.id, payload);
            } else {
                await createPsicologiaObjetivo(pacienteId, payload);
            }
            setObjectiveOpen(false);
            setEditingObjective(null);
            setObjectiveForm({ objetivo: '', progreso: '' });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const handleStrategySubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingStrategy?.id) {
                await updatePsicologiaEstrategia(pacienteId, editingStrategy.id, strategyForm);
            } else {
                await createPsicologiaEstrategia(pacienteId, strategyForm);
            }
            setStrategyOpen(false);
            setEditingStrategy(null);
            setStrategyForm({ estrategia: '', frecuencia: '', estado: '' });
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.psicoSection}>
            <div className={styles.seguimientoHeaderRow}>
                <div>
                    <h3 className={styles.sectionTitle}>Plan de Intervencion Psicológica</h3>
                    <p className={styles.sectionSubtitle}>Objetivos terapeuticos y estrategias de intervencion</p>
                </div>
            </div>

            <div className={styles.psicoObjectives}>
                {objetivos.length === 0 && (
                    <div className={styles.emptyStateCard}>No hay objetivos registrados.</div>
                )}
                {objetivos.map((obj) => (
                    <div key={obj.id} className={`${styles.psicoObjectiveCard} ${styles[`psicoObjective${obj.tono || 'info'}`]}`}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <p>{obj.objetivo}</p>
                            <div style={{display:'flex', gap:'6px'}}>
                                {canEdit && (
                                    <Button size="xs" variant="secondary" onClick={() => {
                                        setEditingObjective(obj);
                                        setObjectiveForm({
                                            objetivo: obj.objetivo || '',
                                            progreso: obj.progreso ?? '',
                                        });
                                        setObjectiveOpen(true);
                                    }}><FaEdit /> Editar</Button>
                                )}
                                {canDelete && (
                                    <Button size="xs" variant="danger" onClick={() => handleDeleteObjective(obj)}>Borrar</Button>
                                )}
                            </div>
                        </div>
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
                    <div style={{display:'flex', gap:'10px'}}>
                        <Button onClick={() => { setEditingStrategy(null); setStrategyOpen(true); }}><FaPlus /> Nueva Estrategia</Button>
                    </div>
                </div>
                <div className={styles.psicoTable}>
                    <div className={styles.psicoTableHeader}>
                        <span>Estrategia</span>
                        <span>Frecuencia</span>
                        <span>Estado</span>
                        {canEdit && <span>Acciones</span>}
                    </div>
                    {estrategias.length === 0 && (
                        <div className={styles.psicoTableRow}>
                            <span>Sin estrategias</span>
                            <span>-</span>
                            <span>-</span>
                            {canEdit && <span>-</span>}
                        </div>
                    )}
                    {estrategias.map((row) => (
                        <div key={row.id} className={styles.psicoTableRow}>
                            <span>{row.estrategia}</span>
                            <span>{row.frecuencia || '-'}</span>
                            <span className={styles.psicoStatus}>{row.estado || '-'}</span>
                            {canEdit && (
                                <span style={{display:'flex', gap:'6px'}}>
                                    <Button size="xs" variant="secondary" onClick={() => {
                                        setEditingStrategy(row);
                                        setStrategyForm({ estrategia: row.estrategia || '', frecuencia: row.frecuencia || '', estado: row.estado || '' });
                                        setStrategyOpen(true);
                                    }}><FaEdit /> Editar</Button>
                                    {canDelete && <Button size="xs" variant="danger" onClick={() => handleDeleteStrategy(row)}>Borrar</Button>}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Button className={styles.psicoFullButton} onClick={() => { setEditingObjective(null); setObjectiveForm({ objetivo: '', progreso: '' }); setObjectiveOpen(true); }}>
                <FaPlus /> Agregar Nuevo Objetivo
            </Button>

            <Modal title={editingObjective ? "Editar Objetivo" : "Nuevo Objetivo"} isOpen={objectiveOpen} onClose={() => { setObjectiveOpen(false); setEditingObjective(null); }}>
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
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setObjectiveOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>Guardar</Button>
                    </div>
                </form>
            </Modal>

            <Modal title={editingStrategy ? "Editar Estrategia" : "Nueva Estrategia"} isOpen={strategyOpen} onClose={() => { setStrategyOpen(false); setEditingStrategy(null); }}>
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

const PsicologiaNotasSection = ({ pacienteId, notas, onRefresh, canEdit, canDelete }) => {
    const [nota, setNota] = useState('');
    const [editingNota, setEditingNota] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const handleDelete = async (item) => {
        if (!canDelete) return;
        if (!window.confirm('¿Eliminar esta nota?')) return;
        try {
            await deletePsicologiaNota(pacienteId, item.id);
            onRefresh();
        } catch {
            alert('No se pudo eliminar la nota');
        }
    };

    const guardarNota = async () => {
        if (!nota.trim()) return;
        setIsSaving(true);
        try {
            if (editingNota?.id) {
                await updatePsicologiaNota(pacienteId, editingNota.id, { nota: nota.trim(), fecha: editingNota.fecha || new Date().toISOString().slice(0, 10) });
            } else {
                await createPsicologiaNota(pacienteId, { nota: nota.trim(), fecha: new Date().toISOString().slice(0, 10) });
            }
            setNota('');
            setEditingNota(null);
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
                <div style={{display:'flex', gap:'10px', alignItems:'center', marginTop:'8px'}}>
                    {editingNota && <Tag label="Editando nota" />}
                    <Button onClick={guardarNota} disabled={isSaving}><FaSave /> {editingNota ? 'Guardar Cambios' : 'Guardar Notas'}</Button>
                    {editingNota && (
                        <Button variant="secondary" onClick={() => { setEditingNota(null); setNota(''); }}>Cancelar</Button>
                    )}
                </div>
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
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px'}}>
                            <p style={{margin:0, flex:1}}>{item.nota}</p>
                            <div style={{display:'flex', gap:'6px'}}>
                                {canEdit && (
                                    <Button size="xs" variant="secondary" onClick={() => { setEditingNota(item); setNota(item.nota || ''); }}><FaEdit /> Editar</Button>
                                )}
                                {canDelete && (
                                    <Button size="xs" variant="danger" onClick={() => handleDelete(item)}>Borrar</Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinancialSummarySection = ({ paciente, canEdit = false, onSaveFinancial, isSaving = false }) => {
    const financialPackage = getPacienteFinancialPackage(paciente);
    const membership = getPacienteMembresia(paciente);
    const paymentStatus = getPacienteEstadoPago(paciente);
    const benefits = Array.isArray(financialPackage?.benefits) ? financialPackage.benefits : [];
    const [isEditingFinance, setIsEditingFinance] = useState(false);
    const [financeForm, setFinanceForm] = useState(() => buildFinanceFormState(membership, paymentStatus));

    const handleFinanceFieldChange = (event) => {
        const { name, value } = event.target;
        setFinanceForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setFinanceForm(buildFinanceFormState(membership, paymentStatus));
        setIsEditingFinance(false);
    };

    const handleSave = async () => {
        if (!onSaveFinancial) return;
        const saved = await onSaveFinancial(financeForm);
        if (saved) {
            setIsEditingFinance(false);
        }
    };

    return (
        <div className={styles.financialSection}>
            <div className={styles.financialHero}>
                <div className={styles.financialHeroBadge}>
                    <img src={logoAmd} alt="Asociación Mexicana de Diabetes en Jalisco" className={styles.financialHeroLogo} />
                </div>
                <div>
                    <p className={styles.financialHeroKicker}>Expediente financiero</p>
                    <h3 className={styles.financialHeroTitle}>{financialPackage?.label || membership || 'Sin membresía'}</h3>
                    <p className={styles.financialHeroText}>
                        {financialPackage?.heroDescription || 'Este paciente no tiene un paquete financiero asignado actualmente.'}
                    </p>
                    <div className={styles.financialHeroTags}>
                        <Tag label={membership || 'Sin membresía'} />
                        <Tag label={paymentStatus || 'Sin estado'} />
                    </div>
                </div>
            </div>

            {canEdit && (
                <div className={styles.financialEditorCard}>
                    <div className={styles.financialEditorHeader}>
                        <div>
                            <h4 className={styles.sectionTitle}>Edición financiera</h4>
                            <p className={styles.sectionSubtitle}>Actualiza la membresía y el estado financiero de este paciente.</p>
                        </div>
                        {isEditingFinance ? (
                            <div className={styles.financialEditorActions}>
                                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                                    <FaTimesCircle /> Cancelar
                                </Button>
                                <Button type="button" onClick={handleSave} disabled={isSaving}>
                                    <FaSave /> {isSaving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" onClick={() => setIsEditingFinance(true)}>
                                <FaEdit /> Editar estado
                            </Button>
                        )}
                    </div>

                    <div className={styles.financialEditorGrid}>
                        <div className={formStyles.formGroup}>
                            <label>Membresía</label>
                            <select
                                name="tipoMembresia"
                                value={financeForm.tipoMembresia}
                                onChange={handleFinanceFieldChange}
                                disabled={!isEditingFinance || isSaving}
                                className={!isEditingFinance ? formStyles.disabledInput : ''}
                            >
                                <option value="">Sin membresía</option>
                                {allowedTiposMembresia.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>

                        <div className={formStyles.formGroup}>
                            <label>Estado financiero</label>
                            <select
                                name="estadoPago"
                                value={financeForm.estadoPago}
                                onChange={handleFinanceFieldChange}
                                disabled={!isEditingFinance || isSaving}
                                className={!isEditingFinance ? formStyles.disabledInput : ''}
                            >
                                <option value="">Sin estado</option>
                                {allowedEstadosPago.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.financialMetaGrid}>
                <div className={styles.financialMetaCard}>
                    <span>Membresía</span>
                    <strong>{membership || '-'}</strong>
                </div>
                <div className={styles.financialMetaCard}>
                    <span>Estado</span>
                    <strong>{paymentStatus || '-'}</strong>
                </div>
                <div className={styles.financialMetaCard}>
                    <span>Mensualidad</span>
                    <strong>{financialPackage?.monthlyPrice ? `$${financialPackage.monthlyPrice}` : '-'}</strong>
                </div>
                <div className={styles.financialMetaCard}>
                    <span>Anualidad</span>
                    <strong>{financialPackage?.annualPrice ? `$${financialPackage.annualPrice}` : '-'}</strong>
                </div>
            </div>

            {benefits.length > 0 ? (
                <div className={styles.financialBenefits}>
                    {benefits.map((benefit, index) => (
                        <div
                            key={`${benefit.title}-${index}`}
                            className={index % 2 === 0 ? styles.financialBenefitLight : styles.financialBenefitDark}
                        >
                            <div className={styles.financialBenefitTitle}>{benefit.title}</div>
                            <div className={styles.financialBenefitText}>{benefit.description}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.financialEmpty}>
                    No hay desglose de beneficios disponible para esta membresía.
                </div>
            )}
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
    const role = normalizeRole(currentUser?.role);
    const isDoctor = role === 'DOCTOR';
    const isPsych = role === 'PSICOLOGO';
    const isAdmin = role === 'ADMIN';
    const isFinance = role === 'FINANZAS';
    const isReadOnly = isReadOnlyRole(role);
    const canEditFinancial = isAdmin || isFinance;
    // Regla solicitada: solo admin puede borrar; los demás pueden editar
    const canEditPsych = !isReadOnly;
    const canDeletePsych = isAdmin;
    const [isPsychLike, setIsPsychLike] = useState(isPsych || isAdmin); // admin podrá ver vista de psicología si aplica
    const [isDoctorLike, setIsDoctorLike] = useState(isDoctor || isAdmin);
    const [adminEspecialidad, setAdminEspecialidad] = useState('');
    const [psicoData, setPsicoData] = useState({
        sesiones: [],
        evaluaciones: [],
        objetivos: [],
        estrategias: [],
        notas: [],
    });

    const normalizeEspecialidad = (value = '') =>
        value.toString()
            .trim()
            .toUpperCase()
            .replace('Ó', 'O')
            .replace('Í', 'I')
            .replace('Á', 'A')
            .replace('É', 'E')
            .replace('Ú', 'U');

    const fetchPaciente = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPacienteById(id);
            const normalizedData = {
                ...data,
                municipio: getCanonicalMunicipioJalisco(data?.municipio) || '',
                talla: data?.talla ?? '',
                tipoMembresia: getPacienteMembresia(data),
                estadoPago: getPacienteEstadoPago(data),
                ultimaVisita: getPacienteUltimaVisita(data),
            };
            setPaciente(normalizedData);
            setFormData(normalizedData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchPaciente();
    }, [fetchPaciente]);

    useEffect(() => {
        if (!isAdmin || !paciente?.id) return;
        const loadEspecialidad = async () => {
            try {
                const data = await getCitasByPaciente(paciente.id);
                const list = Array.isArray(data)
                    ? data
                    : [
                        ...(Array.isArray(data?.proximasCitas) ? data.proximasCitas : []),
                        ...(Array.isArray(data?.historialCitas) ? data.historialCitas : []),
                    ];
                const now = new Date();
                const next = list
                    .map((cita) => {
                        const fecha = new Date(cita.fechaHora || cita.fecha_cita || cita.fecha || cita.fechaRegistro || '');
                        return { cita, fecha };
                    })
                    .filter((item) => item.fecha instanceof Date && !Number.isNaN(item.fecha))
                    .sort((a, b) => a.fecha - b.fecha)
                    .find((item) => item.fecha >= now);

                const rawEspecialidad =
                    next?.cita?.especialidad ||
                    next?.cita?.especialidadNombre ||
                    next?.cita?.Medico?.especialidad ||
                    next?.cita?.medico?.especialidad ||
                    '';

                setAdminEspecialidad(normalizeEspecialidad(rawEspecialidad));
            } catch (err) {
                console.error(err);
                setAdminEspecialidad('');
            }
        };
        loadEspecialidad();
    }, [isAdmin, paciente?.id]);

    const loadPsicologia = React.useCallback(async () => {
        if (!paciente?.id) return;
        const data = await getPsicologia(paciente.id);
        setPsicoData({
            sesiones: Array.isArray(data?.sesiones) ? data.sesiones : [],
            evaluaciones: Array.isArray(data?.evaluaciones) ? data.evaluaciones : [],
            objetivos: Array.isArray(data?.objetivos) ? data.objetivos : [],
            estrategias: Array.isArray(data?.estrategias) ? data.estrategias : [],
            notas: Array.isArray(data?.notas) ? data.notas : [],
        });
    }, [paciente?.id]);

    useEffect(() => {
        if (isPsychLike && paciente?.id) {
            void loadPsicologia();
        }
    }, [isPsychLike, loadPsicologia, paciente?.id]);

    const tabs = React.useMemo(() => (
        isReadOnly
            ? ['generales', 'finanzas', 'documentos']
            : isPsychLike
            ? ['generales', 'finanzas', 'sesiones', 'evaluaciones', 'plan', 'notas', 'documentos']
            : isDoctorLike
                ? ['generales', 'finanzas', 'clinico', 'citas', 'seguimiento', 'archivos', 'notas']
                : ['generales', 'finanzas', 'clinico', 'citas', 'nutricion', 'documentos']
    ), [isDoctorLike, isPsychLike, isReadOnly]);

    const tabLabel = (tab) => {
        if (tab === 'generales') return 'Datos Generales';
        if (tab === 'finanzas') return 'Finanzas';
        if (tab === 'sesiones') return 'Sesiones Psicológicas';
        if (tab === 'evaluaciones') return 'Evaluaciones';
        if (tab === 'plan') return 'Plan de Intervención';
        if (tab === 'notas' && isPsychLike) return 'Notas Clínicas';
        if (tab === 'nutricion') return 'Seguimiento';
        if (tab === 'documentos') return 'Documentos';
        if (tab === 'archivos') return 'Documentos';
        if (tab === 'clinico') return 'Historial Clínico';
        if (tab === 'citas') return 'Citas';
        if (tab === 'seguimiento') return 'Seguimiento';
        return tab;
    };

    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);

    // Ajusta flags dinámicamente al cargar paciente/psicoData para admins
    useEffect(() => {
        const hasPsico = Boolean(paciente?.psicologoId) ||
            psicoData.sesiones.length > 0 ||
            psicoData.evaluaciones.length > 0 ||
            psicoData.objetivos.length > 0 ||
            psicoData.estrategias.length > 0 ||
            psicoData.notas.length > 0;
        const hasDoctor = Boolean(paciente?.medicoId);

        const adminTargetsPsico = isAdmin && adminEspecialidad === 'PSICOLOGIA';
        const adminTargetsNutri = isAdmin && ['NUTRICION', 'NUTRI', 'NUTRIOLOGO'].includes(adminEspecialidad);
        const adminTargetsDoctor = isAdmin && adminEspecialidad && !adminTargetsPsico && !adminTargetsNutri;

        const resolvedPsych = isPsych || adminTargetsPsico || (!adminEspecialidad && isAdmin && hasPsico);
        const resolvedDoctor = isDoctor || adminTargetsDoctor || (!adminEspecialidad && isAdmin && hasDoctor);

        setIsPsychLike(resolvedPsych);
        setIsDoctorLike(resolvedDoctor && !adminTargetsNutri);

        if (isAdmin) {
            if (adminTargetsNutri && activeTab !== 'nutricion') setActiveTab('nutricion');
            if (adminTargetsPsico && !['generales', 'finanzas', 'sesiones', 'evaluaciones', 'plan', 'notas', 'documentos'].includes(activeTab)) {
                setActiveTab('generales');
            }
            if (adminTargetsDoctor && !['generales', 'finanzas', 'clinico', 'citas', 'seguimiento', 'archivos', 'notas'].includes(activeTab)) {
                setActiveTab('clinico');
            }
        }
    }, [paciente, psicoData, isPsych, isDoctor, isAdmin, adminEspecialidad, activeTab]);

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
        if (isReadOnly) return;
        setIsSaving(true);
        try {
            const updated = await updatePaciente(id, buildPacientePayload(formData));
            const mergedPaciente = {
                ...formData,
                ...updated,
                talla: updated?.talla ?? formData.talla ?? '',
                estadoPago: getPacienteEstadoPago(updated) || formData.estadoPago || '',
                ultimaVisita: getPacienteUltimaVisita(updated) || formData.ultimaVisita || '',
            };
            setPaciente(mergedPaciente);
            setFormData(mergedPaciente);
            setIsEditing(false);
            alert("Guardado correctamente");
        } catch {
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinancialSave = async (financialData) => {
        if (!canEditFinancial) return false;
        setIsSaving(true);
        try {
            const updated = await updatePacienteFinanzas(id, financialData);
            const mergedPaciente = {
                ...paciente,
                ...updated,
                talla: updated?.talla ?? paciente?.talla ?? '',
                tipoMembresia: getPacienteMembresia(updated) || financialData.tipoMembresia || '',
                estadoPago: getPacienteEstadoPago(updated) || financialData.estadoPago || '',
                ultimaVisita: getPacienteUltimaVisita(updated) || paciente?.ultimaVisita || '',
            };
            setPaciente(mergedPaciente);
            setFormData((prev) => ({
                ...prev,
                tipoMembresia: mergedPaciente.tipoMembresia,
                estadoPago: mergedPaciente.estadoPago,
            }));
            alert('Información financiera actualizada correctamente');
            return true;
        } catch (error) {
            console.error(error);
            alert('Error al actualizar la información financiera');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className={styles.loadingContainer}><FaSpinner className="fa-spin" /> Cargando...</div>;
    if (!paciente) return <div>No encontrado</div>;

    const latestSesion = psicoData.sesiones[0] || null;
    const sesionesCount = psicoData.sesiones.length;

    // Helper para renderizar campos
    const renderField = (label, name, type = 'text', options = [], props = {}) => {
        const { suggestions = [], ...inputProps } = props;
        const datalistId = suggestions.length > 0 ? `${name}-suggestions` : undefined;

        return (
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
                    list={datalistId}
                    disabled={!isEditing || props.readOnly} 
                    className={(!isEditing || props.readOnly) ? formStyles.disabledInput : ''}
                    {...inputProps} 
                />
            )}
            {suggestions.length > 0 && (
                <datalist id={datalistId}>
                    {suggestions.map((option) => <option key={option} value={option} />)}
                </datalist>
            )}
        </div>
        );
    };

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
                    ) : !isReadOnly ? (
                        <Button onClick={() => setIsEditing(true)}><FaEdit /> Editar</Button>
                    ) : null}
                </div>
            </div>
            {/* Metrica */}
            {isPsychLike ? (
                <div className={styles.psicoHeader}>
                    <div>
                        <h2>Expediente Psicológico</h2>
                        <p>{paciente.nombre} • {calcularEdad(paciente.fechaNacimiento)} años</p>
                    </div>
                    <Tag label={paciente.riesgo || 'Riesgo Alto'} />
                </div>
            ) : null}

            <div className={styles.metricsGrid}>
            {isPsychLike ? (
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
                        <div className={styles.metricCard}><h4>Fecha de consulta</h4><h3>{getPacienteUltimaVisita(paciente) ? new Date(getPacienteUltimaVisita(paciente)).toLocaleDateString() : 'N/A'}</h3></div>
                        <div className={styles.metricCard}><h4>Membresía</h4><h3>{getPacienteMembresia(paciente) || '-'}</h3><small>Paquete vigente del paciente</small></div>
                        <div className={styles.metricCard}><h4>Estado financiero</h4><h3>{getPacienteEstadoPago(paciente) || '-'}</h3><small>Seguimiento de pago del paciente</small></div>
                        <div className={styles.metricCard}><h4>IMC</h4><h2>{paciente.imc || '-'}</h2><small>{paciente.pesoKg}kg / {paciente.estatura}m</small></div>
                        <div className={styles.metricCard}><h4>Talla de cintura</h4><h2>{paciente.talla || '-'}</h2><small>Referencia independiente de estatura</small></div>
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
                {isPsychLike ? (
                    <>
                        {activeTab === 'generales' && (
                            <form className={formStyles.formGrid} style={{display:'block'}}>
                                <h3 className={formStyles.formSectionTitle}>Información Personal</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Nombre del Paciente', 'nombre')}
                                    {renderField('CURP', 'curp')}
                                    {renderField('Fecha Nacimiento', 'fechaNacimiento', 'date')}
                                    {renderField('Género', 'genero', 'select', allowedGeneros.map(v => ({value:v, label:v})))}
                                    {renderField('Celular', 'celular')}
                                    {renderField('Email', 'email', 'email')}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Domicilio</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Domicilio', 'calleNumero')}
                                    {renderField('Colonia', 'colonia')}
                                    {renderField('Municipio', 'municipio', 'select', [{ value: '', label: 'Selecciona un municipio' }, ...municipiosJalisco.map((v) => ({ value: v, label: v }))])}
                                    {renderField('Estado', 'estado')}
                                    {renderField('CP', 'codigoPostal')}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Programa y servicio</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Tipo de servicio', 'tipoServicio', 'text', [], { suggestions: tipoServicioSuggestions })}
                                    {renderField('Membresía', 'tipoMembresia', 'select', [{ value: '', label: 'Sin definir' }, ...allowedTiposMembresia.map(v => ({ value: v, label: v }))])}
                                    {renderField('Estado financiero', 'estadoPago', 'select', [{ value: '', label: 'Sin definir' }, ...allowedEstadosPago.map(v => ({ value: v, label: v }))])}
                                    {renderField('Responsable', 'responsable', 'text', [], { suggestions: responsableSuggestions })}
                                    {renderField('Estatus', 'estatus', 'select', allowedEstatus.map(v => ({value:v, label:v})))}
                                    {renderField('Riesgo', 'riesgo', 'select', allowedRiesgo.map(v => ({value:v, label:v})))}
                                    {renderField('Grupo al que pertenece', 'grupo', 'text', [], { suggestions: grupoSuggestions })}
                                    {renderField('Tipo de terapia', 'tipoTerapia', 'select', allowedTipoTerapia.map(v => ({value:v, label:v})))}
                                    {renderField('Motivo de consulta', 'motivoConsulta', 'text', [], { suggestions: motivoConsultaSuggestions })}
                                    {renderField('Mes', 'mesEstadistico', 'select', mesesEstadisticos.map(v => ({value:v, label:v})))}
                                    {renderField('Fecha de diagnóstico', 'fechaDiagnostico', 'date')}
                                    {renderField('Fecha de consulta', 'ultimaVisita', 'date')}
                                </div>
                            </form>
                        )}
                        {activeTab === 'finanzas' && (
                            <FinancialSummarySection
                                key={`${paciente?.id || 'nuevo'}:${getPacienteMembresia(paciente) || ''}:${getPacienteEstadoPago(paciente) || ''}`}
                                paciente={paciente}
                                canEdit={canEditFinancial}
                                onSaveFinancial={handleFinancialSave}
                                isSaving={isSaving}
                            />
                        )}
                        {activeTab === 'sesiones' && (
                            <PsicologiaSesionesSection
                                pacienteId={paciente.id}
                                sesiones={psicoData.sesiones}
                                onRefresh={loadPsicologia}
                                canEdit={canEditPsych}
                                canDelete={canDeletePsych}
                            />
                        )}
                        {activeTab === 'evaluaciones' && (
                            <PsicologiaEvaluacionesSection
                                pacienteId={paciente.id}
                                evaluaciones={psicoData.evaluaciones}
                                onRefresh={loadPsicologia}
                                canEdit={canEditPsych}
                                canDelete={canDeletePsych}
                            />
                        )}
                        {activeTab === 'plan' && (
                            <PsicologiaPlanSection
                                pacienteId={paciente.id}
                                objetivos={psicoData.objetivos}
                                estrategias={psicoData.estrategias}
                                onRefresh={loadPsicologia}
                                canEdit={canEditPsych}
                                canDelete={canDeletePsych}
                            />
                        )}
                        {activeTab === 'notas' && (
                            <PsicologiaNotasSection
                                pacienteId={paciente.id}
                                notas={psicoData.notas}
                                onRefresh={loadPsicologia}
                                canEdit={canEditPsych}
                                canDelete={canDeletePsych}
                            />
                        )}
                        {activeTab === 'documentos' && (
                            <Documentos pacienteId={paciente.id} />
                        )}
                    </>
                ) : (
                    <>
                        {activeTab === 'generales' && (
                            <form className={formStyles.formGrid} style={{display:'block'}}>
                                <h3 className={formStyles.formSectionTitle}>Información Personal</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Nombre del Paciente', 'nombre')}
                                    {renderField('CURP', 'curp')}
                                    {renderField('Fecha Nacimiento', 'fechaNacimiento', 'date')}
                                    {renderField('Género', 'genero', 'select', allowedGeneros.map(v => ({value:v, label:v})))}
                                    {renderField('Celular', 'celular')}
                                    {renderField('Email', 'email', 'email')}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Domicilio</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Domicilio', 'calleNumero')}
                                    {renderField('Colonia', 'colonia')}
                                    {renderField('Municipio', 'municipio', 'select', [{ value: '', label: 'Selecciona un municipio' }, ...municipiosJalisco.map((v) => ({ value: v, label: v }))])}
                                    {renderField('Estado', 'estado')}
                                    {renderField('CP', 'codigoPostal')}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Información Clínica</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Tipo Diabetes', 'tipoDiabetes', 'select', allowedTipoDiabetes.map(v => ({value:v, label:v})))}
                                    {renderField('Fecha de diagnóstico', 'fechaDiagnostico', 'date')}
                                    {renderField('Fecha de consulta', 'ultimaVisita', 'date')}
                                    {renderField('Estatura (metros)', 'estatura', 'number', [], {step:'0.01', placeholder:'Ej: 1.65'})}
                                    {renderField('Talla de cintura', 'talla', 'text', [], {placeholder:'Ej: 32, 34, 36'})}
                                    {renderField('Peso (kg)', 'pesoKg', 'number', [], {step:'0.1'})}
                                    {renderField('HbA1c', 'hba1c', 'number', [], {step:'0.1'})}
                                    {isDoctorLike && renderField('Glucosa (mg/dL)', 'glucosa', 'number', [], {step:'0.1'})}
                                    {isDoctorLike && renderField('Presión arterial', 'presionArterial', 'text', [], {placeholder:'120/80'})}
                                    {renderField('IMC (Auto)', 'imc', 'number', [], {readOnly: true, placeholder:'Automatico'})}
                                </div>

                                <h3 className={formStyles.formSectionTitle}>Programa y servicio</h3>
                                <div className={formStyles.formGrid}>
                                    {renderField('Tipo de servicio', 'tipoServicio', 'text', [], { suggestions: tipoServicioSuggestions })}
                                    {renderField('Membresía', 'tipoMembresia', 'select', [{ value: '', label: 'Sin definir' }, ...allowedTiposMembresia.map(v => ({ value: v, label: v }))])}
                                    {renderField('Estado financiero', 'estadoPago', 'select', [{ value: '', label: 'Sin definir' }, ...allowedEstadosPago.map(v => ({ value: v, label: v }))])}
                                    {renderField('Responsable', 'responsable', 'text', [], { suggestions: responsableSuggestions })}
                                    {renderField('Estatus', 'estatus', 'select', allowedEstatus.map(v => ({value:v, label:v})))}
                                    {renderField('Riesgo', 'riesgo', 'select', allowedRiesgo.map(v => ({value:v, label:v})))}
                                    {renderField('Grupo al que pertenece', 'grupo', 'text', [], { suggestions: grupoSuggestions })}
                                    {renderField('Tipo de terapia', 'tipoTerapia', 'select', allowedTipoTerapia.map(v => ({value:v, label:v})))}
                                    {renderField('Motivo de consulta', 'motivoConsulta', 'text', [], { suggestions: motivoConsultaSuggestions })}
                                    {renderField('Mes', 'mesEstadistico', 'select', mesesEstadisticos.map(v => ({value:v, label:v})))}
                                </div>
                            </form>
                        )}
                        {activeTab === 'finanzas' && (
                            <FinancialSummarySection
                                key={`${paciente?.id || 'nuevo'}:${getPacienteMembresia(paciente) || ''}:${getPacienteEstadoPago(paciente) || ''}`}
                                paciente={paciente}
                                canEdit={canEditFinancial}
                                onSaveFinancial={handleFinancialSave}
                                isSaving={isSaving}
                            />
                        )}
                        {activeTab === 'clinico' && <HistorialClinicoSection pacienteId={paciente.id} onConsultaCreated={fetchPaciente} />}
                        {activeTab === 'citas' && <CitasSection pacienteId={paciente.id} defaultMedicoId={paciente.medicoId} />}

                        {!isDoctorLike && activeTab === 'nutricion' && <Nutricion pacienteId={paciente.id} pacienteData={paciente} onPacienteUpdated={fetchPaciente} />}
                        {!isDoctorLike && activeTab === 'documentos' && <Documentos pacienteId={paciente.id} />}

                        {isDoctorLike && activeTab === 'seguimiento' && (
                            <DoctorSeguimientoSection paciente={paciente} onConsultaCreated={fetchPaciente} />
                        )}
                        {isDoctorLike && activeTab === 'archivos' && <Documentos pacienteId={paciente.id} />}
                        {isDoctorLike && activeTab === 'notas' && <DoctorNotasSection pacienteId={paciente.id} />}
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


