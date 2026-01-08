Snippets para actualizar frontend React

1) Cambiar baseURL en `src/services/api.js` (opcional si usas ruta absoluta en las APIs):

```javascript
// src/services/api.js
import axios from 'axios';
const baseURL = 'http://localhost/asosiacionMexicanaDeDiabetes/api';
const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
export default api;
```

2) Actualizar `createCita` para POST a `create_cita.php`:

```javascript
// src/services/consultaCitaService.js
import api from './api.js';
export const createCita = async (pacienteId, citaData) => {
  try {
    const payload = { pacienteId, ...citaData };
    const response = await api.post('/create_cita.php', payload);
    return response.data;
  } catch (error) {
    console.error('Error al agendar cita:', error);
    throw error.response?.data || new Error('Error al agendar cita');
  }
};
```

3) Polling simple para notificaciones (ejemplo en `App.jsx` o Layout):

```javascript
import { useEffect } from 'react';
import api from './services/api';

useEffect(() => {
  let timer;
  const role = (user?.role || '').toUpperCase().trim();
  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api_get_notifications.php?role=${role}`);
      const notes = res.data || res; // dependiendo del adapter
      if (notes && notes.length) {
        // mostrar toast o añadir al estado de notificaciones
        console.log('Nuevas notificaciones', notes);
      }
    } catch (err) { console.error(err); }
  };
  fetchNotifications();
  timer = setInterval(fetchNotifications, 15000); // cada 15s
  return () => clearInterval(timer);
}, [user]);
```

Ajusta rutas y nombres si mueves los archivos al directorio `api/`.
