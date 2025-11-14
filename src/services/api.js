// src/services/api.js
import axios from 'axios';

const api = axios.create({
  // Apuntamos a nuestro nuevo backend de Express
  baseURL: 'http://localhost:4000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;