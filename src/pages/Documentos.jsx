import React, { useEffect, useRef, useState } from "react";
import { FiUpload, FiTrash2, FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import api from "../services/api";
import styles from "./Documentos.module.css";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatSize = (value) => {
  if (!value && value !== 0) return "-";
  const size = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(size)) return value;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const Documentos = ({ pacienteId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/documentos/${pacienteId}`);
      setDocs(res.data || []);
    } catch (err) {
      console.error("Error fetching documentos:", err);
      setError("No pudimos cargar los documentos. Intenta refrescar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("pacienteId", pacienteId);

    try {
      await api.post("/documentos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Documento cargado correctamente.");
      await fetchDocs();
    } catch (err) {
      console.error("Error subiendo documento:", err);
      setError("No se pudo subir el documento. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    uploadFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const handleDelete = async (docId) => {
    setError("");
    try {
      await api.delete(`/documentos/${docId}`);
      setMessage("Documento eliminado.");
      await fetchDocs();
    } catch (err) {
      console.error("Error eliminando documento:", err);
      setError("No se pudo eliminar el documento.");
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  const getFilenameFromDisposition = (headerValue, fallback) => {
    if (!headerValue) return fallback;
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^\";]+)"?/i.exec(headerValue);
    const name = decodeURIComponent(match?.[1] || match?.[2] || "").trim();
    return name || fallback;
  };

  const handleDownload = async (doc) => {
    try {
      const url = doc.downloadUrl || `/documentos/${doc.id}/descargar`;
      const res = await api.get(url, { responseType: "blob" });
      const filename = getFilenameFromDisposition(
        res.headers?.["content-disposition"],
        doc.nombre || "documento"
      );
      const blobUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error descargando documento:", err);
      setError("No se pudo descargar el documento.");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Documentos</p>
          <h3 className={styles.title}>Archivos del paciente</h3>
          <p className={styles.subtitle}>Sube PDFs, imágenes o resultados y mantenlos ordenados.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            onClick={fetchDocs}
            disabled={loading || uploading}
            title="Refrescar listado"
          >
            <FiRefreshCw className={loading ? styles.spin : ""} />
          </button>
          <label className={`${styles.uploadButton} ${uploading ? styles.uploading : ""}`}>
            <FiUpload />
            {uploading ? "Subiendo..." : "Subir documento"}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div
        className={styles.uploadZone}
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className={styles.uploadIcon}>
          <FiFileText />
        </div>
        <div className={styles.uploadCopy}>
          <p className={styles.uploadTitle}>Arrastra y suelta o haz clic para seleccionar</p>
          <p className={styles.uploadHint}>Formatos PDF, JPG, PNG. Límite recomendado 10 MB.</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>Seguro</span>
          <span className={styles.badge}>Organizado</span>
        </div>
      </div>

      {(message || error) && (
        <div className={`${styles.alert} ${error ? styles.alertError : styles.alertSuccess}`}>
          {error || message}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span>Categoría</span>
          <span>Fecha</span>
          <span>Cargado por</span>
          <span>Tamaño</span>
          <span className={styles.actionsCol}>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.skeletonList}>
            {[1, 2, 3].map((key) => (
              <div key={key} className={styles.skeletonRow} />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiFileText />
            </div>
            <div>
              <p className={styles.emptyTitle}>No hay documentos registrados</p>
              <p className={styles.emptyText}>Sube el primer archivo para iniciar el expediente digital.</p>
            </div>
          </div>
        ) : (
          <div className={styles.tableBody}>
            {docs.map((doc) => (
              <div key={doc.id} className={styles.row}>
                <div>
                  <p className={styles.docName}>{doc.nombre}</p>
                  <p className={styles.docMeta}>{doc.descripcion || "Sin descripción"}</p>
                </div>
                <span className={styles.docTag}>{doc.categoria || "General"}</span>
                <span className={styles.docMeta}>{formatDate(doc.fecha)}</span>
                <span className={styles.docMeta}>{doc.cargado_por || "—"}</span>
                <span className={styles.docMeta}>{formatSize(doc.tamano)}</span>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => handleDownload(doc)}
                  >
                    <FiDownload /> Descargar
                  </button>
                  <button
                    className={styles.dangerButton}
                    onClick={() => handleDelete(doc.id)}
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentos;
