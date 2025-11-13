import React, { useState } from 'react';
// 1. Importamos AMBOS archivos CSS
import styles from './Configuracion.module.css';
import tableStyles from './Pacientes.module.css'; // Reutilizamos los estilos de la tabla

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';

// Importamos íconos
import {
  FaUsers, FaBook, FaProjectDiagram, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';

// --- Datos de Ejemplo ---
const mockUsuarios = [
  { id: 1, nombre: 'Dr. Juan Pérez', email: 'jperez@amd.mx', rol: 'Doctor', estatus: 'Activo' },
  { id: 2, nombre: 'Lic. María González', email: 'mgonzalez@amd.mx', rol: 'Nutriólogo', estatus: 'Activo' },
  { id: 3, nombre: 'Admin Sistema', email: 'admin@amd.mx', rol: 'Administrador', estatus: 'Activo' },
];

const mockCatalogos = {
  municipios: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá'],
  servicios: ['Médico', 'Nutricional', 'Mixto', 'Educativo'],
};

// --- Componente Principal ---
function Configuracion() {
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios', 'catalogos', 'programas'

  // Función para renderizar el contenido de la pestaña activa
  const renderTabContent = () => {
    
    // --- PESTAÑA USUARIOS Y ROLES ---
    if (activeTab === 'usuarios') {
      return (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Gestión de Usuarios</h2>
              <Button><FaPlus /> Nuevo Usuario</Button>
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
                  {mockUsuarios.map(user => (
                    <tr key={user.id}>
                      <td>{user.nombre}</td>
                      <td>{user.email}</td>
                      {/* Usamos el Tag component con colores personalizados */}
                      <td>
                        <Tag label={user.rol} /> 
                      </td>
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

          <div className={styles.permissionsGrid}>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Administrador</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Control total del sistema</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Gestión de usuarios y roles</li>
              </ul>
            </div>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Doctor</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Ver/editar expedientes médicos</li>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Ver datos clínicos (solo lectura)</li>
                <li className={styles.permissionItem}><FaTimes className={styles.itemDeny} /> No puede borrar pacientes</li>
              </ul>
            </div>
            <div className={styles.permissionCard}>
              <h3 className={styles.permissionTitle}>Nutriólogo</h3>
              <ul className={styles.permissionList}>
                <li className={styles.permissionItem}><FaCheck className={styles.itemAllow} /> Ver/editar módulos nutricionales</li>
                <li className={styles.permissionItem}><FaTimes className={styles.itemDeny} /> No puede modificar datos clínicos</li>
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
      return (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Programas y Grupos</h2>
              <Button><FaPlus /> Nuevo Programa</Button>
            </div>
            <p>Gestiona los grupos de atención y programas</p>
            {/* Aquí usamos de nuevo los estilos de la tabla de Pacientes */}
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
    </div>
  );
}

export default Configuracion;