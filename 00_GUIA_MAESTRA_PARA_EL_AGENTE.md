# GUÍA MAESTRA PARA EL AGENTE --- PAY SERVICES

## Misión

Trabaja directamente en la carpeta seleccionada en VS Code. Construye,
prueba y deja listo un proyecto académico pequeño llamado **Pay
Services**, para la Actividad Evaluativa Eje 3 de Gestión de Bases de
Datos de la Fundación Universitaria del Área Andina.

Lee también `01_ESPECIFICACION_TECNICA.md` y
`02_ENTREGA_EVIDENCIAS_Y_DESPLIEGUE.md`. No te limites a dar
instrucciones: crea los archivos, implementa la aplicación, ejecútala y
prueba el CRUD.

## Alcance

Una aplicación web para administrar pagos simulados de servicios
mediante un único CRUD: - Crear un pago. - Listar y consultar pagos. -
Editar un pago. - Eliminar un pago con confirmación.

No procesa dinero real. No implementes autenticación, roles, pasarela
bancaria, notificaciones, microservicios, Docker, paneles complejos ni
funcionalidades ajenas al objetivo.

## Tecnologías

-   Node.js + Express para API y servidor.
-   `mysql2` para MySQL.
-   HTML, CSS y JavaScript nativo para el frontend.
-   `dotenv` para variables de entorno.
-   `express.static` para servir la interfaz desde Express.

No uses React, Angular, Vue, TypeScript, Sequelize ni herramientas
innecesarias. El objetivo es desplegar frontend y API juntos como un
único servicio web en Render.

## Inspección inicial

1.  Examina la carpeta seleccionada y su contenido.
2.  Identifica si contiene el proyecto o archivos del Eje 2.
3.  Conserva los archivos útiles; no borres ni sobrescribas trabajo
    existente sin revisar.
4.  Busca el modelo, scripts SQL y documentación previa.
5.  Comprueba si existe `.env`, pero nunca imprimas ni muestres su
    contenido.
6.  Inspecciona el esquema real de Aiven antes de decidir qué tabla
    utilizar.

Si faltan credenciales nuevas o acceso a Aiven, solicita al usuario
completar `.env`. No inventes valores ni declares exitosa una conexión
que no probaste.

## Seguridad de credenciales

La captura de Aiven compartida anteriormente expuso una contraseña. No
la copies ni la incorpores en código, documentación, capturas o
repositorios. Recomienda rotarla en Aiven antes de continuar.

Utiliza exclusivamente un archivo local `.env` con estas variables:

``` env
PORT=3000
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL=true
```

No supongas que el nombre de la base es `defaultdb`: confírmalo. Añade
`.env` a `.gitignore` y crea `.env.example` sin secretos. Nunca subas
`.env` a GitHub ni a Render. En Render configura los secretos desde
Environment.

Aiven exige SSL según la captura. Configura TLS de acuerdo con las
instrucciones actuales de Aiven y usa el certificado CA cuando
corresponda. No desactives la validación del certificado como solución
automática.

## Reutilizar Eje 2

Inspecciona con `SHOW TABLES` y `DESCRIBE nombre_tabla`, además de
revisar claves primarias y foráneas. - Reutiliza una tabla adecuada si
ya existe. - Si hace falta ampliar el esquema, presenta el SQL y evita
cambios destructivos. - Si no hay estructura útil, crea únicamente la
tabla mínima necesaria. - No borres tablas ni datos del Eje 2. - Nunca
ejecutes `DROP DATABASE`, `DROP TABLE` ni reinicializaciones
destructivas. - No alteres tablas existentes sin explicar el cambio y
obtener autorización.

El CRUD debe leer y escribir en Aiven; no uses arreglos en memoria ni
`localStorage` como almacenamiento principal.

## Calidad mínima

Consultas SQL parametrizadas; validación en frontend y backend; manejo
de errores; códigos HTTP coherentes; interfaz en español, adaptable a
móvil y escritorio; importes presentados en COP; confirmación antes de
eliminar; mensajes de éxito/error y estado vacío. No muestres secretos
ni errores internos al usuario.

## Orden de trabajo

1.  Inspeccionar carpeta y archivos previos.
2.  Leer la guía Eje 3 y el documento Eje 2, si están disponibles.
3.  Inspeccionar el esquema Aiven.
4.  Definir la tabla y correspondencia entre tabla y objeto.
5.  Implementar conexión y API.
6.  Implementar interfaz.
7.  Probar las cuatro operaciones CRUD.
8.  Reiniciar servidor y comprobar persistencia.
9.  Preparar despliegue Render.
10. Preparar README, documento académico y evidencias.

No marques una función como terminada hasta probarla. Si no se puede
probar por falta de credenciales, dilo expresamente.

## Criterio de finalización

La aplicación debe iniciar localmente; conectarse a Aiven si hay
credenciales válidas; realizar CRUD real; demostrar persistencia; servir
frontend y API desde el mismo servidor; tener configuración Render,
`.env` excluido de Git, README y evidencias reales.

No inventes pruebas, capturas, URL pública ni conexión exitosa.
