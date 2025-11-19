// src/pages/pacientes/Nutricion.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

const Nutricion = ({ pacienteId }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Ajuste: Verificar si la ruta de la API es correcta. 
        // Si el backend no tiene /nutricion, esto fallará (404), pero no error de build.
        api.get(`/nutricion/${pacienteId}`)
            .then((res) => setData(res.data))
            .catch(err => console.error("Error fetching nutricion:", err));
    }, [pacienteId]);

    if (!data) return <p>Cargando información nutricional...</p>;

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Información Nutricional</h2>
            <p className="text-gray-500 mb-4">Antropometría y planes alimenticios</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="font-medium">IMC Actual</label>
                    <input
                        value={data.imc || ''}
                        readOnly
                        className="mt-1 w-full border rounded-lg p-2 bg-gray-50"
                    />
                </div>
                <div>
                    <label className="font-medium">Nutriólogo Asignado</label>
                    <input
                        value={data.nutriologo || ''}
                        readOnly
                        className="mt-1 w-full border rounded-lg p-2 bg-gray-50"
                    />
                </div>
                <div>
                    <label className="font-medium">Estado Nutricional</label>
                    <input
                        value={data.estado || ''}
                        readOnly
                        className="mt-1 w-full border rounded-lg p-2 bg-gray-50"
                    />
                </div>
            </div>

            <hr className="my-4" />

            <h3 className="text-md font-semibold mb-2">Planes de Alimentación</h3>
            {(!data.planes || data.planes.length === 0) ? (
                <div className="text-center py-8 text-gray-400">
                    <i className="fa-regular fa-file text-3xl mb-2"></i>
                    <p>No hay planes nutricionales registrados</p>
                    <button className="text-blue-600 font-medium mt-2">
                        Crear plan nutricional
                    </button>
                </div>
            ) : (
                <ul>
                    {data.planes.map((p) => (
                        <li key={p.id} className="py-2 border-b">
                            <strong>{p.nombre}</strong> – {p.fecha}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Nutricion;
