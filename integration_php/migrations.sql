-- Migrations: add `especialidad` and notification/contact tables

-- 1) Agrega columna `especialidad` a la tabla `citas`
ALTER TABLE citas
  ADD COLUMN especialidad VARCHAR(64) DEFAULT 'GENERAL';

-- 2) Crea tabla `notifications` para notificaciones internas
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  referencia_id INT NULL,
  mensaje TEXT NOT NULL,
  target_role VARCHAR(50) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) Tabla `contactos` (si no existe) para almacenar mensajes del formulario de contacto
CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
