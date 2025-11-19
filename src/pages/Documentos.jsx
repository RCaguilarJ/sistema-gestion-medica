// src/pages/pacientes/Documentos.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

const Documentos = ({ pacienteId }) => {
    const [docs, setDocs] = useState([]);

    useEffect(() => {
        api.get(`/documentos/${pacienteId}`)
            .then((res) => setDocs(res.data))
            .catch(err => console.error("Error fetching documentos:", err));
    }, [pacienteId]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("archivo", file);
        formData.append("pacienteId", pacienteId);

        api.post("/documentos/upload", formData).then(() => {
            api.get(`/documentos/${pacienteId}`).then((res) => setDocs(res.data));
        }).catch(err => alert("Error subiendo documento"));
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Documentos</h2>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">
                    Subir Documento
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            <p className="text-gray-500 mb-4">
                Archivos y documentación del paciente
            </p>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Categoría</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Cargado por</th>
                        <th className="p-2">Tamaño</th>
                        <th className="p-2 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {docs.map((doc) => (
                        <tr key={doc.id} className="border-t">
                            <td className="p-2">{doc.nombre}</td>
                            <td className="p-2">{doc.categoria}</td>
                            <td className="p-2">{doc.fecha}</td>
                            <td className="p-2">{doc.cargado_por}</td>
                            <td className="p-2">{doc.tamano}</td>
                            <td className="p-2 text-center space-x-2">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500"
                                >
                                    Descargar
                                </a>
                                <button
                                    onClick={() => api.delete(`/documentos/${doc.id}`)}
                                    className="text-red-500"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {docs.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-6 text-gray-400">
                                No hay documentos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Documentos;
