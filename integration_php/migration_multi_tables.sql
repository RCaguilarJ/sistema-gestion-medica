-- migration_multi_tables.sql
-- Maneja ambos nombres de tabla: `cita` (en sistema_gestion_medica) y `citas` (en diabetes_db)
-- IMPORTANTE: hacer backup antes de ejecutar.

-- ==================================================
-- 1) Verificar y añadir columna `especialidad` en `cita` (BD: sistema_gestion_medica)
-- Selecciona la BD 'sistema_gestion_medica' en phpMyAdmin o ejecuta desde CLI con la DB correcta.
-- Si usas phpMyAdmin: selecciona la BD -> pestaña SQL -> pega solo el bloque correspondiente y ejecuta.

-- Bloque seguro para MySQL (comprobación + ALTER) sobre tabla `cita`:
SET @db := 'sistema_gestion_medica';
SELECT COUNT(*) INTO @cnt
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = @db
   AND TABLE_NAME = 'cita'
   AND COLUMN_NAME = 'especialidad';

SET @sql := IF(@cnt = 0,
  CONCAT('ALTER TABLE `', @db, '`.`cita` ADD COLUMN `especialidad` VARCHAR(64) NOT NULL DEFAULT \'GENERAL\''),
  'SELECT "column_exists_in_cita"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- 2) Verificar y añadir columna `especialidad` en `citas` (BD: diabetes_db)
SET @db2 := 'diabetes_db';
SELECT COUNT(*) INTO @cnt2
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = @db2
   AND TABLE_NAME = 'citas'
   AND COLUMN_NAME = 'especialidad';

SET @sql2 := IF(@cnt2 = 0,
  CONCAT('ALTER TABLE `', @db2, '`.`citas` ADD COLUMN `especialidad` VARCHAR(64) NOT NULL DEFAULT \'GENERAL\''),
  'SELECT "column_exists_in_citas"');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ==================================================
-- 3) NOTAS:
-- - Si phpMyAdmin no permite ejecutar múltiples bloques PREPARE por seguridad, ejecuta cada bloque por separado seleccionando la BD correspondiente.
-- - Alternativa simple (si estás en la BD correcta):
--   ALTER TABLE `cita` ADD COLUMN `especialidad` VARCHAR(64) NOT NULL DEFAULT 'GENERAL';
--   ALTER TABLE `citas` ADD COLUMN `especialidad` VARCHAR(64) NOT NULL DEFAULT 'GENERAL';
-- - Después de ejecutar, verifica con:
--   SHOW FULL COLUMNS FROM `cita` WHERE Field = 'especialidad';
--   SHOW FULL COLUMNS FROM `citas` WHERE Field = 'especialidad';

-- ==================================================
-- 4) Crear tablas `notifications` y `contactos` (si no existen)
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

CREATE TABLE IF NOT EXISTS `contactos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `asunto` VARCHAR(255) DEFAULT NULL,
  `mensaje` TEXT,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FIN
