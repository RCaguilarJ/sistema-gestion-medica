import React, { useEffect, useState } from "react";
import styles from "./Nutricion.module.css";
import api from "../services/api";
import { FaRegFileAlt } from "react-icons/fa"; // Ícono de documento

const Nutricion = ({ pacienteId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Esta ruta ya la configuramos en el backend unificado (MySQL)
                const res = await api.get(`/nutricion/${pacienteId}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching nutricion:", err);
                // Fallback para evitar pantalla blanca si falla
                setData({ imc: '', nutriologo: '', estado: '', planes: [] });
            } finally {
                setLoading(false);
            }
        };

        if (pacienteId) fetchData();
    }, [pacienteId]);

    if (loading) {
        return <div style={{padding:'2rem', textAlign:'center', color:'#666'}}>Cargando información nutricional...</div>;
    }

    return (
        <div className={styles.card}>
            {/* Encabezado */}
            <div>
                <h2 className={styles.title}>Información Nutricional</h2>
                <p className={styles.subtitle}>Antropometría y planes alimenticios</p>
            </div>

            {/* Métricas (Inputs de solo lectura) */}
            <div className={styles.gridRow}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>IMC Actual</label>
                    <input 
                        className={styles.readOnlyInput} 
                        value={data?.imc || '-'} 
                        readOnly 
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Nutriólogo Asignado</label>
                    <input 
                        className={styles.readOnlyInput} 
                        value={data?.nutriologo || 'Sin asignar'} 
                        readOnly 
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Estado Nutricional</label>
                    <input 
                        className={styles.readOnlyInput} 
                        value={data?.estado || '-'} 
                        readOnly 
                    />
                </div>
            </div>

            {/* Planes de Alimentación */}
            <div>
                <h3 className={styles.sectionTitle}>Planes de Alimentación</h3>
                
                {data?.planes && data.planes.length > 0 ? (
                    /* Si HAY planes, mostramos una lista simple (puedes personalizarla luego) */
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {data.planes.map((plan, idx) => (
                            <li key={idx} style={{padding:'10px', borderBottom:'1px solid #eee'}}>
                                <strong>{plan.nombre}</strong> - {new Date(plan.fecha).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    /* Si NO hay planes, mostramos el diseño de la imagen */
                    <div className={styles.emptyState}>
                        <FaRegFileAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No hay planes nutricionales registrados</p>
                        <button 
                            className={styles.createLink}
                            onClick={() => alert("Funcionalidad para crear plan pendiente")}
                        >
                            Crear plan nutricional
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nutricion;