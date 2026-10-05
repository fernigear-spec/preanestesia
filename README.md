# AnesHealth · Entrevista preanestésica de enfermería

Programa web de **apoyo** a la entrevista preanestésica de enfermería del **Servicio
de Anestesiología, Reanimación y Terapéutica del Dolor del Hospital Vithas Barcelona**.

> Este documento está escrito para el personal del servicio (sin conocimientos
> técnicos). Explica qué hace el programa, cómo se usa, cómo se mantiene su contenido
> clínico y qué queda pendiente antes de usarlo con pacientes.

---

## 1. Qué es y qué no es

**Qué es:** una ayuda para hacer la entrevista preanestésica de forma guiada y
ordenada. Recoge los datos del paciente, calcula escalas, propone qué hacer con la
medicación y las pruebas, redacta un resumen para el anestesiólogo y genera una hoja
de recomendaciones para el paciente con un código QR.

**Qué NO es:** no es un sustituto del juicio clínico. Todo lo que propone el programa
es una **sugerencia**; la decisión final es siempre del anestesiólogo responsable. El
programa no diagnostica ni prescribe.

## 2. Para quién es

Para las **enfermeras de anestesia** y los **anestesiólogos** del Servicio de
Anestesiología del Hospital Vithas Barcelona. La entrevista la realiza la enfermera
(presencial o telefónica) y el resultado lo revisa y valida el anestesiólogo.

## 3. Cómo se usa (resumen)

La entrevista tiene **12 pasos**:

1. Datos de la intervención (procedimiento, fecha, hora).
2. Alergias.
3. Datos básicos (edad, sexo, peso, talla; en embarazadas y niños, datos propios).
4. Antecedentes (intervenciones y anestesias previas).
5. Hábitos (tabaco, alcohol, capacidad funcional, fragilidad).
6. Enfermedades y hemostasia (se abren cuestionarios por patología; HEMSTOP siempre).
7. Técnica anestésica prevista.
8. Medicación habitual (qué tomar, suspender o ajustar y cuándo).
9. Vía aérea (no en la entrevista telefónica).
10. Consentimiento.
11. Origen materno (cribado mitocondrial mtND4).
12. Resultados.

En la pantalla de **resultados** aparece:

- **Resumen del anestesiólogo:** alertas, ASA sugerido, escalas, plan de medicación,
  pruebas, ayuno y notas técnicas.
- **Puntos de validación clínica:** situaciones que conviene revisar antes de la
  intervención, de dos tipos: 🔴 «valorar posponer la cirugía programada» y 🟡
  «validar antes de la intervención». No bloquean nada; cada uno se resuelve con
  «Validado por [nombre]» o «Posponer o derivar».
- **Puntos pendientes de confirmación:** fármacos cuya pauta requiere que el
  anestesiólogo la confirme (con su nombre) o marque «le llamaremos».
- **Texto para SAP:** antecedentes listos para copiar y pegar en la historia.
- **Hoja del paciente y QR:** recomendaciones para el paciente (medicación, ayuno,
  qué traer…). El paciente escanea el QR y ve su hoja en el móvil; puede cambiar el
  idioma (castellano/catalán), recalcular las fechas si le cambian la cita y guardar
  un PDF.

## 4. Privacidad

- **No se guardan datos de pacientes.** La entrevista vive solo en la memoria del
  dispositivo mientras dura.
- **Borrado automático** a los **30 minutos de inactividad**.
- El **código QR del paciente lleva los datos dentro del propio enlace**, no en
  ningún servidor: nadie los almacena. El enlace caduca por sí solo.
- El programa no envía datos a internet (sin analítica ni rastreadores).

## 5. Direcciones (dónde se usa)

- **Versión de pruebas (actual):** https://holaaneshealth-eng.github.io/preanestesia/
  — muestra la banda «VERSIÓN DE PRUEBA · NO USAR CON PACIENTES».
- **Versión definitiva (pendiente):** tras la migración a Cloudflare (con acceso
  protegido para el personal). Los pasos están en
  [`docs/despliegue_cloudflare.md`](docs/despliegue_cloudflare.md). **La migración
  debe hacerse antes de usar el programa con pacientes reales.**

## 6. Herramientas del servicio

Accesibles desde los enlaces del pie de la aplicación:

- **Modo entrenamiento:** casos de ejemplo ya rellenados para practicar y comparar
  con el resultado esperado (no cuentan en el contador de uso).
- **Guía imprimible:** un PDF con el guion de preguntas y casillas para anotar a
  mano, por si falla el equipo.
- **Cuadro de mando de uso:** estadísticas de uso guardadas solo en el dispositivo,
  sin datos clínicos.
- **Administración de contenido:** para ver y editar los datos clínicos (ver abajo).

## 7. Cómo se actualiza el contenido clínico

Todo el contenido clínico vive en la carpeta **`datos/`** y se puede editar **sin
programar**, desde el **panel de administración** de la propia aplicación:

| Fichero | Qué contiene |
| --- | --- |
| `datos/config.json` | Parámetros generales (teléfono, minutos de inactividad, validez del QR, direcciones). |
| `datos/farmacos.csv` | Catálogo de fármacos (nombres comerciales, regla, vía…). |
| `datos/procedimientos.csv` | Catálogo de procedimientos y sus riesgos. |
| `datos/reglas_farmacos.json` | Parámetros de las reglas de medicación (plazos, umbrales). |
| `datos/modulos/*.json` | Cuestionarios por enfermedad (preguntas y lo que generan). |
| `datos/validaciones.json` | Puntos de validación clínica (§13 bis). |
| `datos/plantillas_sap.json` | Abreviaturas del texto para SAP. |
| `datos/opioides.json` | Factores de conversión de opioides a morfina. |
| `datos/textos/{es,ca}/paciente.json` | Textos de la hoja del paciente (castellano y catalán). |

**Cómo editar y publicar un cambio (paso a paso):**

1. En la aplicación, abra **«Administración de contenido»** (enlace del pie).
2. Elija el fichero que quiere cambiar. Verá una tabla (CSV) o un editor de texto
   (JSON) y, a la derecha, un aviso que **valida** lo que escribe en el momento.
3. Haga el cambio. Si hay un error (por ejemplo, una regla que no existe), el panel
   lo avisa y no le dejará dar por bueno el fichero.
4. Pulse **«Descargar»**. Se guardará en su ordenador el fichero corregido.
5. Suba ese fichero al repositorio de GitHub:
   - Entre en el repositorio en `github.com/holaaneshealth-eng/preanestesia`.
   - Navegue hasta la carpeta del fichero (por ejemplo `datos/`).
   - Pulse el fichero y luego el icono del **lápiz** (editar) o
     **«Add file → Upload files»** para sustituirlo por el que descargó.
   - Escriba una descripción corta del cambio y pulse **«Commit changes»**.
6. En unos minutos el cambio queda publicado automáticamente.
7. Si cambia el contenido clínico, **suba también la versión** en `datos/config.json`
   (`version_contenido`) y la fecha de revisión.

> **Importante:** todo cambio clínico debe reflejarse también en
> [`docs/documento_fuente.md`](docs/documento_fuente.md) (la fuente de la verdad
> clínica) y regenerarse [`CONTENIDO_CLINICO.md`](CONTENIDO_CLINICO.md), que es el
> documento legible que el servicio revisa y firma.

## 8. Documentos de referencia

- [`docs/documento_fuente.md`](docs/documento_fuente.md) — especificación clínica
  completa (la fuente de la verdad).
- [`CONTENIDO_CLINICO.md`](CONTENIDO_CLINICO.md) — resumen legible de **lo que hace**
  el programa (reglas, escalas, textos, puntos de validación), para revisar y firmar.
- [`docs/casos_referencia.md`](docs/casos_referencia.md) e
  [`docs/informe_casos_referencia.md`](docs/informe_casos_referencia.md) — casos de
  prueba y su resultado.
- [`docs/cotejo_nombres_comerciales_CIMA_2026-09-30.csv`](docs/cotejo_nombres_comerciales_CIMA_2026-09-30.csv)
  — cotejo de los nombres comerciales con CIMA (AEMPS).
- [`docs/despliegue_cloudflare.md`](docs/despliegue_cloudflare.md) — guía para
  publicar la versión definitiva con acceso protegido.

## 9. Responsabilidad clínica y mantenimiento

> **Contenido clínico validado por el Servicio de Anestesiología (pendiente de
> firma).**

- **Responsable clínico:** ______________________________
- **Fecha de la última revisión:** __________________
- **Versión del contenido:** ver `version_contenido` en `datos/config.json`.

El mantenimiento del contenido clínico (fármacos, reglas, textos) es responsabilidad
del Servicio de Anestesiología. Cualquier duda sobre el funcionamiento del programa
debe dirigirse al responsable designado.

## 10. Licencia y copyright

```
© 2026 AnesHealth. Todos los derechos reservados. Uso restringido al Servicio de Anestesiología del Hospital Vithas Barcelona.

AnesHealth · Programa de apoyo a la entrevista preanestésica de enfermería

LICENCIA PROPIETARIA — TODOS LOS DERECHOS RESERVADOS

Este software y todo su contenido (código fuente, textos clínicos, catálogos de
fármacos, reglas de medicación, módulos, ilustraciones y documentación) son
propiedad de AnesHealth y están protegidos por las leyes de propiedad intelectual.

Su uso queda restringido al Servicio de Anestesiología, Reanimación y Terapéutica
del Dolor del Hospital Vithas Barcelona, exclusivamente para los fines internos de
apoyo a la entrevista preanestésica de enfermería para los que ha sido desarrollado.
```

Texto completo en [`LICENSE`](LICENSE).

## 11. Pendiente antes del uso clínico

- [ ] **Firma del contenido clínico** por el Servicio de Anestesiología.
- [ ] **Revisión del catalán** de la hoja del paciente (hoy marcado como pendiente).
- [ ] **Pruebas con casos reales** del servicio.
- [ ] **Migración a Cloudflare** con acceso protegido para el personal
      (ver `docs/despliegue_cloudflare.md`).
- [ ] **Prueba en las tablets y móviles** reales del servicio (incluido iPad).
- [ ] **Aviso al delegado de protección de datos** del hospital.

---

_AnesHealth · Hospital Vithas Barcelona · Servicio de Anestesiología, Reanimación y
Terapéutica del Dolor._
