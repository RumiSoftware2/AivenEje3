# ESPECIFICACIÓN TÉCNICA --- PAY SERVICES

## 1. Propósito

Pay Services es una aplicación web académica para administrar registros
simulados de pagos de servicios. Demuestra conexión con MySQL en Aiven,
operaciones CRUD, correspondencia entre modelo relacional y objetos, y
persistencia. No procesa dinero real ni se conecta con bancos.

## 2. Datos y CRUD

La funcionalidad principal administra pagos. Si el esquema del Eje 2 ya
tiene tablas de clientes, servicios y pagos, reutiliza esas tablas y sus
relaciones. No dupliques entidades ni cambies innecesariamente el modelo
existente.

Si no existe una estructura reutilizable, crea una tabla mínima `pagos`
con:

  -----------------------------------------------------------------------
  Campo                   Tipo sugerido           Regla
  ----------------------- ----------------------- -----------------------
  id                      INT                     Clave primaria
                                                  autoincremental

  cliente                 VARCHAR(100)            Obligatorio

  servicio                VARCHAR(60)             Obligatorio: agua,
                                                  energía, internet, gas,
                                                  etc.

  referencia              VARCHAR(60)             Obligatorio; dato
                                                  ficticio

  valor                   DECIMAL(12,2)           Mayor que cero

  fecha_pago              DATE                    Obligatorio

  estado                  VARCHAR(20)             Pendiente o Pagado
  -----------------------------------------------------------------------

No ejecutes cambios destructivos. Si hay que modificar el esquema
existente, explica primero el SQL y solicita autorización.

## 3. API REST

Implementa y documenta estas rutas:

  Método   Ruta               Acción
  -------- ------------------ -------------------
  GET      `/api/pagos`       Listar pagos
  GET      `/api/pagos/:id`   Consultar un pago
  POST     `/api/pagos`       Crear
  PUT      `/api/pagos/:id`   Actualizar
  DELETE   `/api/pagos/:id`   Eliminar

Usa JSON y códigos HTTP apropiados (`200`, `201`, `400`, `404`, `500`).
Ejemplo ilustrativo:

``` json
{
  "cliente": "Cliente de prueba",
  "servicio": "Internet",
  "referencia": "REF-001",
  "valor": 85000,
  "fecha_pago": "2026-11-08",
  "estado": "Pendiente"
}
```

Es solo un ejemplo de estructura, no un registro que deba insertarse
automáticamente.

## 4. Estructura sugerida

``` text
pay-services/
├── src/
│   ├── config/database.js
│   ├── routes/pagos.routes.js
│   └── controllers/pagos.controller.js
├── public/
│   ├── index.html
│   ├── css/styles.css
│   ├── js/app.js
│   └── assets/logo-areandina.png
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

Puedes simplificarla si el resultado queda claro.

## 5. Conexión Aiven

Utiliza `mysql2/promise` y un pool de conexiones. Lee host, puerto,
usuario, contraseña y base desde `.env`. El servicio Aiven mostrado por
el usuario requiere SSL. Configura TLS según la documentación vigente de
Aiven; si proporciona certificado CA, utilízalo. No desactives
indiscriminadamente la verificación TLS.

Ejemplo orientativo, que debes completar y verificar:

``` js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true"
    ? { /* configuración TLS verificada para Aiven */ }
    : undefined,
  waitForConnections: true,
  connectionLimit: 5
});

module.exports = pool;
```

Crea `GET /api/health` para comprobar que el servidor está activo y que
la base responde, sin devolver credenciales ni información sensible.

## 6. Mapeo relacional--objetos

Explica el mapeo real en el documento:

  Modelo relacional   Modelo de objetos/API
  ------------------- ------------------------------------
  Tabla de pagos      Colección de objetos de pago
  Fila                Objeto JavaScript
  Columna             Propiedad del objeto
  Clave primaria      Identificador `id`
  Clave foránea       Referencia al registro relacionado
  INSERT              Crear registro persistido
  SELECT              Recuperar objetos desde MySQL
  UPDATE              Modificar registro
  DELETE              Eliminar registro

El proyecto utiliza consultas SQL con `mysql2`, no un ORM. El mapeo se
realiza explícitamente al convertir filas MySQL en objetos JavaScript y
los datos recibidos por la API en parámetros SQL. Si existen relaciones
con clientes o servicios, explica sus claves foráneas y cómo se
representan en la API.

## 7. Interfaz

Diseña una interfaz sencilla, moderna, en español y adaptable: -
Encabezado con nombre Pay Services. - Formulario para crear y editar
pagos. - Tabla o listado de pagos. - Acciones editar y eliminar. -
Mensajes de éxito y error. - Indicador de carga y estado vacío. -
Importes en pesos colombianos (COP).

Al editar, carga los datos en el formulario y cambia el botón a
"Actualizar pago". Permite cancelar edición. Al eliminar, solicita
confirmación. La interfaz usa `fetch` para llamar a la API; nunca debe
conectarse directamente a MySQL.

## 8. Validación y seguridad

-   Usa consultas parametrizadas (`?`) en SQL.
-   Valida campos obligatorios, importe positivo, fecha y estado en
    backend.
-   No confíes solo en la validación del navegador.
-   No pongas secretos en JavaScript del frontend.
-   Mantén `.env` en `.gitignore`.
-   No muestres credenciales en README, PDF ni capturas.
-   Usa datos ficticios para las demostraciones.

## 9. Persistencia

Demuestra con MySQL Aiven: 1. Crear un pago desde la interfaz. 2.
Consultarlo en la interfaz. 3. Comprobar que se guardó en MySQL. 4.
Reiniciar el servidor o recargar la aplicación. 5. Confirmar que el
registro sigue disponible. 6. Editar y eliminar y verificar los cambios
en la base.

No uses arreglos en memoria ni `localStorage` como base principal. MySQL
Aiven es el origen de verdad.
