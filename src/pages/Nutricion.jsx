import React, { useEffect, useState } from "react";
import styles from "./Nutricion.module.css";
import api from "../services/api";
import { FaRegFileAlt, FaPlus, FaSave, FaSpinner, FaEye, FaEdit, FaTimes } from "react-icons/fa";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import formStyles from "./Configuracion.module.css"; 

// --- MODAL VER DETALLE DEL PLAN ---
const ModalVerPlan = ({ plan, onClose }) => {
    if (!plan) return null;
    return (
        <div style={{ padding: '15px' }}>
            <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{plan.nombre}</h3>
                <small style={{ color: '#666' }}>Fecha de inicio: {new Date(plan.fecha).toLocaleDateString()}</small>
            </div>
            <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Detalles del Menú:</label>
                <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', lineHeight: '1.6' }}>
                    {plan.detalles || "Sin detalles registrados."}
                </p>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

// --- MODAL NUEVO PLAN ---
const FormularioPlan = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        nombre: "",
        fecha: new Date().toISOString().slice(0, 10),
        detalles: ""
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await onSave(form); } 
        catch (error) { alert("Error al guardar"); } 
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
            <div className={formStyles.formGroup}>
                <label>Nombre del Plan *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Dieta Hiposódica" required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
            </div>
            <div className={formStyles.formGroup} style={{marginTop: '1rem'}}>
                <label>Fecha de Inicio *</label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
            </div>
            <div className={formStyles.formGroup} style={{marginTop: '1rem'}}>
                <label>Detalles / Menú</label>
                <textarea name="detalles" value={form.detalles} onChange={handleChange} rows="6" style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? <FaSpinner className="fa-spin" /> : <FaSave />} Guardar</Button>
            </div>
        </form>
    );
};

// --- COMPONENTE PRINCIPAL ---
const Nutricion = ({ pacienteId, pacienteData }) => {
    const [data, setData] = useState(null); // Datos completos (planes + info)
    const [infoForm, setInfoForm] = useState({ nutriologo: '', estado: '' }); // Estado local para edición
    const [loading, setLoading] = useState(true);
    
    const [isEditingInfo, setIsEditingInfo] = useState(false); // Modo edición activado?
    const [isSavingInfo, setIsSavingInfo] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const fetchData = async () => {
        try {
            const res = await api.get(`/nutricion/${pacienteId}`);
            setData(res.data);
            // Inicializamos el formulario con los datos que vienen del backend
            setInfoForm({
                nutriologo: res.data.nutriologo || '',
                estado: res.data.estado || ''
            });
        } catch (err) {
            console.error(err);
            setData({ nutriologo: '', estado: '', planes: [] });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        if (pacienteId) fetchData();
    }, [pacienteId]);

    // --- MANEJO DE EDICIÓN DE INFORMACIÓN (Nutriólogo y Estado) ---
    const handleInfoChange = (e) => {
        setInfoForm({ ...infoForm, [e.target.name]: e.target.value });
    };

    const handleSaveInfo = async () => {
        setIsSavingInfo(true);
        try {
            // Enviamos PUT al backend
            // Nota: Enviamos también el IMC actual del paciente para que se guarde en el histórico de nutrición si es necesario
            await api.put(`/nutricion/${pacienteId}`, {
                ...infoForm,
                imc: pacienteData?.imc // Mantenemos sincronizado el IMC
            });
            
            setIsEditingInfo(false);
            await fetchData(); // Recargar para confirmar
        } catch (error) {
            alert("Error al actualizar información nutricional");
        } finally {
            setIsSavingInfo(false);
        }
    };

    const toggleEdit = () => {
        if (isEditingInfo) {
            // Si estamos editando y cancelamos, reseteamos los valores
            setInfoForm({
                nutriologo: data.nutriologo || '',
                estado: data.estado || ''
            });
        }
        setIsEditingInfo(!isEditingInfo);
    };

    // --- MANEJO DE PLANES ---
    const handleSavePlan = async (formData) => {
        await api.post(`/nutricion/${pacienteId}/planes`, formData);
        await fetchData();
        setIsModalOpen(false);
    };

    if (loading) return <div style={{padding:'2rem', textAlign:'center'}}>Cargando...</div>;

    return (
        <div className={styles.card}>
            
            {/* SECCIÓN 1: INFO NUTRICIONAL EDITABLE */}
            <div style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                    <div>
                        <h2 className={styles.title}>Información Nutricional</h2>
                        <p className={styles.subtitle}>Antropometría y planes alimenticios</p>
                    </div>
                    
                    {/* Botón de Editar / Guardar */}
                    <div>
                        {isEditingInfo ? (
                            <div style={{display:'flex', gap:'10px'}}>
                                <Button size="small" variant="secondary" onClick={toggleEdit} disabled={isSavingInfo}>
                                    <FaTimes /> Cancelar
                                </Button>
                                <Button size="small" onClick={handleSaveInfo} disabled={isSavingInfo}>
                                    {isSavingInfo ? <FaSpinner className="fa-spin"/> : <FaSave />} Guardar
                                </Button>
                            </div>
                        ) : (
                            <button 
                                onClick={toggleEdit}
                                style={{background:'transparent', border:'1px solid #ddd', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', color:'#555', fontWeight:'600', display:'flex', alignItems:'center', gap:'5px'}}
                            >
                                <FaEdit /> Editar Info
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.gridRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>IMC Actual</label>
                        {/* El IMC siempre es solo lectura porque viene de Datos Generales */}
                        <input className={styles.readOnlyInput} value={pacienteData?.imc || '-'} readOnly />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Nutriólogo Asignado</label>
                        <input 
                            name="nutriologo"
                            className={isEditingInfo ? styles.editableInput : styles.readOnlyInput} 
                            value={infoForm.nutriologo}
                            onChange={handleInfoChange}
                            readOnly={!isEditingInfo}
                            placeholder={isEditingInfo ? "Escribe el nombre..." : "Sin asignar"}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Estado Nutricional</label>
                        <input 
                            name="estado"
                            className={isEditingInfo ? styles.editableInput : styles.readOnlyInput} 
                            value={infoForm.estado}
                            onChange={handleInfoChange}
                            readOnly={!isEditingInfo}
                            placeholder={isEditingInfo ? "Ej. Obesidad, Normal..." : "-"}
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: PLANES (Con botón azul Nuevo Plan a la derecha) */}
            <div style={{marginTop: '30px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h3 className={styles.sectionTitle} style={{margin:0}}>Planes de Alimentación</h3>
                    <Button size="small" onClick={() => setIsModalOpen(true)}>
                        <FaPlus /> Nuevo Plan
                    </Button>
                </div>
                
                {data?.planes && data.planes.length > 0 ? (
                    <div style={{border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead style={{backgroundColor: '#f9f9f9'}}>
                                <tr>
                                    <th style={{textAlign:'left', padding:'12px', fontSize:'0.85rem', color:'#666'}}>Nombre del Plan</th>
                                    <th style={{textAlign:'left', padding:'12px', fontSize:'0.85rem', color:'#666'}}>Fecha Inicio</th>
                                    <th style={{textAlign:'left', padding:'12px', fontSize:'0.85rem', color:'#666'}}>Detalles</th>
                                    <th style={{textAlign:'center', padding:'12px', fontSize:'0.85rem', color:'#666'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.planes.map((plan, idx) => (
                                    <tr key={idx} style={{borderTop: '1px solid #eee'}}>
                                        <td style={{padding:'12px', fontWeight:'600'}}>{plan.nombre}</td>
                                        <td style={{padding:'12px'}}>{new Date(plan.fecha).toLocaleDateString()}</td>
                                        <td style={{padding:'12px', color:'#666', fontSize:'0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                            {plan.detalles || '-'}
                                        </td>
                                        <td style={{padding:'12px', textAlign:'center'}}>
                                            <button 
                                                onClick={() => setSelectedPlan(plan)}
                                                style={{background:'none', border:'none', cursor:'pointer', color:'#007bff', fontSize:'1.1rem'}}
                                                title="Ver detalles"
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FaRegFileAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No hay planes nutricionales registrados</p>
                    </div>
                )}
            </div>

            {/* Modales */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Plan Nutricional">
                <FormularioPlan onClose={() => setIsModalOpen(false)} onSave={handleSavePlan} />
            </Modal>

            <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title="Detalle del Plan">
                <ModalVerPlan plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
            </Modal>
        </div>
    );
};

export default Nutricion;