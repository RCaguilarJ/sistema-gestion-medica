// src/services/api.js

//funcion para local
// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://admin.diabetesjalisco.org/api", // ✅ Este debe coincidir con el puerto real del backend
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;


//funcion para producción

import axios from "axios";

// EN PRODUCCIÓN: La URL será relativa '/api' (el mismo dominio que sirve la web)
// EN DESARROLLO: Usa https://admin.diabetesjalisco.org
const baseURL = import.meta.env.PROD 
  ? '/api' 
  : 'https://admin.diabetesjalisco.org/api';

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
