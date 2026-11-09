# Pay Services

CRUD académico sencillo para registrar pagos simulados de servicios. No procesa dinero real. El proyecto separa backend y frontend, sin framework de interfaz: Express entrega los archivos HTML/CSS/JavaScript y la API desde el mismo servicio; MySQL en Aiven guarda los registros.

## Estructura

```text
backend/
  server.js
  package.json
  .env                  # local, ignorado por Git
  certs/ca.pem           # CA Aiven local, ignorada por Git
  src/
    app.js
    config/db.js
    models/pagos.model.js
    controllers/pagos.controller.js
    routes/pagos.routes.js
  scripts/              # inspección de esquema y prueba CRUD
  sql/create-pagos.sql
  test/
frontend/
  index.html
  css/styles.css
  js/app.js
docs/INFORME_EJE3.md
evidencias/
```

## Variables privadas

La configuración se lee solo desde `backend/.env`. Ese archivo ya tiene los datos de host, puerto, usuario y base que compartiste; la clave nueva va después de `DB_PASSWORD=`. No pegues la clave en el chat. El archivo está excluido de Git.

```env
PORT=3000
DB_HOST=...              # ya está en backend/.env
DB_PORT=...              # ya está en backend/.env
DB_USER=...              # ya está en backend/.env
DB_PASSWORD=             # escribe aquí la contraseña nueva de Aiven
DB_NAME=...              # ya está en backend/.env
DB_SSL=true
DB_CA_PATH=certs/ca.pem
```

El certificado CA descargado de Aiven está en `backend/certs/ca.pem`; `.gitignore` excluye tanto `backend/.env` como el certificado. El frontend no necesita variables de entorno porque usa la ruta relativa `/api/pagos`.

## Instalar e iniciar

En PowerShell, desde la carpeta raíz:

```powershell
cd backend
npm install
npm start
```

Abre <http://localhost:3000>. Para cambios con reinicio automático usa `npm run dev`.

## Reactivar el servicio gratuito en Render

Render puede suspender una instancia gratuita tras 15 minutos sin tráfico. La primera solicitud vuelve a iniciarla y puede tardar cerca de un minuto. Al abrir el sitio, esa visita ya inicia la instancia; el botón **Conectar / reintentar** de Pay Services consulta `/api/health`, muestra el estado de Aiven y reintenta durante un tiempo limitado si Render sigue despertando. No envía pings permanentes ni evita que Render suspenda la instancia por inactividad. [Límites del plan gratuito de Render](https://render.com/docs/free).

## Base de datos

Cuando completes `backend/.env`, desde `backend/` revisa primero las tablas y relaciones reales:

```powershell
npm run db:inspect
```

La inspección confirmó que `defaultdb` estaba vacía. Se creó la tabla mínima `pagos` con `CREATE TABLE IF NOT EXISTS`; no se borró ni modificó ninguna tabla previa. Para repetir la preparación en un entorno nuevo ejecuta `npm run db:setup` después de inspeccionar.

## API

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/pagos` | Listar |
| GET | `/api/pagos/:id` | Consultar |
| POST | `/api/pagos` | Crear |
| PUT | `/api/pagos/:id` | Actualizar |
| DELETE | `/api/pagos/:id` | Eliminar |
| GET | `/api/health` | Comprobar servidor y base |

Cada pago incluye cliente, servicio, referencia, valor positivo en COP, fecha y estado (`Pendiente` o `Pagado`). El backend valida los campos y usa consultas parametrizadas.

## Pruebas

Desde `backend/`, `npm test` ejecuta las pruebas unitarias de validación. Con Aiven conectado y el servidor iniciado, `node scripts/smoke-crud.js` prueba el CRUD real y elimina el registro de prueba al terminar.

Verificado: seis pruebas unitarias aprobadas; conexión Aiven TLS; inspección de la tabla; ciclo CRUD completo con `node scripts/smoke-crud.js`; y persistencia tras reiniciar el servidor. Las pruebas CRUD limpiaron sus registros temporales. No se ha publicado todavía en Render.

## Despliegue en Render

Frontend y API se despliegan juntos en un Web Service:

- Build command: `cd backend && npm ci`
- Start command: `cd backend && npm start`
- En Environment añade las variables privadas de `backend/.env` y `DB_SSL=true`. Agrega `ca.pem` en Secret Files y establece `DB_CA_PATH=/etc/secrets/ca.pem`. Render expone los archivos secretos bajo `/etc/secrets/` en tiempo de ejecución ([documentación](https://render.com/docs/configure-environment-variables)). No subas `.env` ni el certificado CA al repositorio.

Servicio desplegado: [https://aiveneje3.onrender.com](https://aiveneje3.onrender.com). La conexión `/api/health` se comprobó con estado `ok` y base `connected`. En el plan gratuito Render puede dormir el servicio tras 15 minutos sin tráfico; el botón **Conectar / reintentar** consulta su estado y reintenta durante el arranque, pero no mantiene el servicio activo en segundo plano.

## Documentos

- Fuente editable actualizada del informe: `docs/INFORME_EJE3.md`. El PDF existente en `output/pdf/Informe_Academico_Pay_Services.pdf` conserva el borrador anterior y debe regenerarse antes de entregar.
- Fuente editable: `docs/INFORME_EJE3.md`.
- Evidencias: `evidencias/README.md` indica cuáles faltan por capturar en una sesión real con Aiven.

## Referencias consultadas

- [Node.js](https://nodejs.org/docs/)
- [Express](https://expressjs.com/)
- [MySQL2 - SSL/TLS](https://sidorares.github.io/node-mysql2/docs/documentation/ssl)
- [Aiven - certificados TLS](https://aiven.io/docs/platform/concepts/tls-ssl-certificates)
- [Aiven - conexión MySQL](https://aiven.io/docs/products/mysql/howto/connect-from-mysql-workbench)
- [Render - Web Services](https://render.com/docs/web-services)
- [Render - variables de entorno y secretos](https://render.com/docs/configure-environment-variables)
