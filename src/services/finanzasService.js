import api from "./api.js";

export const getFinanceCatalog = async () => {
  const response = await api.get("/finanzas/catalogo");
  return response.data?.packages || [];
};

export const updateFinancePackagePrices = async (packageKey, prices) => {
  const response = await api.put(`/finanzas/catalogo/${packageKey}/precios`, prices);
  return response.data;
};

export const validateFinancialWorkbook = async (file) => {
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await api.post("/finanzas/importar/validar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const importFinancialWorkbook = async (file) => {
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await api.post("/finanzas/importar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
