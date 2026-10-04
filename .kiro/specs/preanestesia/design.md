# design.md — AnesHealth · Entrevista Preanestésica de Enfermería

> **Estado:** alineado con el documento fuente v3 (29/09/2026). Pendiente del visto bueno final antes de escribir código.
> Versión 0.3 · 29/09/2026
> Repositorio destino: **fernigear-spec/preanestesia** (público). Documento fuente: `docs/documento_fuente.md`.

---

## Stack aprobado

El servicio ha aprobado el stack (Decisión 12) y ha indicado **no usar PreHabilítame como referencia**:

> **Vite + React + TypeScript estricto + Vitest + Playwright**, con el **motor de dominio aislado de la UI** y **despliegue en GitHub Pages con GitHub Actions**.

El diseño mantiene la separación entre el **motor de dominio** (cálculos y reglas, funciones puras sin dependencias de UI) y la **capa de presentación**, de modo que la lógica clínica es verificable de forma aislada y reutilizable.

**Fuente única de verdad clínica (R0):** toda referencia al «documento fuente» en este documento apunta a `docs/documento_fuente.md`, citando la sección concreta cuando aplica a una regla (p. ej. `docs/documento_fuente.md §8.4`). Las reglas clínicas se implementan tomando los valores de `docs/documento_fuente.md` y de `datos/`, nunca de memoria ni de resúmenes; ante cualquier discrepancia entre el spec y el documento fuente se consulta al servicio antes de decidir.

---

## Visión general de la arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Navegador (cliente)                       │
│                                                               │
│  ┌────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  Capa UI   │──▶│  Estado en   │──▶│  Motor de dominio  │  │
│  │  (React)   │   │   memoria    │   │  (TS puro, sin UI) │  │
│  │            │◀──│  (store)     │◀──│                    │  │
│  └────────────┘   └──────────────┘   └────────────────────┘  │
│         │                                      │              │
│         │              ┌───────────────────────┘              │
│         ▼              ▼                                       │
│  ┌────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │ Salidas    │   │ Cargador de  │   │  QR / enlaces      │  │
│  │ (SAP, PDF, │   │ datos +      │   │  (compresión +     │  │
│  │  hoja, QR) │   │ validador    │   │   base64url)       │  │
│  └────────────┘   └──────────────┘   └────────────────────┘  │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           ▼
              datos/ (JSON + CSV empaquetados)
                           │
                    Service Worker
              (caché de app y datos, nunca del paciente)
```

**Principio rector:** separación estricta entre **motor de dominio** (funciones puras y deterministas, sin dependencias de UI ni de red) y **capa de presentación**. Todo el contenido clínico se carga desde `datos/` y ningún número clínico está codificado en el motor.

---

## Decisiones de stack y su justificación

| Área | Elección | Justificación |
|---|---|---|
| Lenguaje | **TypeScript** con `strict: true` | Exigido por `docs/documento_fuente.md §2`. Tipado estricto obligatorio para seguridad clínica. |
| Build / bundler | **Vite** | Estándar de facto para SPA estáticas modernas; genera artefactos estáticos ideales para GitHub Pages; empaqueta todas las dependencias localmente (requisito R1.3). |
| UI | **React 18** + componentes funcionales | Aprobado (Decisión 12). Ecosistema maduro, buen soporte táctil, fácil de aislar de la lógica de dominio. |
| Estilos | **CSS Modules + variables CSS** | Sin dependencias remotas. Color principal `#0027c2` como variable de tema. Diseño táctil con utilidades propias. |
| Estado | **Zustand** (store ligero en memoria) | Store pequeño, sin persistencia por defecto (clave para R1.2). Fácil de resetear con «Nuevo paciente». |
| Tests | **Vitest** + **@testing-library/react** + **Playwright** (E2E) | Vitest integra nativamente con Vite. Playwright para los casos E2E y la verificación de privacidad (R15). |
| PDF | **pdf-make** o **jsPDF** (empaquetado) | Generación de PDF en el navegador sin servidor (R1.1). Se elegirá el de menor peso que soporte tablas y tipografías embebidas. |
| QR | **qrcode** (generación) | Librería sin dependencias de red. La lectura la hace la cámara del móvil del paciente/anestesiólogo. |
| Compresión de payload | **lz-string** (base64url) o `CompressionStream` (deflate) nativo | Requisito R11. `lz-string` como opción portable; se evaluará `CompressionStream` si el soporte de navegadores objetivo es suficiente. |
| Búsqueda difusa | **Fuse.js** (empaquetado) | Autocompletado tolerante a tildes/errores para fármacos y procedimientos (R3.2.23). |
| CSV | Parser propio ligero o **PapaParse** (empaquetado) | Separador `;`, UTF-8. |
| Despliegue | **GitHub Actions → GitHub Pages** | Aprobado (Decisión 12). Workflow que construye y publica el `dist/` en `fernigear-spec/preanestesia`. |
| i18n | Diccionarios JSON propios en `datos/textos/` | Sin librería pesada; el contenido del paciente ya vive en ficheros de datos. |

> Todas las librerías se instalan como dependencias empaquetadas por Vite; **ninguna se carga desde CDN**. El `Content-Security-Policy` en `<meta>` prohíbe `connect-src`, `font-src`, `img-src` y `script-src` externos (`default-src 'self'`).

---

## Organización del repositorio

```
preanestesia/
├── .github/workflows/deploy.yml     # build + publicación en GitHub Pages
├── index.html                        # con la meta CSP
├── package.json
├── tsconfig.json                     # strict: true
├── vite.config.ts                    # base path para Pages, PWA/SW
├── public/
│   ├── manifest.webmanifest
│   └── sw.js                          # (o generado por vite-plugin-pwa)
├── datos/                             # CONTENIDO CLÍNICO EDITABLE
│   ├── config.json
│   ├── farmacos.csv
│   ├── procedimientos.csv
│   ├── reglas_farmacos.json
│   ├── opioides.json
│   ├── coherencia.json
│   ├── plantillas_sap.json
│   ├── modulos/
│   │   ├── cardiovascular.json
│   │   ├── respiratorio.json
│   │   └── ...  (uno por patología de R5)
│   ├── textos/
│   │   ├── es/*.json
│   │   ├── ca/*.json                  # marcados "PENDENT DE REVISIÓ"
│   │   └── historico/<versión>/       # snapshots de textos por versión (QR antiguos)
│   └── casos_entrenamiento/*.json
├── docs/
│   └── documento_fuente.md            # documento clínico fuente (v3)
├── src/
│   ├── dominio/                       # MOTOR: TS puro, sin React
│   │   ├── escalas/                   # una carpeta/fichero por escala
│   │   │   ├── asa.ts
│   │   │   ├── egri.ts
│   │   │   ├── langeron.ts
│   │   │   ├── stopBang.ts
│   │   │   ├── stbur.ts
│   │   │   ├── apfel.ts
│   │   │   ├── povoc.ts
│   │   │   ├── cha2ds2va.ts
│   │   │   ├── dasi.ts
│   │   │   ├── cockcroftGault.ts
│   │   │   ├── morfinaEquivalente.ts
│   │   │   ├── auditC.ts
│   │   │   ├── cfs.ts
│   │   │   └── cuatroAT.ts            # 4AT (sustituye a Mini-Cog, Decisión 7)
│   │   ├── reglas/                    # motor de reglas de medicación
│   │   │   ├── motor.ts               # evaluador genérico basado en params
│   │   │   ├── antivitaminaK.ts
│   │   │   ├── acod.ts
│   │   │   ├── antiagregantes.ts
│   │   │   ├── heparinas.ts
│   │   │   ├── antidiabeticos.ts
│   │   │   ├── aine.ts
│   │   │   ├── psicofarmacos.ts
│   │   │   ├── inmunosupresores.ts
│   │   │   ├── oncologicos.ts
│   │   │   ├── cardiovasculares.ts
│   │   │   └── otros.ts
│   │   ├── pruebas/                    # tabla de decisión de pruebas (R7)
│   │   ├── ayuno/                      # cálculo de ayuno (R8.14)
│   │   ├── coherencia/                 # asistente de coherencia (R4)
│   │   ├── fechas/                     # utilidades de fecha/hora y traducción
│   │   ├── riesgo/                     # clase de riesgo del paciente (R7.2)
│   │   └── tipos.ts                    # tipos de dominio compartidos
│   ├── datos/                          # carga y validación de datos
│   │   ├── cargador.ts
│   │   ├── validador.ts                # valida CSV/JSON, reporta fila/columna
│   │   └── esquemas.ts                 # esquemas (zod) de cada fichero
│   ├── salidas/
│   │   ├── sap.ts                      # generador por plantillas (R10.1)
│   │   ├── hojaPaciente.ts
│   │   ├── resumenAnestesiologo.ts
│   │   ├── pdf.ts
│   │   └── qr/
│   │       ├── serializar.ts           # payload compacto + compresión
│   │       ├── deserializar.ts
│   │       └── caducidad.ts
│   ├── estado/                          # store en memoria (Zustand)
│   │   └── store.ts
│   ├── ui/                              # componentes React
│   │   ├── pasos/                       # un componente por paso (R3.2)
│   │   ├── paneles/                     # panel lateral, alertas, resumen
│   │   ├── modulos/                     # render de módulos desde JSON
│   │   ├── admin/                       # panel de administración (R14.1)
│   │   ├── entrenamiento/               # modo entrenamiento (R14.2)
│   │   ├── uso/                         # cuadro de mando (R14.3)
│   │   ├── vistaQR/                     # vista de solo lectura del QR
│   │   └── comunes/                     # botones grandes, ilustración Mallampati, etc.
│   ├── i18n/
│   └── main.tsx
├── tests/
│   ├── unit/                            # espejo de dominio/
│   └── e2e/                             # 23 casos + privacidad + tamaño QR
├── scripts/
│   └── generar-contenido-clinico.ts     # genera CONTENIDO_CLINICO.md
├── README.md
└── CONTENIDO_CLINICO.md                 # autogenerado
```

---

## Modelo de datos de dominio (tipos principales)

```typescript
// Estado completo de una entrevista, solo en memoria.
interface Entrevista {
  modalidad: 'presencial' | 'telefonica';
  intervencion: DatosIntervencion;
  paciente: DatosBasicos;
  antecedentes: Antecedentes;
  mtnd4: RespuestasMtND4;
  alergias: Alergias;
  habitos: Habitos;
  modulosActivos: Record<IdModulo, RespuestasModulo>;
  medicacion: FarmacoTomado[];
  viaAerea: DatosViaAerea;
  consentimiento: EstadoConsentimiento;
  identificacionImpresa?: string;   // solo para PDF/impresión; nunca al QR
}

interface ResultadoCalculado {
  asaSugerido: { clase: 1|2|3|4|5; determinantes: string[]; modificadoManualmente: boolean };  // sin sufijo E (decisión 30/09/2026)
  escalas: Record<string, ResultadoEscala>;      // egri, stopBang, apfel, ...
  claseRiesgoPaciente: 'bajo'|'bajo-moderado'|'moderado'|'alto';
  pruebas: PruebaSolicitada[];
  planMedicacion: ResultadoFarmaco[];
  ayuno: PlanAyuno;
  alertas: Alerta[];                              // ordenadas por gravedad
  puntosPendientes: PuntoConfirmacion[];
  prehabilitacion: boolean;
}

interface ResultadoFarmaco {
  idFarmaco: string;
  nombreComercial: string;
  principiosActivos: string[];
  accion: 'mantener'|'suspender'|'ajustar'|'consultar';
  fechaHoraUltimaToma?: Date;
  textoPaciente: string;
  textoAnestesiologo?: string;
  reglaAplicada: string;
  fuente: string;
  requiereConfirmacion: boolean;
  confirmadoPor?: string;              // nombre del anestesiólogo
}

interface Alerta {
  gravedad: 'roja'|'amarilla'|'informativa';
  mensaje: string;
  origen: string;                      // módulo/escala/regla que la generó
  soloAnestesiologo: boolean;          // no aparece en la hoja del paciente
}
```

Todos los cálculos son **funciones puras**: reciben `Entrevista` + datos de `datos/` y devuelven `ResultadoCalculado`, sin efectos secundarios. Esto hace las pruebas unitarias triviales y el resultado reproducible (clave para los casos de entrenamiento y los QR).

---

## Motor de reglas de medicación

El punto más delicado del diseño. Estrategia:

1. **Parámetros en `reglas_farmacos.json`**: cada regla tiene un `id` y un objeto de parámetros (horas, condiciones por riesgo hemorrágico, técnica, aclaramiento, indicación, listas de bloqueos profundos, tablas SETH). *Los números siempre salen del JSON.*
2. **Lógica en código**: cada familia de regla (`antivitaminaK.ts`, `acod.ts`, ...) contiene la lógica condicional que no cabe en parámetros, pero lee todos los umbrales del JSON.
3. **Contexto de evaluación**: cada regla recibe un `ContextoReglas` con: riesgo hemorrágico del procedimiento, técnica anestésica efectiva (con la resolución de «no se sabe» → neuroaxial si aplica), aclaramiento de creatinina (o su ausencia), fecha/hora de intervención, indicación del fármaco, y factores del paciente (peso, trombofilia, stent, etc.).
4. **Salida uniforme**: toda regla devuelve un `ResultadoFarmaco`. Si falta un dato crítico (p. ej. aclaramiento para dabigatrán), la regla marca `requiereConfirmacion = true` e incluye qué dato falta (R12.5).
5. **Resolución de la más restrictiva**: en combinaciones (`principios_activos` separados por `+`) se evalúa cada componente y se toma el plazo mayor / la acción más conservadora.
6. **Traducción a lenguaje del paciente**: el módulo `fechas/` convierte la fecha/hora límite en frases con día de la semana, según la pauta y hora habitual del fármaco.

Ejemplo de flujo (ACOD, caso 1 del documento):
```
apixabán (anti-Xa), riesgo hemorrágico alto (prótesis rodilla) + raquídea + aclaramiento 45
 → regla acod: base neuroaxial = 72 h; anti-Xa con neuroaxial suma +24 h solo si CrCl < 30,
   pero 45 ≥ 30 ⇒ sin ajuste extra ⇒ 72 h  ✓ (coincide con el resultado esperado)
```

### Precisiones de las decisiones del servicio (v0.2)

- **Bloqueos (Decisión 9):** el `ContextoReglas` distingue `bloqueoPeriferico` y `bloqueoProfundo`. La lista de qué bloqueos son profundos vive en `reglas_farmacos.json` (por defecto: paravertebral, plexo lumbar/psoas, plexo cervical profundo, intercostal). Los planos fasciales (TAP, erector, PENG, serrato) son periféricos y **no** disparan los plazos de bloqueo profundo.
- **ACOD + neuroaxial + aclaramiento (Decisión 1):** los ajustes por aclaramiento **se suman** al plazo de neuroaxial. Dabigatrán con neuroaxial: 72/96/120 h según CrCl > 80 / 50-80 / < 50. Anti-Xa con neuroaxial y CrCl < 30: 96 h. Todos los tramos son casos de prueba unitaria.
- **Combinaciones fijas (Decisión 5):** el motor agrupa por medicamento comercial; una combinación fija emite **una** instrucción con el plazo más restrictivo. Si la combinación fuerza a retirar la metformina antes de su plazo propio, se añade la nota «vigilar glucemia en los días sin tratamiento» a las notas del anestesiólogo.
- **GLP-1 (Decisión 8):** diarios → última dosis 4 días antes (omitir 3 días previos + día de la IQ). Semanales → el módulo `fechas/` localiza la dosis programada que cae en la ventana de 7 días previos y la marca como omitida, mostrando su fecha exacta.
- **Bomba de insulina (Decisión 6; revisada 2026-10-04):** se retira el régimen del `ContextoReglas` y de `DatosIntervencion`. La regla decide `requiereConfirmacion` **solo** por el riesgo quirúrgico: bajo → sin confirmación; intermedio o alto → confirmación.
- **Sugammadex (Decisión 11):** regla condicional que, para mujer con anticonceptivo hormonal y posible AG, añade el texto correspondiente (oral vs. no oral) a la hoja del paciente y el recordatorio al alta a las notas del anestesiólogo.
- **4AT (Decisión 7):** `cuatroAT.ts` calcula el total y la categoría (0 / 1-3 / ≥ 4). Se ejecuta en presencial y telefónica; el resumen registra la modalidad.

---

## Cargador y validador de datos

- Al arrancar, `cargador.ts` lee todos los ficheros de `datos/` (empaquetados como assets estáticos).
- `validador.ts` aplica esquemas **zod** a cada fichero:
  - CSV: comprueba columnas presentes, tipos, valores dentro de listas cerradas (p. ej. riesgo ∈ {bajo, intermedio, alto}), y que cada `id_regla` de `farmacos.csv` exista en `reglas_farmacos.json`.
  - JSON de módulos: comprueba estructura de preguntas, tipos de respuesta, referencias y, si existe, la forma del campo `genera` de cada pregunta (efectos por respuesta: `cuando`, `efecto`, `tipo` ∈ {alerta, nota, prueba, clase_riesgo, asa, regla, hecho}, `gravedad` obligatoria en las alertas). Un test de cobertura (`coberturaAlertas.test.ts`) exige que las respuestas de §5/§5.16 que generan un efecto conserven su `genera` (decisión 30/09/2026).
- Si hay error, se muestra una pantalla de bloqueo con **fichero, fila y columna** exactos y **no se puede iniciar** ninguna entrevista (R2.3, caso de prueba 21).

### Ejecución de los efectos de módulo (§5.16, 2026-10-04)

Hasta la Fase 1 el campo `genera` era solo descriptivo. Ahora cada efecto de tipo `alerta` o `nota` lleva una **condición estructurada `si`** (igual / enLista / contieneAlguno / mayorQue / mayorIgualQue / recienteMeses / sinFechaRecienteMeses) que `src/dominio/entrevista/efectosModulos.ts` (`emitirEfectosModulos`, función pura) evalúa contra las respuestas para **emitir** las alertas y notas en el resumen del anestesiólogo, conservando las que no salen de módulos (escalas, vía aérea, mtND4, HEMSTOP). Incluye ictus/AIT < 3 meses (roja) y TVP/TEP < 3 meses (amarilla). Dos pruebas lo cubren: una comprueba que cada efecto con `si` se emite, y otra (`coherenciaEfectos.test.ts`) que los efectos de tipo `clase_riesgo`/`asa`/`prueba`/`regla` coinciden con el cálculo real de su capa (`riesgoYPruebas`, `asaSugerido`, `tablaPruebas`, `hechosClinicos`).

### Pruebas complementarias: BNP y vigencia (§7.3/§7.4, 2026-10-04)

`tablaPruebas.decidirPruebas` admite la prueba `bnp` (nota **: cirugía intermedia/alta + comorbilidad CV significativa / fragilidad / capacidad reducida) y un parámetro de vigencia que **descuenta** las pruebas aún vigentes. `riesgoYPruebas` deriva la comorbilidad CV del conjunto de enfermedades (la HTA aislada no cuenta), la fragilidad/capacidad de las escalas, y la vigencia de las fechas del apartado «Pruebas recientes» del paso 6 (comparadas con la fecha de la intervención o «hoy»).

---

## Estado y privacidad

- El store (Zustand) vive solo en memoria. **No se configura ningún middleware de persistencia.**
- «Nuevo paciente» ejecuta `store.reset()`.
- `beforeunload` activo mientras haya una entrevista con datos.
- Temporizador de inactividad (valor de `config.json`) que, al expirar, avisa y luego resetea.
- Únicos usos permitidos de `localStorage`:
  - preferencia de modo guiado (booleano),
  - cuadro de mando de uso (R14.3): registros sin datos clínicos ni identificadores.
- El service worker (via `vite-plugin-pwa` en modo `injectManifest` o `generateSW`) cachea **solo** los assets de la app y `datos/`, nunca respuestas con datos del paciente (que no existen, al no haber red).
- **Prueba automática (caso 23)**: tras una entrevista E2E completa, un test de Playwright inspecciona `localStorage`, `sessionStorage`, `IndexedDB`, `cookies` y `caches` y verifica que no hay ningún dato clínico.

---

## QR y enlaces sin servidor

- Payload serializado con claves cortas y catálogos referenciados por `id` (no por texto) para el QR del anestesiólogo (R11.3, R11.8).
- Compresión (`lz-string`/deflate) → base64url → se coloca tras `#` en la URL.
- La app lee el fragmento al cargar; si detecta un payload, entra en modo «vista QR».
- **Caducidad**: comparación de fechas al abrir; si caducó, se muestra el mensaje sin renderizar datos (regla de visualización, documentada como tal en el README — R11.9).
- Dos tipos de payload:
  - **paciente**: hoja calculada **en forma estructurada** (nombre comercial, código de acción y fecha/hora por fármaco, horas de ayuno, ids de anexos, teléfono y **versión de textos**), **no** textos largos. La vista renderiza esa estructura con los textos de `datos/textos/historico/<versión>/`, de modo que un QR antiguo muestre siempre la misma hoja aunque se actualice el contenido. Solo lectura, conmutador es/ca, botón guardar PDF. Codificar por ids/códigos también ayuda a que la carga quepa en el QR (R11.8).
    - **Recálculo por el paciente (§8.16d).** Para cada fármaco el payload lleva además: tipo de plazo (`dias` | `horas` | `no_dia_iq` | `sin_plazo`), su duración, las horas habituales de toma, si admite adelanto y si es anticoagulante; y a nivel de payload, el teléfono del servicio y la fecha de intervención (o `null`). La función pura `recalcularHoja(contenido, fecha?, ahora?)` (en `src/dominio/salidas/qr/hojaPaciente.ts`) genera las instrucciones: sin fecha, como margen y sin adelantos (§8.16b); con fecha, aplicando las reglas del §8.0 incluidos los adelantos de anticoagulantes, con la fecha calculada y el margen entre paréntesis (§8.16c); y si un plazo ya no se puede cumplir, sin pauta y con remisión al teléfono (§8.16e). La caducidad la calcula `caducidadQrPaciente` (90 días sin fecha / 30 tras la intervención, §8.16f). La **vista interactiva del paciente** (botón «Me han dado la fecha o me la han cambiado») solo llama a `recalcularHoja` sobre el contenido decodificado y se construye en el bloque de salidas (R10/R11).
  - **anestesiólogo**: entrevista completa + versión de contenido; permite confirmar pendientes y regenerar el QR del paciente.
- **Prueba de tamaño (caso 19)**: round-trip codificar/decodificar de los casos más complejos, verificando que caben en ~2,9 KB; si no, aviso + copiar enlace.

---

## Generador de texto SAP

- Motor de plantillas dirigido por `plantillas_sap.json`: orden de bloques, plantillas de frase por respuesta con marcadores `{farmaco}`, `{dosis}`, `{fecha}`.
- Utilidades gramaticales: enumeración con «y» final, singular/plural, concordancia de género, omisión de bloques vacíos, fechas cortas.
- Política de abreviaturas y de negativos configurable.
- Modo «solo ASCII» (transliteración de tildes/símbolos).
- Sin límite de caracteres: `construirSap` emite antecedentes patológicos, quirúrgicos y el **resultado del consentimiento** del paso 10 (2026-10-04); el resto del informe se rellena con los desplegables del SAP. Solo constan las preguntas contestadas; las booleanas usan `etiquetaSap` (sí = la palabra; no = «no» + la palabra) vía la función pura `resumenModuloSap`; las de casillas múltiples, solo las opciones marcadas. Un test vigila que toda booleana tenga `etiquetaSap`.
- Vista previa sobre los casos de entrenamiento en el panel de administración.

---

## Salidas y su separación de audiencias

- **Hoja del paciente**: nunca contiene notas técnicas ni alertas «solo anestesiólogo». Los puntos que requieren confirmación aparecen como «el anestesiólogo le llamará…». La hoja y el QR se generan **siempre** (2026-10-04): se retira el bloqueo por fármacos pendientes de `BloqueHojaPaciente`; los pendientes se listan y confirman en el resumen del anestesiólogo (`Salidas.tsx`, sección «Puntos pendientes de confirmación»).
- **Resumen del anestesiólogo**: incluye todo, con un apartado plegable «Notas técnicas».
- Una sola vista de la aplicación para todos los usuarios; la separación es de **salida**, no de rol.
- Pie común en todas las salidas con versión y fecha de revisión (R12.4).
- **Prehabilitación (Decisión 13):** el apartado de prehabilitación se renderiza **solo si** `config.prehabilitacion_activa === true`. Con el interruptor apagado no aparece ni en la hoja del paciente ni en las notas del anestesiólogo, aunque se cumplan los criterios clínicos. La URL de PreHabilítame es un valor configurable en `config.json`.
- **Stent reciente + neuroaxial (Decisión 3):** `evaluarStent` se evalúa en el resumen (`Salidas.tsx`) desde los hechos clínicos (`clin.stent`) y emite la alerta roja «valorar diferir» y, con técnica neuroaxial/bloqueo profundo, la amarilla adicional (2026-10-04, antes estaba calculada pero sin conectar). El stent reciente es además un punto de validación «valorar posponer» (§13 bis, Fase 4). La supresión de la pauta de antiagregantes en la hoja (`suprimirPautaAntiagregantesEnHoja`) queda cubierta por el mecanismo de «requiere confirmación» (frase única de §12) mientras no se confirme.

---

## Ilustraciones propias (sin derechos de autor)

La ilustración esquemática de Mallampati (R6.2.1) se dibuja como **SVG propio** dentro del repositorio, sin usar imágenes con copyright.

---

## Despliegue

- Repositorio: **fernigear-spec/preanestesia** (público).
- `deploy.yml`: en push a `main`, `npm ci` → `npm run build` → `npm test` (los tests deben pasar) → publicación de `dist/` en GitHub Pages.
- `vite.config.ts` con `base: '/preanestesia/'` para las rutas de Pages.
- El PWA/service worker se genera en el build.

### Vista del paciente como build independiente (§8.16, Bloque III-A, 2026-10-04)

La hoja del paciente se publica como una **segunda aplicación**, separada de la de
enfermería, para que lo que abre el paciente al escanear el QR sea mínimo y no lleve
ningún dato clínico embebido:

- **Dos entradas en Vite** (`build.rollupOptions.input`): `index.html → src/main.tsx`
  (app de enfermería) y `paciente/index.html → src/mainPaciente.tsx` (vista del
  paciente). La segunda se emite como `dist/paciente/index.html`, servida en la ruta
  **`/paciente/`**.
- La vista del paciente **solo** contiene: su hoja (`VistaPaciente` + `CuerpoHoja` +
  `render`), el cambio de idioma (es/ca), el PDF (impresión del navegador), los anexos
  y el recálculo de fechas (§8.16: `hojaPaciente.ts`, `fechas/`, `serializar.ts`). **No**
  incluye el motor de reglas, los catálogos de fármacos, los módulos, el panel de
  administración ni la entrevista. Se garantiza con la prueba
  `tests/unit/ui/aislamientoPaciente.test.ts`, que recorre el grafo de imports de valor
  desde `src/mainPaciente.tsx` y comprueba que nunca alcanza esas rutas prohibidas.
- **La dirección base del QR sale de `config.url_vista_paciente`** (p. ej.
  `https://holaaneshealth-eng.github.io/preanestesia/paciente/`). Así, al migrar de
  GitHub Pages a Cloudflare basta con cambiar esa clave en `datos/config.json`.
  `HojaPaciente.tsx` compone el enlace del QR como `url_vista_paciente + '#p=' + payload`.
- **Service worker:** el de la app de enfermería **no** precachea ni gobierna la vista
  del paciente (`globIgnores: ['paciente/**', 'assets/paciente-*.js']` y
  `navigateFallbackDenylist: [/\/paciente\//]`), de modo que cada app se cachea y
  actualiza por separado.
- Prueba E2E (`vistaPrevia.spec.ts`): genera el QR desde el resumen, comprueba que el
  enlace apunta a `/paciente/#p=…` y abre la hoja en la nueva ruta.

---

## Versionado de textos del paciente (histórico)

- Cada publicación de contenido incrementa `config.version` y deja un snapshot de `datos/textos/{es,ca}/` en `datos/textos/historico/<versión>/`.
- El QR del paciente guarda solo la **versión de textos** (no los textos). Al abrirlo, la vista carga el diccionario histórico correspondiente y renderiza la hoja; si esa versión no estuviera disponible (caso excepcional), cae a la versión actual y muestra el aviso de versión distinta (R11.7).
- El build valida que exista una carpeta de histórico por cada versión referenciable y que los snapshots no se editen retroactivamente.

---

## Generación de `CONTENIDO_CLINICO.md`

- `scripts/generar-contenido-clinico.ts` lee todos los ficheros de `datos/` y emite un Markdown legible con cada regla, cada escala, cada texto y su **fuente**, para revisión y firma del servicio (R16 / §16 del documento).
- Se ejecuta en el build y/o mediante `npm run contenido`.

---

## Estrategia de pruebas

| Nivel | Herramienta | Alcance |
|---|---|---|
| Unitario | Vitest | Cada escala y cada regla, con tablas de casos (incluidos los umbrales límite). |
| Integración | Vitest | Cargador+validador, generador SAP, serialización QR. |
| E2E | Playwright | Los 23 casos del documento (con los ajustes de R15.2) como flujos completos; verificación de privacidad; tamaño de QR; enlace caducado; aviso de versión distinta. |
| Datos | Vitest | Validación de que los ficheros iniciales de `datos/` son coherentes (toda `id_regla` existe, etc.). |

Los 23 casos (y los añadidos de R15.2: GLP-1 diario/semanal, tramos de dabigatrán/anti-Xa con neuroaxial, stent + neuroaxial, bomba de insulina CMA vs. ingreso, sugammadex oral/no oral) se codifican **una sola vez** en `datos/casos_entrenamiento/` y se reutilizan tanto en el modo entrenamiento (R14.2) como en las pruebas E2E. El caso 17 usa **4AT** en lugar de Mini-Cog.

---

## Riesgos técnicos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Payload del anestesiólogo no cabe en un QR | Claves cortas + catálogos por id + compresión; aviso + enlace alternativo. |
| Números clínicos codificados por error en el motor | Regla de diseño: todo umbral vive en `datos/`; revisión en PR y `CONTENIDO_CLINICO.md` autogenerado. |
| Fuga de datos por persistencia accidental | Prueba automática de privacidad en cada CI (caso 23). |
| Contenido clínico corrupto en producción | Validación bloqueante al arrancar (caso 21). |
