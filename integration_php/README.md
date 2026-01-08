Integración entre React (SPA) y plataforma PHP

Archivos creados en this folder:
- migrations.sql -> SQL para agregar `especialidad`, `notifications` y `contactos`.
- api_create_cita.php -> endpoint para crear cita y generar notificación.
- api_create_contact.php -> endpoint para crear contacto y notificación a ADMIN.
- api_get_notifications.php -> endpoint para consultar notificaciones por rol.

Pasos rápidos:
1) Ejecuta `integration_php/migrations.sql` en tu base de datos (phpMyAdmin o CLI).
2) Copia `api_create_cita.php`, `api_create_contact.php`, `api_get_notifications.php` a la carpeta `api/` de tu proyecto PHP.
3) Ajusta `require_once` si tu `includes/db.php` está en otro path. Asegúrate que exporte `$db` (PDO) o `$conn` (mysqli).
4) Actualiza el frontend React (`src/services/api.js`) para apuntar al endpoint PHP: ejemplo `const baseURL = "http://localhost/asosiacionMexicanaDeDiabetes/api"`.
5) En React, ajusta `createCita` para hacer POST a `create_cita.php`.
6) Para notificaciones en tiempo real considera:
   - Implementar polling en React llamando a `api_get_notifications.php?role=ROL` cada 10-20s
   - O usar WebSockets / Ratchet o un servicio externo (Pusher) para emitir eventos en tiempo real.

Snippets de frontend en `frontend_snippets.md`.
