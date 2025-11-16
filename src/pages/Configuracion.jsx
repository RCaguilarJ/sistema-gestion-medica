import React, { useState } from 'react';
import styles from './Configuracion.module.css';
import tableStyles from './Pacientes.module.css'; 
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';
import Modal from '../components/ui/Modal.jsx';
import { register } from '../services/authService.js';

import {
  FaUsers, FaBook, FaProjectDiagram, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';

// --- 1. DEFINICIÓN DE DATOS DE EJEMPLO (ESTO FALTABA) ---
const mockUsuarios = [
  { id: 1, nombre: 'Dr. Juan Pérez', email: 'jperez@amd.mx', rol: 'Doctor', estatus: 'Activo' },
  { id: 2, nombre: 'Lic. María González', email: 'mgonzalez@amd.mx', rol: 'Nutriólogo', estatus: 'Activo' },
];
const mockCatalogos = {
  municipios: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá'],
  servicios: ['Médico', 'Nutricional', 'Mixto', 'Educativo'],
};
// ----------------------------------------------------

// --- Componente de Formulario (con campo de Rol) ---
const FormularioNuevoUsuario = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor'); // Estado para el rol
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Enviamos el rol al servicio de registro
      const data = await register(username, email, password, role);
      if (data) {
        onSuccess(); 
      } else {
        setError('No se pudo crear el usuario. Revisa los datos.');
      }
    } catch (err) {
      setError('Error al registrar. Intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="username">Nombre de Usuario (Username)</label>
        <input
          type="text" id="username" value={username}
          onChange={(e) => setUsername(e.target.value)} required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email" id="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
        />
      </div>
      
      {/* Campo de Rol */}
      <div className={styles.formGroup}>
        <label htmlFor="role">Rol de Usuario</label>
        <select 
          id="role" 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className={styles.selectInput} // Reutilizamos estilo
        >
          <option value="Administrador">Administrador</option>
          <option value="Doctor">Doctor</option>
          <option value="Nutriólogo">Nutriólogo</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password">Contraseña</label>
        <input
          type="password" id="password" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6}
        />
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Crear Usuario</Button>
      </div>
    </form>
  );
};


// --- Componente Principal ---
function Configuracion() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleUserCreated = () => {
    handleCloseModal();
    alert('¡Usuario creado exitosamente!');
    // (En el futuro, aquí recargamos la lista de usuarios)
  };
  
  const renderTabContent = () => {
    if (activeTab === 'usuarios') {
      return (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Gestión de Usuarios</h2>
              <Button onClick={handleOpenModal}>
                <FaPlus /> Nuevo Usuario
              </Button>
            </div>
            <p>Administra permisos y accesos al sistema</p>
            
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ¡AQUÍ ESTÁ EL CÓDIGO QUE USABA LA VARIABLE FALTANTE! */}
                  {mockUsuarios.map(user => (
                    <tr key={user.id}>
                      <td>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td><Tag label={user.rol} /></td>
                      <td><Tag label={user.estatus} /></td>
                      <td style={{ display: 'flex', gap: '1rem' }}>
                        <FaEdit className={tableStyles.accionIcon} />
                        <FaTrash className={tableStyles.accionIcon} style={{ color: '#de350b' }}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Roles y Permisos</h2>
          <div className={styles.permissionsGrid}>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Administrador</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Gestión de Usuarios y Roles</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Gestión de Catálogos</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Generación de Reportes</li>
              </ul>
            </div>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Doctor</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Gestión de Pacientes</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Ver Dashboard</li>
                <li className={styles.permissionItem}><FaTimes className={styles.itemDeny} /> No puede acceder a Configuración</li>
              </ul>
            </div>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Nutriólogo</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Gestión de Pacientes (solo nutrición)</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Ver Dashboard</li>
                <li className={styles.permissionItem}><FaTimes className={styles.itemDeny} /> No puede acceder a Configuración</li>
              </ul>
            </div>
          </div>

        </div>
      );
    }
    // --- PESTAÑA CATÁLOGOS ---
    if (activeTab === 'catalogos') {
      return (
        <div className={styles.catalogGrid}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Municipios</h2>
              <Button variant="secondary"><FaPlus /> Agregar</Button>
            </div>
            <ul className={styles.catalogList}>
              {/* ¡AQUÍ USABA LA OTRA VARIABLE FALTANTE! */}
              {mockCatalogos.municipios.map(m => (
                <li key={m} className={styles.catalogItem}>
                  <span>{m}</span>
                  <FaEdit />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Tipos de Servicio</h2>
              <Button variant="secondary"><FaPlus /> Agregar</Button>
            </div>
            <ul className={styles.catalogList}>
              {/* ¡AQUÍ USABA LA OTRA VARIABLE FALTANTE! */}
              {mockCatalogos.servicios.map(s => (
                <li key={s} className={styles.catalogItem}>
                  <span>{s}</span>
                  <FaEdit />
                </li>
              ))}
            </ul>
          </Card>
          {/* (Aquí irían las otras 2 tarjetas de catálogos) */}
        </div>
      );
    }

    // --- PESTAÑA PROGRAMAS ---
    if (activeTab === 'programas') {
      // (Esta pestaña no usaba mock data, así que estaba bien)
      return (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Programas y Grupos</h2>
              <Button><FaPlus /> Nuevo Programa</Button>
            </div>
            <p>Gestiona los grupos de atención y programas</p>
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Nombre del Programa</th>
                    <th>Tipo</th>
                    <th>Participantes</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Grupo Matutino A</td>
                    <td>Grupal</td>
                    <td>25</td>
                    <td style={{ display: 'flex', gap: '1rem' }}>
                      <FaEdit className={tableStyles.accionIcon} />
                      <FaTrash className={tableStyles.accionIcon} style={{ color: '#de350b' }}/>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          
          <Card style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>Metas y Objetivos</h2>
            <p>Define metas clínicas y nutricionales para el programa</p>
            <div className={styles.metaForm}>
              <div className={styles.formGroup}>
                <label htmlFor="metaHba1c">Meta HbA1c (%)</label>
                <input type="text" id="metaHba1c" defaultValue="7.0" />
                <small>Objetivo de control glucémico</small>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="metaImc">Meta IMC</label>
                <input type="text" id="metaImc" defaultValue="25.0" />
                <small>Objetivo de índice de masa corporal</small>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="metaAdh">Meta de Adherencia (%)</label>
                <input type="text" id="metaAdh" defaultValue="80" />
                <small>Porcentaje de asistencia a citas</small>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="frecuencia">Frecuencia de Seguimiento</label>
                <select id="frecuencia">
                  <option>Mensual</option>
                  <option>Bimestral</option>
                  <option>Trimestral</option>
                </select>
                <small>Periodicidad de consultas</small>
              </div>
              <div className={styles.formActions}>
                <Button variant="dark">Guardar Configuración</Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Configuración del Sistema</h1>
      <p className={styles.subtitle}>Administra usuarios, catálogos y parámetros del sistema</p>

      {/* Navegación de Pestañas */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <FaUsers /> Usuarios y Roles
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'catalogos' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('catalogos')}
        >
          <FaBook /> Catálogos
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'programas' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('programas')}
        >
          <FaProjectDiagram /> Programas
        </button>
      </nav>

      {/* Contenido de la Pestaña Activa */}
      {renderTabContent()}

      <Modal 
        title="Crear Nuevo Usuario"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      >
        <FormularioNuevoUsuario 
          onClose={handleCloseModal}
          onSuccess={handleUserCreated}
        />
      </Modal>
    </div>
  );
}

export default Configuracion;