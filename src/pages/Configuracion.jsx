import React, { useState, useEffect } from 'react';
import styles from './Configuracion.module.css';
import tableStyles from './Pacientes.module.css';
// Necesitamos estilos adicionales para la barra de filtros nueva
import formStyles from '../styles/FormStyles.module.css'; 
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import Modal from '../components/ui/Modal.jsx';
import { register } from '../services/authService.js';
import { getUsers, deleteUser, updateUser } from '../services/userService.js';
import { useAuth } from "../hooks/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import {
  FaUsers, FaBook, FaProjectDiagram, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch
} from 'react-icons/fa';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'NUTRI', label: 'Nutriólogo' },
  { value: 'ENDOCRINOLOGO', label: 'Endocrinólogo' },
  { value: 'PODOLOGO', label: 'Podólogo' },
  { value: 'PSICOLOGO', label: 'Psicólogo' },
];

const ROLE_PERMISSIONS = [
  {
    title: 'Administrador',
    permissions: [
      { text: 'Gestión Total', allowed: true },
      { text: 'Configuración', allowed: true },
    ],
  },
  {
    title: 'Doctor',
    permissions: [
      { text: 'Pacientes y Citas', allowed: true },
      { text: 'Configuración', allowed: false },
    ],
  },
  {
    title: 'Nutriólogo',
    permissions: [
      { text: 'Pacientes (Nutrición)', allowed: true },
      { text: 'Configuración', allowed: false },
    ],
  },
  {
    title: 'Endocrinólogo',
    permissions: [
      { text: 'Pacientes (Endocrinología)', allowed: true },
      { text: 'Configuración', allowed: false },
    ],
  },
  {
    title: 'Podólogo',
    permissions: [
      { text: 'Pacientes (Podología)', allowed: true },
      { text: 'Configuración', allowed: false },
    ],
  },
  {
    title: 'Psicólogo',
    permissions: [
      { text: 'Pacientes (Psicología)', allowed: true },
      { text: 'Configuración', allowed: false },
    ],
  },
];

// --- 1. COMPONENTE: Formulario Nuevo Usuario ---
const FormularioNuevoUsuario = ({ onClose, onSuccess }) => {
  const [nombre, setNombre] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await register(nombre, username, email, password, role, { persistSession: false });
      if (data) onSuccess(); 
      else setError('No se pudo crear el usuario.');
    } catch (err) {
      setError('Error al registrar.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label>Nombre Completo</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Dr. Juan Pérez" />
      </div>
      <div className={styles.formGroup}>
        <label>Usuario</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className={styles.formGroup}>
        <label>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className={styles.formGroup}>
        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.selectInput}>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      {error && <p style={{ color: 'red', marginTop:'10px' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Crear Usuario</Button>
      </div>
    </form>
  );
};

// --- 2. COMPONENTE: Formulario Editar Usuario ---
const FormularioEditarUsuario = ({ userToEdit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: userToEdit.nombre || '',
    username: userToEdit.username || '',
    email: userToEdit.email || '',
    role: userToEdit.role || 'DOCTOR',
    estatus: userToEdit.estatus || 'Activo',
    password: '' 
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === '') delete payload.password;
      await updateUser(userToEdit.id, payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Error al actualizar usuario.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}><label>Nombre</label><input name="nombre" value={formData.nombre} onChange={handleChange} required /></div>
      <div className={styles.formGroup}><label>Usuario</label><input name="username" value={formData.username} onChange={handleChange} required /></div>
      <div className={styles.formGroup}><label>Correo</label><input name="email" value={formData.email} onChange={handleChange} required /></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
        <div className={styles.formGroup}>
          <label>Rol</label>
          <select name="role" value={formData.role} onChange={handleChange} className={styles.selectInput}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}><label>Estatus</label><select name="estatus" value={formData.estatus} onChange={handleChange} className={styles.selectInput}><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></div>
      </div>
      <div className={styles.formGroup}><label>Nueva Contraseña (Opcional)</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Dejar en blanco para no cambiar" /></div>
      {error && <p style={{ color: 'red', marginTop:'10px' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Guardar Cambios</Button>
      </div>
    </form>
  );
};

// --- 3. COMPONENTE: Tarjeta de Catálogo ---
const CatalogCard = ({ title, subtitle, items, onAdd, footerText }) => {
    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h3 className={styles.sectionTitle} style={{ marginBottom: '0.25rem' }}>{title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{subtitle}</p>
                </div>
                <Button onClick={onAdd} size="small" style={{ backgroundColor: '#111827', color: '#fff', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Agregar
                </Button>
            </div>
            <ul className={styles.catalogList}>
                {items.map((item, idx) => (
                    <li key={idx} className={styles.catalogItem} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '0.9rem', color: '#374151' }}>{item}</span>
                        <FaEdit style={{ cursor: 'pointer', color: '#9ca3af' }} />
                    </li>
                ))}
            </ul>
            {footerText && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>{footerText}</p>}
        </Card>
    );
};

// --- 4. COMPONENTE: Modal Agregar Catálogo ---
const ModalAgregarCatalogo = ({ title, onClose, onSave }) => {
    const [valor, setValor] = useState("");
    const handleSubmit = (e) => { e.preventDefault(); if (valor.trim()) onSave(valor); };
    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label>Nombre del nuevo elemento</label>
                <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} placeholder={`Ej. Nuevo ${title}`} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" style={{ backgroundColor: '#111827', color: '#fff' }}>Agregar</Button>
            </div>
        </form>
    );
};

// --- 5. COMPONENTE PRINCIPAL ---
export default function Configuracion() {
  const { user: currentUser } = useAuth();

  if (currentUser?.role !== 'ADMIN') return <Navigate to="/app" replace />;

  const [activeTab, setActiveTab] = useState('usuarios');
  
  // Estados Usuarios
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados Catálogos
  const [municipios, setMunicipios] = useState(["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Tlajomulco de Zúñiga"]);
  const [servicios, setServicios] = useState(["Médico", "Nutricional", "Mixto", "Educativo", "Otro"]);
  const [terapias, setTerapias] = useState(["Individual", "Grupal", "Educación", "Seguimiento", "Otro"]);
  const [docs, setDocs] = useState(["Identificación", "Consentimiento", "Laboratorio", "Receta", "Referencia", "Nutrición"]);
  const [catalogModal, setCatalogModal] = useState({ isOpen: false, type: '' });

  // Estados Programas (Datos simulados para la UI)
  const [programasData] = useState([
      { id: 1, nombre: "Grupo de Control Matutino A", tipo: "Grupal", responsable: "Dr. Ana García", horario: "Lun, Mié, Vie - 9:00 AM", participantes: 25, cupo: 30, estatus: "Activo" },
      { id: 2, nombre: "Taller de Nutrición Básica", tipo: "Educativo", responsable: "Lic. Carlos Ruiz", horario: "Martes - 16:00 PM (Semanal)", participantes: 18, cupo: 20, estatus: "Activo" },
      { id: 3, nombre: "Programa de Ejercicio Físico", tipo: "Actividad", responsable: "Ent. Pedro Sánchez", horario: "Jueves - 10:00 AM", participantes: 15, cupo: 25, estatus: "Inactivo" },
  ]);
  const [searchProgramas, setSearchProgramas] = useState('');

  // Cargar usuarios
  useEffect(() => { cargarUsuarios(); }, []);
  const cargarUsuarios = async () => {
    setIsLoading(true);
    try { setUsuarios(await getUsers()); } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // Handlers Usuarios
  const handleUserCreated = async () => { setIsCreateModalOpen(false); await cargarUsuarios(); };
  const handleUserUpdated = async () => { setIsEditModalOpen(false); setUserToEdit(null); await cargarUsuarios(); };
  const handleEditClick = (u) => { setUserToEdit(u); setIsEditModalOpen(true); };
  const handleDeleteClick = async (id, nombre) => {
    if (window.confirm(`¿Eliminar a ${nombre}?`)) {
        try { await deleteUser(id); setUsuarios(prev => prev.filter(u => u.id !== id)); } catch (err) { alert(err.message); }
    }
  };

  // Handlers Catálogos
  const openCatalogModal = (type) => setCatalogModal({ isOpen: true, type });
  const handleAddCatalogItem = (newItem) => {
      switch (catalogModal.type) {
          case 'Municipio': setMunicipios([...municipios, newItem]); break;
          case 'Servicio': setServicios([...servicios, newItem]); break;
          case 'Terapia': setTerapias([...terapias, newItem]); break;
          case 'Documento': setDocs([...docs, newItem]); break;
      }
      setCatalogModal({ isOpen: false, type: '' });
  };

  const renderTabContent = () => {
    if (activeTab === 'usuarios') {
      return (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Gestión de Usuarios</h2>
              <Button onClick={() => setIsCreateModalOpen(true)}><FaPlus /> Nuevo Usuario</Button>
            </div>
            <p style={{color:'#666', marginBottom:'1.5rem'}}>Administra permisos y accesos al sistema</p>
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                   usuarios.map(u => (
                      <tr key={u.id}>
                        <td>{u.nombre}<br/><small style={{color:'#888'}}>@{u.username}</small></td>
                        <td>{u.email}</td>
                        <td><Tag label={u.role} /></td>
                        <td><Tag label={u.estatus || 'Activo'} /></td>
                        <td style={{display:'flex', gap:'1rem'}}>
                          <FaEdit className={tableStyles.accionIcon} onClick={() => handleEditClick(u)} title="Editar" style={{cursor:'pointer', color:'#555'}} />
                          {currentUser.id !== u.id && <FaTrash className={tableStyles.accionIcon} style={{color:'#de350b', cursor:'pointer'}} onClick={() => handleDeleteClick(u.id, u.nombre)} title="Eliminar" />}
                        </td>
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* ... Sección de Permisos (igual que antes) ... */}
          <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Roles y Permisos</h2>
          <div className={styles.permissionsGrid}>
            {ROLE_PERMISSIONS.map((rolePerm) => (
              <div key={rolePerm.title} className={styles.permissionCard}>
                <h3 className={styles.permissionTitle}>{rolePerm.title}</h3>
                <ul className={styles.permissionList}>
                  {rolePerm.permissions.map((perm) => (
                    <li key={perm.text} className={styles.permissionItem}>
                      {perm.allowed ? (
                        <FaCheck className={styles.itemAllow} />
                      ) : (
                        <FaTimes className={styles.itemDeny} />
                      )}
                      {' '}
                      {perm.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'catalogos') {
      return (
        <div className={styles.catalogGrid}>
          <CatalogCard title="Municipios" subtitle="Municipios de Jalisco registrados" items={municipios} onAdd={() => openCatalogModal('Municipio')} footerText="Y 120 municipios más..."/>
          <CatalogCard title="Tipos de Servicio" subtitle="Categorías de servicios ofrecidos" items={servicios} onAdd={() => openCatalogModal('Servicio')}/>
          <CatalogCard title="Tipos de Terapia" subtitle="Modalidades de atención" items={terapias} onAdd={() => openCatalogModal('Terapia')}/>
          <CatalogCard title="Categorías de Documentos" subtitle="Tipos de archivos permitidos" items={docs} onAdd={() => openCatalogModal('Documento')}/>
        </div>
      );
    }

    // --- PESTAÑA PROGRAMAS (REPLICANDO LA IMAGEN) ---
    if (activeTab === 'programas') {
      return (
        <Card>
            {/* Encabezado */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                <div>
                    <h2 className={styles.sectionTitle} style={{marginBottom:'0.25rem'}}>Programas y Grupos de Atención</h2>
                    <p style={{margin:0, color:'#666', fontSize:'0.9rem'}}>Gestión de grupos, talleres y programas educativos</p>
                </div>
                <Button style={{ backgroundColor: '#111827', color: '#fff' }}><FaPlus /> Nuevo Programa</Button>
            </div>

            {/* Barra de Filtros (Estilo Gris) */}
            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', border: '1px solid #e5e7eb' }}>
                <div className={formStyles.formGroup} style={{ marginBottom: 0, position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar programa o responsable..." 
                        value={searchProgramas}
                        onChange={(e) => setSearchProgramas(e.target.value)}
                        style={{ paddingLeft: '36px', backgroundColor: '#fff' }}
                        className={formStyles.input}
                    />
                </div>
                <select className={formStyles.selectInput} style={{ backgroundColor: '#fff' }}>
                    <option value="Todos">Todos los tipos</option>
                    <option value="Grupal">Grupal</option>
                    <option value="Educativo">Educativo</option>
                </select>
                <select className={formStyles.selectInput} style={{ backgroundColor: '#fff' }}>
                    <option value="Todos">Todos los estatus</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            {/* Tabla de Programas */}
            <div className={tableStyles.tableContainer}>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th>Nombre del Programa</th>
                            <th>Tipo</th>
                            <th>Responsable</th>
                            <th>Horario/Frecuencia</th>
                            <th>Participantes</th>
                            <th>Estatus</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {programasData.map(prog => (
                            <tr key={prog.id}>
                                <td style={{fontWeight:'600'}}>{prog.nombre}</td>
                                <td>{prog.tipo}</td>
                                <td>{prog.responsable}</td>
                                <td>{prog.horario}</td>
                                <td>{prog.participantes} / {prog.cupo}</td>
                                <td>
                                    <Tag label={prog.estatus} style={{ backgroundColor: prog.estatus === 'Activo' ? '#def7ec' : '#f3f4f6', color: prog.estatus === 'Activo' ? '#03543f' : '#374151' }} />
                                </td>
                                <td style={{ display: 'flex', gap: '1rem' }}>
                                    <FaEdit className={tableStyles.accionIcon} title="Editar" style={{cursor:'pointer', color:'#555'}} onClick={() => alert('Editar programa')} />
                                    <FaTrash className={tableStyles.accionIcon} title="Eliminar" style={{color:'#de350b', cursor:'pointer'}} onClick={() => alert('Eliminar programa')} />
                                    <FaUsers className={tableStyles.accionIcon} title="Ver participantes" style={{color:'#3B82F6', cursor:'pointer'}} onClick={() => alert('Ver participantes')} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      );
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Configuración del Sistema</h1>
      <p className={styles.subtitle}>Administra usuarios, catálogos y parámetros del sistema</p>

      <nav className={styles.tabNav}>
        <button className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('usuarios')}><FaUsers /> Usuarios y Roles</button>
        <button className={`${styles.tabButton} ${activeTab === 'catalogos' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('catalogos')}><FaBook /> Catálogos</button>
        <button className={`${styles.tabButton} ${activeTab === 'programas' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('programas')}><FaProjectDiagram /> Programas</button>
      </nav>

      {renderTabContent()}

      <Modal title="Crear Nuevo Usuario" isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <FormularioNuevoUsuario onClose={() => setIsCreateModalOpen(false)} onSuccess={handleUserCreated} />
      </Modal>
      <Modal title="Editar Usuario" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {userToEdit && <FormularioEditarUsuario userToEdit={userToEdit} onClose={() => setIsEditModalOpen(false)} onSuccess={handleUserUpdated} />}
      </Modal>
      <Modal title={`Agregar ${catalogModal.type}`} isOpen={catalogModal.isOpen} onClose={() => setCatalogModal({isOpen:false, type:''})}>
          <ModalAgregarCatalogo title={catalogModal.type} onClose={() => setCatalogModal({isOpen:false, type:''})} onSave={handleAddCatalogItem} />
      </Modal>
    </div>
  );
}