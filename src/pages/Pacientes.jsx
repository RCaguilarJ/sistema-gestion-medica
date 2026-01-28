import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import styles from "./Pacientes.module.css";
import Button from "../components/ui/Button.jsx";
import Tag from "../components/ui/Tag.jsx";
import { FaSearch, FaPlus, FaEye, FaSpinner, FaSave } from "react-icons/fa";
import Modal from "../components/ui/Modal.jsx";
import DetallePacienteModal from "../components/ui/DetallePacienteModal.jsx";

import {
  getPacientes,
  createPaciente,
  getAllPacientesByDoctor,
} from "../services/pacienteService.js";
import { getCitasPortal, createPacienteFromCita } from "../services/consultaCitaService.js";

// --- LISTA DE MUNICIPIOS DE JALISCO ---
const municipiosJalisco = [
  "Acatic","Acatlán de Juárez","Ahualulco de Mercado","Amacueca","Amatitán","Ameca","Arandas","Atemajac de Brizuela","Atengo","Atenguillo","Atotonilco el Alto","Atoyac","Autlán de Navarro","Ayotlán","Ayutla","Bolaños","Cabo Corrientes","Cañadas de Obregón","Casimiro Castillo","Chapala","Chimaltitán","Chiquilistlán","Cihuatlán","Cocula","Colotlán","Concepción de Buenos Aires","Cuautitlán de García Barragán","Cuautla","Cuquío","Degollado","Ejutla","El Arenal","El Grullo","El Limón","El Salto","Encarnación de Díaz","Etzatlán","Gómez Farías","Guachinango","Guadalajara","Hostotipaquillo","Huejúcar","Huejuquilla el Alto","Ixtlahuacán de los Membrillos","Ixtlahuacán del Río","Jalostotitlán","Jamay","Jesús María","Jilotlán de los Dolores","Jocotepec","Juanacatlán","Juchitlán","La Barca","La Huerta","La Manzanilla de la Paz","Lagos de Moreno","Magdalena","Mascota","Mazamitla","Mexticacán","Mezquitic","Mixtlán","Ocotlán","Ojuelos de Jalisco","Pihuamo","Poncitlán","Puerto Vallarta","Quitupan","San Cristóbal de la Barranca","San Diego de Alejandría","San Gabriel","San Ignacio Cerro Gordo","San Juan de los Lagos","San Juanito de Escobedo","San Julián","San Marcos","San Martín de Bolaños","San Martín Hidalgo","San Miguel el Alto","San Pedro Tlaquepaque","San Sebastián del Oeste","Santa María de los Ángeles","Santa María del Oro","Sayula","Tala","Talpa de Allende","Tamazula de Gordiano","Tapalpa","Tecalitlán","Techaluta de Montenegro","Tecolotlán","Tenamaxtlán","Teocaltiche","Teocuitatlán de Corona","Tepatitlán de Morelos","Tequila","Teuchitlán","Tizapán el Alto","Tlajomulco de Zúñiga","Tolimán","Tomatlán","Tonalá","Tonaya","Tonila","Totatiche","Tototlán","Tuxcacuesco","Tuxcueca","Tuxpan","Unión de San Antonio","Unión de Tula","Valle de Guadalupe","Valle de Juárez","Villa Corona","Villa Guerrero","Villa Hidalgo","Villa Purificación","Yahualica de González Gallo","Zacoalco de Torres","Zapopan","Zapotiltic","Zapotitlán de Vadillo","Zapotlán del Rey","Zapotlán el Grande","Zapotlanejo",
];

// --- Helpers ---
const cleanAndNormalizeData = (data) => {
  const cleanedData = { ...data };

  if (cleanedData.estaturaCm) cleanedData.estaturaCm = parseInt(cleanedData.estaturaCm, 10);
  if (cleanedData.pesoKg) cleanedData.pesoKg = parseFloat(cleanedData.pesoKg);

  if (cleanedData.edad) delete cleanedData.edad;

  Object.keys(cleanedData).forEach((key) => {
    if (cleanedData[key] === "" || cleanedData[key] === null || cleanedData[key] === undefined) {
      delete cleanedData[key];
    }
  });

  return cleanedData;
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "";
  const hoy = new Date();
  const cumpleanos = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const m = hoy.getMonth() - cumpleanos.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) edad--;
  return edad;
};

// --- COMPONENTE FORMULARIO MODAL ---
const FormularioNuevoPaciente = ({ onClose, onSuccess, initialData, citaOrigen }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    fechaNacimiento: "",
    edad: "",
    genero: "",
    curp: "",
    calleNumero: "",
    colonia: "",
    municipio: "Guadalajara",
    codigoPostal: "",
    telefono: "",
    celular: "",
    grupo: "",
    tipoServicio: "Médico",
    tipoTerapia: "Individual",
    responsable: "",
    motivoConsulta: "",
    mesEstadistico: "",
    fechaDiagnostico: "",
    fechaConsulta: new Date().toISOString().slice(0, 10),
    primeraVez: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (formData.fechaNacimiento) {
      setFormData((prev) => ({ ...prev, edad: calcularEdad(prev.fechaNacimiento) }));
    }
  }, [formData.fechaNacimiento]);

  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
    }));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const payload = cleanAndNormalizeData({
        ...formData,
        usuarioId: formData.usuarioId || user?.id,
        medicoId: formData.medicoId || citaOrigen?.medicoId,
      });

      if (citaOrigen?.id) {
        await createPacienteFromCita(citaOrigen.id, payload);
      } else {
        await createPaciente(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Error al guardar el paciente.");
    } finally {
      setIsSaving(false);
    }
  };

  const redStar = <span style={{ color: "red" }}>*</span>;

  return (
    <form onSubmit={handleSubmit} className={styles.modalFormContainer}>
      <p className={styles.requiredNote}>Los campos marcados con {redStar} son obligatorios</p>

      <div>
        <h3 className={styles.sectionHeader}>Datos Personales</h3>
        <p className={styles.sectionSub}>Información básica del paciente</p>

        <div style={{ marginBottom: "1rem" }}>
          <label className={styles.label}>Nombre del Paciente {redStar}</label>
          <input className={styles.inputFull} name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre completo" required />
        </div>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Fecha de Nacimiento {redStar}</label>
            <input type="date" className={styles.inputFull} name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
          </div>
          <div>
            <label className={styles.label}>Edad {redStar}</label>
            <input className={`${styles.inputFull} ${styles.inputReadOnly}`} name="edad" value={formData.edad} readOnly placeholder="Auto" />
          </div>
          <div>
            <label className={styles.label}>Género {redStar}</label>
            <select className={styles.inputFull} name="genero" value={formData.genero} onChange={handleChange} required>
              <option value="">No especifica</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>CURP {redStar}</label>
            <input className={styles.inputFull} name="curp" value={formData.curp} onChange={handleChange} placeholder="18 caracteres" maxLength={18} required />
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div>
        <h3 className={styles.sectionHeader}>Contacto y Domicilio</h3>
        <p className={styles.sectionSub}>Información de contacto y ubicación</p>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Domicilio (Calle y Número) {redStar}</label>
            <input className={styles.inputFull} name="calleNumero" value={formData.calleNumero} onChange={handleChange} placeholder="Calle y número" required />
          </div>
          <div>
            <label className={styles.label}>Colonia {redStar}</label>
            <input className={styles.inputFull} name="colonia" value={formData.colonia} onChange={handleChange} placeholder="Nombre de la colonia" required />
          </div>
          <div>
            <label className={styles.label}>Municipio {redStar}</label>
            <select className={styles.inputFull} name="municipio" value={formData.municipio} onChange={handleChange} required>
              {municipiosJalisco.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Código Postal {redStar}</label>
            <input className={styles.inputFull} name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} placeholder="5 dígitos" required />
          </div>
          <div>
            <label className={styles.label}>Teléfono (Opcional)</label>
            <input className={styles.inputFull} name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono fijo" />
          </div>
          <div>
            <label className={styles.label}>Celular {redStar}</label>
            <input className={styles.inputFull} name="celular" value={formData.celular} onChange={handleChange} placeholder="10 dígitos" required />
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div>
        <h3 className={styles.sectionHeader}>Programa y Servicio</h3>
        <p className={styles.sectionSub}>Información del programa de atención</p>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Grupo al que Pertenece {redStar}</label>
            <input className={styles.inputFull} name="grupo" value={formData.grupo} onChange={handleChange} placeholder="Ej: Grupo Matutino A" required />
          </div>
          <div>
            <label className={styles.label}>Tipo de Servicio {redStar}</label>
            <select className={styles.inputFull} name="tipoServicio" value={formData.tipoServicio} onChange={handleChange} required>
              <option value="Médico">Médico</option>
              <option value="Nutricional">Nutricional</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Tipo de Terapia {redStar}</label>
            <select className={styles.inputFull} name="tipoTerapia" value={formData.tipoTerapia} onChange={handleChange} required>
              <option value="Individual">Individual</option>
              <option value="Grupal">Grupal</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Responsable {redStar}</label>
            <input className={styles.inputFull} name="responsable" value={formData.responsable} onChange={handleChange} placeholder="Nombre del tutor o contacto" required />
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label className={styles.label}>Motivo de Consulta {redStar}</label>
          <textarea
            className={styles.inputFull}
            name="motivoConsulta"
            value={formData.motivoConsulta}
            onChange={handleChange}
            placeholder="Describe el motivo de la consulta..."
            rows="3"
            maxLength={500}
            required
            style={{ resize: "none", fontFamily: "inherit" }}
          />
          <div className={styles.charCount}>{formData.motivoConsulta.length}/500 caracteres</div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div style={{ marginBottom: "2rem" }}>
        <h3 className={styles.sectionHeader}>Fechas Clínicas</h3>
        <p className={styles.sectionSub}>Información sobre diagnóstico y consulta</p>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Mes Estadístico {redStar}</label>
            <select className={styles.inputFull} name="mesEstadistico" value={formData.mesEstadistico} onChange={handleChange} required>
              <option value="">Seleccionar</option>
              {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>Fecha de Diagnóstico {redStar}</label>
            <input type="date" className={styles.inputFull} name="fechaDiagnostico" value={formData.fechaDiagnostico} onChange={handleChange} required />
          </div>
          <div>
            <label className={styles.label}>Fecha de Consulta {redStar}</label>
            <input type="date" className={styles.inputFull} name="fechaConsulta" value={formData.fechaConsulta} onChange={handleChange} required />
          </div>

          <div className={styles.checkboxContainer}>
            <label className={styles.checkboxLabel}>
              Primera Vez {redStar}
              <div className={`${styles.toggleSwitch} ${formData.primeraVez ? styles.toggleActive : ""}`}>
                <input type="checkbox" name="primeraVez" checked={formData.primeraVez} onChange={handleChange} />
                <span className={styles.toggleKnob}></span>
              </div>
              <span>{formData.primeraVez ? "Sí - Primera consulta" : "No - Seguimiento"}</span>
            </label>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.modalActions}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving} style={{ backgroundColor: "#003366", color: "white" }}>
          {isSaving ? <FaSpinner className="fa-spin" /> : <FaSave />} Guardar Paciente
        </Button>
      </div>
    </form>
  );
};

// --- PÁGINA PRINCIPAL ---
function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [citasPortal, setCitasPortal] = useState([]);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = (currentUser?.role || "").toUpperCase() === "ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");
  const [filterRiesgo, setFilterRiesgo] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  const cargarPacientesYCitas = async () => {
    setIsLoading(true);
    try {
      let data = [];
      let citasData = [];

      if (currentUser?.id && !isAdmin) {
        data = await getAllPacientesByDoctor(currentUser.id);
        citasData = await getCitasPortal(currentUser.id);
      } else {
        data = await getPacientes();
        citasData = await getCitasPortal();
      }

      setPacientes(Array.isArray(data) ? data : []);
      setCitasPortal(Array.isArray(citasData) ? citasData : []);
    } catch (err) {
      console.error("Error cargando pacientes o citas:", err);
      setPacientes([]);
      setCitasPortal([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarPacientesYCitas();
  }, [currentUser?.id, isAdmin]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const pacientesArray = Array.isArray(pacientes) ? pacientes : [];
    return pacientesArray.filter((p) => {
      const matchesSearch =
        (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.curp || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstatus = filterEstatus ? p.estatus === filterEstatus : true;
      const matchesRiesgo = filterRiesgo ? p.riesgo === filterRiesgo : true;
      const matchesMunicipio = filterMunicipio ? p.municipio === filterMunicipio : true;

      return matchesSearch && matchesEstatus && matchesRiesgo && matchesMunicipio;
    });
  }, [pacientes, searchTerm, filterEstatus, filterRiesgo, filterMunicipio]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstatus, filterRiesgo, filterMunicipio]);

  const totalPages = Math.max(1, Math.ceil(pacientesFiltrados.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pacientesPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pacientesFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [pacientesFiltrados, currentPage, itemsPerPage]);

  const getEspecialistasAsignados = (paciente) => {
    if (!paciente) return "-";
    const etiquetas = [];
    if (paciente.medico) etiquetas.push(`Medico: ${paciente.medico.nombre}`);
    if (paciente.nutriologo) etiquetas.push(`Nutriologo: ${paciente.nutriologo.nombre}`);
    if (paciente.psicologo) etiquetas.push(`Psicologo: ${paciente.psicologo.nombre}`);
    if (paciente.endocrinologo) etiquetas.push(`Endocrinologo: ${paciente.endocrinologo.nombre}`);
    if (paciente.podologo) etiquetas.push(`Podologo: ${paciente.podologo.nombre}`);
    if (
      etiquetas.length === 0 &&
      (paciente.medicoId ||
        paciente.nutriologoId ||
        paciente.psicologoId ||
        paciente.endocrinologoId ||
        paciente.podologoId)
    ) {
      return "Asignado";
    }
    return etiquetas.length > 0 ? etiquetas.join(" / ") : "-";
  };

  const citasFiltradas = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return citasPortal.filter((cita) => {
      const nombre = (cita.pacienteNombre || "").toLowerCase();
      const email = (cita.pacienteEmail || "").toLowerCase();
      const telefono = (cita.pacienteTelefono || "").toLowerCase();
      return nombre.includes(term) || email.includes(term) || telefono.includes(term);
    });
  }, [citasPortal, searchTerm]);

  const handleVerDetalle = (pacienteId) => {
    if (isMobileView) {
      setSelectedPacienteId(pacienteId);
      setMobileDetailOpen(true);
    } else {
      navigate(`/app/pacientes/${pacienteId}`);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Pacientes</h1>
          <p className={styles.subtitle}>Total: {pacientesFiltrados.length} pacientes</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: "#003366", color: "#fff", padding: "0.75rem 1.5rem" }}
        >
          <FaPlus /> Nuevo Paciente
        </Button>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>Filtros de Búsqueda</h3>
          <p className={styles.filtersSubtitle}>Filtra y busca pacientes por diferentes criterios</p>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.searchInputWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre o CURP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className={styles.filterSelect} value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
            <option value="">Todos los estatus</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <select className={styles.filterSelect} value={filterRiesgo} onChange={(e) => setFilterRiesgo(e.target.value)}>
            <option value="">Todos los riesgos</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>

          <select className={styles.filterSelect} value={filterMunicipio} onChange={(e) => setFilterMunicipio(e.target.value)}>
            <option value="">Todos los municipios</option>
            {municipiosJalisco.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {citasFiltradas.length > 0 && (
        <div className={styles.tableContainer} style={{ marginBottom: "2rem" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cita encontrada</th>
                <th>Contacto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map((cita) => (
                <tr key={`cita-${cita.id}`}>
                  <td>
                    <div className={styles.cellNameMain}>{cita.pacienteNombre || "Sin nombre"}</div>
                    <div className={styles.cellNameSub}>{cita.especialidad || "Sin especialidad"}</div>
                  </td>
                  <td className={styles.cellNameSub}>
                    <div>{cita.pacienteEmail || "-"}</div>
                    <div>{cita.pacienteTelefono || "-"}</div>
                  </td>
                  <td style={{ fontSize: "0.9rem", color: "#555" }}>
                    {cita.fechaHora ? new Date(cita.fechaHora).toLocaleString("es-MX") : "-"}
                  </td>
                  <td><Tag label={(cita.estado || "pendiente").toString()} /></td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className={styles.actionButton}
                      onClick={() => {
                        setSelectedCita(cita);
                        setIsModalOpen(true);
                      }}
                    >
                      <FaPlus /> Nuevo Paciente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingState}>
          <FaSpinner className="fa-spin" /> Cargando...
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>CURP</th>
                <th>Estatus</th>
                {isAdmin && <th>Especialista</th>}
                <th>Ultima Visita</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesPaginados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.cellNameMain}>{p.nombre}</div>
                    <div className={styles.cellNameSub}>
                      {p.edad ? `${p.edad} años` : ""} • {p.genero || "-"}
                    </div>
                  </td>
                  <td className={styles.cellCurp}>{p.curp}</td>
                  <td><Tag label={p.estatus || "Activo"} /></td>
                  {isAdmin && (
                    <td style={{ fontSize: "0.9rem", color: "#555" }}>
                      {getEspecialistasAsignados(p)}
                    </td>
                  )}
                  <td style={{ fontSize: "0.9rem", color: "#555" }}>
                    {p.ultimaVisita ? new Date(p.ultimaVisita).toLocaleDateString("es-MX") : "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className={styles.actionButton} onClick={() => handleVerDetalle(p.id)}>
                      <FaEye /> Ver
                    </button>
                  </td>
                </tr>
              ))}

              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? "6" : "5"} className={styles.emptyTable}>No se encontraron resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && pacientesFiltrados.length > itemsPerPage && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando {pacientesFiltrados.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            {" - "}
            {Math.min(currentPage * itemsPerPage, pacientesFiltrados.length)} de {pacientesFiltrados.length}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={`${styles.paginationButton} ${currentPage === 1 ? styles.paginationButtonDisabled : ""}`}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  className={`${styles.paginationButton} ${currentPage === pageNumber ? styles.paginationButtonActive : ""}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              className={`${styles.paginationButton} ${currentPage === totalPages ? styles.paginationButtonDisabled : ""}`}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <Modal title="Nuevo Paciente" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FormularioNuevoPaciente
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedCita(null);
            cargarPacientesYCitas();
          }}
          citaOrigen={selectedCita}
          initialData={
            selectedCita
              ? {
                  nombre: selectedCita.pacienteNombre || "",
                  email: selectedCita.pacienteEmail || "",
                  telefono: selectedCita.pacienteTelefono || "",
                  celular: selectedCita.pacienteTelefono || "",
                  motivoConsulta: selectedCita.motivo || "",
                  medicoId: selectedCita.medicoId || null,
                }
              : null
          }
        />
      </Modal>

      <DetallePacienteModal
        pacienteId={selectedPacienteId}
        isOpen={mobileDetailOpen}
        onClose={() => setMobileDetailOpen(false)}
      />
    </div>
  );
}

export default Pacientes;



