import React, { useState } from 'react';
import { registrarPaciente, agendarCita } from '../services/pacienteService';

function RegistroPacienteCita({ usuarioId, medicoId }) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    especialidad: '',
    fecha_cita: '',
    descripcion: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);
    try {
      // 1. Registrar paciente
      await registrarPaciente({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        usuarioId: usuarioId
      });

      // 2. Agendar cita
      await agendarCita({
        usuarioId: usuarioId,
        medicoId: medicoId,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        especialidad: form.especialidad,
        fecha_cita: form.fecha_cita,
        descripcion: form.descripcion
      });

      setMensaje('Paciente registrado y cita agendada correctamente.');
      setForm({ nombre: '', email: '', telefono: '', especialidad: '', fecha_cita: '', descripcion: '' });
    } catch (error) {
      setMensaje('Ocurrió un error: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Registrar Paciente y Agendar Cita</h2>
      <div>
        <label>Nombre:</label>
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
      </div>
      <div>
        <label>Email:</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label>Teléfono:</label>
        <input name="telefono" value={form.telefono} onChange={handleChange} required />
      </div>
      <div>
        <label>Especialidad:</label>
        <input name="especialidad" value={form.especialidad} onChange={handleChange} required />
      </div>
      <div>
        <label>Fecha de la cita:</label>
        <input name="fecha_cita" type="datetime-local" value={form.fecha_cita} onChange={handleChange} required />
      </div>
      <div>
        <label>Descripción:</label>
        <input name="descripcion" value={form.descripcion} onChange={handleChange} />
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Procesando...' : 'Registrar y Agendar'}
      </button>
      {mensaje && <p style={{ marginTop: 16 }}>{mensaje}</p>}
    </form>
  );
}

export default RegistroPacienteCita;
