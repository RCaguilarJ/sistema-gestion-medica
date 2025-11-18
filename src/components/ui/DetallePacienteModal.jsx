import React, { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { getPacienteById } from '../../services/pacienteService.js';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function DetallePacienteModal({ pacienteId, isOpen, onClose }) {
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const fetchPaciente = async () => {
      setLoading(true);
      try {
        const data = await getPacienteById(pacienteId);
        if (mounted) setPaciente(data);
      } catch (err) {
        console.error('Error cargando paciente en modal:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPaciente();
    return () => { mounted = false; };
  }, [pacienteId, isOpen]);

  const handleOpenFull = () => {
    onClose();
    navigate(`/pacientes/${pacienteId}`);
  };

  return (
    <Modal title={loading ? 'Cargando...' : (paciente ? paciente.nombre : 'Detalle')} isOpen={isOpen} onClose={onClose}>
      {loading && <p>Cargando paciente...</p>}
      {!loading && paciente && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div><strong>CURP:</strong> {paciente.curp || 'N/A'}</div>
          <div><strong>Correo:</strong> {paciente.email || 'N/A'}</div>
          <div><strong>Teléfono:</strong> {paciente.telefono || 'N/A'}</div>
          <div><strong>Municipio:</strong> {paciente.municipio || 'N/A'}</div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button onClick={handleOpenFull} variant="secondary"><FaExternalLinkAlt /> Ver completo</Button>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
      {!loading && !paciente && <p>No se encontró el paciente.</p>}
    </Modal>
  );
}

export default DetallePacienteModal;
