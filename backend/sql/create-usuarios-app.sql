-- Adición segura: crea únicamente la tabla de cuentas de Pay Services.
-- No modifica la tabla pagos ni elimina datos existentes.
CREATE TABLE IF NOT EXISTS usuarios_app (
  id INT NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(80) NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  rol ENUM('admin', 'consulta', 'registro') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_app_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
