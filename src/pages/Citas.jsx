import React, { useEffect, useMemo, useState } from "react";
import { FaEye, FaRegCalendarAlt } from "react-icons/fa";
import styles from "./Citas.module.css";
import { getCitasPortal, updateCitaPortalEstado } from "../services/consultaCitaService.js";
import { useAuth } from "../hooks/AuthContext.jsx";
import { useSearchParams } from "react-router-dom";

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString();
};

const normalizeStatus = (value) => {
  if (!value) return "Pendiente";
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "pendiente") return "Pendiente";
  if (normalized === "confirmada") return "Confirmada";
  if (normalized === "cancelada") return "Cancelada";
  return value.toString();
};

function Citas() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const focusCitaId = searchParams.get("citaId");

  const medicoId = useMemo(() => {
    if (!user?.id) return null;
    const role = (user?.role || "").toUpperCase();
    return role === "ADMIN" ? null : user.id;
  }, [user]);

  const canManage = useMemo(() => {
    const role = (user?.role || "").toUpperCase();
    return role === "ADMIN" || role === "DOCTOR" || role === "NUTRI" || role === "ENDOCRINOLOGO" || role === "PODOLOGO" || role === "PSICOLOGO";
  }, [user]);

  useEffect(() => {
    let active = true;

    const fetchCitas = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getCitasPortal(medicoId);
        if (active) setCitas(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error("Error cargando citas AMD:", fetchError);
        if (active) setError("No fue posible cargar las citas.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCitas();

    return () => {
      active = false;
    };
  }, [medicoId]);

  useEffect(() => {
    if (!focusCitaId || loading) return;
    const row = document.getElementById(`cita-row-${focusCitaId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusCitaId, loading, citas]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendario de Sesiones</h1>
        <p className={styles.subtitle}>Gestiona tus consultas psicológicas programadas</p>
      </header>

      <div className={styles.calendarCard}>
        <div className={styles.calendarPlaceholder}>
          <FaRegCalendarAlt className={styles.calendarIcon} />
          <p>Vista de calendario próximamente</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Citas registradas</h2>
          <span>{citas.length} en total</span>
        </div>

        {loading && <div className={styles.stateMessage}>Cargando citas...</div>}
        {!loading && error && <div className={styles.stateMessage}>{error}</div>}
        {!loading && !error && citas.length === 0 && (
          <div className={styles.stateMessage}>Aún no hay citas registradas.</div>
        )}

        {!loading && !error && citas.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Paciente</th>
                  <th>Especialista</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  {canManage && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => {
                  const statusLabel = normalizeStatus(cita.estado);
                  const statusClass = styles[`status${statusLabel}`] || "";
                  const canConfirm = canManage && statusLabel === "Pendiente";
                  const isFocused = focusCitaId && String(cita.id) === focusCitaId;

                  return (
                    <tr
                      key={cita.id ?? `${cita.pacienteId}-${cita.fechaHora}`}
                      id={cita.id ? `cita-row-${cita.id}` : undefined}
                      className={isFocused ? styles.focusedRow : undefined}
                    >
                      <td>{formatDateTime(cita.fechaHora)}</td>
                      <td>{cita.pacienteNombre || cita.pacienteEmail || `Paciente #${cita.usuarioId ?? "N/A"}`}</td>
                      <td>{cita.medicoNombre || `Especialista #${cita.medicoId ?? "N/A"}`}</td>
                      <td className={styles.motivoCell}>
                        <div className={styles.motivoMain}>{cita.motivo || "Sin motivo"}</div>
                        {cita.especialidad && <div className={styles.motivoSub}>{cita.especialidad}</div>}
                      </td>
                      <td>
                        <span className={`${styles.status} ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <button
                            type="button"
                            className={styles.actionButton}
                            disabled={!canConfirm}
                            onClick={async () => {
                              try {
                                const nextEstado = canConfirm ? "confirmada" : "pendiente";
                                await updateCitaPortalEstado(cita.id, nextEstado);
                                setCitas((prev) =>
                                  prev.map((item) =>
                                    item.id === cita.id ? { ...item, estado: nextEstado } : item
                                  )
                                );
                              } catch (updateError) {
                                console.error("Error actualizando estado:", updateError);
                              }
                            }}
                            title={canConfirm ? "Confirmar cita" : "Solo disponible para citas pendientes"}
                          >
                            <FaEye />
                            {canConfirm ? "Confirmar" : "Confirmada"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Citas;
