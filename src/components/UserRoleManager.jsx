import React, { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole } from '../../../sistema-gestion-backend-/scripts/userRoleUtils';
import { register } from '../services/authService.js';
import { useAuth } from '../hooks/AuthContext.jsx';

const UserRoleManager = ({ token }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  // Para crear usuario
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', role: 'DOCTOR' });
  const [creating, setCreating] = useState(false);
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await register(newUser.nombre, newUser.email, newUser.email, newUser.password, newUser.role);
      setShowCreate(false);
      setNewUser({ nombre: '', email: '', password: '', role: 'DOCTOR' });
      // Recargar usuarios
      const data = await fetchUsers(token);
      setUsers(data);
    } catch (err) {
      setError('Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers(token);
        setUsers(data);
      } catch (err) {
        setError('Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdating(true);
      await updateUserRole(userId, newRole, token);
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError('Error al actualizar rol');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Gestión de Roles de Usuario</h2>
      <div style={{marginBottom: 16}}>
        <strong>Usuario actual:</strong> {currentUser?.email || 'No logueado'}<br/>
        <strong>Rol actual:</strong> {currentUser?.role || 'Sin rol'}
      </div>
      {currentUser?.role === 'ADMIN' && (
        <div style={{marginBottom: 24}}>
          <button onClick={() => setShowCreate((v) => !v)} style={{marginBottom: 8}}>
            {showCreate ? 'Cancelar' : 'Agregar nuevo usuario'}
          </button>
          {showCreate && (
            <form onSubmit={handleCreateUser} style={{border: '1px solid #ccc', padding: 12, borderRadius: 8, marginBottom: 16}}>
              <div>
                <label>Nombre: </label>
                <input name="nombre" value={newUser.nombre} onChange={handleCreateChange} required />
              </div>
              <div>
                <label>Email: </label>
                <input name="email" type="email" value={newUser.email} onChange={handleCreateChange} required />
              </div>
              <div>
                <label>Contraseña: </label>
                <input name="password" type="password" value={newUser.password} onChange={handleCreateChange} required />
              </div>
              <div>
                <label>Rol: </label>
                <select name="role" value={newUser.role} onChange={handleCreateChange} required>
                  <option value="ADMIN">ADMIN</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="NUTRI">NUTRI</option>
                  <option value="PSY">PSY</option>
                  <option value="PATIENT">PATIENT</option>
                  <option value="ENDOCRINOLOGO">ENDOCRINOLOGO</option>
                  <option value="PODOLOGO">PODOLOGO</option>
                  <option value="PSICOLOGO">PSICOLOGO</option>
                </select>
              </div>
              <button type="submit" disabled={creating}>{creating ? 'Creando...' : 'Crear usuario'}</button>
            </form>
          )}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.nombre}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {currentUser?.role === 'ADMIN' ? (
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    disabled={updating}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NUTRI">NUTRI</option>
                    <option value="PSY">PSY</option>
                    <option value="PATIENT">PATIENT</option>
                    <option value="ENDOCRINOLOGO">ENDOCRINOLOGO</option>
                    <option value="PODOLOGO">PODOLOGO</option>
                    <option value="PSICOLOGO">PSICOLOGO</option>
                  </select>
                ) : (
                  <span>Sin permisos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
    </div>
  );
};

export default UserRoleManager;
