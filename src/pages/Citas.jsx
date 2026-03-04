import React, { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import styles from "./Citas.module.css";
import {
  getCitasAmd,
  getCitasPortal,
  updateCitaEstado,
  updateCitaPortalEstado,
} from "../services/consultaCitaService.js";
import { useAuth } from "../hooks/AuthContext.jsx";
import { useSearchParams } from "react-router-dom";
import CalendarCard from "../components/calendar/CalendarCard.jsx";

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX");
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
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const isAdmin = useMemo(() => {
    const role = (user?.role || "").toUpperCase();
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }, [user]);

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
        const [portalData, appData] = await Promise.all([
          getCitasPortal(medicoId),
          getCitasAmd(medicoId),
        ]);
        const portalList = Array.isArray(portalData) ? portalData : [];
        const appList = Array.isArray(appData) ? appData : [];

        const normalized = [
          ...portalList.map((cita) => ({ ...cita, source: "portal" })),
          ...appList.map((cita) => ({ ...cita, source: "app" })),
        ];

        if (active) setCitas(normalized);
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
    const row =
      document.getElementById(`cita-row-portal-${focusCitaId}`) ||
      document.getElementById(`cita-row-app-${focusCitaId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusCitaId, loading, citas]);

  const today = useMemo(() => new Date(), []);
  const currentDate = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [today, monthOffset]);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthLabel = useMemo(
    () => new Date(currentYear, currentMonth, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
    [currentYear, currentMonth]
  );

  const handlePrevMonth = () => setMonthOffset((prev) => prev - 1);
  const handleNextMonth = () => setMonthOffset((prev) => prev + 1);
  const handleCurrentMonth = () => {
    setMonthOffset(0);
    setSelectedDay(null);
  };

  useEffect(() => {
    setSelectedDay(null);
  }, [currentYear, currentMonth]);

  const normalizeRoleKey = (raw) => {
    const normalized = (raw || "")
      .toString()
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("PSICOLOGO") || normalized.includes("PSY")) return "PSICOLOGO";
    if (normalized.includes("NUTRI")) return "NUTRI";
    if (normalized.includes("ENDOCRINOLOGO")) return "ENDOCRINOLOGO";
    if (normalized.includes("PODOLOGO")) return "PODOLOGO";
    if (normalized.includes("DOCTOR") || normalized.includes("MEDICO")) return "DOCTOR";
    return "OTRO";
  };

  const roleColors = {
    DOCTOR: "#2563eb",
    NUTRI: "#10b981",
    PSICOLOGO: "#f59e0b",
    ENDOCRINOLOGO: "#8b5cf6",
    PODOLOGO: "#ef4444",
    OTRO: "#64748b",
  };

  const roleLabels = {
    DOCTOR: "Doctor",
    NUTRI: "Nutriólogo",
    PSICOLOGO: "Psicólogo",
    ENDOCRINOLOGO: "Endocrinólogo",
    PODOLOGO: "Podólogo",
    OTRO: "Otros",
  };

  const citasByDay = useMemo(() => {
    const map = new Map();
    citas.forEach((cita) => {
      const date = new Date(cita.fechaHora);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth) return;

      const day = date.getDate();
      const roleKey = normalizeRoleKey(cita.medicoRole || cita.role || cita.especialidad);
      const entry = map.get(day) || { count: 0, roles: new Map() };
      entry.count += 1;
      entry.roles.set(roleKey, (entry.roles.get(roleKey) || 0) + 1);
      map.set(day, entry);
    });
    return map;
  }, [citas, currentYear, currentMonth]);

  const citasFiltradas = useMemo(() => {
    if (!selectedDay) return citas;
    const start = new Date(currentYear, currentMonth, selectedDay, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth, selectedDay, 23, 59, 59, 999);
    return citas.filter((cita) => {
      const date = new Date(cita.fechaHora);
      if (Number.isNaN(date.getTime())) return false;
      return date >= start && date <= end;
    });
  }, [citas, selectedDay, currentYear, currentMonth]);

  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0

    const slots = [];
    for (let i = 0; i < startWeekday; i += 1) slots.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) slots.push(day);
    while (slots.length % 7 !== 0) slots.push(null);

    const weeks = [];
    for (let i = 0; i < slots.length; i += 7) {
      weeks.push(slots.slice(i, i + 7));
    }
    return weeks;
  }, [currentYear, currentMonth]);

  const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"];

  const legendItems = useMemo(
    () =>
      Object.keys(roleColors).map((roleKey) => ({
        label: roleLabels[roleKey] || roleKey,
        color: roleColors[roleKey],
      })),
    []
  );

  const chips = useMemo(() => {
    const totals = new Map();
    citas.forEach((cita) => {
      const date = new Date(cita.fechaHora);
      if (Number.isNaN(date.getTime())) return;
      if (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth) return;
      const roleKey = normalizeRoleKey(cita.medicoRole || cita.role || cita.especialidad);
      totals.set(roleKey, (totals.get(roleKey) || 0) + 1);
    });
    return Array.from(totals.entries()).map(
      ([roleKey, count]) => `${roleLabels[roleKey] || "Otros"}: ${count}`
    );
  }, [citas, currentYear, currentMonth]);

  const weeksData = useMemo(
    () =>
      calendarWeeks.map((week) =>
        week.map((day) => {
          if (!day) return { inMonth: false };
          const entry = citasByDay.get(day);
          const date = new Date(currentYear, currentMonth, day);
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const state =
            selectedDay === day
              ? "selected"
              : entry
                ? "active"
                : isToday
                  ? "today"
                  : "default";

          return {
            inMonth: true,
            label: day,
            state,
            count: entry?.count || 0,
          };
        })
      ),
    [calendarWeeks, citasByDay, selectedDay, currentYear, currentMonth, today]
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendario de Sesiones</h1>
        <p className={styles.subtitle}>Gestiona tus consultas psicológicas programadas</p>
      </header>

      <CalendarCard
        monthLabel={monthLabel}
        weekdayLabels={weekdayLabels}
        weeks={weeksData}
        legend={[]}
        chips={chips}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        onToday={handleCurrentMonth}
        onSelectDay={(day) => {
          setSelectedDay(day);
          const table = document.getElementById("citas-registradas");
          if (table) table.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div className={styles.tableCard} id="citas-registradas">
        <div className={styles.tableHeader}>
          <h2>Citas registradas</h2>
          <span>{citasFiltradas.length} en total</span>
        </div>

        {loading && <div className={styles.stateMessage}>Cargando citas...</div>}
        {!loading && error && <div className={styles.stateMessage}>{error}</div>}
        {!loading && !error && citasFiltradas.length === 0 && (
          <div className={styles.stateMessage}>Aún no hay citas registradas.</div>
        )}

        {!loading && !error && citasFiltradas.length > 0 && (
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
                {citasFiltradas.map((cita) => {
                  const statusLabel = normalizeStatus(cita.estado);
                  const displayStatus = statusLabel === "Pendiente" ? "" : statusLabel;
                  const statusClass = styles[`status${statusLabel}`] || "";
                  const canConfirm = canManage && statusLabel === "Pendiente";
                  const isFocused = focusCitaId && String(cita.id) === focusCitaId;
                  const rowKey = `${cita.source || "app"}-${cita.id ?? `${cita.pacienteId}-${cita.fechaHora}`}`;

                  return (
                    <tr
                      key={rowKey}
                      id={cita.id ? `cita-row-${cita.source || "app"}-${cita.id}` : undefined}
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
                        {displayStatus ? (
                          <span className={`${styles.status} ${statusClass}`}>
                            {displayStatus}
                          </span>
                        ) : null}
                      </td>
                      {canManage && (
                        <td>
                          <button
                            type="button"
                            className={styles.actionButton}
                            disabled={!canConfirm}
                            onClick={async () => {
                              try {
                                const nextEstadoPortal = canConfirm ? "confirmada" : "pendiente";
                                const nextEstadoApp = canConfirm ? "Confirmada" : "Pendiente";
                                if (cita.source === "portal") {
                                  await updateCitaPortalEstado(cita.id, nextEstadoPortal);
                                } else {
                                  await updateCitaEstado(cita.id, nextEstadoApp);
                                }
                                setCitas((prev) =>
                                  prev.map((item) =>
                                    item.id === cita.id && item.source === cita.source
                                      ? { ...item, estado: cita.source === "portal" ? nextEstadoPortal : nextEstadoApp }
                                      : item
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

