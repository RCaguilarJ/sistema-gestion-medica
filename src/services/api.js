// src/services/api.js

//funcion para local
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:4000/api", // ✅ Este debe coincidir con el puerto real del backend
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
// EN DESARROLLO: Sigue siendo localhost:4000
const baseURL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:4000/api';

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