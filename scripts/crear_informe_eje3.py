from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = 'output/Informe_Pay_Services_Eje_3.docx'
GREEN, DARK, PALE, LIGHT, GRAY = '62B446', '17324D', 'EAF3E5', 'F3F6F8', '5B6570'
doc = Document()
sec = doc.sections[0]
sec.top_margin=Inches(.7); sec.bottom_margin=Inches(.65); sec.left_margin=Inches(.78); sec.right_margin=Inches(.78)
styles=doc.styles
styles['Normal'].font.name='Aptos'; styles['Normal'].font.size=Pt(10); styles['Normal'].font.color.rgb=RGBColor.from_string(DARK); styles['Normal'].paragraph_format.space_after=Pt(5)
for s,size in [('Title',30),('Heading 1',18),('Heading 2',13),('Heading 3',11)]:
    styles[s].font.name='Aptos Display'; styles[s].font.size=Pt(size); styles[s].font.bold=True; styles[s].font.color.rgb=RGBColor.from_string(DARK)
    if s.startswith('Heading'): styles[s].paragraph_format.space_before=Pt(11); styles[s].paragraph_format.space_after=Pt(5)

def shade(cell,color):
    pr=cell._tc.get_or_add_tcPr(); el=OxmlElement('w:shd'); el.set(qn('w:fill'),color); pr.append(el)
def set_cell(cell,text,bold=False,color=None,size=9):
    cell.text=''; p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(1); r=p.add_run(str(text)); r.bold=bold; r.font.name='Aptos'; r.font.size=Pt(size)
    if color: r.font.color.rgb=RGBColor.from_string(color)
    cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
def table(headers,rows,widths=None):
    t=doc.add_table(rows=1,cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
    for i,h in enumerate(headers): shade(t.rows[0].cells[i],DARK); set_cell(t.rows[0].cells[i],h,True,'FFFFFF')
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,v in enumerate(row):
            if ri%2: shade(cells[i],LIGHT)
            set_cell(cells[i],v)
    if widths:
        for row in t.rows:
            for i,w in enumerate(widths): row.cells[i].width=Inches(w)
    doc.add_paragraph().paragraph_format.space_after=Pt(1); return t
def para(text='',boldlead=None):
    p=doc.add_paragraph()
    if boldlead and text.startswith(boldlead): p.add_run(boldlead).bold=True; p.add_run(text[len(boldlead):])
    else: p.add_run(text)
    return p
def bullet(text): doc.add_paragraph(text,style='List Bullet')
def codebox(text):
    t=doc.add_table(rows=1,cols=1); t.style='Table Grid'; c=t.cell(0,0); shade(c,'F2F4F6'); c.text=''
    for i,line in enumerate(text.split('\n')):
        p=c.paragraphs[0] if i==0 else c.add_paragraph(); p.paragraph_format.space_after=Pt(0); r=p.add_run(line); r.font.name='Consolas'; r.font.size=Pt(8.5)
    doc.add_paragraph().paragraph_format.space_after=Pt(1)
def evidence(n,title,purpose,instructions):
    doc.add_heading(f'Evidencia {n}. {title}',level=2)
    para('Qué demuestra: '+purpose,'Qué demuestra:'); para('Cómo tomarla: '+instructions,'Cómo tomarla:')
    t=doc.add_table(rows=1,cols=1); t.style='Table Grid'; c=t.cell(0,0); shade(c,'FBFCFD'); c.text=''
    p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(35); p.paragraph_format.space_after=Pt(35)
    r=p.add_run('PEGAR CAPTURA AQUÍ'); r.bold=True; r.font.size=Pt(14); r.font.color.rgb=RGBColor.from_string(GREEN)
    p=c.add_paragraph('Deja visibles la ventana, el resultado y el contexto. Oculta contraseñas, tokens y datos personales.'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].italic=True; p.runs[0].font.size=Pt(8); p.runs[0].font.color.rgb=RGBColor.from_string(GRAY)

head=sec.header.paragraphs[0]; head.alignment=WD_ALIGN_PARAGRAPH.RIGHT; r=head.add_run('PAY SERVICES  |  ACTIVIDAD EVALUATIVA EJE 3'); r.bold=True; r.font.size=Pt(8); r.font.color.rgb=RGBColor.from_string(GREEN)
foot=sec.footer.paragraphs[0]; foot.alignment=WD_ALIGN_PARAGRAPH.CENTER; foot.add_run('Fundación Universitaria del Área Andina · Gestión de Bases de Datos · '); fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); foot._p.append(fld)

# Portada
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(65); r=p.add_run('FUNDACIÓN UNIVERSITARIA\nDEL ÁREA ANDINA'); r.bold=True; r.font.size=Pt(15); r.font.color.rgb=RGBColor.from_string(GREEN)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(45); r=p.add_run('PAY SERVICES'); r.bold=True; r.font.size=Pt(31); r.font.color.rgb=RGBColor.from_string(DARK)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('Actividad evaluativa Eje 3\nDesarrollo de aplicación'); r.font.size=Pt(18)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(26); p.add_run('Gestión de Bases de Datos').bold=True
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('Docente: Yashin Alberto Rueda Matos')
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(22); p.add_run('AUTORES').bold=True
for name in ['Santiago Guevara Cancelado','Sebastian Mendoza Duitama','Wilmer Dávila Ríos']:
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run(name).font.size=Pt(12)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(22); p.add_run('9 de noviembre de 2026 · Colombia').font.color.rgb=RGBColor.from_string(GRAY)
doc.add_page_break()

doc.add_heading('Guía rápida para completar y entregar',level=1)
para('Este informe describe Pay Services y sus componentes. Los recuadros del capítulo 10 están reservados para tus propias capturas. No presentes como evidencia una imagen que no hayas tomado ni modifiques los resultados que aparezcan en pantalla.')
for x in ['Sigue el recorrido de demostración del capítulo 9 y captura las pantallas reales.','Pega cada imagen en el recuadro numerado que corresponda.','Completa la referencia exacta del material de pensamiento/complementario del aula virtual en el capítulo 12.','Oculta contraseñas, archivos .env, certificados privados, tokens y datos personales.','Actualiza la fecha si entregas en otro momento y exporta el documento final como PDF desde Word.']: bullet(x)
doc.add_heading('Datos de la aplicación',level=2)
table(['Elemento','Dato'],[('Aplicación','Pay Services — CRUD académico de pagos simulados'),('Sitio desplegado','https://aiveneje3.onrender.com'),('Repositorio','https://github.com/RumiSoftware2/AivenEje3'),('Base de datos','MySQL en Aiven · esquema defaultdb · tabla pagos'),('Alcance','Registra pagos simulados; no procesa transacciones ni dinero real.')],[1.65,5.2])

doc.add_heading('1. Introducción',level=1)
para('La actividad propone desarrollar una aplicación web conectada a una base de datos relacional, explicar el mapeo entre el modelo relacional y los objetos de la aplicación y demostrar la persistencia de los datos. Para responder a ese propósito se construyó Pay Services, una aplicación sencilla para registrar y administrar pagos simulados de servicios.')
para('La interfaz web consume una API REST implementada con Node.js y Express. El backend ejecuta operaciones SQL sobre MySQL alojado en Aiven. La tabla pagos funciona como fuente persistente y el servicio está desplegado en Render. El alcance es académico: la aplicación almacena registros y no se conecta con entidades recaudadoras ni pasarelas de pago.')
doc.add_heading('2. Objetivos',level=1); doc.add_heading('Objetivo general',level=2)
para('Desarrollar una aplicación web CRUD conectada a MySQL que permita gestionar registros de pagos simulados, explicar el mapeo de datos relacionales a objetos y evidenciar su persistencia.')
doc.add_heading('Objetivos específicos',level=2)
for x in ['Diseñar y describir la tabla relacional pagos y sus campos.','Implementar crear, consultar/listar, actualizar y eliminar mediante una API REST.','Explicar la correspondencia entre filas y columnas de MySQL y objetos/propiedades JavaScript.','Verificar la conexión, validaciones y persistencia de datos y preparar evidencias de funcionamiento.']: bullet(x)

doc.add_heading('3. Tecnologías y elección',level=1)
table(['Tecnología','Uso en el proyecto'],[('HTML, CSS y JavaScript nativo','Estructura, presentación e interacción del frontend; llamadas HTTP con fetch.'),('Node.js','Ejecución del backend JavaScript.'),('Express 4','Servidor web, entrega del frontend y API REST.'),('mysql2/promise','Conexión a MySQL, pool y consultas parametrizadas.'),('MySQL en Aiven','Almacenamiento relacional persistente con TLS.'),('Render','Despliegue del servidor Node.js y entrega pública.')],[1.75,5.1])
para('Se eligió una solución pequeña con JavaScript en ambos lados para mantener el flujo fácil de estudiar. El mapeo se implementa con SQL explícito; no se utiliza ORM. Esto permite observar cómo los resultados de consultas se convierten en objetos y cómo las acciones CRUD generan sentencias SQL.')

doc.add_heading('4. Arquitectura y flujo de información',level=1)
table(['Capa','Responsabilidad','Ubicación'],[('Frontend','Formulario, lista, mensajes y solicitudes fetch.','frontend/index.html, frontend/css, frontend/js'),('Rutas API','Asocian métodos HTTP con acciones.','backend/src/routes/pagos.routes.js'),('Controlador','Valida entradas y construye respuestas HTTP.','backend/src/controllers/pagos.controller.js'),('Modelo','Ejecuta SELECT, INSERT, UPDATE y DELETE parametrizados.','backend/src/models/pagos.model.js'),('Base de datos','Guarda registros de forma persistente.','Aiven MySQL · defaultdb.pagos')],[1.1,3.25,2.5])
para('Flujo: la persona usa el formulario → JavaScript envía la solicitud a /api/pagos → Express deriva al controlador → el modelo ejecuta SQL parametrizado → MySQL devuelve filas o resultado → backend devuelve JSON → frontend actualiza la lista.')
para('Frontend y API se sirven desde el mismo origen. El navegador usa rutas relativas como /api/pagos; no necesita una URL de API independiente en local o en Render.')

doc.add_heading('5. Modelo relacional implementado',level=1)
para('La inspección de Aiven confirmó el esquema defaultdb. La tabla pagos se creó con CREATE TABLE IF NOT EXISTS después de revisar que no existía una tabla reutilizable. No se borraron ni modificaron otras tablas. Este modelo mínimo no tiene claves foráneas.')
table(['Campo','Tipo','Regla/uso'],[('id','INT','Clave primaria; autoincremental.'),('cliente','VARCHAR(100)','Obligatorio; nombre asociado al registro.'),('servicio','VARCHAR(60)','Obligatorio; tipo de servicio.'),('referencia','VARCHAR(60)','Obligatorio; referencia del pago.'),('valor','DECIMAL(12,2)','Obligatorio; valor positivo.'),('fecha_pago','DATE','Obligatorio; fecha del registro.'),('estado','VARCHAR(20)','Obligatorio; Pendiente o Pagado.')],[1.15,1.6,4.1])
para('La aplicación también valida el valor positivo y los estados permitidos. La clave primaria id identifica cada registro y se genera automáticamente al insertar.')

doc.add_heading('6. Mapeo del modelo relacional al modelo de objetos',level=1)
table(['Concepto relacional','Representación en la aplicación','Ejemplo'],[('Tabla pagos','Colección/listado devuelto en JSON.','GET /api/pagos'),('Fila','Objeto de pago individual.','{ id, cliente, servicio, referencia, valor, fecha_pago, estado }'),('Columna','Propiedad del objeto.','cliente ↔ pago.cliente'),('Clave primaria id','Identidad del objeto y búsqueda.','GET /api/pagos/12'),('INSERT','Creación del objeto persistido.','POST /api/pagos'),('SELECT','Lectura como uno o varios objetos.','GET /api/pagos'),('UPDATE','Actualiza el registro identificado.','PUT /api/pagos/:id'),('DELETE','Elimina el registro identificado.','DELETE /api/pagos/:id')],[1.5,3.05,2.35])
para('El controlador valida el cuerpo JSON. El modelo pasa sus valores a consultas preparadas con parámetros. mysql2 devuelve filas como objetos JavaScript, que Express serializa a JSON. No se usa ORM: el mapeo queda visible en las consultas SQL y en los objetos que intercambian backend y frontend.')
codebox("// Ejemplo conceptual de un objeto que representa una fila\n{ id: 12, cliente: 'Prueba Eje 3', servicio: 'Internet',\n  referencia: 'EJE3-TEST-01', valor: '85000.00',\n  fecha_pago: '2026-11-09', estado: 'Pendiente' }")
para('Este objeto ilustra la estructura que maneja la aplicación; sus valores son un ejemplo didáctico, no se presentan como registro actual de la base.')

doc.add_heading('7. Funcionalidades CRUD y API',level=1)
table(['Operación','Método y endpoint','Descripción'],[('Crear','POST /api/pagos','Valida y guarda un nuevo registro.'),('Listar','GET /api/pagos','Devuelve pagos en JSON.'),('Consultar','GET /api/pagos/:id','Busca por identificador.'),('Actualizar','PUT /api/pagos/:id','Valida y actualiza el registro.'),('Eliminar','DELETE /api/pagos/:id','Borra después de confirmación del usuario.'),('Estado','GET /api/health','Informa si puede conectarse a la base.')],[1.05,2.0,3.85])
para('La interfaz permite ingresar cliente, servicio, referencia, valor, fecha y estado; visualizar registros; editar y confirmar antes de eliminar. El backend rechaza campos obligatorios ausentes, valores inválidos, fechas imposibles y estados o servicios no permitidos.')

doc.add_heading('8. Persistencia, conexión y seguridad básica',level=1)
para('Los registros se guardan en MySQL de Aiven y permanecen en la base después de cerrar o reiniciar el servidor. La conexión usa TLS y puede cargar el certificado CA mediante configuración de entorno. Las credenciales están fuera del código en backend/.env local y en variables/secret files de Render; no deben aparecer en capturas ni subirse al repositorio.')
para('Durante la revisión del proyecto, /api/health confirmó conexión en local y Render. El equipo reportó seis pruebas unitarias aprobadas y cero fallidas, una prueba CRUD contra la base real y persistencia tras reiniciar el servidor. Los datos temporales de esas pruebas se eliminaron. Para la entrega se recomienda usar un registro de demostración y retirarlo al terminar.')
para('El servicio gratuito de Render puede suspenderse tras inactividad. La primera solicitud lo despierta y puede tardar; el botón “Conectar / reintentar” comprueba el estado. No garantiza disponibilidad continua ni mantiene pings permanentes.')

doc.add_heading('9. Recorrido guiado para producir evidencias',level=1); doc.add_heading('Antes de comenzar',level=2)
for x in ['Abre https://aiveneje3.onrender.com. Si está iniciando, espera y pulsa “Conectar / reintentar”.','Abre MySQL Workbench con la conexión Aiven guardada y selecciona defaultdb. No captures el campo de contraseña.','En Workbench ejecuta DESCRIBE defaultdb.pagos; luego la consulta de listado siguiente.','Usa un registro de prueba académico, no información personal ni una factura real. Comprueba que la referencia esté libre.']: bullet(x)
doc.add_heading('Consultas SQL para la demostración',level=2)
codebox("-- Ver estructura y columnas\nDESCRIBE defaultdb.pagos;\n\n-- Ver registros\nSELECT id, cliente, servicio, referencia, valor, fecha_pago, estado\nFROM defaultdb.pagos ORDER BY id DESC;\n\n-- Buscar el registro de demostración\nSELECT id, cliente, servicio, referencia, valor, fecha_pago, estado\nFROM defaultdb.pagos WHERE referencia = 'EJE3-TEST-01';")
doc.add_heading('Secuencia de demostración',level=2)
for x in ['Crear: diligencia el formulario con cliente “Prueba Eje 3”, servicio Internet, referencia EJE3-TEST-01, valor 85000, fecha actual y estado Pendiente. Guarda y comprueba que aparece en la lista.','Comprobar: ejecuta el SELECT con WHERE referencia en Workbench. Debe aparecer el mismo registro.','Actualizar: edita ese registro desde la interfaz; por ejemplo cambia el valor a 87000 y el estado a Pagado. Guarda y vuelve a ejecutar el SELECT.','Persistencia: recarga la página y comprueba que el cambio sigue en la lista. También puedes cerrar y abrir el sitio.','Eliminar y limpiar: elimina el registro desde la interfaz y confirma. Ejecuta el SELECT filtrado; debe devolver cero filas. Nunca ejecutes DELETE sin WHERE ni afectes otros registros.']:
    doc.add_paragraph(x,style='List Number')

doc.add_heading('10. Evidencias de la actividad',level=1)
para('Inserta capturas propias en los espacios. Deben ser legibles y mostrar el resultado correspondiente. Si incluyes varias ventanas, deja claro el nombre de la aplicación, la operación y el resultado. No edites cifras ni mensajes.')
evidence(1,'Aplicación y conexión disponible','La interfaz web y el estado del servicio.','Abre el sitio desplegado, espera la respuesta y pulsa “Conectar / reintentar” si hace falta. Captura la cabecera, el estado y la interfaz.')
evidence(2,'Modelo relacional en MySQL Workbench','La tabla pagos y sus columnas implementadas.','Ejecuta DESCRIBE defaultdb.pagos; y captura la consulta y las columnas del resultado.')
evidence(3,'Creación desde el frontend','El formulario y la confirmación del registro.','Crea los datos de prueba indicados en el capítulo 9 y captura la fila visible en Pay Services.')
evidence(4,'Persistencia comprobada en Workbench','Que el registro creado desde la interfaz quedó en Aiven.','Ejecuta el SELECT filtrado por referencia y captura la fila y sus campos.')
evidence(5,'Actualización desde la interfaz','El cambio realizado mediante UPDATE desde la aplicación.','Edita el registro y captura la fila actualizada, con sus nuevos valores visibles.')
evidence(6,'Actualización persistida','Que MySQL conserva los datos actualizados.','Ejecuta de nuevo el SELECT filtrado en Workbench y captura la fila actualizada.')
evidence(7,'Lectura después de recargar','Que el registro se vuelve a leer de la base.','Recarga la página y captura el registro actualizado que reaparece en la lista.')
evidence(8,'Eliminación y limpieza','La operación DELETE de la interfaz y la ausencia posterior del registro de prueba.','Elimina desde Pay Services; luego ejecuta el SELECT filtrado en Workbench y captura el resultado vacío. No ejecutes DELETE manual sin filtro.')
evidence(9,'Pruebas automatizadas (opcional)','La ejecución local de npm test.','En PowerShell, desde backend, ejecuta npm test y captura el resumen real al finalizar. No simules resultados.')

doc.add_heading('11. Análisis y conclusiones',level=1); doc.add_heading('Análisis',level=2)
para('El ejercicio permite seguir un dato desde un formulario hasta una fila persistida. La tabla contiene tipos y restricciones adecuados para el alcance mínimo: identificador, datos descriptivos, valor decimal, fecha y estado controlado. La aplicación representa cada fila como un objeto JSON y usa el id para consultas y modificaciones. El SQL explícito permite observar la correspondencia y las consultas parametrizadas separan los valores de la sentencia.')
para('Las evidencias del frontend y Workbench deben mostrar el mismo registro al crearlo, actualizarlo, leerlo después de recargar y eliminarlo. Esa comparación sustenta la conexión y persistencia. El sistema es un CRUD académico y no valida ni procesa pagos reales.')
doc.add_heading('Conclusiones',level=2)
for x in ['Se implementó un CRUD web dividido en frontend, API, controlador, modelo y base de datos MySQL.','Se explicó el mapeo directo entre tabla y propiedades JSON mediante mysql2 y SQL parametrizado, sin ORM.','La persistencia usa Aiven MySQL; la conexión se configura con secretos fuera del código y TLS.','Las capturas añadidas deben documentar las operaciones reales. Al finalizar la demostración debe retirarse el registro de prueba.']: bullet(x)

doc.add_heading('12. Referencias',level=1)
para('Actividad evaluativa Eje 3. (s. f.). Desarrollo de aplicación [Guía PDF de la asignatura Gestión de Bases de Datos]. Fundación Universitaria del Área Andina.')
para('Completa aquí la referencia exacta del “referente de pensamiento” y del material complementario consultados en el aula virtual. Usa autor/entidad, año, título, unidad y enlace/datos editoriales tal como aparecen en la fuente; no inventes información.')
table(['Material del curso','Datos por completar'],[('Referente de pensamiento','Autor/entidad: __________________________\nAño: ______  Título: __________________________\nUnidad o módulo: ______________________________'),('Material complementario','Autor/entidad: __________________________\nAño: ______  Título: __________________________\nUnidad o módulo: ______________________________')],[1.75,5.1])
doc.add_heading('Documentación técnica consultada',level=2)
for ref in ['Node.js. Documentación oficial. https://nodejs.org/docs/','Express. API Reference 4.x. https://expressjs.com/4x/api.html','mysql2. SSL configuration. https://sidorares.github.io/node-mysql2/docs/documentation/ssl','Aiven. TLS/SSL certificates. https://aiven.io/docs/platform/concepts/tls-ssl-certificates','Render. Web Services. https://render.com/docs/web-services','Render. Free service limits. https://render.com/docs/free','Render. Environment variables and secret files. https://render.com/docs/configure-environment-variables']: bullet(ref)

doc.add_heading('13. Lista final antes de entregar',level=1)
for x in ['Reemplacé los espacios de evidencia por capturas reales o retiré el opcional que no usé.','Workbench muestra la tabla y los resultados consultados desde Pay Services.','Las evidencias de edición, persistencia y eliminación corresponden al mismo registro.','El registro de prueba fue eliminado y confirmé que la consulta filtrada quedó sin filas.','Completé autor, año y título de las lecturas asignadas en el aula virtual.','Actualicé la fecha y revisé nombres y ortografía.','No se ven contraseñas, .env, certificados, tokens ni datos personales.','Exporté el documento a PDF y comprobé que imágenes y tablas se lean bien.']:
    p=doc.add_paragraph(); p.add_run('☐  '+x)

for t in doc.tables:
    for row in t.rows: row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
doc.core_properties.title='Pay Services — Actividad evaluativa Eje 3'
doc.core_properties.subject='Informe académico con guía y espacios para evidencias'
doc.core_properties.author='Santiago Guevara Cancelado; Sebastian Mendoza Duitama; Wilmer Dávila Ríos'
doc.save(OUT); print(OUT)
