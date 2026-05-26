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
import { useNavigate, useSearchParams } from "react-router-dom";
import CalendarCard from "../components/calendar/CalendarCard.jsx";
import { getPacientes } from "../services/pacienteService.js";
import { canViewGlobalData, isAdminRole, isFinanceRole, isReadOnlyRole } from "../utils/roles.js";

const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"];

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX");
};

const formatDateLabel = (year, month, day) =>
  new Date(year, month, day).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const normalizeStatus = (value) => {
  if (!value) return "Pendiente";
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "pendiente") return "Pendiente";
  if (normalized === "confirmada") return "Confirmada";
  if (normalized === "cancelada") return "Cancelada";
  return value.toString();
};

const normalizeText = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizePaymentStatus = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "Sin registro";
  if (["pagado", "pagada", "si", "true", "1"].includes(normalized)) return "Pagado";
  if (normalized === "parcial") return "Parcial";
  if (normalized === "exento") return "Exento";
  if (["pendiente", "no pagado", "no pagada", "no", "false", "0"].includes(normalized)) return "Pendiente";
  if (normalized === "atrasado") return "Atrasado";
  if (normalized === "vencido") return "Vencido";
  if (normalized === "moroso") return "Moroso";
  if (["suspendido", "suspendida"].includes(normalized)) return "Suspendido";
  if (["baja", "inactivo"].includes(normalized)) return "Baja";
  return value.toString().trim();
};

const getPaymentStatusClassSuffix = (status) => {
  const normalized = normalizePaymentStatus(status);
  return normalized.replace(/\s+/g, "");
};

const normalizeLookupKey = (value) => normalizeText(value);

const formatMembership = (value) => {
  if (!value) return "Sin membresia";
  return value.toString().trim();
};

const getPacienteUltimaVisita = (paciente) => paciente?.ultimaVisita ?? paciente?.fechaConsulta ?? "";
const getPacienteEstadoPago = (paciente) =>
  paciente?.estadoPago
  ?? paciente?.estado_pago
  ?? paciente?.estadoFinanciero
  ?? paciente?.estado_financiero
  ?? "";
const getPacienteMembresia = (paciente) =>
  paciente?.perfilFinanciero?.membresia
  ?? paciente?.tipoMembresia
  ?? paciente?.tipo_membresia
  ?? "";
const hasFinancialTracking = (paciente) =>
  Boolean(getPacienteMembresia(paciente) || getPacienteEstadoPago(paciente));

const ROLE_LABELS = {
  DOCTOR: "Doctor",
  NUTRI: "Nutriologo",
  PSICOLOGO: "Psicologo",
  ENDOCRINOLOGO: "Endocrinologo",
  PODOLOGO: "Podologo",
  OTRO: "Otros",
};

const getFinanceStatusGroup = (status) => {
  const normalized = normalizePaymentStatus(status);
  if (["Vencido", "Moroso", "Atrasado", "Suspendido", "Baja"].includes(normalized)) {
    return "danger";
  }
  if (["Pendiente", "Parcial", "Sin registro"].includes(normalized)) {
    return "warning";
  }
  if (["Pagado", "Exento"].includes(normalized)) {
    return "success";
  }
  return "warning";
};

const getFinanceStatusPriority = (status) => {
  const group = getFinanceStatusGroup(status);
  if (group === "danger") return 3;
  if (group === "warning") return 2;
  if (group === "success") return 1;
  return 0;
};

const parseValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameMonth = (date, year, month) =>
  date && date.getFullYear() === year && date.getMonth() === month;

const isSameDay = (date, year, month, day) =>
  isSameMonth(date, year, month) && date.getDate() === day;

function Citas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [citas, setCitas] = useState([]);
  const [financePatients, setFinancePatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const focusCitaId = searchParams.get("citaId");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const medicoId = useMemo(() => {
    if (!user?.id) return null;
    return canViewGlobalData(user?.role) ? null : user.id;
  }, [user]);

  const isAdmin = useMemo(() => isAdminRole(user?.role), [user]);
  const canManage = useMemo(() => !isReadOnlyRole(user?.role), [user]);
  const isFinanceView = useMemo(() => isFinanceRole(user?.role), [user]);
  const useAdminPatientStatus = useMemo(
    () => isAdmin && !isFinanceView,
    [isAdmin, isFinanceView]
  );

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (isFinanceView) {
          const pacientes = await getPacientes();
          if (!active) return;
          setFinancePatients((Array.isArray(pacientes) ? pacientes : []).filter(hasFinancialTracking));
          setCitas([]);
          return;
        }

        const requests = [
          getCitasPortal(medicoId),
          getCitasAmd(medicoId),
        ];

        if (useAdminPatientStatus) {
          requests.push(getPacientes());
        }

        const [portalData, appData, pacientesData] = await Promise.all(requests);

        if (!active) return;

        const portalList = Array.isArray(portalData) ? portalData : [];
        const appList = Array.isArray(appData) ? appData : [];

        setCitas([
          ...portalList.map((cita) => ({ ...cita, source: "portal" })),
          ...appList.map((cita) => ({ ...cita, source: "app" })),
        ]);
        setFinancePatients(
          useAdminPatientStatus
            ? (Array.isArray(pacientesData) ? pacientesData : []).filter(hasFinancialTracking)
            : []
        );
      } catch (fetchError) {
        console.error("Error cargando datos de citas/finanzas:", fetchError);
        if (active) {
          setError(isFinanceView ? "No fue posible cargar los pacientes financieros." : "No fue posible cargar las citas.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [isFinanceView, medicoId, useAdminPatientStatus]);

  useEffect(() => {
    if (!focusCitaId || loading || isFinanceView) return;
    const row =
      document.getElementById(`cita-row-portal-${focusCitaId}`) ||
      document.getElementById(`cita-row-app-${focusCitaId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusCitaId, loading, citas, isFinanceView]);

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

  const visibleCitas = useMemo(() => citas, [citas]);

  const patientFinancialLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    const byEmail = new Map();

    financePatients.forEach((paciente) => {
      if (paciente?.id !== undefined && paciente?.id !== null) {
        byId.set(String(paciente.id), paciente);
      }

      const normalizedName = normalizeLookupKey(paciente?.nombre);
      if (normalizedName) {
        byName.set(normalizedName, paciente);
      }

      const normalizedEmail = normalizeLookupKey(paciente?.email);
      if (normalizedEmail) {
        byEmail.set(normalizedEmail, paciente);
      }
    });

    return { byId, byName, byEmail };
  }, [financePatients]);

  const getAdministrativePatientForCita = (cita) => {
    const candidateIds = [cita?.pacienteId, cita?.usuarioId, cita?.paciente?.id];
    for (const candidateId of candidateIds) {
      if (candidateId !== undefined && candidateId !== null) {
        const patient = patientFinancialLookup.byId.get(String(candidateId));
        if (patient) return patient;
      }
    }

    const emailKey = normalizeLookupKey(cita?.pacienteEmail);
    if (emailKey && patientFinancialLookup.byEmail.has(emailKey)) {
      return patientFinancialLookup.byEmail.get(emailKey);
    }

    const nameKey = normalizeLookupKey(cita?.pacienteNombre);
    if (nameKey && patientFinancialLookup.byName.has(nameKey)) {
      return patientFinancialLookup.byName.get(nameKey);
    }

    return null;
  };

  const financeRows = useMemo(() => {
    if (!isFinanceView) return [];

    return [...financePatients]
      .map((paciente) => {
        const paymentStatus = normalizePaymentStatus(getPacienteEstadoPago(paciente));
        const lastVisit = getPacienteUltimaVisita(paciente);
        const visitDate = parseValidDate(lastVisit);

        return {
          ...paciente,
          membership: formatMembership(getPacienteMembresia(paciente)),
          paymentStatus,
          paymentGroup: getFinanceStatusGroup(paymentStatus),
          lastVisit,
          visitDate,
        };
      })
      .sort((left, right) => {
        const leftTime = left.visitDate?.getTime() || 0;
        const rightTime = right.visitDate?.getTime() || 0;
        return rightTime - leftTime;
      });
  }, [financePatients, isFinanceView]);

  const financeRowsInMonth = useMemo(
    () => financeRows.filter((row) => isSameMonth(row.visitDate, currentYear, currentMonth)),
    [financeRows, currentYear, currentMonth]
  );

  const financeRowsFiltered = useMemo(() => {
    if (!selectedDay) return financeRowsInMonth;
    return financeRowsInMonth.filter((row) => isSameDay(row.visitDate, currentYear, currentMonth, selectedDay));
  }, [financeRowsInMonth, selectedDay, currentYear, currentMonth]);

  const citasByDay = useMemo(() => {
    const map = new Map();
    visibleCitas.forEach((cita) => {
      const date = parseValidDate(cita.fechaHora);
      if (!isSameMonth(date, currentYear, currentMonth)) return;

      const day = date.getDate();
      const roleKey = normalizeRoleKey(cita.medicoRole || cita.role || cita.especialidad);
      const entry = map.get(day) || { count: 0, roles: new Map() };
      entry.count += 1;
      entry.roles.set(roleKey, (entry.roles.get(roleKey) || 0) + 1);
      map.set(day, entry);
    });
    return map;
  }, [visibleCitas, currentYear, currentMonth]);

  const financeByDay = useMemo(() => {
    const map = new Map();

    financeRowsInMonth.forEach((row) => {
      if (!row.visitDate) return;

      const day = row.visitDate.getDate();
      const entry = map.get(day) || {
        count: 0,
        worstPriority: 0,
        statusLabel: "Sin registro",
        variant: "warning",
        names: [],
      };

      entry.count += 1;
      entry.names.push(row.nombre || `Paciente #${row.id}`);

      const priority = getFinanceStatusPriority(row.paymentStatus);
      if (priority >= entry.worstPriority) {
        entry.worstPriority = priority;
        entry.statusLabel = row.paymentStatus;
        entry.variant = row.paymentGroup;
      }

      map.set(day, entry);
    });

    return map;
  }, [financeRowsInMonth]);

  const citasFiltradas = useMemo(() => {
    if (!selectedDay) return visibleCitas;
    return visibleCitas.filter((cita) => {
      const date = parseValidDate(cita.fechaHora);
      return isSameDay(date, currentYear, currentMonth, selectedDay);
    });
  }, [visibleCitas, selectedDay, currentYear, currentMonth]);

  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7;

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

  const financeLegend = useMemo(
    () => [
      { label: "Pago realizado", color: "#22c55e" },
      { label: "Pago pendiente", color: "#f59e0b" },
      { label: "Pago vencido", color: "#ef4444" },
    ],
    []
  );

  const roleLabels = useMemo(() => ROLE_LABELS, []);

  const chips = useMemo(() => {
    if (isFinanceView) {
      const totals = new Map();
      financeRowsInMonth.forEach((row) => {
        totals.set(row.paymentStatus, (totals.get(row.paymentStatus) || 0) + 1);
      });

      const orderedStatuses = ["Pagado", "Pendiente", "Parcial", "Atrasado", "Vencido", "Moroso", "Baja"];

      return [
        `Pacientes del mes: ${financeRowsInMonth.length}`,
        ...orderedStatuses
          .filter((status) => totals.has(status))
          .map((status) => `${status}: ${totals.get(status)}`),
      ];
    }

    const totals = new Map();
    visibleCitas.forEach((cita) => {
      const date = parseValidDate(cita.fechaHora);
      if (!isSameMonth(date, currentYear, currentMonth)) return;
      const roleKey = normalizeRoleKey(cita.medicoRole || cita.role || cita.especialidad);
      totals.set(roleKey, (totals.get(roleKey) || 0) + 1);
    });

    return Array.from(totals.entries()).map(
      ([roleKey, count]) => `${roleLabels[roleKey] || "Otros"}: ${count}`
    );
  }, [visibleCitas, currentYear, currentMonth, roleLabels, isFinanceView, financeRowsInMonth]);

  const weeksData = useMemo(
    () =>
      calendarWeeks.map((week) =>
        week.map((day) => {
          if (!day) return { inMonth: false };

          const entry = isFinanceView ? financeByDay.get(day) : citasByDay.get(day);
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

          if (isFinanceView) {
            const patientNames = entry?.names?.slice(0, 4).join(", ");
            return {
              inMonth: true,
              label: day,
              state,
              count: entry?.count || 0,
              variant: entry?.variant || "",
              ariaLabel: entry
                ? `Dia ${day}, ${entry.count} pacientes, estado ${entry.statusLabel}. ${patientNames}`
                : `Dia ${day}`,
            };
          }

          return {
            inMonth: true,
            label: day,
            state,
            count: entry?.count || 0,
            ariaLabel: entry ? `Dia ${day}, ${entry.count} citas` : `Dia ${day}`,
          };
        })
      ),
    [calendarWeeks, citasByDay, financeByDay, selectedDay, currentYear, currentMonth, today, isFinanceView]
  );

  const financeTableTitle = selectedDay
    ? `Pacientes del ${formatDateLabel(currentYear, currentMonth, selectedDay)}`
    : `Pacientes del mes de ${monthLabel}`;

  const financeTableCount = selectedDay
    ? `${financeRowsFiltered.length} pacientes ese dia`
    : `${financeRowsFiltered.length} pacientes con membresia o pago este mes`;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isFinanceView ? "Calendario administrativo de mensualidades" : "Calendario de Sesiones"}
        </h1>
        <p className={styles.subtitle}>
          {isFinanceView
            ? "Gestiona tus consultas administrativas de los pacientes"
            : useAdminPatientStatus
              ? "Gestiona tus consultas administrativas de los pacientes"
              : "Gestiona tus consultas psicologicas programadas"}
        </p>
      </header>

      <CalendarCard
        monthLabel={monthLabel}
        weekdayLabels={weekdayLabels}
        weeks={weeksData}
        legend={isFinanceView ? financeLegend : []}
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
          <h2>{isFinanceView ? financeTableTitle : "Citas registradas"}</h2>
          <span>{isFinanceView ? financeTableCount : `${citasFiltradas.length} en total`}</span>
        </div>

        {loading && (
          <div className={styles.stateMessage}>
            {isFinanceView ? "Cargando pacientes..." : "Cargando citas..."}
          </div>
        )}
        {!loading && error && <div className={styles.stateMessage}>{error}</div>}
        {!loading && !error && isFinanceView && financeRowsFiltered.length === 0 && (
          <div className={styles.stateMessage}>
            {selectedDay
              ? "No hay pacientes con seguimiento financiero para ese dia."
              : "Aun no hay pacientes con mensualidad o estado financiero registrado en este mes."}
          </div>
        )}
        {!loading && !error && !isFinanceView && citasFiltradas.length === 0 && (
          <div className={styles.stateMessage}>Aun no hay citas registradas.</div>
        )}

        {!loading && !error && isFinanceView && financeRowsFiltered.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha de consulta</th>
                  <th>Paciente</th>
                  <th>Membresia</th>
                  <th>Estado financiero</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {financeRowsFiltered.map((row) => {
                  const paymentClassSuffix = getPaymentStatusClassSuffix(row.paymentStatus);
                  const paymentClass = styles[`status${paymentClassSuffix}`] || "";
                  const patientNameClass = styles[`financeName${paymentClassSuffix}`] || "";
                  return (
                    <tr key={`finance-patient-${row.id}`}>
                      <td>{formatDateTime(row.lastVisit)}</td>
                      <td>
                        <span className={`${styles.financePatientName} ${patientNameClass}`}>
                          {row.nombre || `Paciente #${row.id}`}
                        </span>
                      </td>
                      <td>{row.membership}</td>
                      <td>
                        <span className={`${styles.status} ${paymentClass}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td>{row.estatus || "Activo"}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => navigate(`/app/pacientes/${row.id}`)}
                        >
                          <FaEye />
                          Ver paciente
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && !isFinanceView && citasFiltradas.length > 0 && (
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
                  const administrativePatient = useAdminPatientStatus ? getAdministrativePatientForCita(cita) : null;
                  const administrativeStatus = administrativePatient
                    ? normalizePaymentStatus(getPacienteEstadoPago(administrativePatient))
                    : "";
                  const administrativeStatusSuffix = administrativeStatus
                    ? getPaymentStatusClassSuffix(administrativeStatus)
                    : "";
                  const patientNameClass = administrativeStatusSuffix
                    ? styles[`financeName${administrativeStatusSuffix}`] || ""
                    : "";
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
                      <td>
                        {patientNameClass ? (
                          <span className={`${styles.financePatientName} ${patientNameClass}`}>
                            {cita.pacienteNombre || cita.pacienteEmail || `Paciente #${cita.usuarioId ?? "N/A"}`}
                          </span>
                        ) : (
                          cita.pacienteNombre || cita.pacienteEmail || `Paciente #${cita.usuarioId ?? "N/A"}`
                        )}
                      </td>
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
