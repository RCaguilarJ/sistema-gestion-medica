import { useState } from 'react';
// ... otros imports ...

const Modal = () => { // Componente principal exportado por default
    // 1. Agrega este estado para controlar el botón
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        // 2. IMPORTANTE: Prevenir el comportamiento por defecto del formulario
        e.preventDefault();

        // 3. Si ya se está enviando, no hacer nada (Evita doble clic)
        if (isSubmitting) return;

        // Bloqueamos el botón
        setIsSubmitting(true);

        try {
            // Aquí va tu llamada al servicio (axios/fetch)
            const response = await agendarCitaService({
                usuarioId: usuario.id,
                fecha: fechaSeleccionada,
                hora: horaSeleccionada,
                especialidad: especialidad
                // ... resto de datos
            });

            // Manejo de éxito
            alert('Cita agendada con éxito');
            cerrarModal(); // O redirigir

        } catch (error) {
            // Si el backend responde 409 (Duplicado), aquí lo capturamos
            alert(error.response?.data?.message || 'Error al agendar cita');
        } finally {
            // 4. Desbloqueamos el botón al terminar (sea éxito o error)
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ... tus inputs de fecha, hora, etc ... */}
            <button 
                type="submit" 
                disabled={isSubmitting}
                className={`btn btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? 'Agendando...' : 'Confirmar Cita'}
            </button>
        </form>
    );
};

export default Modal;