import api from './api.js';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo stats del dashboard:', error);
    // Retornar estructura vacía para evitar crash
    return {
      kpis: { total: 0, activos: 0 },
      hba1c: [0, 0, 0],
      imc: [0, 0, 0],
      municipios: { labels: [], data: [] }
    };
  }
};