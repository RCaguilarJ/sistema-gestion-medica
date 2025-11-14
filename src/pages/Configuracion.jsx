import React, { useState } from 'react';
import styles from './Configuracion.module.css';
import tableStyles from './Pacientes.module.css'; 
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Tag from '../components/ui/Tag.jsx';

// --- 1. IMPORTAR EL MODAL Y EL SERVICIO DE REGISTRO ---
import Modal from '../components/ui/Modal.jsx';
import { register } from '../services/authService.js';

import {
  FaUsers, FaBook, FaProjectDiagram, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';

// (Seguimos usando los datos de ejemplo por ahora)
const mockUsuarios = [
  { id: 1, nombre: 'Dr. Juan Pérez', email: 'jperez@amd.mx', rol: 'Doctor', estatus: 'Activo' },
  { id: 2, nombre: 'Lic. María González', email: 'mgonzalez@amd.mx', rol: 'Nutriólogo', estatus: 'Activo' },
];

const mockCatalogos = {
  municipios: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá'],
  servicios: ['Médico', 'Nutricional', 'Mixto', 'Educativo'],
};

// --- Componente de Formulario (interno) ---
const FormularioNuevoUsuario = ({ onClose, onSuccess }) => {
  // Estados para el formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await register(username, email, password);
      if (data) {
        onSuccess(); // Llama a la función de éxito (cierra el modal, etc.)
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
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
  
  // --- 2. ESTADO PARA CONTROLAR EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleUserCreated = () => {
    handleCloseModal();
    alert('¡Usuario creado exitosamente!');
    // Aquí, en un futuro, llamaríamos a la función para recargar la lista de usuarios
    // loadUsers(); 
  };
  
  // ... (función renderTabContent)
  const renderTabContent = () => {
    if (activeTab === 'usuarios') {
      return (
        <div>
          <Card>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Gestión de Usuarios</h2>
              {/* --- 3. CONECTAMOS EL BOTÓN --- */}
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
                  {/* (La lista sigue siendo de MOCK por ahora) */}
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
          {/* ... (resto de la pestaña de permisos) ... */}
        </div>
      );
    }
    // ... (otras pestañas)
  };

  return (
    <div>
      <h1 className={styles.title}>Configuración del Sistema</h1>
      <p className={styles.subtitle}>Administra usuarios, catálogos y parámetros del sistema</p>

      {/* Navegación de Pestañas */}
      <nav className={styles.tabNav}>
        {/* ... (botones de pestañas) ... */}
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

      {/* --- 4. AÑADIMOS EL MODAL AL FINAL --- */}
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