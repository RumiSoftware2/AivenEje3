-- Ejecutar solo después de inspeccionar el esquema y confirmar que no hay
-- una tabla de pagos reutilizable. No elimina ni modifica tablas existentes.
CREATE TABLE IF NOT EXISTS pagos (
  id INT NOT NULL AUTO_INCREMENT,
  cliente VARCHAR(100) NOT NULL,
  servicio VARCHAR(60) NOT NULL,
  referencia VARCHAR(60) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_pagos_valor_positivo CHECK (valor > 0),
  CONSTRAINT chk_pagos_estado CHECK (estado IN ('Pendiente', 'Pagado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
