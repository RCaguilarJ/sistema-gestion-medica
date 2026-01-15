import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import styles from './Pacientes.module.css';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import { FaSearch, FaPlus, FaEye, FaSpinner, FaSave } from 'react-icons/fa';
import Modal from '../components/ui/Modal.jsx';
import DetallePacienteModal from '../components/ui/DetallePacienteModal.jsx';
import { getPacientes, createPaciente, getAllPacientesByDoctor } from '../services/pacienteService.js';

// --- LISTA DE MUNICIPIOS DE JALISCO ---
const municipiosJalisco = [
  "Acatic", "Acatlán de Juárez", "Ahualulco de Mercado", "Amacueca", "Amatitán", "Ameca", "Arandas", "Atemajac de Brizuela", "Atengo", "Atenguillo", "Atotonilco el Alto", "Atoyac", "Autlán de Navarro", "Ayotlán", "Ayutla", "Bolaños", "Cabo Corrientes", "Cañadas de Obregón", "Casimiro Castillo", "Chapala", "Chimaltitán", "Chiquilistlán", "Cihuatlán", "Cocula", "Colotlán", "Concepción de Buenos Aires", "Cuautitlán de García Barragán", "Cuautla", "Cuquío", "Degollado", "Ejutla", "El Arenal", "El Grullo", "El Limón", "El Salto", "Encarnación de Díaz", "Etzatlán", "Gómez Farías", "Guachinango", "Guadalajara", "Hostotipaquillo", "Huejúcar", "Huejuquilla el Alto", "Ixtlahuacán de los Membrillos", "Ixtlahuacán del Río", "Jalostotitlán", "Jamay", "Jesús María", "Jilotlán de los Dolores", "Jocotepec", "Juanacatlán", "Juchitlán", "La Barca", "La Huerta", "La Manzanilla de la Paz", "Lagos de Moreno", "Magdalena", "Mascota", "Mazamitla", "Mexticacán", "Mezquitic", "Mixtlán", "Ocotlán", "Ojuelos de Jalisco", "Pihuamo", "Poncitlán", "Puerto Vallarta", "Quitupan", "San Cristóbal de la Barranca", "San Diego de Alejandría", "San Gabriel", "San Ignacio Cerro Gordo", "San Juan de los Lagos", "San Juanito de Escobedo", "San Julián", "San Marcos", "San Martín de Bolaños", "San Martín Hidalgo", "San Miguel el Alto", "San Pedro Tlaquepaque", "San Sebastián del Oeste", "Santa María de los Ángeles", "Santa María del Oro", "Sayula", "Tala", "Talpa de Allende", "Tamazula de Gordiano", "Tapalpa", "Tecalitlán", "Techaluta de Montenegro", "Tecolotlán", "Tenamaxtlán", "Teocaltiche", "Teocuitatlán de Corona", "Tepatitlán de Morelos", "Tequila", "Teuchitlán", "Tizapán el Alto", "Tlajomulco de Zúñiga", "Tolimán", "Tomatlán", "Tonalá", "Tonaya", "Tonila", "Totatiche", "Tototlán", "Tuxcacuesco", "Tuxcueca", "Tuxpan", "Unión de San Antonio", "Unión de Tula", "Valle de Guadalupe", "Valle de Juárez", "Villa Corona", "Villa Guerrero", "Villa Hidalgo", "Villa Purificación", "Yahualica de González Gallo", "Zacoalco de Torres", "Zapopan", "Zapotiltic", "Zapotitlán de Vadillo", "Zapotlán del Rey", "Zapotlán el Grande", "Zapotlanejo"
];

// --- Helpers ---
const cleanAndNormalizeData = (data) => {
    const cleanedData = { ...data };
    // Conversiones numéricas si existieran en el futuro
    if (cleanedData.estaturaCm) cleanedData.estaturaCm = parseInt(cleanedData.estaturaCm, 10);
    if (cleanedData.pesoKg) cleanedData.pesoKg = parseFloat(cleanedData.pesoKg);
    // Eliminamos campo auxiliar 'edad'
    if (cleanedData.edad) delete cleanedData.edad;
    
    // Eliminar campos vacíos para no enviar strings vacíos a la BD
    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    return cleanedData;
};

const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
        edad--;
    }
    return edad;
};

// --- COMPONENTE FORMULARIO MODAL ---
const FormularioNuevoPaciente = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // 1. Datos Personales
    nombre: '',
    fechaNacimiento: '',
    edad: '',
    genero: '',
    curp: '',
    // 2. Contacto y Domicilio
    calleNumero: '',
    colonia: '',
    municipio: 'Guadalajara',
    codigoPostal: '',
    telefono: '',
    celular: '', 
    // 3. Programa y Servicio
    grupo: '',
    tipoServicio: 'Médico',
    tipoTerapia: 'Individual',
    responsable: '',
    motivoConsulta: '',
    // 4. Fechas Clínicas
    mesEstadistico: '',
    fechaDiagnostico: '',
    fechaConsulta: new Date().toISOString().slice(0, 10),
    primeraVez: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Calcular edad automáticamente al cambiar fecha
  useEffect(() => {
    if (formData.fechaNacimiento) {
        setFormData(prev => ({ ...prev, edad: calcularEdad(prev.fechaNacimiento) }));
    }
  }, [formData.fechaNacimiento]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await createPaciente(cleanAndNormalizeData(formData));
        onSuccess();
    } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Error al guardar el paciente.');
    } finally {
        setIsSaving(false);
    }
  };

  const redStar = <span style={{color: 'red'}}>*</span>;

  return (
    <form onSubmit={handleSubmit} className={styles.modalFormContainer}>
        <p className={styles.requiredNote}>Los campos marcados con {redStar} son obligatorios</p>

        {/* SECCIÓN 1 */}
        <div>
            <h3 className={styles.sectionHeader}>Datos Personales</h3>
            <p className={styles.sectionSub}>Información básica del paciente</p>
            
            <div style={{ marginBottom: '1rem' }}>
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
                    </select>
                </div>
                <div>
                    <label className={styles.label}>CURP {redStar}</label>
                    <input className={styles.inputFull} name="curp" value={formData.curp} onChange={handleChange} placeholder="18 caracteres" maxLength={18} required />
                </div>
            </div>
        </div>

        <div className={styles.divider}></div>

        {/* SECCIÓN 2 */}
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
                        {municipiosJalisco.map(m => <option key={m} value={m}>{m}</option>)}
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

        {/* SECCIÓN 3 */}
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
            
            <div style={{ marginTop: '1rem' }}>
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
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                />
                <div className={styles.charCount}>
                    {formData.motivoConsulta.length}/500 caracteres
                </div>
            </div>
        </div>

        <div className={styles.divider}></div>

        {/* SECCIÓN 4 */}
        <div style={{ marginBottom: '2rem' }}>
            <h3 className={styles.sectionHeader}>Fechas Clínicas</h3>
            <p className={styles.sectionSub}>Información sobre diagnóstico y consulta</p>

            <div className={styles.formGrid}>
                <div>
                    <label className={styles.label}>Mes Estadístico {redStar}</label>
                    <select className={styles.inputFull} name="mesEstadistico" value={formData.mesEstadistico} onChange={handleChange} required>
                        <option value="">Seleccionar</option>
                        <option value="Enero">Enero</option>
                        <option value="Febrero">Febrero</option>
                        <option value="Marzo">Marzo</option>
                        <option value="Abril">Abril</option>
                        <option value="Mayo">Mayo</option>
                        <option value="Junio">Junio</option>
                        <option value="Julio">Julio</option>
                        <option value="Agosto">Agosto</option>
                        <option value="Septiembre">Septiembre</option>
                        <option value="Octubre">Octubre</option>
                        <option value="Noviembre">Noviembre</option>
                        <option value="Diciembre">Diciembre</option>
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
                        <div className={`${styles.toggleSwitch} ${formData.primeraVez ? styles.toggleActive : ''}`}>
                            <input 
                                type="checkbox" 
                                name="primeraVez" 
                                checked={formData.primeraVez} 
                                onChange={handleChange} 
                            />
                            <span className={styles.toggleKnob}></span>
                        </div>
                        <span>{formData.primeraVez ? 'Sí - Primera consulta' : 'No - Seguimiento'}</span>
                    </label>
                </div>
            </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving} style={{backgroundColor: '#003366', color: 'white'}}>
                {isSaving ? <FaSpinner className="fa-spin" /> : <FaSave />} Guardar Paciente
            </Button>
        </div>
    </form>
  );
};

// --- PÁGINA PRINCIPAL ---
function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');
  const [filterRiesgo, setFilterRiesgo] = useState('');
  const [filterMunicipio, setFilterMunicipio] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  
  const navigate = useNavigate();

  const cargarPacientes = async () => {
    setIsLoading(true);
    try {
        let data = [];
        if (currentUser && currentUser.id) {
            // Si hay usuario logueado, obtener pacientes por doctorId
            data = await getAllPacientesByDoctor(currentUser.id);
        } else {
            // Fallback: obtener todos los pacientes
            data = await getPacientes();
        }
        setPacientes(data);
    } catch (err) {
        console.error("Error cargando pacientes:", err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lógica de Filtrado
  const pacientesFiltrados = useMemo(() => {
        const pacientesArray = Array.isArray(pacientes) ? pacientes : [];
        return pacientesArray.filter(p => {
            const matchesSearch = 
                p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.curp?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstatus = filterEstatus ? p.estatus === filterEstatus : true;
            const matchesRiesgo = filterRiesgo ? p.riesgo === filterRiesgo : true;
            const matchesMunicipio = filterMunicipio ? p.municipio === filterMunicipio : true;

            return matchesSearch && matchesEstatus && matchesRiesgo && matchesMunicipio;
        });
  }, [pacientes, searchTerm, filterEstatus, filterRiesgo, filterMunicipio]);

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
        <Button onClick={() => setIsModalOpen(true)} style={{backgroundColor: '#003366', color: '#fff', padding: '0.75rem 1.5rem'}}>
            <FaPlus /> Nuevo Paciente
        </Button>
      </div>

      {/* CAJA DE FILTROS */}
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
      
      {/* TABLA */}
      {isLoading ? (
        <div className={styles.loadingState}><FaSpinner className="fa-spin" /> Cargando...</div>
      ) : (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>CURP</th>
                    <th>Estatus</th>
                    <th>Última Visita</th>
                    <th style={{textAlign: 'right'}}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {pacientesFiltrados.map((p) => (
                <tr key={p.id}>
                    <td>
                        <div className={styles.cellNameMain}>{p.nombre}</div>
                        <div className={styles.cellNameSub}>
                            {p.edad ? `${p.edad} años` : ''} • {p.genero}
                        </div>
                    </td>
                    <td className={styles.cellCurp}>{p.curp}</td>
                    <td><Tag label={p.estatus || 'Activo'} /></td>
                    <td style={{fontSize: '0.9rem', color: '#555'}}>
                        {p.ultimaVisita ? new Date(p.ultimaVisita).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td style={{textAlign: 'right'}}>
                        <button className={styles.actionButton} onClick={() => handleVerDetalle(p.id)}>
                            <FaEye /> Ver
                        </button>
                    </td>
                </tr>
                ))}
                {pacientesFiltrados.length === 0 && (
                    <tr>
                        <td colSpan="5" className={styles.emptyTable}>No se encontraron resultados.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      <Modal title="Nuevo Paciente" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FormularioNuevoPaciente onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); cargarPacientes(); }} />
      </Modal>

      <DetallePacienteModal pacienteId={selectedPacienteId} isOpen={mobileDetailOpen} onClose={() => setMobileDetailOpen(false)} />
    </div>
  );
}

export default Pacientes;