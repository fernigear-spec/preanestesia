# requirements.md — AnesHealth · Entrevista Preanestésica de Enfermería

> **Estado:** alineado con el documento fuente v3 (29/09/2026), que integra las 14 decisiones del servicio y las correcciones de la revisión de v0.2. Pendiente del visto bueno final antes de escribir código.
> Versión 0.3 · 29/09/2026
> Repositorio destino: **fernigear-spec/preanestesia** (público). Documento fuente: `docs/documento_fuente.md`.

---

## Introducción

Este documento recoge los requisitos funcionales y no funcionales de **AnesHealth Preanestesia**, una aplicación web estática que asiste a las enfermeras de anestesia del Hospital Vithas Barcelona durante la entrevista preoperatoria. La aplicación guía el proceso de recogida de datos, ejecuta cálculos clínicos, aplica reglas de medicación y genera las salidas necesarias para el paciente y el anestesiólogo.

La enfermera hace el cribado; el anestesiólogo valida. El programa emite recomendaciones directamente al paciente **salvo** en los supuestos marcados como «requiere confirmación del anestesiólogo».

---

## R0. Fuente única de verdad clínica

- **R0.1** El documento clínico fuente es `docs/documento_fuente.md`. Toda mención al «documento fuente» en `requirements.md`, `design.md` y `tasks.md` se refiere a ese fichero y, siempre que aplique a una regla concreta, se cita con su sección (por ejemplo, `docs/documento_fuente.md §8.4`).
- **R0.2** Las reglas clínicas (escalas, plazos de medicación, tablas de pruebas, umbrales de alerta) se toman **siempre** de `docs/documento_fuente.md` y de los ficheros de `datos/`, **nunca de memoria ni de resúmenes**. Los números concretos viven en `datos/` (R2), y el documento fuente es la referencia de la que se derivan.
- **R0.3** Si en algún momento `requirements.md` (u otro documento del spec) discrepa de `docs/documento_fuente.md`, **se avisa al servicio por el chat antes de decidir**; no se resuelve la discrepancia por cuenta propia.

---

## R1. Arquitectura y privacidad

### R1.1 Sitio estático sin backend
- **R1.1.1** La aplicación es un sitio web estático desplegado en GitHub Pages. No tiene servidor propio, base de datos, backend ni cuentas de usuario.
- **R1.1.2** Todo el cálculo se realiza en el navegador del cliente.

### R1.2 Privacidad radical de datos
- **R1.2.1** No se almacenan datos de pacientes fuera de la sesión activa: nada en `localStorage`, `sessionStorage`, `IndexedDB`, cookies con datos clínicos ni en ningún otro mecanismo de persistencia del navegador.
- **R1.2.2** El estado de la entrevista vive únicamente en memoria (estado de la aplicación en ejecución).
- **R1.2.3** Existe un botón «Nuevo paciente» que borra completamente el estado en memoria y reinicia la aplicación.
- **R1.2.4** Al intentar cerrar o recargar la pestaña con una entrevista en curso, el navegador muestra un aviso de confirmación estándar (`beforeunload`).
- **R1.2.5** Tras 30 minutos de inactividad (valor configurable en `config.json`), la sesión se borra automáticamente mostrando un aviso al usuario antes de hacerlo.
- **R1.2.6** Lo único que persiste en el `localStorage` del dispositivo, fuera de la sesión, es la preferencia del «modo guiado» activado/desactivado y el cuadro de mando de uso de R14.3; ambos **sin datos clínicos ni identificadores**. Nada más.
- **R1.2.7** La única información que puede salir de la sesión es la embebida en los QR y enlaces (véase R11), que nunca contiene nombre, número de historia ni el campo de identificación opcional.

### R1.3 Sin peticiones a terceros
- **R1.3.1** La aplicación no realiza ninguna petición de red a terceros: sin CDN externo, sin fuentes remotas, sin analítica, sin telemetría.
- **R1.3.2** Todas las librerías están empaquetadas en el propio sitio.
- **R1.3.3** Se incluye una etiqueta `<meta http-equiv="Content-Security-Policy">` que prohíbe cargas externas.

### R1.4 Funcionamiento sin conexión
- **R1.4.1** Un service worker almacena en caché la aplicación y los ficheros de datos para que funcione sin conexión durante una entrevista.
- **R1.4.2** La caché del service worker no almacena nunca datos del paciente.
- **R1.4.3** Cuando se publica una versión nueva del contenido, la aplicación lo detecta y muestra un aviso de recarga **entre entrevistas** (nunca en mitad de una).

### R1.5 Compatibilidad
- **R1.5.1** Funciona en PC (Windows) y tablet (iPad y Android) con navegador moderno (últimas dos versiones de Chrome, Safari, Edge y Firefox).
- **R1.5.2** El diseño es táctil: botones grandes, selección por pulsación, mínimo texto libre.

---

## R2. Contenido clínico separado del código

### R2.1 Carpeta `datos/`
Todo el contenido clínico (preguntas, fármacos, reglas, procedimientos, plantillas, textos) vive en ficheros editables en la carpeta `datos/` del repositorio, fuera del código. El código implementa el motor; los médicos mantienen el contenido.

### R2.2 Ficheros de datos obligatorios
- **R2.2.1** `datos/config.json` — nombre del centro, teléfono de contacto, minutos de inactividad, edad pediátrica máxima (17 por defecto), días de validez de los QR, interruptor de prehabilitación (`prehabilitacion_activa`, por defecto `false`) y URL de PreHabilítame configurable, versión del contenido y fecha de la última revisión clínica. *(El límite de caracteres del SAP se retiró; el texto solo recoge antecedentes patológicos y quirúrgicos, R10.1.)*
- **R2.2.2** `datos/farmacos.csv` — catálogo de fármacos con columnas: `id`, `principios_activos`, `nombres_comerciales`, `grupo`, `subgrupo`, `pauta_tipica`, `id_regla`, `texto_paciente` (opcional), `texto_anestesiologo` (opcional), `requiere_confirmacion`, `indicaciones_posibles`, `fuente`, `fecha_revision`, `verificado_cima`.
- **R2.2.3** `datos/reglas_farmacos.json` — parámetros de cada regla de medicación, incluida la lista editable de bloqueos profundos por defecto (R8.0).
- **R2.2.4** `datos/procedimientos.csv` — catálogo de procedimientos con columnas: procedimiento, especialidad, riesgo cardiovascular, riesgo hemorrágico, grupo oftalmológico, técnica neuroaxial/bloqueo profundo probable, duración ≥ 30 min, riesgo trombótico alto.
- **R2.2.5** `datos/modulos/*.json` — un fichero por módulo de patología.
- **R2.2.6** `datos/plantillas_sap.json` — orden de bloques, plantillas con marcadores, abreviaturas y política de negativos.
- **R2.2.7** `datos/opioides.json` — factores de conversión a morfina oral equivalente (CDC 2022).
- **R2.2.8** `datos/coherencia.json` — reglas del asistente de coherencia.
- **R2.2.9** `datos/textos/es/*.json` y `datos/textos/ca/*.json` — textos del paciente en castellano y catalán. Todas las versiones publicadas se conservan en `datos/textos/historico/<versión>/`, de modo que un QR antiguo pueda renderizarse siempre con los textos de la versión con que se generó (R11.5).
- **R2.2.10** `datos/casos_entrenamiento/*.json` — casos clínicos para el modo entrenamiento y las pruebas automáticas.

### R2.3 Validación al inicio
- **R2.3.1** Al cargar la aplicación se validan todos los ficheros de datos. Si alguno contiene errores (columnas que faltan, valores fuera de lista, referencias a reglas inexistentes), la aplicación muestra qué fichero, fila y columna fallan, y no permite iniciar entrevistas con datos corruptos.
- **R2.3.2** Esta validación se ejecuta también tras cualquier actualización de contenido detectada por el service worker.

---

## R3. Flujo de la entrevista

### R3.1 Navegación por pasos
- **R3.1.1** La entrevista se organiza en pasos numerados con barra de progreso visible.
- **R3.1.2** Un panel lateral (inferior en tablet) muestra en tiempo real el resumen, las alertas activas y los cálculos calculados hasta ese momento.
- **R3.1.3** El usuario puede volver a cualquier paso ya completado en cualquier momento.
- **R3.1.4** Cada paso indica qué preguntas obligatorias están pendientes de respuesta.
- **R3.1.5** Al inicio de cada entrevista se elige la modalidad: **presencial** o **telefónica**.

### R3.2 Pasos de la entrevista

> **Orden actualizado (decisión del servicio, 30/09/2026).** La entrevista tiene 12 pasos: 1) intervención, 2) datos básicos, 3) alergias, 4) antecedentes, 5) hábitos, 6) enfermedades y hemostasia, 7) técnica anestésica prevista, 8) medicación, 9) vía aérea, 10) consentimiento, 11) origen materno (mtND4) y 12) resultados. Se elimina el «carácter» de la intervención y el sufijo «E» del ASA. La técnica anestésica pasa a un paso propio (paso 7) y, si se cambia, las reglas y salidas se recalculan. La hipertermia maligna y el déficit de pseudocolinesterasa (personales o familiares) pasan a las condiciones especiales del paso 6 (R5.15). Los identificadores R3.2.x se conservan aunque cambie el número de paso.

**Paso 1 — Datos de la intervención**
- **R3.2.1** Campos: fecha y hora prevista de la intervención, procedimiento (buscador con autocompletado sobre `procedimientos.csv`), lateralidad (si aplica según el procedimiento), régimen (CMA, ingreso, UCI prevista) y contraste yodado. **La técnica anestésica ya no se recoge aquí, sino en el paso 7.** Se elimina el campo «carácter» (programada/urgencia).
- **R3.2.2** Si no se conoce la hora, se asume las 08:00 y la hoja del paciente lo advierte.
- **R3.2.4** Aviso si la intervención está a más de 60 días («las suspensiones deben recalcularse si cambia la fecha»).
- **R3.2.5** Alerta por fármaco si alguna fecha límite de suspensión calculada ya ha pasado o cae hoy: «ya no se puede cumplir el plazo; consultar con el anestesiólogo». Ese fármaco pasa a requerir confirmación.
- **R3.2.6b** El paso 1 permite marcar «fecha de intervención aún no conocida» y continuar. Sin fecha, la hoja del paciente expresa cada instrucción como margen (sin adelantos de tomas); con fecha, muestra la fecha y hora calculadas y el margen entre paréntesis. El QR del paciente permite recalcular al introducir o cambiar la fecha, y su caducidad depende de si hay fecha. *(§8.16; véase R11 para el QR y R10 para la vista del paciente.)*

**Paso 2 — Datos básicos**
- **R3.2.7** Campos: edad (fecha de nacimiento o años; en menores de 2 años, meses), sexo, peso, talla. IMC se calcula automáticamente.
- **R3.2.8** En menores de edad (edad ≤ edad pediátrica máxima de `config.json`), el peso es obligatorio; se activa el módulo pediátrico (R5.12), se sustituye STOP-Bang por STBUR y Apfel por POVOC.
- **R3.2.9** En mujeres de 12 a 55 años: preguntar posibilidad de embarazo y fecha de la última regla. Si está embarazada, activar módulo obstétrico (R5.13).

**Paso 3 — Alergias**
- **R3.2.14** Medicamentos (con tipo de reacción), látex, contrastes yodados, alimentos relevantes (huevo, soja, frutos secos, frutas tropicales si alergia al látex), clorhexidina, adhesivos.
- **R3.2.15** Opción explícita «No alergias conocidas».

**Paso 4 — Antecedentes anestésicos y quirúrgicos**
- **R3.2.10** Lista añadible de intervenciones previas (procedimiento, año, tipo de anestesia, incidencias).
- **R3.2.11** Incidencias a preguntar de forma explícita: intubación o ventilación difícil conocida, NVPO, despertar prolongado, reacción alérgica en quirófano, despertar intraoperatorio, dificultad con epidural o raquídea, transfusiones y reacción transfusional.
- **R3.2.12** La hipertermia maligna y el déficit de pseudocolinesterasa (personales y familiares) ya no se recogen aquí: pasan a las condiciones especiales del paso 6 (R5.15).

**Paso 5 — Hábitos, capacidad funcional y fragilidad**
- **R3.2.16** Tabaco: activo, exfumador (con fecha de abandono y paquetes-año), nunca.
- **R3.2.17** Alcohol: AUDIT-C (3 preguntas). Positivo ≥ 4 en hombres y ≥ 3 en mujeres: consejo breve y hoja de reducción. ≥ 8: alerta de riesgo de síndrome de abstinencia perioperatorio.
- **R3.2.18** Otras drogas: cannabis, cocaína (con fecha del último consumo), otras. Cocaína en la última semana: alerta.
- **R3.2.19** Capacidad funcional: pregunta directa de dos pisos; si negativa o dudosa, DASI completo (R6.6).
- **R3.2.20** En pacientes de 65 años o más: Clinical Frailty Scale (R6.10) y el test **4AT** (R6.10), en modalidad presencial **y** telefónica. *(Decisión 7.)*

**Paso 6 — Enfermedades y hemostasia**
- **R3.2.21** Lista de casillas agrupada por aparatos. Cada casilla marcada despliega su módulo (R5).
- **R3.2.22** Casilla «Ninguna enfermedad conocida» como opción explícita.
- **R3.2.23** El cuestionario HEMSTOP (R5.5) se realiza siempre, independientemente de si hay patología hematológica marcada.
- **R3.2.23b** Incluye las **condiciones especiales** (R5.15): hipertermia maligna y déficit de pseudocolinesterasa, preguntados por separado como personal y familiar.

**Paso 7 — Técnica anestésica prevista**
- **R3.2.1b** Técnica anestésica prevista (general, sedación, neuroaxial, bloqueo periférico, bloqueo profundo, local, o «no se sabe»). En procedimientos oftalmológicos: tópica, retrobulbar o peribulbar, general y sedación.
- **R3.2.3** Si la técnica anestésica es «no se sabe» y el procedimiento tiene marcada técnica neuroaxial probable, las reglas de fármacos utilizan los plazos de neuroaxial y lo indican explícitamente.
- **R3.2.6** El selector de técnica anestésica distingue explícitamente «bloqueo periférico» y «bloqueo profundo» como opciones separadas (véase R8.0 para la clasificación por defecto). *(Decisión 9.)*
- **R3.2.6c** En la catarata, la técnica decide el grupo oftalmológico: tópica = riesgo bajo; retrobulbar o peribulbar = moderado-alto; sin técnica, moderado-alto y se indica (§8.1-8.3). Si la técnica se cambia, las reglas de medicación y las salidas se recalculan.

**Paso 8 — Medicación habitual**
- **R3.2.24** Buscador por principio activo o nombre comercial con autocompletado sobre `farmacos.csv`, tolerante a tildes, mayúsculas y errores menores (distancia de edición ≤ 2).
- **R3.2.25** Para cada fármaco: dosis, pauta y hora habitual.
- **R3.2.26** Fármacos no presentes en el catálogo: se añaden manualmente y quedan marcados como «no catalogado: mantener y consultar con el anestesiólogo».
- **R3.2.27** Al añadir cada fármaco actúa el asistente de coherencia (R4). Al volver al paso 7 para cambiar la técnica, la medicación introducida se conserva y se recalcula.

**Paso 9 — Vía aérea**
- **R3.2.28** Datos de vía aérea (R6.2). En modalidad telefónica, solo los datos de anamnesis; la exploración queda «pendiente de explorar el día de la intervención» y el cálculo del EGRI es parcial.

**Paso 10 — Consentimiento informado**
- **R3.2.29** Tres estados: entregado y explicado (con fecha), pendiente de entregar (la hoja del paciente indica «le entregaremos el consentimiento el día de la intervención»), o no procede. Consta en el texto de SAP.

**Paso 11 — Origen materno (cribado mtND4)**
- **R3.2.13** Sección obligatoria en todos los pacientes (véase R9). Es el último paso antes de los resultados; al continuar se registra el uso (R14.3).

**Paso 12 — Resultados**
- **R3.2.30** Muestra todos los cálculos, pruebas complementarias, plan de medicación, normas de ayuno, alertas y permite generar las salidas (R10).

---

## R4. Asistente de coherencia

### R4.1 Principio general
El asistente de coherencia está basado en reglas (sin IA), definido en `coherencia.json` y en `farmacos.csv`. Sugiere y pregunta; **nunca afirma ni marca nada por su cuenta**. Las sugerencias aparecen como tarjetas no bloqueantes, se descartan con un toque y las descartadas quedan listadas en el resumen del anestesiólogo.

### R4.2 De fármaco a enfermedad
- **R4.2.1** Cada fármaco tiene una lista de indicaciones posibles en `farmacos.csv` (`indicaciones_posibles`). Al añadir un fármaco, si ninguna de sus indicaciones está recogida en la entrevista, aparece la tarjeta: «[Fármaco] suele tomarse por [lista]. Pregúntele por qué lo toma».
- **R4.2.2** La tarjeta ofrece un botón por indicación que abre el módulo correspondiente con la casilla propuesta, **sin marcarla** hasta que la enfermera confirme explícitamente, más las opciones «otra razón» (campo libre) y «no lo sabe».
- **R4.2.3** Los datos iniciales incluyen las correspondencias de `docs/documento_fuente.md §5b.1` para: IECA/ARA-II/betabloqueantes/antagonistas del calcio/diuréticos, corticoides, inmunosupresores, anticoagulantes, antiagregantes, insulina/antidiabéticos, inhaladores, antiepilépticos, levodopa/IMAO-B, levotiroxina, opioides y biológicos.

### R4.3 De enfermedad a fármaco
- **R4.3.1** Si hay una enfermedad marcada cuyo tratamiento habitual no aparece en la medicación, la tarjeta sugiere preguntar si lo ha dejado, se lo retiraron o se ha olvidado de mencionarlo.
- **R4.3.2** Reglas iniciales obligatorias: fibrilación auricular sin anticoagulante ni antiagregante; stent o infarto sin antiagregante; prótesis mecánica sin anticoagulante; diabetes sin tratamiento; HTA sin antihipertensivo; asma o EPOC sin inhalador; SAOS sin CPAP; epilepsia sin antiepiléptico; hipotiroidismo sin levotiroxina; trasplante sin inmunosupresor; TVP o TEP reciente sin anticoagulante.

### R4.4 Datos que faltan
- **R4.4.1** Si un módulo está marcado y falta un dato que cambia el manejo, la tarjeta pide obtenerlo o marcar «no disponible». Casos obligatorios: diabetes sin HbA1c, stent sin fecha o motivo, valvulopatía sin ecocardiograma, anticoagulante o dabigatrán sin creatinina, fumador sin paquetes-año, insuficiencia cardiaca sin clase NYHA, marcapasos sin fecha de última revisión, ictus o TVP sin fecha, biológico sin fecha de última dosis.

### R4.5 Modo guiado
- **R4.5.1** Cada pregunta tiene un enlace plegable «¿Por qué preguntamos esto?» con una o dos frases para la enfermera nueva. Las preguntas delicadas incluyen formulación sugerida. Los textos viven en `modulos/*.json` y `textos/`.
- **R4.5.2** El modo guiado se puede desactivar desde un conmutador. La aplicación guarda esta preferencia en el dispositivo (único dato local persistido, sin datos clínicos).

---

## R5. Módulos de patología

Cada módulo define preguntas clave, datos a registrar, efecto sobre ASA sugerido y clase de riesgo del paciente (R7.2), alertas y frase para SAP.

### R5.1 Cardiovascular
Hipertensión arterial, cardiopatía isquémica (con stent: fecha, tipo, motivo; alimenta regla de antiagregantes R8.3), insuficiencia cardiaca (NYHA, fracción de eyección), valvulopatía (prótesis, ecocardiograma), fibrilación auricular y arritmias (activa CHA2DS2-VA R6.5), marcapasos o DAI (alerta siempre), arteriopatía periférica, aneurisma de aorta, ictus/AIT (< 3 meses: alerta), TVP/TEP (< 3 meses: alerta).

### R5.2 Respiratorio
Asma (inhaladores, ingresos, crisis recientes; hoja del paciente: traer inhaladores), EPOC (mMRC, exacerbaciones, oxigenoterapia), SAOS diagnosticado (CPAP/BiPAP, cumplimiento, presión; hoja: traer CPAP; con diagnóstico no se calcula STOP-Bang), sin diagnóstico de SAOS → STOP-Bang (R6.3), infección respiratoria < 4 semanas (alerta), otras (fibrosis, bronquiectasias, hipertensión pulmonar [alerta], neumotórax previo).

### R5.3 Endocrino y metabolismo
Diabetes (tipo, evolución, complicaciones, HbA1c con fecha, hipoglucemias, gastroparesia [síntomas específicos a preguntar], bomba o sensor; HbA1c > 8,5 %: alerta), obesidad (desde IMC calculado; ≥ 40: alerta), tiroides (bocio grande o cirugía tiroidea previa: alerta de vía aérea), corticoterapia crónica (≥ 5 mg/día prednisona equivalente > 3 semanas en últimos 3 meses: alerta de dosis de estrés), insuficiencia suprarrenal, feocromocitoma (alerta roja), hiperparatiroidismo.

### R5.4 Renal y hepático
Enfermedad renal crónica (estadio, diálisis, trasplante; campo de creatinina con fecha para aclaramiento R6.7), hepatopatía/cirrosis (causa, Child-Pugh, ascitis, varices, encefalopatía, plaquetas).

### R5.5 Hematológico
HEMSTOP siempre (7 preguntas; ≥ 2 positivas: pedir estudio de coagulación y alerta). Anticoagulación/antiagregación (indicación). Trombofilia (factor V Leiden homo/heterocigoto, protrombina G20210A, déficit antitrombina, déficit proteína C/S, síndrome antifosfolípido; alimenta regla de terapia puente). TEV previo (fecha). Anemia (Hb, fecha; Hb < 13 con cirugía intermedia o alta: alerta de optimización, añadir ferritina). Trastornos de coagulación conocidos. Testigo de Jehová o rechazo de hemoderivados (alerta; registrar voluntades anticipadas y qué acepta).

### R5.6 Neurológico y psiquiátrico
Epilepsia (tipo, última crisis, fármacos), Parkinson (fármacos y horario; la levodopa nunca se omite), miastenia gravis y enfermedades neuromusculares (alerta), esclerosis múltiple, deterioro cognitivo/demencia (grado, cuidador, capacidad para consentir; alerta de delirium), trastornos psiquiátricos (IMAO y litio activan reglas específicas).

### R5.7 Dolor crónico y opioides
Localización y evolución, unidad del dolor, tratamientos intervencionistas. Opioides con cálculo de dosis equivalente de morfina oral (R6.8; ≥ 50 mg: alerta; ≥ 90 mg: alerta alta). Buprenorfina y metadona: sin conversión, alerta «no suspender; planificar con el anestesiólogo». Coadyuvantes (gabapentinoides, antidepresivos, benzodiacepinas). Si opioides de base, dosis ≥ 50 mg/día o dolor crónico con cirugía intermedia o alta: alerta de derivación a circuito de dolor transicional.

### R5.8 Musculoesquelético y reumatológico
Artritis reumatoide (afectación cervical: alerta de vía aérea), espondilitis anquilosante (limitación cervical y lumbar: alerta de vía aérea y técnica neuroaxial), lupus y conectivopatías, biológicos/inmunosupresores, cirugía de columna previa.

### R5.9 Digestivo
Reflujo (frecuencia, síntomas actuales, tratamiento), hernia de hiato grande, cirugía bariátrica previa (tipo, fecha, síntomas actuales), esofagectomía/acalasia/disfagia, nutrición enteral por sonda (gástrica o pospilórica).

### R5.10 Oncológico
Cáncer activo y tratamiento en curso, quimioterapia/inmunoterapia (fármaco y fecha de última dosis; antraciclinas o trastuzumab: preguntar por ecocardiograma), radioterapia cervical o torácica (cervical: alerta de vía aérea), reservorio venoso o PICC.

### R5.11 Infeccioso
VIH, hepatitis B/C, tuberculosis, colonización/infección por multirresistentes (aislamiento: alerta).

### R5.12 Pediatría (activado por edad ≤ edad pediátrica máxima)
Prematuridad (semanas; < 60 semanas posconcepcionales: alerta apnea), infección respiratoria vías altas < 2-4 semanas (alerta), STBUR (R6.3), cardiopatía congénita (alerta), síndromes (Down: alerta vía aérea y columna cervical), vacunación al día, vacuna en la última semana, ansiedad (niño y padres), antecedentes de NVPO del niño o familiares (POVOC), adolescentes con SAOS: traer CPAP.

### R5.13 Obstetricia (activado si embarazo)
Semana de gestación, embarazo múltiple, preeclampsia/HTA gestacional, diabetes gestacional, plaquetas en última analítica, HBPM profiláctica o terapéutica (fármaco, dosis y hora), problemas de columna, cesáreas previas, dificultad previa con epidural. ≥ 20 semanas: alerta de ayuno individualizado y profilaxis de aspiración.

### R5.14 Mujer
Posibilidad de embarazo (si la hay, alerta). Anticonceptivos hormonales combinados o THS: activa regla R8.11 (anticonceptivos). Cualquier anticonceptivo hormonal en mujer con posible anestesia general activa además la advertencia condicional sobre sugammadex (R8.15).

### R5.15 Condiciones especiales
Se recogen en el paso 6 (enfermedades y hemostasia), no en antecedentes. La hipertermia maligna y el déficit de pseudocolinesterasa se preguntan por separado como personal y familiar. Hipertermia maligna personal o familiar (alerta roja), déficit de pseudocolinesterasa personal o familiar (alerta), porfiria (alerta con recordatorio de revisar seguridad de fármacos), alergia al látex (alerta de quirófano libre de látex).

### R5.16 Codificación del efecto por respuesta
- **R5.16.1** Cada respuesta de un módulo que genera un efecto clínico lo declara en el campo `genera` de la pregunta (`datos/modulos/*.json`): tipo (alerta, nota, prueba, clase de riesgo, ASA, regla o dato), gravedad de la alerta, condición que lo dispara y sección del documento fuente. *(Decisión del servicio, 30/09/2026.)*
- **R5.16.2** El validador de módulos comprueba la forma de `genera` (cuando, efecto, tipo; gravedad obligatoria en las alertas).
- **R5.16.3** `CONTENIDO_CLINICO.md` (§16) muestra el efecto por pregunta.
- **R5.16.4** Un test de cobertura falla si una respuesta de §5/§5.16 que genera un efecto pierde su codificación o si una entrada `genera` está mal formada.

---

## R6. Escalas y cálculos

Cada escala se implementa como módulo independiente con pruebas unitarias. Siempre se muestra: puntuación, categoría y componentes que han contribuido.

### R6.1 ASA sugerido
- **R6.1.1** El ASA sugerido es el máximo de las clases mínimas asignadas por cada respuesta de los módulos, según la clasificación ASA 2020.
- **R6.1.2** La aplicación muestra qué respuestas determinan el ASA sugerido.
- **R6.1.3** El ASA se puede modificar manualmente. Las salidas muestran el valor final e indican si fue modificado.
- **R6.1.4** El sufijo «E» de urgencia se ha retirado: ya no se recoge el carácter urgente de la intervención. *(Decisión del servicio, 30/09/2026.)*

### R6.2 Vía aérea
- **R6.2.1** Datos recogidos: Mallampati (I-IV, con ilustración esquemática propia), apertura bucal (≥ 4 cm / < 4 cm), distancia tiromentoniana (> 6,5 cm / 6-6,5 cm / < 6 cm), movilidad cervical (> 90° / 80-90° / < 80°), protrusión mandibular (puede / no puede), dentición, cuello corto o grueso, perímetro del cuello, barba, antecedente de intubación difícil (no / dudoso / confirmado), radioterapia cervical, tumor de cabeza y cuello, limitación cervical reumatológica, ronquido.
- **R6.2.2** Índice de El-Ganzouri (EGRI): apertura bucal < 4 cm +1; DTM 6-6,5 cm +1, < 6 cm +2; Mallampati II +1, III/IV +2; movilidad 80-90° +1, < 80° +2; no protrusión +1; peso 90-110 kg +1, > 110 kg +2; intubación difícil dudosa +1, confirmada +2. EGRI ≥ 4: riesgo elevado de laringoscopia difícil.
- **R6.2.3** Predictores de ventilación difícil con mascarilla (Langeron): barba, IMC > 26, edéntulo, edad > 55 años, ronquido. ≥ 2 predictores: riesgo.
- **R6.2.4** Alerta independiente si: radioterapia cervical, tumor de cabeza y cuello, limitación cervical reumatológica, bocio grande, intubación difícil previa confirmada.
- **R6.2.5** En modalidad telefónica: EGRI parcial con los datos disponibles de anamnesis y aviso «exploración pendiente».

### R6.3 STOP-Bang y STBUR
- **R6.3.1** STOP-Bang (adultos sin SAOS diagnosticado): 8 ítems. 0-2 bajo; 3-4 intermedio; 5-8 alto. También alto si ≥ 2 de los 4 primeros más varón, IMC > 35 o cuello > 40 cm. Alto: alerta.
- **R6.3.2** STBUR (niños): 5 ítems. ≥ 3 positivos: riesgo aumentado (alerta). 5 positivos: alerta alta.

### R6.4 NVPO: Apfel y POVOC
- **R6.4.1** Apfel (adultos): mujer +1, no fumador +1, NVPO/cinetosis previas +1, opioides postoperatorios previstos +1. Probabilidades: 0=10 %, 1=20 %, 2=40 %, 3=60 %, 4=80 %. Si no se sabe si habrá opioides, se consideran previstos en cirugía intermedia o alta.
- **R6.4.2** POVOC/Eberhart (niños): cirugía ≥ 30 min +1, edad ≥ 3 años +1, cirugía de estrabismo +1, NVPO propias o de familiares de primer grado +1. Probabilidades: 0=9 %, 1=10 %, 2=30 %, 3=55 %, 4=70 %.

### R6.5 CHA2DS2-VA (fibrilación auricular o flúter; guía ESC 2024)
IC +1, HTA +1, edad ≥ 75 +2, DM +1, ictus/AIT/tromboembolismo +2, enfermedad vascular +1, edad 65-74 +1. Máximo 8. Informativo. No calcular CHA2DS2-VASc.

### R6.6 Capacidad funcional
Pregunta de dos pisos. Si negativa o dudosa, DASI completo (12 ítems con sus pesos METs). METs = (0,43 × DASI + 9,6) / 3,5. Capacidad reducida: < 4 METs o DASI ≤ 34.

### R6.7 Aclaramiento de creatinina
Cockcroft-Gault con peso real. Acepta mg/dL y µmol/L (con conversión). Si solo hay filtrado estimado del informe, se usa indicándolo. Sin dato: las reglas dependientes de función renal quedan en estado «requiere confirmación» hasta que se introduzca el valor.

### R6.8 Dosis equivalente de morfina oral
Suma de (dosis diaria × factor) de `opioides.json`. Factores CDC 2022: morfina oral ×1, codeína ×0,15, tramadol ×0,2, tapentadol ×0,4, oxicodona ×1,5, hidromorfona oral ×5, fentanilo transdérmico µg/h ×2,4. Buprenorfina y metadona: sin conversión automática.

### R6.9 AUDIT-C
3 preguntas, 0-12 puntos. Positivo ≥ 4 (hombres) / ≥ 3 (mujeres): consejo breve y hoja de reducción. ≥ 8: alerta de abstinencia.

### R6.10 Fragilidad y 4AT (≥ 65 años)  *(Decisión 7: el 4AT sustituye al Mini-Cog.)*
- **R6.10.1** Clinical Frailty Scale 1-9 con descripción corta de cada nivel. CFS ≥ 5: alerta de fragilidad.
- **R6.10.2** Test **4AT**, aplicable en modalidad presencial **y** telefónica (el resumen del anestesiólogo indica la modalidad en que se realizó). Componentes y puntuación:
  - **Alerta**: normal 0 / alterado 4.
  - **AMT4** (edad, fecha de nacimiento, lugar, año): 0 errores 0; 1 error 1; 2 o más errores o no valorable 2.
  - **Meses del año al revés**: 7 o más correctos 0; empieza pero menos de 7 1; no valorable 2.
  - **Cambio agudo o curso fluctuante**: no 0 / sí 4.
- **R6.10.3** Interpretación del 4AT (total): **0** = deterioro cognitivo/delirium improbable; **1-3** = posible deterioro cognitivo (alerta de riesgo de delirium + recomendaciones de prevención); **4 o más** = posible delirium actual (**alerta roja**, valoración por el anestesiólogo antes de la cirugía).
- **R6.10.4** Con fragilidad (CFS ≥ 5), 4AT ≥ 1 o deterioro cognitivo conocido: la hoja del paciente incluye recomendaciones de prevención del delirium (traer gafas y audífonos, venir acompañado, que el acompañante pueda estar en la recuperación si el circuito lo permite, no empezar sedantes nuevos por su cuenta) y la salida del anestesiólogo añade: evitar benzodiacepinas y anticolinérgicos, valorar monitorización de profundidad anestésica.

---

## R7. Pruebas complementarias

### R7.1 Clasificación de riesgo quirúrgico
Según `procedimientos.csv`: bajo (< 1 %), intermedio (1-5 %), alto (> 5 %).

### R7.2 Clase de riesgo del paciente
La más alta asignada por los módulos: bajo, bajo-moderado, moderado, alto (definiciones de `docs/documento_fuente.md §7.2`).

### R7.3 Tabla de decisión de pruebas
La aplicación aplica la tabla completa de `docs/documento_fuente.md §7.3` (notas *, ** y ***) y pregunta los supuestos de excepción para Rx de tórax. Incluye la lógica de ecocardiograma. La sulodexida **no** interviene en la petición de pruebas (es solo una regla de medicación; véase Decisión 2).

### R7.4 Validez de pruebas
Hemograma 30 días, bioquímica 30 días, coagulación 14 días, ECG 3 meses, Rx tórax 3 meses, ecocardiograma 12 meses (18 si función conocida y estable). La aplicación pregunta por pruebas recientes con su fecha y compara con la fecha de la intervención.

---

## R8. Reglas de medicación

### R8.0 Motor de reglas
- Los plazos se calculan en horas desde la última toma hasta la hora prevista de la intervención.
- La aplicación calcula la fecha/hora límite de la última toma y la traduce al lenguaje del paciente con el día de la semana.
- «Mantener» se traduce en «Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua».
- Sin hora de intervención: se usa 08:00 y la hoja avisa.
- Fármaco no catalogado: mantener y consultar con el anestesiólogo.
- Cada regla guarda su fuente en los datos (protocolo del servicio, ESC 2022, ESC 2024, CPOC, ACR 2022, CDC 2022, ASRA 2018, EHRA 2021).
- Cualquier regla que devuelva «requiere confirmación» activa el mecanismo R12.
- **Clasificación de bloqueos (Decisión 9):** «bloqueo periférico» y «bloqueo profundo» son categorías separadas. Bloqueos de plano fascial (TAP, erector de la columna, PENG, serrato) se consideran **periféricos**. Bloqueos **profundos** por defecto: paravertebral, plexo lumbar/compartimento del psoas, plexo cervical profundo e intercostal. La lista de bloqueos profundos es **editable en `reglas_farmacos.json`**.
- **Combinaciones fijas (Decisión 5):** una combinación fija (una sola pastilla) genera **una única instrucción** por medicamento comercial, aplicando el plazo **más restrictivo** de sus componentes (p. ej. «Deje de tomar Synjardy 3 días antes»). Si los principios activos se toman en medicamentos separados, se genera una instrucción por medicamento. Cuando la combinación obligue a retirar la metformina antes de su plazo propio, se añade en las notas del anestesiólogo: «vigilar glucemia en los días sin tratamiento».

### R8.1 Antivitamina K (warfarina, acenocumarol)
Según riesgo hemorrágico y oftalmológico: no suspender si oftalmología de riesgo bajo o hemorrágico mínimo (verificar INR). Resto: coordinar o suspender (warfarina 5 días, acenocumarol 3 días). Terapia puente con los criterios de `docs/documento_fuente.md §8.1` (siempre requiere confirmación).

### R8.2 ACOD (dabigatrán, rivaroxabán, apixabán, edoxabán)  *(Decisión 1.)*
- No suspender en oftalmología de riesgo bajo.
- Riesgo hemorrágico bajo sin neuroaxial ni bloqueo profundo: 48 h.
- Riesgo hemorrágico alto, neuroaxial o bloqueo profundo: 72 h.
- **Dabigatrán con técnica neuroaxial (los ajustes por aclaramiento se suman al plazo de neuroaxial):** CrCl > 80 mL/min → **72 h**; CrCl 50-80 → **96 h**; CrCl < 50 → **120 h**. Fuera de neuroaxial, mantiene los ajustes de `docs/documento_fuente.md §8.2` (+24 h con CrCl 50-80; +48 h con CrCl < 50 sobre el plazo base).
- **Anti-Xa (rivaroxabán, apixabán, edoxabán) con técnica neuroaxial y CrCl < 30 mL/min → 96 h.** Fuera de neuroaxial, +24 h con CrCl < 30 sobre el plazo base.
- Nota informativa para el anestesiólogo con riesgo hemorrágico bajo, sin neuroaxial ni bloqueo profundo y CrCl > 50: «podría considerarse suspender solo 24 h».
- Criterio de alto riesgo trombótico de R8.1: requiere confirmación con el texto «consultar con hematología o cardiología el cambio a acenocumarol para poder hacer terapia puente».

### R8.3 Antiagregantes
AAS ≤ 200 mg: mantener (excepto neurocirugía intracraneal/canal medular: confirmación). AAS > 200 mg: suspender 7 días (indicación cardiovascular: confirmación con sugerencia de pasar a 100 mg/día). Stent < 6 meses tras programado o < 12 meses tras SCA: alerta de diferir, requiere confirmación. Inhibidores P2Y12 (clopidogrel 5 días, ticagrelor 5 días, prasugrel 7 días; con neuroaxial o bloqueo profundo 7/7/10 días). Situaciones específicas de oftalmología. Triflusal, dipiridamol, cilostazol, sulodexida, GP IIb/IIIa y cangrelor según `docs/documento_fuente.md §8.3`. Demás reglas según `docs/documento_fuente.md §8.3`.

### R8.4 Heparinas y fondaparinux
Plazos según tipo (profiláctica/terapéutica), técnica anestésica y aclaramiento. Tablas SETH para clasificación dosis profiláctica/terapéutica.

### R8.5 Antidiabéticos e insulina  *(Decisiones 5, 6 y 8.)*
Reglas específicas para cada grupo farmacológico según el protocolo de preanestesia en diabéticos y CPOC (detalle completo en `docs/documento_fuente.md §8.5`). Precisiones acordadas:
- **Combinaciones fijas:** ver R8.0 (una instrucción por medicamento comercial, plazo más restrictivo; nota de vigilar glucemia si retira la metformina antes de su plazo).
- **Combinaciones fijas de insulina + GLP-1** (Xultophy, Suliqua): requiere confirmación (omitir el GLP-1 dejaría sin insulina basal).
- **GLP-1 diarios (semaglutida oral, liraglutida, lixisenatida):** «omitir 3 dosis» significa **no tomar los 3 días previos ni el día de la intervención**; la última dosis es **4 días antes** (ejemplo: intervención el jueves → última toma el domingo). Ayuno estándar.
- **GLP-1 semanales:** si la dosis semanal cae **entre 7 días antes y el día de la intervención (ambos incluidos)**, **no se administra**; la hoja del paciente indica **la fecha exacta de la dosis que se omite**. Dieta de líquidos claros las 24 h previas (hoja anexa). *(docs/documento_fuente.md §8.5.)*
- **Bomba de insulina:** basal al 70-80 % y suspender los bolos. En **cirugía de riesgo bajo en CMA**, la enfermera registra la pauta del protocolo **sin confirmación**. En **cirugía de riesgo intermedio o alto, o con ingreso**, **requiere confirmación**.

### R8.6 AINE
Plazos por principio activo: ibuprofeno 24 h, naproxeno 72 h, diclofenaco/dexketoprofeno/ketorolaco 24 h, celecoxib/etoricoxib: mantener. Texto al paciente sobre alternativas analgésicas (paracetamol o metamizol).

### R8.7 Psicofármacos y neurología
IMAO irreversibles (retirar 10-14 días, requiere confirmación, nota de anestesia segura), moclobemida (suspender 24 h), IMAO-B antiparkinsonianos (mantener, nota), litio (suspender según riesgo quirúrgico: bajo 24 h, intermedio 48 h, alto 72 h), resto: mantener.

### R8.8 Inmunosupresores y reumatología
Azatioprina/ciclosporina/tacrolimus/micofenolato: mantener por trasplante; confirmación si autoinmune. Metotrexato > 20 mg/semana: confirmación. Leflunomida/hidroxicloroquina/sulfasalazina: mantener. Inhibidores JAK: suspender 3 días. Biológicos: planificación por ciclo, requiere confirmación.

### R8.9 Oncológicos
Inhibidores de tirosina cinasa: continuar hasta la cirugía. Antiangiogénicos sistémicos (bevacizumab, aflibercept oncológico, ramucirumab): última dosis < 6-8 semanas: alerta de diferir, requiere confirmación. Aflibercept intravítreo: mantener.

### R8.10 Cardiovasculares
IECA/ARA-II: suspender 24 h (excepto IC con disfunción sistólica, infarto reciente o proteinuria/nefropatía: mantener). Sacubitrilo/valsartán: confirmación. Betabloqueantes, antagonistas del calcio, nitratos, amiodarona, digoxina, estatinas: mantener. Diuréticos: no tomar la mañana de la intervención.

### R8.11 Otros
Fitoterapia/suplementos con efecto sobre coagulación: suspender 14 días (mínimo 7). **Anticonceptivos hormonales combinados y THS con riesgo trombótico alto (Decisión 4):** la sugerencia de suspensión (valorar suspender 4-6 semanas antes y método alternativo) va **solo en las notas del anestesiólogo**. Además, **la hoja del paciente muestra la línea del mecanismo general de requiere confirmación (R12.1) referida al anticonceptivo** —«Sobre su anticonceptivo, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta»— **hasta que el punto se confirme**; una vez confirmado (R12.2) se muestra la pauta indicada por el anestesiólogo. Corticoides: mantener. Levotiroxina, inhaladores, IBP, alopurinol, bifosfonatos, opioides crónicos: mantener.

### R8.12 Reanudación posoperatoria
Solo en notas del anestesiólogo (detalle completo en `docs/documento_fuente.md §8.12`).

### R8.13 Salida por fármaco
Nombre comercial y principio activo, acción recomendada, fecha/hora de última toma, regla aplicada, fuente, si requiere confirmación.

### R8.14 Ayuno
Las horas se calculan desde la hora prevista de inducción y se muestran como horas de reloj. Reglas completas del protocolo de Vithas Barcelona (adultos, pediatría, diabetes, GLP-1 semanal, reflujo, bariátrica, embarazo, nutrición enteral, contraste oral). Solo en notas del anestesiólogo: criterios de profilaxis de aspiración con tabla de fármacos y dosis.

### R8.15 Sugammadex y anticoncepción hormonal  *(Decisión 11.)*
En toda mujer con **cualquier anticonceptivo hormonal** y **posible anestesia general**, la hoja del paciente incluye, de forma **condicional** («si durante la anestesia se usa sugammadex»):
- **Anticonceptivo oral:** la administración de sugammadex equivale a olvidar una toma; seguir las instrucciones de «dosis olvidada» del prospecto del anticonceptivo.
- **Anticonceptivo hormonal no oral (implante, anillo, parche, DIU hormonal):** usar además un método de barrera (preservativo) durante los **7 días** siguientes.

Las notas del anestesiólogo recuerdan **informar a la paciente al alta si se ha usado sugammadex**. Fuente: ficha técnica de sugammadex.

---

## R9. Cribado mtND4 (consenso SEDAR 2026)

- **R9.1** Pregunta obligatoria en todos los pacientes, con guion sugerido para la enfermera.
- **R9.2** Cuatro preguntas: ascendencia venezolana materna directa, origen materno desconocido u ovodonación, antecedentes familiares compatibles, resultado del test genético (variante m.11232T>C) si ya se ha realizado.
- **R9.3** Lógica de alerta *(Decisión 10)*:
  - **Test genético positivo** (portador de la variante) = **alerta roja**, más la recomendación de **vigilancia postoperatoria estrecha**.
  - **Test genético negativo** (variante ausente) = **alerta informativa**: «variante m.11232T>C ausente; decisión del anestesiólogo».
  - **Ascendencia materna venezolana directa, origen materno desconocido, ovodonación o antecedentes familiares compatibles sin test** = **alerta roja**.
- **R9.4** Las medidas se muestran en las notas del anestesiólogo (diferir si es posible y hacer test, o TIVA/regional si no es diferible, con purgado de máquina y circuito, EEG procesado, normoxia, normocapnia, normotermia, estabilidad hemodinámica, control de glucemia y equilibrio ácido-base).
- **R9.5** En la hoja del paciente solo aparece: «El anestesiólogo hablará con usted sobre este punto antes de la intervención».
- **R9.6** La fuente y fecha del documento SEDAR se muestran junto a esta sección para facilitar actualizaciones (recomendaciones provisionales).

---

## R10. Salidas

### R10.1 Texto para SAP
- Texto plano, listo para copiar. Generado por plantillas de `plantillas_sap.json` sin IA.
- Utilidades gramaticales (enumeraciones, singular/plural, concordancia, omisión de vacíos, fechas cortas).
- Abreviaturas configurables, política de negativos configurable.
- Opción «solo ASCII» (sin tildes ni símbolos especiales).
- Sin límite de caracteres: el texto recoge solo antecedentes patológicos y quirúrgicos; el resto del informe se rellena con los desplegables del propio SAP. *(Decisión del servicio, 30/09/2026.)*
- Vista previa sobre los casos de entrenamiento en el panel de administración.

### R10.2 Hoja de recomendaciones para el paciente
- Castellano o catalán (conmutador de idioma visible).
- Lenguaje sencillo, tratamiento de usted, letra grande, diseño táctil.
- Secciones: día/hora, medicación en tabla, ayuno con horas de reloj, qué traer, tabaco/alcohol (hojas anexas si aplica), delirium si aplica (R6.10), consentimiento, prehabilitación **solo si `prehabilitacion_activa = true`** (R13), advertencia condicional de sugammadex si aplica (R8.15), cuándo llamar, teléfono de contacto, versión y fecha.
- Disponible en pantalla (para leer en voz alta), PDF (generado en el navegador) y QR (R11.1).
- **No se exporta ni genera QR sin resolver los puntos pendientes de confirmación** (confirmados o dejados explícitamente como «le llamaremos»).

### R10.3 Resumen para el anestesiólogo
- Pantalla y PDF: alertas por gravedad (roja, amarilla, informativa), puntos pendientes, cálculos con componentes, plan de medicación con fuente, pruebas, ayuno. Indica la modalidad en que se hizo la entrevista (relevante para el 4AT, R6.10.2).
- Apartado plegable «Notas técnicas»: profilaxis de aspiración, anestesia segura con IMAO, medidas mtND4, reanudación de antitrombóticos, notas de diabetes y dolor, aviso de sugammadex al alta (R8.15), nota de vigilar glucemia en combinaciones fijas de antidiabéticos (R8.0).
- Listado de sugerencias del asistente de coherencia descartadas por la enfermera.

---

## R11. QR y enlaces

- **R11.1** Los datos viajan en el fragmento de la URL (`#`), que el navegador no envía a GitHub Pages. Se comprimen y codifican en base64url.
- **R11.2** Cada carga útil incluye: tipo (paciente/anestesiólogo), versión del esquema, versión del contenido clínico, fecha de creación y fecha de caducidad.
- **R11.3** Nunca incluyen nombre, número de historia ni campo de identificación.
- **R11.4** Enlace caducado: muestra «Este enlace ha caducado. Llame al [teléfono]» sin mostrar datos.
- **R11.5** QR del paciente: contiene la hoja ya calculada **en forma estructurada** (nombre comercial, código de acción y fecha/hora de cada fármaco, horas de ayuno, ids de los anexos aplicables, teléfono y **versión de los textos**), **no** las respuestas de la entrevista ni textos largos. La vista del paciente renderiza esa estructura en castellano o catalán con los textos de la versión indicada, tomados de `datos/textos/historico/<versión>/`, de modo que la hoja no cambie aunque luego se actualice el catálogo o los textos. Caducidad: 30 días después de la fecha de intervención (configurable). Vista de solo lectura adaptada a móvil con conmutador de idioma, botón para guardar como PDF e indicación de cómo añadirla a la pantalla de inicio. No se genera mientras haya puntos pendientes sin resolver (R12).
- **R11.6** QR del anestesiólogo: contiene la entrevista completa. Al abrirlo, el anestesiólogo puede confirmar puntos pendientes con su nombre; la aplicación genera el QR/enlace definitivo del paciente y el SAP actualizado. Caducidad: 60 días (configurable).
- **R11.7** Si la versión del contenido del enlace difiere de la actual: aviso visible.
- **R11.8** Si la carga supera la capacidad del QR (~2,9 KB con corrección media/baja), la aplicación avisa y ofrece copiar el enlace.
- **R11.9** La caducidad es una regla de visualización, no cifrado; esto se documenta en el README.
- **R11.10** Botón «Copiar enlace para el paciente» (preparado para envío futuro por WhatsApp corporativo).

---

## R12. Seguridad clínica

- **R12.1** Los fármacos/recomendaciones con «requiere confirmación» aparecen en la hoja del paciente como «Sobre [fármaco], el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta». Esto incluye el caso de los anticonceptivos hormonales combinados y la THS con riesgo trombótico alto (R8.11, Decisión 4): la hoja del paciente muestra esta línea referida al anticonceptivo hasta que se confirme el punto.
- **R12.2** Se puede marcar «confirmado por el anestesiólogo» con su nombre, desde la tablet o desde el QR del anestesiólogo. Solo entonces se muestra la pauta. El nombre aparece en el texto de SAP.
- **R12.3** La hoja del paciente no se exporta ni genera QR sin revisar todos los puntos pendientes.
- **R12.4** Pie en todas las salidas: «Recomendaciones generadas según los protocolos del Servicio de Anestesiología (versión X, revisión fecha). Validación final por el anestesiólogo.»
- **R12.5** Si falta un dato que cambia la recomendación, ésta requiere confirmación e indica qué dato falta.
- **R12.6** Validación de rangos en peso, talla, edad, dosis y fechas, con aviso ante valores improbables.
- **R12.7** Stent reciente + técnica neuroaxial *(Decisión 3)*: se emiten **ambas** alertas; la del stent **primero y en rojo**. La hoja del paciente **no muestra ninguna pauta de antiagregantes** hasta que el anestesiólogo lo confirme.

---

## R13. Prehabilitación

- **R13.1** La derivación a PreHabilítame está controlada por el interruptor `prehabilitacion_activa` de `config.json`, **por defecto `false`** (proyecto piloto). Con el interruptor **apagado**, la prehabilitación **no aparece** ni en la hoja del paciente ni en las notas del anestesiólogo. *(Decisión 13.)*
- **R13.2** Con el interruptor **encendido**: si la cirugía es de riesgo intermedio o alto y hay capacidad funcional reducida, fragilidad (CFS ≥ 5) o anemia, la hoja del paciente incluye un apartado de prehabilitación con el enlace y un QR a PreHabilítame (URL configurable en `config.json`, por defecto https://holaaneshealth-eng.github.io/Prehabilitame/), y las notas del anestesiólogo lo recogen como derivación propuesta.

---

## R14. Herramientas del servicio

### R14.1 Panel de administración de contenido
- Permite ver y editar en tablas/formularios todos los ficheros de datos de `datos/`.
- Valida en tiempo real y descarga el fichero corregido para subir al repositorio (el panel no escribe en GitHub).
- Muestra un diff con la versión publicada.
- Incluye instrucciones para publicar cambios en GitHub y actualizar la versión en `config.json`.

### R14.2 Modo entrenamiento
- Carga los casos de `datos/casos_entrenamiento/` con la entrevista ya rellenada.
- Banda visible «ENTRENAMIENTO» en todas las pantallas y salidas.
- Comparación de respuestas con los resultados esperados.
- No cuenta en el cuadro de mando de uso (R14.3).

### R14.3 Cuadro de mando de uso
- Contador guardado solo en `localStorage` del dispositivo, **sin datos clínicos ni identificadores**.
- Campos guardados: fecha, hora de inicio, duración, modalidad, tipo de paciente, riesgo quirúrgico.
- Gráficas por día, semana y mes, tiempo medio, exportación a CSV, botón de borrado.

### R14.4 Guía imprimible en blanco
PDF generado desde los módulos con el guion de preguntas y casillas para anotar a mano.

---

## R15. Pruebas automáticas

### R15.1 Cobertura mínima obligatoria
- Pruebas unitarias de cada escala (ASA, EGRI, Langeron, STOP-Bang, STBUR, Apfel, POVOC, CHA2DS2-VA, DASI/METs, Cockcroft-Gault, dosis morfina equivalente, AUDIT-C, CFS, 4AT).
- Pruebas unitarias de cada regla de medicación (R8.1 a R8.15).
- Pruebas de extremo a extremo con los 23 casos de `docs/documento_fuente.md §15` (véase R15.2) que deben incluirse también en `datos/casos_entrenamiento/`.
- Prueba de privacidad: tras una entrevista completa, verificar que no queda ningún dato clínico en `localStorage`, `sessionStorage`, `IndexedDB`, cookies ni caché del service worker.
- Prueba de tamaño de QR con los casos más complejos.
- Prueba de validación de ficheros de datos corruptos (R2.3).

### R15.2 Ajustes a los casos de prueba por las decisiones
- **Caso 1** (apixabán, prótesis rodilla, raquídea, CrCl 45): resultado esperado 72 h (anti-Xa con neuroaxial y CrCl ≥ 30 mantiene 72 h). CHA2DS2-VA 3.
- **Caso 2** (dabigatrán, CrCl 40, colecistectomía, AG sin neuroaxial): 48 + 48 = 96 h.
- **Caso 17** *(Decisión 7, actualizado)*: mujer de 78 años, CFS 6, **4AT** (en lugar de Mini-Cog), Hb 11,5, artroplastia de cadera. Se recalcula el 4AT según sus componentes; si el resultado es 1-3, alerta de riesgo de delirium; si es ≥ 4, alerta roja de posible delirium. Alertas de fragilidad y anemia, ferritina. La prehabilitación solo aparece si `prehabilitacion_activa = true`.
- Se añaden casos para: GLP-1 diario (última dosis 4 días antes), GLP-1 semanal (omisión de la dosis que cae en los 7 días previos con fecha exacta), dabigatrán + neuroaxial en los tres tramos de aclaramiento (72/96/120 h), anti-Xa + neuroaxial con CrCl < 30 (96 h), stent reciente + neuroaxial (doble alerta), bomba de insulina en CMA de bajo riesgo (sin confirmación) frente a ingreso (con confirmación), y advertencia de sugammadex en anticonceptivo oral y no oral.

---

## R16. Idioma e internacionalización

- **R16.1** Interfaz de la aplicación en español de España.
- **R16.2** Textos para el paciente en castellano y catalán desde la primera versión.
- **R16.3** Las traducciones al catalán se generan automáticamente y se marcan como «⚠️ PENDENT DE REVISIÓ» en los ficheros `datos/textos/ca/`.
- **R16.4** El conmutador de idioma del paciente es visible en la hoja del paciente y en el QR.

---

## Decisiones registradas (resolución de ambigüedades)

Las ambigüedades detectadas en la versión 0.1 quedaron resueltas por el servicio con las siguientes decisiones, ya incorporadas al articulado anterior:

1. **ACOD + neuroaxial + aclaramiento** → se suman los plazos. Dabigatrán con neuroaxial: 72 h (CrCl > 80), 96 h (50-80), 120 h (< 50). Anti-Xa con neuroaxial y CrCl < 30: 96 h. *(R8.2.)*
2. **Sulodexida** → solo regla de medicación; no afecta a las pruebas complementarias. *(R7.3, R8.3.)*
3. **Stent reciente + neuroaxial** → ambas alertas; stent primero y en rojo; sin pauta de antiagregantes en la hoja del paciente hasta confirmación. *(R12.7.)*
4. **Anticonceptivos/THS en riesgo trombótico alto** → sugerencia de suspensión solo en notas del anestesiólogo; **además**, la hoja del paciente muestra la línea del mecanismo general de requiere confirmación referida al anticonceptivo («el anestesiólogo le llamará…») hasta que se confirme. *(R8.11, R12.1.)*
5. **Combinaciones orales de antidiabéticos** → una instrucción por medicamento comercial con el plazo más restrictivo; nota de vigilar glucemia si se retira la metformina antes de su plazo. *(R8.0, R8.5.)*
6. **Bomba de insulina** → sin confirmación en CMA de bajo riesgo; con confirmación en riesgo intermedio/alto o ingreso. *(R8.5.)*
7. **4AT sustituye al Mini-Cog** → en ≥ 65 años, presencial y telefónica; puntuación e interpretación en R6.10; caso 17 actualizado.
8. **GLP-1** → diarios: última dosis 4 días antes (omitir 3 días previos + día de la IQ). Semanales: omitir la dosis que caiga entre 7 días antes y el día de la intervención (ambos incluidos), indicando fecha exacta. *(R8.5; docs/documento_fuente.md §8.5.)*
9. **Técnica anestésica** → «bloqueo periférico» y «bloqueo profundo» separados; planos fasciales = periféricos; profundos por defecto: paravertebral, plexo lumbar/psoas, plexo cervical profundo, intercostal (lista editable). *(R3.2.6, R8.0.)*
10. **mtND4** → test positivo = alerta roja + vigilancia postoperatoria estrecha; test negativo = alerta informativa; factores de riesgo sin test = alerta roja. *(R9.3.)*
11. **Sugammadex y anticoncepción** → advertencia condicional en la hoja del paciente (oral: dosis olvidada; no oral: barrera 7 días) y recordatorio al alta en las notas del anestesiólogo. *(R8.15, R5.14.)*
12. **Stack** → Vite + React + TypeScript estricto + Vitest + Playwright, motor de dominio aislado de la UI, despliegue en GitHub Pages con GitHub Actions. Sin usar PreHabilítame como referencia. *(design.md.)*
13. **Prehabilitación** → derivación desactivada por defecto (`prehabilitacion_activa: false`), URL configurable; apagada no aparece en ninguna salida. *(R13.)*
14. **Repositorio destino** → `fernigear-spec/preanestesia` (público). Todas las referencias a `holaaneshealth-eng` como organización del proyecto quedan corregidas; la URL de PreHabilítame se mantiene solo como valor por defecto configurable del enlace externo.

### Novedades incorporadas del documento fuente v3

- **QR del paciente estructurado + histórico de textos (R11.5, R2.2.9):** el QR del paciente lleva la hoja en forma estructurada (códigos de acción, fechas, ids de anexos, versión de textos), no textos largos; la vista los renderiza con los textos de la versión con que se generó, conservados en `datos/textos/historico/<versión>/`. Esto garantiza que un QR antiguo muestre siempre la misma hoja aunque se actualice el contenido.
- **Catálogo del Anexo A ampliado:** combinaciones antihipertensivas (Atacand Plus/Parapres Plus, Viacoram, Sevikar) y de antidiabéticos/insulina (Qtern, Trijardy, Ryzodeg) pasan de sugerencia a catálogo oficial (`verificado_cima = no`).
- **Documento fuente versionado:** se conserva en `docs/documento_fuente.md` (v3).

---

## Nombres comerciales adicionales (ya integrados en el Anexo A v3)

Las sugerencias que se propusieron en la v0.2 han sido aceptadas por el servicio e incorporadas oficialmente al catálogo del Anexo A del documento fuente v3 (con `verificado_cima = no`, pendientes de validación en CIMA antes del uso clínico):

- **Candesartán + hidroclorotiazida**: Atacand Plus, Parapres Plus.
- **Perindopril + amlodipino**: Viacoram.
- **Olmesartán + amlodipino**: Sevikar.
- **Dapagliflozina + saxagliptina**: Qtern.
- **Empagliflozina + metformina + linagliptina**: Trijardy.
- **Insulina degludec + aspart**: Ryzodeg.

Nota: **Zepbound** (tirzepatida para obesidad) queda como sugerencia pendiente de verificar disponibilidad en España; no se ha añadido al Anexo A. El equipo médico debe validar todos los nombres comerciales en CIMA (https://cima.aemps.es) antes del uso clínico.
