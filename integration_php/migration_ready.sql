-- migration_ready.sql
-- Instrucciones: hacer backup antes de ejecutar. Importar en phpMyAdmin
-- Seleccionar la base de datos correcta (ej. `sistema_gestion_medica`) y ejecutar.

-- 1) Añadir columna `especialidad` a `citas` (seguro: funciona en MySQL 8+)
ALTER TABLE `citas`
ADD COLUMN IF NOT EXISTS `especialidad` VARCHAR(64) NOT NULL DEFAULT 'GENERAL';

-- 1b) Bloque alternativo compatible con versiones antiguas de MySQL
-- (ejecutar sólo si 'ADD COLUMN IF NOT EXISTS' falla en tu servidor)

-- BEGIN BLOQUE PARA MYSQL < 8
SET @db := DATABASE();
SELECT COUNT(*) INTO @cnt
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = @db
   AND TABLE_NAME = 'citas'
   AND COLUMN_NAME = 'especialidad';

SET @sql := IF(@cnt = 0,
  'ALTER TABLE `citas` ADD COLUMN `especialidad` VARCHAR(64) NOT NULL DEFAULT \'GENERAL\'',
  'SELECT "column_exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- END BLOQUE PARA MYSQL < 8

-- 2) Crear tabla `notifications` (almacena notificaciones dirigidas por rol o especialidad)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `tipo` VARCHAR(50) DEFAULT 'info',
  `rol_destino` VARCHAR(100) DEFAULT NULL,
  `especialidad_destino` VARCHAR(100) DEFAULT NULL,
  `referencia_tipo` VARCHAR(50) DEFAULT NULL,
  `referencia_id` INT DEFAULT NULL,
  `leido` TINYINT(1) DEFAULT 0,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`rol_destino`),
  INDEX (`especialidad_destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Crear tabla `contactos` (mensajes recibidos desde la app / formulario)
CREATE TABLE IF NOT EXISTS `contactos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `asunto` VARCHAR(255) DEFAULT NULL,
  `mensaje` TEXT,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Opcional: verificar/ajustar valores existentes (ejemplo)
-- UPDATE `citas` SET `especialidad` = 'GENERAL' WHERE `especialidad` IS NULL;

-- NOTA:
-- 1) Hacer backup antes de ejecutar (mysqldump o Export en phpMyAdmin).
-- 2) Si usas phpMyAdmin: selecciona la BD -> pestaña SQL -> pegar y ejecutar.
-- 3) Si ejecutas por CLI: mysql -u usuario -p nombre_bd < migration_ready.sql
-- 4) Después de ejecutar, prueba el endpoint create_cita.php y verifica tablas `citas` y `notifications`.
