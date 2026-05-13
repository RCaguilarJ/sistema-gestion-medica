import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Nutricion.module.css";
import api from "../services/api";
import { FaRegFileAlt, FaPlus, FaSave, FaSpinner, FaEye, FaEdit, FaTimes } from "react-icons/fa";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import formStyles from "./Configuracion.module.css";
import { useAuth } from "../hooks/AuthContext.jsx";

const ModalVerPlan = ({ plan, onClose }) => {
    if (!plan) return null;

    return (
        <div style={{ padding: "15px" }}>
            <div style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#333" }}>{plan.nombre}</h3>
                <small style={{ color: "#666" }}>Fecha de inicio: {new Date(plan.fecha).toLocaleDateString("es-MX")}</small>
            </div>
            <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px", color: "#555" }}>Detalles del menu:</label>
                <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", lineHeight: "1.6" }}>
                    {plan.detalles || "Sin detalles registrados."}
                </p>
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

const FormularioPlan = ({ onClose, onSave, initialData }) => {
    const [form, setForm] = useState({
        nombre: initialData?.nombre || "",
        fecha: initialData?.fecha ? initialData.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
        detalles: initialData?.detalles || "",
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(form);
        } catch {
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: "10px" }}>
            <div className={formStyles.formGroup}>
                <label>Nombre del Plan *</label>
                <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Dieta Hiposodica"
                    required
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
                />
            </div>
            <div className={formStyles.formGroup} style={{ marginTop: "1rem" }}>
                <label>Fecha de Inicio *</label>
                <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
                />
            </div>
            <div className={formStyles.formGroup} style={{ marginTop: "1rem" }}>
                <label>Detalles / Menu</label>
                <textarea
                    name="detalles"
                    value={form.detalles}
                    onChange={handleChange}
                    rows="6"
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? <FaSpinner className="fa-spin" /> : <FaSave />} Guardar</Button>
            </div>
        </form>
    );
};

const Nutricion = ({ pacienteId, pacienteData, onPacienteUpdated }) => {
    const [data, setData] = useState(null);
    const [infoForm, setInfoForm] = useState({ nutriologo: "", estado: "", talla: "" });
    const [loading, setLoading] = useState(true);
    const [nutriologos, setNutriologos] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");
    const { user } = useAuth();

    const userRole = useMemo(() => (user?.role || "").toUpperCase(), [user]);
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    const roleFilters = useMemo(() => {
        if (userRole === "PSICOLOGO" || userRole === "PSY") return ["PSICOLOGO", "PSY"];
        if (["NUTRI", "ENDOCRINOLOGO", "PODOLOGO", "DOCTOR"].includes(userRole)) {
            return [userRole];
        }
        return [];
    }, [userRole]);

    const adminRoleOptions = useMemo(() => ([
        { value: "", label: "Todos" },
        { value: "NUTRI", label: "Nutriologo" },
        { value: "PSICOLOGO", label: "Psicologo" },
        { value: "PSY", label: "Psych (PSY)" },
        { value: "ENDOCRINOLOGO", label: "Endocrinologo" },
        { value: "PODOLOGO", label: "Podologo" },
        { value: "DOCTOR", label: "Doctor" },
    ]), []);

    const especialistaLabel = useMemo(() => {
        if (userRole === "NUTRI") return "Nutriologo asignado";
        if (userRole === "ENDOCRINOLOGO") return "Endocrinologo asignado";
        if (userRole === "PODOLOGO") return "Podologo asignado";
        if (userRole === "DOCTOR") return "Doctor asignado";
        if (userRole === "PSICOLOGO" || userRole === "PSY") return "Psicologo asignado";
        return "Especialista asignado";
    }, [userRole]);

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const normalizeTalla = (value) => (value === null || value === undefined ? "" : String(value));
    const normalizeSpecialistPayloadValue = (value) => {
        if (value === null || value === undefined || value === "") return "";
        return /^\d+$/.test(String(value)) ? Number(value) : value;
    };

    const getSpecialistFieldValue = (source = {}) => {
        const rawValue = source.nutriologoId ?? source.nutriologo ?? "";
        if (rawValue && typeof rawValue === "object") {
            return rawValue.id ?? rawValue.nombre ?? "";
        }
        return rawValue ?? "";
    };

    const tallaBase = pacienteData?.talla ?? "";

    const buildInfoForm = useCallback((source = {}) => ({
        nutriologo: getSpecialistFieldValue(source),
        estado: source.estado || "",
        talla: normalizeTalla(source.talla ?? tallaBase),
    }), [tallaBase]);

    const getSpecialistDisplay = (value) => {
        if (!value) return "";
        if (typeof value === "object") {
            return value.nombre || value.email || String(value.id || "");
        }
        const selected = nutriologos.find((u) => String(u.id) === String(value));
        return selected?.nombre || String(value);
    };

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/nutricion/${pacienteId}`);
            const normalizedData = {
                ...(res.data || {}),
                talla: normalizeTalla(res.data?.talla ?? tallaBase),
                planes: Array.isArray(res.data?.planes) ? res.data.planes : [],
            };
            setData(normalizedData);
            setInfoForm(buildInfoForm(normalizedData));
        } catch (err) {
            console.error(err);
            const fallbackData = {
                nutriologo: "",
                estado: "",
                talla: normalizeTalla(tallaBase),
                planes: [],
            };
            setData(fallbackData);
            setInfoForm(buildInfoForm(fallbackData));
        } finally {
            setLoading(false);
        }
    }, [buildInfoForm, pacienteId, tallaBase]);

    useEffect(() => {
        setLoading(true);
        if (pacienteId) void fetchData();
    }, [fetchData, pacienteId]);

    useEffect(() => {
        let isMounted = true;

        const fetchEspecialistas = async () => {
            try {
                const params = isAdmin
                    ? (selectedRole ? { role: selectedRole } : undefined)
                    : (roleFilters.length === 1 ? { role: roleFilters[0] } : undefined);
                const res = await api.get("/users/especialistas", params ? { params } : undefined);
                const list = Array.isArray(res.data?.especialistas) ? res.data.especialistas : [];

                const filtered = isAdmin
                    ? list
                    : list.filter((u) => roleFilters.includes((u.role || "").toUpperCase()));

                if (isMounted) setNutriologos(filtered);
            } catch (err) {
                console.error("Error cargando especialistas:", err);
                if (isMounted) setNutriologos([]);
            }
        };

        fetchEspecialistas();

        return () => {
            isMounted = false;
        };
    }, [isAdmin, roleFilters, selectedRole]);

    const handleInfoChange = (e) => {
        setInfoForm({ ...infoForm, [e.target.name]: e.target.value });
    };

    const handleSaveInfo = async () => {
        setIsSavingInfo(true);
        try {
            await api.put(`/nutricion/${pacienteId}`, {
                ...infoForm,
                nutriologo: normalizeSpecialistPayloadValue(infoForm.nutriologo),
                talla: normalizeTalla(infoForm.talla),
                imc: pacienteData?.imc,
            });

            setIsEditingInfo(false);
            await fetchData();

            if (onPacienteUpdated) {
                try {
                    await onPacienteUpdated();
                } catch (syncError) {
                    console.error("Error recargando paciente tras actualizar nutricion:", syncError);
                }
            }
        } catch {
            alert("Error al actualizar informacion nutricional");
        } finally {
            setIsSavingInfo(false);
        }
    };

    const toggleEdit = () => {
        if (isEditingInfo) {
            setInfoForm(buildInfoForm(data || {}));
        }
        setIsEditingInfo((prev) => !prev);
    };

    const handleSavePlan = async (formData) => {
        if (editingPlan?.id) {
            await api.put(`/nutricion/${pacienteId}/planes/${editingPlan.id}`, formData);
        } else {
            await api.post(`/nutricion/${pacienteId}/planes`, formData);
        }
        await fetchData();
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleDeletePlan = async (plan) => {
        if (!isAdmin) return;
        if (!window.confirm("Eliminar este seguimiento?")) return;
        await api.delete(`/nutricion/${pacienteId}/planes/${plan.id}`);
        await fetchData();
    };

    if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando...</div>;

    const currentSpecialistValue = infoForm.nutriologo ? String(infoForm.nutriologo) : "";
    const showCurrentSpecialistOption = currentSpecialistValue && !nutriologos.some((u) => String(u.id) === currentSpecialistValue);
    const currentSpecialistLabel = getSpecialistDisplay(data?.nutriologo ?? infoForm.nutriologo);

    return (
        <div className={styles.card}>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 className={styles.sectionTitle} style={{ margin: "0 0 0.25rem 0" }}>Informacion del seguimiento</h3>
                        <p className={styles.subtitle} style={{ margin: 0 }}>Datos editables del paciente para seguimiento nutricional.</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        {isEditingInfo ? (
                            <>
                                <Button type="button" variant="secondary" onClick={toggleEdit} disabled={isSavingInfo}>
                                    Cancelar
                                </Button>
                                <Button type="button" onClick={handleSaveInfo} disabled={isSavingInfo}>
                                    {isSavingInfo ? <FaSpinner className="fa-spin" /> : <FaSave />} Guardar
                                </Button>
                            </>
                        ) : (
                            <Button type="button" onClick={toggleEdit}>
                                <FaEdit /> Editar informacion
                            </Button>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className={styles.gridRow} style={{ marginBottom: "1rem" }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Filtrar especialistas</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className={styles.editableInput}
                            >
                                {adminRoleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className={styles.gridRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{especialistaLabel}</label>
                        {isEditingInfo ? (
                            <select
                                name="nutriologo"
                                value={currentSpecialistValue}
                                onChange={handleInfoChange}
                                className={styles.editableInput}
                            >
                                <option value="">Sin asignar</option>
                                {showCurrentSpecialistOption && (
                                    <option value={currentSpecialistValue}>{currentSpecialistLabel}</option>
                                )}
                                {nutriologos.map((especialista) => (
                                    <option key={especialista.id} value={String(especialista.id)}>
                                        {especialista.nombre}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className={styles.readOnlyInput}
                                value={currentSpecialistLabel}
                                placeholder="Sin asignar"
                                readOnly
                            />
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Estado</label>
                        <input
                            name="estado"
                            value={infoForm.estado}
                            onChange={handleInfoChange}
                            className={isEditingInfo ? styles.editableInput : styles.readOnlyInput}
                            placeholder="Sin capturar"
                            readOnly={!isEditingInfo}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Talla de cintura</label>
                        <input
                            name="talla"
                            value={infoForm.talla}
                            onChange={handleInfoChange}
                            className={isEditingInfo ? styles.editableInput : styles.readOnlyInput}
                            placeholder="Ej: 32, 34, 36"
                            readOnly={!isEditingInfo}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Seguimientos</h3>
                    <Button size="small" onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}>
                        <FaPlus /> Nuevo seguimiento
                    </Button>
                </div>

                {data?.planes && data.planes.length > 0 ? (
                    <div style={{ border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: "#f9f9f9" }}>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "12px", fontSize: "0.85rem", color: "#666" }}>Nombre del Plan</th>
                                    <th style={{ textAlign: "left", padding: "12px", fontSize: "0.85rem", color: "#666" }}>Fecha Inicio</th>
                                    <th style={{ textAlign: "left", padding: "12px", fontSize: "0.85rem", color: "#666" }}>Detalles</th>
                                    <th style={{ textAlign: "center", padding: "12px", fontSize: "0.85rem", color: "#666" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.planes.map((plan, idx) => (
                                    <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                                        <td style={{ padding: "12px", fontWeight: "600" }}>{plan.nombre}</td>
                                        <td style={{ padding: "12px" }}>{new Date(plan.fecha).toLocaleDateString("es-MX")}</td>
                                        <td style={{ padding: "12px", color: "#666", fontSize: "0.9rem", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {plan.detalles || "-"}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center", display: "flex", justifyContent: "center", gap: "12px" }}>
                                            <button
                                                onClick={() => setSelectedPlan(plan)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#007bff", fontSize: "1.1rem" }}
                                                title="Ver detalles"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#28a745", fontSize: "1.05rem" }}
                                                title="Editar seguimiento"
                                            >
                                                <FaEdit />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeletePlan(plan)}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", fontSize: "1.05rem" }}
                                                    title="Borrar"
                                                >
                                                    <FaTimes />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FaRegFileAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No hay seguimientos registrados</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPlan(null); }} title={editingPlan ? "Editar Plan Nutricional" : "Nuevo Plan Nutricional"}>
                <FormularioPlan onClose={() => { setIsModalOpen(false); setEditingPlan(null); }} onSave={handleSavePlan} initialData={editingPlan} />
            </Modal>

            <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title="Detalle del Plan">
                <ModalVerPlan plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
            </Modal>
        </div>
    );
};

export default Nutricion;
