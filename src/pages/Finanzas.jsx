import React, { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaFileUpload,
  FaMoneyCheckAlt,
  FaSpinner,
  FaUniversity,
} from "react-icons/fa";
import styles from "./Finanzas.module.css";
import Button from "../components/ui/Button.jsx";
import {
  getFinanceCatalog,
  importFinancialWorkbook,
  updateFinancePackagePrices,
  validateFinancialWorkbook,
} from "../services/finanzasService.js";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const buildPackageDrafts = (packages) =>
  Object.fromEntries(
    (packages || []).map((pkg) => [
      pkg.key,
      {
        annualPrice: `${pkg.annualPrice ?? ""}`,
        monthlyPrice: `${pkg.monthlyPrice ?? ""}`,
        promptPaymentPrice: `${pkg.promptPaymentPrice ?? ""}`,
      },
    ])
  );

const isPriceDraftInvalid = (draft) => {
  if (!draft) return true;

  return ["annualPrice", "monthlyPrice", "promptPaymentPrice"].some((field) => {
    const raw = draft[field];
    if (raw === "" || raw === null || raw === undefined) return true;
    const parsed = Number(raw);
    return Number.isNaN(parsed) || parsed < 0;
  });
};

function BenefitRow({ benefit, index }) {
  return (
    <div className={index % 2 === 0 ? styles.benefitRowLight : styles.benefitRowDark}>
      <div className={styles.benefitTitle}>{benefit.title}</div>
      <div className={styles.benefitDescription}>{benefit.description}</div>
    </div>
  );
}

function PackagePoster({
  pkg,
  draft,
  onPriceChange,
  onSavePrices,
  saving,
  feedback,
}) {
  const hasInvalidDraft = isPriceDraftInvalid(draft);

  return (
    <article className={styles.posterCard}>
      <div className={styles.posterHero}>
        <div className={styles.posterHeroBadge}>AMDJ</div>
        <div className={styles.posterHeroContent}>
          <p className={styles.posterEyebrow}>Asociacion Mexicana de Diabetes en Jalisco A.C.</p>
          <h2 className={styles.posterTitle}>{pkg.label}</h2>
          <p className={styles.posterDescription}>{pkg.heroDescription}</p>
          <div className={styles.posterPriceRow}>
            <span>{money.format(pkg.annualPrice)} anual</span>
            <span>{money.format(pkg.monthlyPrice)} mensual</span>
            <span>Pronto pago {money.format(pkg.promptPaymentPrice)}</span>
          </div>
        </div>
      </div>

      <div className={styles.priceEditorCard}>
        <div className={styles.priceEditorHeader}>
          <div>
            <h3>Editar precios</h3>
            <p>Cualquier cambio aqui se guarda y se refleja en estas plantillas.</p>
          </div>
          {feedback?.message ? (
            <span
              className={
                feedback.type === "error" ? styles.priceEditorFeedbackError : styles.priceEditorFeedbackOk
              }
            >
              {feedback.message}
            </span>
          ) : null}
        </div>

        <div className={styles.priceEditorGrid}>
          <label className={styles.priceField}>
            <span>Anual</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft?.annualPrice ?? ""}
              onChange={(event) => onPriceChange(pkg.key, "annualPrice", event.target.value)}
            />
          </label>

          <label className={styles.priceField}>
            <span>Mensual</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft?.monthlyPrice ?? ""}
              onChange={(event) => onPriceChange(pkg.key, "monthlyPrice", event.target.value)}
            />
          </label>

          <label className={styles.priceField}>
            <span>Pronto pago</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft?.promptPaymentPrice ?? ""}
              onChange={(event) => onPriceChange(pkg.key, "promptPaymentPrice", event.target.value)}
            />
          </label>
        </div>

        <div className={styles.priceEditorActions}>
          <Button onClick={() => onSavePrices(pkg.key)} disabled={saving || hasInvalidDraft}>
            {saving ? (
              <>
                <FaSpinner className="fa-spin" /> Guardando...
              </>
            ) : (
              "Guardar precios"
            )}
          </Button>
        </div>
      </div>

      <div className={styles.posterBenefits}>
        {pkg.benefits.map((benefit, index) => (
          <BenefitRow key={`${pkg.key}-${benefit.title}`} benefit={benefit} index={index} />
        ))}
      </div>
    </article>
  );
}

function WorkbookPreview({ result }) {
  const previewRows = Array.isArray(result?.preview) ? result.preview : [];
  const errors = Array.isArray(result?.errors) ? result.errors : [];

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewStats}>
        <Tag label={`Total ${result?.total || 0}`} />
        <Tag label={`Validos ${result?.validos || 0}`} />
        <Tag label={`Invalidos ${result?.invalidos || 0}`} />
      </div>

      {errors.length > 0 && (
        <div className={styles.errorBox}>
          <h4>Observaciones</h4>
          <ul>
            {errors.slice(0, 10).map((error, index) => (
              <li key={`${error.row || "x"}-${index}`}>
                {error.sheet ? `${error.sheet} ` : ""}
                {error.row ? `fila ${error.row}: ` : ""}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewRows.length > 0 && (
        <div className={styles.previewTableWrap}>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Membresia</th>
                <th>Estado</th>
                <th>Cuota</th>
                <th>Ultimo pago</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={`${row.pacienteId}-${row.nombrePaciente}`}>
                  <td>{row.nombrePaciente}</td>
                  <td>{row.tipoMembresia || "-"}</td>
                  <td>{row.estadoPago || "-"}</td>
                  <td>{row.cuota ? money.format(row.cuota) : "-"}</td>
                  <td>{row.ultimoPago?.paymentDate || row.ultimoPago?.paidIn || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Finanzas() {
  const [packages, setPackages] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogFeedback, setCatalogFeedback] = useState(null);
  const [savingPackageKey, setSavingPackageKey] = useState("");
  const [file, setFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [workbookError, setWorkbookError] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        setCatalogError("");
        const data = await getFinanceCatalog();
        const nextPackages = Array.isArray(data) ? data : [];
        setPackages(nextPackages);
        setPriceDrafts(buildPackageDrafts(nextPackages));
      } catch (err) {
        console.error("Error cargando catalogo financiero:", err);
        setCatalogError("No se pudo cargar el catalogo financiero.");
      } finally {
        setLoadingCatalog(false);
      }
    };

    void loadCatalog();
  }, []);

  const canImport = useMemo(
    () => Boolean(file && validationResult?.validos > 0 && !validating && !importing),
    [file, validationResult, validating, importing]
  );

  const handlePriceChange = (packageKey, field, value) => {
    setCatalogFeedback((current) => (current?.packageKey === packageKey ? null : current));
    setPriceDrafts((current) => ({
      ...current,
      [packageKey]: {
        ...current[packageKey],
        [field]: value,
      },
    }));
  };

  const handleSavePrices = async (packageKey) => {
    const draft = priceDrafts[packageKey];
    if (isPriceDraftInvalid(draft)) {
      setCatalogFeedback({
        packageKey,
        type: "error",
        message: "Captura montos validos antes de guardar.",
      });
      return;
    }

    try {
      setSavingPackageKey(packageKey);
      setCatalogError("");
      const result = await updateFinancePackagePrices(packageKey, {
        annualPrice: Number(draft.annualPrice),
        monthlyPrice: Number(draft.monthlyPrice),
        promptPaymentPrice: Number(draft.promptPaymentPrice),
      });

      const nextPackages = Array.isArray(result?.packages) ? result.packages : packages;
      setPackages(nextPackages);
      setPriceDrafts(buildPackageDrafts(nextPackages));
      setCatalogFeedback({
        packageKey,
        type: "success",
        message: "Precios guardados.",
      });
    } catch (err) {
      console.error("Error actualizando precios del catalogo:", err);
      setCatalogFeedback({
        packageKey,
        type: "error",
        message: err.response?.data?.error || "No se pudieron guardar los precios.",
      });
    } finally {
      setSavingPackageKey("");
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setWorkbookError("");
    setImportResult(null);
    try {
      setValidating(true);
      const result = await validateFinancialWorkbook(file);
      setValidationResult(result);
    } catch (err) {
      console.error("Error validando archivo financiero:", err);
      setValidationResult(null);
      setWorkbookError(err.response?.data?.error || "No se pudo validar el archivo financiero.");
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setWorkbookError("");
    try {
      setImporting(true);
      const result = await importFinancialWorkbook(file);
      setImportResult(result);
    } catch (err) {
      console.error("Error importando archivo financiero:", err);
      setImportResult(null);
      setWorkbookError(err.response?.data?.error || "No se pudo importar el archivo financiero.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Modulo de finanzas</p>
          <h1 className={styles.pageTitle}>Paquetes, membresias y control financiero</h1>
          <p className={styles.pageSubtitle}>
            Consulta el catalogo de membresias y sincroniza el libro de Excel usado como base financiera.
          </p>
        </div>
      </section>

      <section className={styles.importCard}>
        <div className={styles.importCardHeader}>
          <div>
            <h3>Sincronizar Excel financiero</h3>
            <p>
              Usa el archivo de finanzas para actualizar membresia y estado de pago en el expediente de cada paciente.
            </p>
          </div>
          <div className={styles.importIcons}>
            <FaUniversity />
            <FaMoneyCheckAlt />
          </div>
        </div>

        <div className={styles.importControls}>
          <label className={styles.filePicker}>
            <FaFileUpload />
            <span>{file ? file.name : "Seleccionar archivo Excel"}</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setFile(nextFile);
                setValidationResult(null);
                setImportResult(null);
                setWorkbookError("");
              }}
            />
          </label>

          <Button onClick={handleValidate} disabled={!file || validating || importing}>
            {validating ? <><FaSpinner className="fa-spin" /> Validando...</> : "Validar archivo"}
          </Button>

          <Button onClick={handleImport} disabled={!canImport}>
            {importing ? <><FaSpinner className="fa-spin" /> Importando...</> : "Importar finanzas"}
          </Button>
        </div>

        {workbookError && <p className={styles.errorText}>{workbookError}</p>}
        {validationResult && <WorkbookPreview result={validationResult} />}
        {importResult && (
          <div className={styles.successBox}>
            <FaCheckCircle />
            <div>
              <strong>Importacion completada</strong>
              <p>
                Se actualizaron {importResult.actualizados || 0} pacientes con informacion de membresia y estado.
              </p>
            </div>
          </div>
        )}
      </section>

      {catalogError ? <p className={styles.catalogError}>{catalogError}</p> : null}

      <section className={styles.posterGrid}>
        {loadingCatalog ? (
          <div className={styles.catalogLoading}>
            <FaSpinner className="fa-spin" /> Cargando membresias...
          </div>
        ) : (
          packages.map((pkg) => (
            <PackagePoster
              key={pkg.key}
              pkg={pkg}
              draft={priceDrafts[pkg.key]}
              onPriceChange={handlePriceChange}
              onSavePrices={handleSavePrices}
              saving={savingPackageKey === pkg.key}
              feedback={catalogFeedback?.packageKey === pkg.key ? catalogFeedback : null}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default Finanzas;
