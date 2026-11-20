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
    auth/                  # sesiones firmadas y hash de contraseña
    middleware/auth.js     # sesión activa y permisos por rol
    models/usuarios.model.js
    models/pagos.model.js
    routes/auth.routes.js
    controllers/pagos.controller.js
    routes/pagos.routes.js
  scripts/              # inspección de esquema y prueba CRUD
  sql/                   # creación aditiva de pagos y usuarios_app
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
SESSION_SECRET=secreto_aleatorio_de_al_menos_32_caracteres
COOKIE_SECURE=false         # true en el servicio Render con HTTPS
```

El certificado CA descargado de Aiven está en `backend/certs/ca.pem`; `.gitignore` excluye tanto `backend/.env` como el certificado. El frontend no necesita variables de entorno porque usa la ruta relativa `/api/pagos`.

`SESSION_SECRET` firma las sesiones de inicio de sesión y debe ser distinto para cada entorno. Genéralo en PowerShell, copia el valor directamente a `backend/.env` y no lo compartas ni lo subas a Git:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

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

La autenticación agrega `usuarios_app` sin cambiar `pagos`. Después de revisar que la conexión apunta al esquema esperado, desde `backend/` ejecuta:

```powershell
npm run db:setup-users
npm run users:create-demo
# o crea una cuenta propia con contraseña elegida en el terminal:
npm run user:create -- usuario_admin admin
```

`users:create-demo` crea una cuenta de cada rol con claves aleatorias y guarda el texto de acceso solo en `backend/credenciales-roles-local.txt`, ignorado por Git. No vuelvas a ejecutarlo si ese archivo ya existe. `user:create` solicita la contraseña enmascarada en la terminal y la guarda como hash scrypt. Los roles permitidos son `admin`, `consulta` y `registro`. No existe registro público; las cuentas se crean manualmente. `usuarios_app` guarda el nombre, hash, rol y estado, nunca la contraseña en texto legible.

## API

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/pagos` | Listar |
| GET | `/api/pagos/:id` | Consultar |
| POST | `/api/pagos` | Crear |
| PUT | `/api/pagos/:id` | Actualizar |
| DELETE | `/api/pagos/:id` | Eliminar |
| GET | `/api/health` | Comprobar servidor y base |

La API de pagos exige sesión. `admin` puede consultar y administrar; `consulta` puede leer; `registro` puede crear únicamente. La autorización se verifica en el servidor. Las rutas de sesión son `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/me`.

Cada pago incluye cliente, servicio, referencia, valor positivo en COP, fecha y estado (`Pendiente` o `Pagado`). El backend valida los campos y usa consultas parametrizadas.

## Copias de seguridad (Eje 4)

Solo `admin` puede solicitar el proceso; el servidor verifica el rol. Al pulsar **Crear copia y restaurar prueba**, la aplicación toma una instantánea consistente de `pagos` y `usuarios_app`, crea el `.psbak` cifrado con AES-256-GCM y lo descarga. También descifra esa copia en memoria y restaura ambas tablas en copias nuevas de Aiven: `psr_<id>_pagos` y `psr_<id>_usuarios_app`. Las tablas originales no se modifican. La tabla `restauraciones_prueba` registra estado, fecha, nombres de tablas y conteos; el administrador puede consultar el historial y ver los pagos restaurados en la interfaz. Las cuentas restauradas conservan sus hashes, no contraseñas en texto plano.

Las copias restauradas dentro de Aiven se conservan como evidencia de prueba y el sistema no las borra automáticamente. Render no conserva el `.psbak` descargado; el administrador debe guardarlo en la ubicación privada externa acordada por el equipo. Las tablas de prueba adicionales consumen almacenamiento, por lo que el equipo debe acordar cómo gestionarlas antes de un uso prolongado.

Como procedimiento académico propuesto: ejecutar una copia cada semana (domingo, 8:00 p. m.) y antes de cada cambio de estructura; conservar las cuatro copias semanales más recientes (28 días), guardadas en una carpeta cifrada con acceso restringido y replicadas en almacenamiento privado del equipo; mantener una copia previa a cambios hasta validar su resultado. La persona con rol `admin` realiza y registra la copia; otro integrante revisa el registro. Hacer una restauración de prueba mensual en un esquema local vacío y anotar fecha, responsable, resultado y duración. El equipo debe acordar los nombres de responsables y la ubicación privada real antes de entregar la política.

Configura `BACKUP_ENCRYPTION_KEY` con 64 caracteres hexadecimales en `backend/.env` y como variable secreta en Render. Usa la misma clave para descifrar una copia creada en Render. Para generar una clave local en PowerShell sin compartirla en el chat:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Pega el resultado directamente en ambos entornos; no lo guardes en Git, capturas ni en el informe. Inicia sesión como administrador y pulsa **Crear copia y restaurar prueba**. Para preparar además una restauración local desde el archivo descargado, ejecuta desde `backend/` `npm run db:backup:prepare-restore -- "RUTA\archivo.psbak"`. El SQL generado queda bajo `tmp/restore/` (ignorado por Git); impórtalo solo en un esquema local de prueba vacío, nunca en `defaultdb`. El archivo SQL temporal contiene hashes y debe protegerse y eliminarse tras la verificación.

La operación sigue siendo manual: no programa copias semanales ni envía el archivo a almacenamiento externo. El calendario, la ubicación externa y el registro de cumplimiento son tareas operativas del equipo.

Ruta administrativa: `POST /api/backups` (requiere una sesión con rol `admin`).

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
