# ENTREGA, EVIDENCIAS Y DESPLIEGUE --- PAY SERVICES

## 1. Contexto de la actividad

La actividad es **Actividad Evaluativa --- Eje 3: Desarrollo de
aplicación**, de Gestión de Bases de Datos de la Fundación Universitaria
del Área Andina.

La guía del Eje 3 solicita construir una aplicación web para pagos de
servicios, comunicar el modelo relacional con el modelo de objetos
mediante mapeo de BD, seleccionar tecnología, demostrar persistencia y
entregar un PDF con interfaces y evidencias. La aplicación Pay Services
administra pagos simulados y no procesa transacciones reales.

## 2. Portada e identidad institucional

Incluye: - Proyecto: **Pay Services**. - Institución: **Fundación
Universitaria del Área Andina**. - Asignatura: **Gestión de Bases de
Datos**. - Actividad: **Actividad Evaluativa Eje 3 --- Desarrollo de
aplicación**. - Docente: **Yashin Alberto Rueda Matos** (dato de la
portada del Eje 2). - Integrantes, exactamente como aparecen en el
documento del Eje 2: - Santiago - Sebastian - Wilmer Dávila Ríos

No inventes apellidos faltantes ni fecha de entrega. Deja la fecha
editable o pregunta al usuario.

### Logo Areandina

Reutiliza el logo institucional si ya está en la carpeta o en los
materiales entregados por el usuario. Si no está disponible, deja un
espacio identificado para insertar el logo oficial. No inventes ni
recrees el logo ni descargues uno de una fuente dudosa.

## 3. Documento académico PDF

Prepara un PDF en español, siguiendo la organización y presentación del
documento Eje 2 como referencia. Incluye: 1. Portada. 2. Introducción.
3. Objetivo de la aplicación. 4. Tecnologías utilizadas. 5. Modelo
relacional real utilizado. 6. Mapeo relacional a objetos. 7.
Arquitectura y conexión Aiven. 8. API y operaciones CRUD. 9. Interfaces.
10. Persistencia y pruebas. 11. Despliegue o instrucciones de ejecución.
12. Conclusiones. 13. Referencias consultadas.

Adapta el contenido a lo que efectivamente quedó implementado. No
afirmes que se realizaron pruebas o despliegues que no se completaron.

## 4. Evidencias

Crea una carpeta `evidencias/` y prepara estas capturas reales, si el
entorno permite obtenerlas: 1. Estructura de carpetas. 2. Tablas y
campos de MySQL. 3. Modelo relacional o diagrama basado en el esquema
real. 4. Correspondencia tabla/fila/columna con objeto JavaScript. 5.
Servidor iniciado y conexión Aiven verificada, sin secretos. 6. Interfaz
principal. 7. Formulario de creación. 8. Resultado de crear un pago. 9.
Formulario de edición. 10. Resultado de actualizar. 11. Confirmación y
resultado de eliminar. 12. Consulta SQL que compruebe persistencia. 13.
Aplicación después de reiniciar el servidor, conservando registros. 14.
Panel Render y URL pública, solo si el despliegue fue completado.

Usa datos ficticios. Oculta host, usuario, contraseña, tokens y
cualquier secreto. No fabriques capturas ni uses imágenes de una
aplicación distinta.

## 5. Despliegue recomendado: un servicio Render

La opción más sencilla es desplegar frontend y API juntos en un único
**Web Service de Render**: - Express sirve la API bajo `/api`. - Express
sirve los archivos de `public/`. - El navegador carga la interfaz y
llama a la API desde el mismo dominio. - MySQL continúa en Aiven.

No hace falta desplegar frontend en Vercel por separado. Separar Vercel
y Render agrega CORS y dos despliegues sin aportar valor necesario para
esta actividad. Considera Vercel solo si el usuario lo solicita
expresamente.

### Preparar servidor

-   Escuchar en `process.env.PORT`.
-   Usar 3000 como puerto local por defecto.
-   Tener script `start` en `package.json`.
-   Crear `GET /api/health`.
-   Servir la interfaz desde `/`.
-   En el frontend usar rutas relativas como `/api/pagos`.

Scripts sugeridos:

``` json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

### Configurar Render

1.  Crear un repositorio Git (privado o público según decida el
    usuario).
2.  Confirmar que `.env` está excluido de Git.
3.  Subir código sin credenciales ni certificados privados.
4.  En Render crear un **Web Service** conectado al repositorio.
5.  Build/Install command: `npm install`.
6.  Start command: `npm start`.
7.  Configurar en Environment las variables `DB_HOST`, `DB_PORT`,
    `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL`, con credenciales
    nuevas de Aiven.
8.  Configurar certificado CA si Aiven lo requiere, siguiendo
    documentación vigente.
9.  Desplegar y probar `/`, `/api/health` y el CRUD.
10. Registrar URL pública solo después de comprobar que funciona.

No escribas los valores secretos en README ni PDF. Los secretos se
configuran directamente en Render.

### Vercel

Vercel puede alojar el frontend por separado, pero no es la opción
inicial recomendada. Primero termina y verifica la solución unificada en
Render.

## 6. README

Debe explicar qué es Pay Services, tecnologías, requisitos, instalación,
configuración `.env`, inicio local, rutas API, CRUD, conexión SSL con
Aiven, despliegue Render y pruebas realizadas. Nunca incluir secretos.

## 7. Fuentes y rigor

La fuente principal de requerimientos es la **Guía Actividad Evaluativa
Eje 3**, en especial la descripción e instrucciones de las páginas 1 y
2. El documento del Eje 2 sirve para conservar presentación
institucional, integrantes, docente y contexto previo. No atribuyas al
Eje 2 tablas o entidades no verificadas.

Si se consultan fuentes técnicas, prioriza documentación oficial: -
Node.js: https://nodejs.org/docs/ - Express: https://expressjs.com/ -
MySQL2: https://sidorares.github.io/node-mysql2/ - MySQL:
https://dev.mysql.com/doc/ - Aiven: https://aiven.io/docs - Render:
https://render.com/docs

Incluye solo fuentes efectivamente consultadas.

## 8. Lista final de aceptación

-   [ ] La aplicación inicia localmente.
-   [ ] La conexión real Aiven funciona.
-   [ ] Crear pago funciona.
-   [ ] Listar y consultar pago funciona.
-   [ ] Editar pago funciona.
-   [ ] Eliminar pago funciona.
-   [ ] Persistencia comprobada tras reiniciar.
-   [ ] Frontend consume API y no accede directamente a MySQL.
-   [ ] Consultas parametrizadas.
-   [ ] Credenciales fuera del repositorio.
-   [ ] Documento explica modelo relacional y mapeo a objetos.
-   [ ] Evidencias reales preparadas.
-   [ ] README con instrucciones.
-   [ ] Render probado, si se afirma que está publicado.

Al finalizar, informa archivos creados, comandos para ejecutar, pruebas
realizadas, URL pública si existe y tareas que requieran intervención
del usuario.
