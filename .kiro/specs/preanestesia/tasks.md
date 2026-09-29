# tasks.md — AnesHealth · Entrevista Preanestésica de Enfermería

> **Estado:** alineado con el documento fuente v3 (29/09/2026). Pendiente del visto bueno final antes de escribir código.
> Las 14 decisiones y las novedades de la v3 (QR estructurado, histórico de textos, catálogo ampliado) están incorporadas a `requirements.md` y `design.md`. Stack aprobado; repositorio destino **fernigear-spec/preanestesia**; documento fuente en `docs/documento_fuente.md`.
> Versión 0.3 · 29/09/2026

Cada tarea referencia los requisitos que satisface (`Rx.y`). Las tareas se ordenan para permitir desarrollo incremental: primero el andamiaje y el motor de dominio (con pruebas), después las salidas, la UI y las herramientas.

---

## 1. Andamiaje del proyecto

- [ ] **1.1** Inicializar proyecto Vite + React + TypeScript con `strict: true`. _(R1.1, §2)_
- [ ] **1.2** Configurar `vite.config.ts` con `base` para GitHub Pages y estructura de carpetas de `design.md`. _(R1.1)_
- [ ] **1.3** Añadir la meta `Content-Security-Policy` en `index.html` (`default-src 'self'`, sin orígenes externos). _(R1.3.3)_
- [ ] **1.4** Configurar Vitest, Testing Library y Playwright. _(R15)_
- [ ] **1.5** Configurar tema visual: variable de color principal `#0027c2`, tipografía local, utilidades táctiles (botones grandes). _(§0, R1.5.2)_
- [ ] **1.6** Definir `src/dominio/tipos.ts` con el modelo de datos de `design.md`. _(base de todo)_

---

## 2. Carga y validación de datos

- [ ] **2.1** Implementar parser de CSV (`;`, UTF-8) para `farmacos.csv` y `procedimientos.csv`. _(R2.2.2, R2.2.4)_
- [ ] **2.2** Definir esquemas (zod) de todos los ficheros de `datos/`. _(R2.2)_
- [ ] **2.3** Implementar `validador.ts`: reporta fichero, fila y columna en errores; verifica que toda `id_regla` exista en `reglas_farmacos.json`. _(R2.3.1)_
- [ ] **2.4** Implementar `cargador.ts` y pantalla de bloqueo si los datos están corruptos. _(R2.3.1 — caso 21)_
- [ ] **2.5** Prueba: `farmacos.csv` con regla inexistente ⇒ no deja empezar y señala la fila. _(caso 21)_

---

## 3. Contenido clínico inicial (carpeta `datos/`)

- [ ] **3.1** Generar `config.json` con los valores por defecto del documento, incluidos `prehabilitacion_activa: false` y la URL de PreHabilítame configurable. _(R2.2.1, R13 — Decisión 13)_
- [ ] **3.2** Generar `farmacos.csv` con todo el Anexo A (`verificado_cima = no` en todas las filas, más fila genérica por principio activo). _(Anexo A)_
- [ ] **3.3** Generar `procedimientos.csv` con el Anexo B (todas las especialidades, con sus riesgos). _(Anexo B)_
- [ ] **3.4** Generar `reglas_farmacos.json` con los parámetros de todas las reglas de R8 (horas, tablas SETH, listas de bloqueos profundos, fuentes). _(R8)_
- [ ] **3.5** Generar `opioides.json` con los factores CDC 2022. _(R6.8)_
- [ ] **3.6** Generar `coherencia.json` con las reglas de R4.2, R4.3 y R4.4. _(R4)_
- [ ] **3.7** Generar `plantillas_sap.json` (bloques, plantillas, abreviaturas, negativos). _(R10.1)_
- [ ] **3.8** Generar `modulos/*.json` — un fichero por cada módulo de R5.1 a R5.15, con preguntas, tipos, visibilidad, efecto ASA/riesgo, alertas, frase SAP y textos de modo guiado. _(R5, R4.5)_
- [ ] **3.9** Generar `textos/es/*.json` (paciente, hojas anexas, guion de preguntas delicadas). _(R16.2)_
- [ ] **3.10** Generar `textos/ca/*.json` traducidos, marcados «PENDENT DE REVISIÓ». _(R16.3)_
- [ ] **3.11** Sembrar `textos/historico/<versión>/` con el snapshot de la versión inicial y definir el mecanismo de snapshot por publicación. _(R2.2.9, R11.5)_
- [ ] **3.12** Incluir en `farmacos.csv` las combinaciones oficiales de la v3 (Atacand Plus/Parapres Plus, Viacoram, Sevikar, Qtern, Trijardy, Ryzodeg), `verificado_cima = no`. _(Anexo A v3)_
- [ ] **3.13** Guardar el documento fuente v3 en `docs/documento_fuente.md`. _(§0 v3)_

---

## 4. Escalas (motor de dominio + pruebas unitarias)

Cada subtarea incluye su fichero en `src/dominio/escalas/` **y** sus pruebas unitarias con casos límite.

- [ ] **4.1** ASA sugerido (máximo de determinantes, modificable, sufijo E). _(R6.1)_
- [ ] **4.2** EGRI (El-Ganzouri), con soporte para cálculo parcial en telefónica. _(R6.2.2, R6.2.5 — casos 10, 14)_
- [ ] **4.3** Langeron (ventilación difícil con mascarilla). _(R6.2.3)_
- [ ] **4.4** Alertas independientes de vía aérea. _(R6.2.4)_
- [ ] **4.5** STOP-Bang (con la regla del subgrupo alto). _(R6.3.1)_
- [ ] **4.6** STBUR. _(R6.3.2 — caso 8)_
- [ ] **4.7** Apfel (con lógica de opioides previstos). _(R6.4.1)_
- [ ] **4.8** POVOC / Eberhart. _(R6.4.2 — caso 8)_
- [ ] **4.9** CHA2DS2-VA (ESC 2024). _(R6.5 — casos 1)_
- [ ] **4.10** DASI + METs + regla de dos pisos. _(R6.6)_
- [ ] **4.11** Cockcroft-Gault (mg/dL y µmol/L; ausencia de dato ⇒ requiere confirmación). _(R6.7)_
- [ ] **4.12** Dosis equivalente de morfina oral (sin conversión para buprenorfina/metadona). _(R6.8 — caso 16)_
- [ ] **4.13** AUDIT-C (umbrales por sexo, alerta ≥ 8). _(R6.9 — caso 18)_
- [ ] **4.14** Clinical Frailty Scale. _(R6.10.1 — caso 17)_
- [ ] **4.15** Test 4AT (alerta, AMT4, meses al revés, cambio agudo; categorías 0 / 1-3 / ≥ 4), presencial y telefónica. _(R6.10.2, R6.10.3 — caso 17; Decisión 7)_

---

## 5. Clase de riesgo del paciente y prehabilitación

- [ ] **5.1** Implementar cálculo de la clase de riesgo del paciente (la más alta de los módulos). _(R7.2)_
- [ ] **5.2** Implementar la condición de prehabilitación, controlada por el interruptor `prehabilitacion_activa` de `config.json` (por defecto `false`; apagada no aparece en ninguna salida). _(R13 — Decisión 13; caso 17)_

---

## 6. Pruebas complementarias

- [ ] **6.1** Implementar la tabla de decisión (R7.3) con notas *, ** y ***. _(R7.3 — caso 11)_
- [ ] **6.2** Lógica de ecocardiograma y de validez temporal de pruebas. _(R7.4)_
- [ ] **6.3** Preguntas de excepción para Rx de tórax. _(R7.3)_
- [ ] **6.4** Pruebas unitarias de la tabla y las excepciones (incluye HEMSTOP y anticoagulante que fuerzan coagulación). _(caso 11)_

---

## 7. Motor de reglas de medicación

- [ ] **7.1** Implementar `motor.ts`: contexto de evaluación, resolución de técnica anestésica efectiva, resolución de la regla más restrictiva en combinaciones, traducción de plazos a fecha/hora. _(R8.0)_
- [ ] **7.2** Utilidades de fecha (`fechas/`): fecha/hora límite, traducción a lenguaje del paciente con día de la semana, uso de 08:00 sin hora, aviso de plazo no alcanzable. _(R8.0 — casos 14, 15)_
- [ ] **7.3** Regla antivitamina K + terapia puente. _(R8.1 — caso 5, 12)_
- [ ] **7.4** Regla ACOD (ajustes por aclaramiento y técnica). _(R8.2 — casos 1, 2)_
- [ ] **7.5** Regla antiagregantes (AAS, P2Y12, stent, oftalmología). _(R8.3 — casos 3, 6, 7, 15)_
- [ ] **7.6** Regla heparinas y fondaparinux (tablas SETH). _(R8.4)_
- [ ] **7.7** Regla antidiabéticos e insulina (todos los grupos, combinaciones). _(R8.5 — caso 4)_
- [ ] **7.8** Regla AINE. _(R8.6)_
- [ ] **7.9** Regla psicofármacos y neurología (IMAO, litio). _(R8.7 — caso 13)_
- [ ] **7.10** Regla inmunosupresores y reumatología (metotrexato, JAK, biológicos). _(R8.8)_
- [ ] **7.11** Regla oncológicos (antiangiogénicos). _(R8.9)_
- [ ] **7.12** Regla cardiovasculares (IECA/ARA-II, diuréticos, mantener). _(R8.10)_
- [ ] **7.13** Regla otros (fitoterapia, anticonceptivos/THS [sugerencia solo en notas del anestesiólogo], corticoides). _(R8.11 — Decisión 4)_
- [ ] **7.14** Regla sugammadex + anticoncepción hormonal (advertencia condicional oral/no oral en la hoja del paciente; recordatorio al alta en notas). _(R8.15 — Decisión 11)_
- [ ] **7.15** Fármaco no catalogado: mantener y consultar. _(R8.0 — caso 20)_
- [ ] **7.16** Combinaciones fijas: una instrucción por medicamento con plazo más restrictivo; nota de vigilar glucemia si retira metformina antes de su plazo. _(R8.0, R8.5 — Decisión 5)_
- [ ] **7.17** Bloqueo periférico vs. profundo en el contexto de reglas; lista de profundos editable en `reglas_farmacos.json`. _(R8.0 — Decisión 9)_
- [ ] **7.18** Notas de reanudación posoperatoria (solo anestesiólogo). _(R8.12)_
- [ ] **7.19** Salida por fármaco con fuente y estado de confirmación. _(R8.13)_
- [ ] **7.20** Regla combinada stent reciente + neuroaxial: doble alerta (stent primero y en rojo), sin pauta de antiagregantes en la hoja del paciente hasta confirmación. _(R12.7 — Decisión 3)_
- [ ] **7.21** Pruebas unitarias de todas las reglas con los casos de `docs/documento_fuente.md §15` y los añadidos de R15.2 (dabigatrán/anti-Xa con neuroaxial por tramos de aclaramiento; GLP-1 diario y semanal; bomba de insulina CMA vs. ingreso; sugammadex oral/no oral).

---

## 8. Ayuno

- [ ] **8.1** Implementar cálculo de ayuno en horas de reloj desde la inducción (adultos, líquidos claros, comida ligera/copiosa, bebida de carbohidratos). _(R8.14 — caso 8)_
- [ ] **8.2** Situaciones especiales (diabetes, GLP-1 semanal, reflujo, bariátrica, embarazo ≥ 20 sem, nutrición enteral, contraste oral, pediatría). _(R8.14 — casos 4, 8)_
- [ ] **8.3** Criterios de profilaxis de aspiración con tabla de fármacos (solo notas del anestesiólogo). _(R8.14)_
- [ ] **8.4** Pruebas unitarias del cálculo de ayuno.

---

## 9. Cribado mtND4

- [ ] **9.1** Módulo de preguntas mtND4 con guion sugerido. _(R9.1, R9.2)_
- [ ] **9.2** Lógica de alerta roja y medidas (notas del anestesiólogo); texto neutro en la hoja del paciente. _(R9.3, R9.4 — caso 9)_
- [ ] **9.3** Mostrar fuente y fecha SEDAR. _(R9.5)_

---

## 10. Asistente de coherencia

- [ ] **10.1** Motor de tarjetas no bloqueantes (sugerir/preguntar, nunca marcar solo). _(R4.1)_
- [ ] **10.2** De fármaco a enfermedad (abre módulo sin marcar hasta confirmar). _(R4.2 — caso 22)_
- [ ] **10.3** De enfermedad a fármaco (tarjeta inversa). _(R4.3 — caso 22)_
- [ ] **10.4** Datos que faltan (p. ej. diabetes sin HbA1c). _(R4.4 — caso 22)_
- [ ] **10.5** Registro de sugerencias descartadas para el resumen del anestesiólogo. _(R4.1)_

---

## 11. Salidas

- [ ] **11.1** Generador de texto SAP por plantillas (gramática, abreviaturas, negativos, solo ASCII, límite de caracteres). _(R10.1)_
- [ ] **11.2** Hoja del paciente (secciones, es/ca, letra grande) — sin notas técnicas; prehabilitación solo si `prehabilitacion_activa`; advertencia condicional de sugammadex si aplica. _(R10.2, R8.15, R13, R16.4)_
- [ ] **11.3** Resumen del anestesiólogo (alertas por gravedad, notas técnicas plegables). _(R10.3)_
- [ ] **11.4** Exportación a PDF en el navegador (hoja del paciente y resumen). _(R10.2, R10.3)_
- [ ] **11.5** Hojas anexas (dieta líquida 24 h, ayuno diabético, deshabituación tabáquica, reducción de alcohol). _(R10.2)_
- [ ] **11.6** Bloqueo de exportación/QR si hay puntos pendientes sin resolver. _(R12.3)_
- [ ] **11.7** Pie común con versión y fecha en todas las salidas. _(R12.4)_

---

## 12. QR y enlaces

- [ ] **12.1** Serialización compacta (claves cortas, catálogos por id) + compresión + base64url. _(R11.1, R11.8)_
- [ ] **12.2** Deserialización y modo «vista QR» de solo lectura adaptada a móvil. _(R11.5)_
- [ ] **12.3** QR del paciente: payload **estructurado** (códigos de acción, fechas, ids de anexos, versión de textos), renderizado con los textos de `textos/historico/<versión>/`; es/ca, guardar PDF. _(R11.5, R2.2.9)_
- [ ] **12.4** QR del anestesiólogo (entrevista completa, confirmación de pendientes, regeneración del QR del paciente y SAP). _(R11.6, R12.2)_
- [ ] **12.5** Caducidad como regla de visualización + mensaje sin datos. _(R11.4, R11.9)_
- [ ] **12.6** Aviso de versión de contenido distinta. _(R11.7)_
- [ ] **12.7** Botón «Copiar enlace para el paciente». _(R11.10)_
- [ ] **12.8** Pruebas: round-trip sin pérdida, tamaño dentro del límite, enlace caducado, versión distinta. _(caso 19)_

---

## 13. Interfaz de la entrevista

- [ ] **13.1** Navegación por pasos con barra de progreso e indicación de preguntas faltantes. _(R3.1)_
- [ ] **13.2** Panel lateral/inferior con resumen, alertas y cálculos en tiempo real. _(R3.1.2)_
- [ ] **13.3** Selector de modalidad (presencial/telefónica). _(R3.1.5)_
- [ ] **13.4** Paso 1 — datos de intervención (buscador de procedimientos, avisos de fecha, selector con bloqueo periférico y profundo separados). _(R3.2.1–R3.2.6)_
- [ ] **13.5** Paso 2 — datos básicos (IMC, activación de módulos pediátrico/obstétrico). _(R3.2.6–R3.2.8)_
- [ ] **13.6** Paso 3 — antecedentes anestésicos/quirúrgicos. _(R3.2.9–R3.2.11)_
- [ ] **13.7** Paso 4 — mtND4 (usa tarea 9). _(R3.2.12)_
- [ ] **13.8** Paso 5 — alergias. _(R3.2.13–R3.2.14)_
- [ ] **13.9** Paso 6 — hábitos, capacidad funcional, fragilidad (CFS + 4AT en ≥ 65 años, presencial y telefónica). _(R3.2.16–R3.2.20)_
- [ ] **13.10** Paso 7 — cribado por aparatos (render de módulos desde JSON, HEMSTOP siempre). _(R3.2.20–R3.2.22)_
- [ ] **13.11** Paso 8 — medicación habitual (autocompletado difuso, no catalogado). _(R3.2.23–R3.2.26)_
- [ ] **13.12** Paso 9 — vía aérea (con ilustración Mallampati SVG propia; parcial en telefónica). _(R3.2.27, R6.2)_
- [ ] **13.13** Paso 10 — consentimiento. _(R3.2.28)_
- [ ] **13.14** Paso 11 — resultados (integra todas las salidas). _(R3.2.29)_
- [ ] **13.15** Modo guiado: enlaces «¿Por qué preguntamos esto?» y formulaciones sugeridas; conmutador con preferencia local. _(R4.5)_
- [ ] **13.16** Campo opcional «Identificación para la hoja impresa» (solo PDF/impresión). _(R1.2 nota de identificación)_

---

## 14. Privacidad y ciclo de sesión

- [ ] **14.1** Store en memoria sin persistencia; «Nuevo paciente» resetea. _(R1.2.2, R1.2.3)_
- [ ] **14.2** Aviso `beforeunload` con entrevista en curso. _(R1.2.4)_
- [ ] **14.3** Temporizador de inactividad configurable con aviso y borrado. _(R1.2.5)_
- [ ] **14.4** Prueba E2E de privacidad (nada clínico en storages/cookies/caché). _(caso 23)_

---

## 15. Service worker / PWA

- [ ] **15.1** Configurar service worker que cachee app y `datos/`, nunca datos del paciente. _(R1.4.1, R1.4.2)_
- [ ] **15.2** Detección de versión nueva y aviso de recarga entre entrevistas. _(R1.4.3)_

---

## 16. Herramientas del servicio

- [ ] **16.1** Panel de administración: editar en tablas/formularios, validar en tiempo real, descargar fichero corregido, diff con la versión publicada, instrucciones de publicación. _(R14.1)_
- [ ] **16.2** Vista previa del SAP sobre casos de entrenamiento en el panel. _(R10.1)_
- [ ] **16.3** Modo entrenamiento: cargar casos, banda «ENTRENAMIENTO», comparación con lo esperado. _(R14.2)_
- [ ] **16.4** Cuadro de mando de uso (localStorage sin datos clínicos, gráficas, CSV, borrado). _(R14.3)_
- [ ] **16.5** Guía imprimible en blanco (PDF con guion y casillas). _(R14.4)_

---

## 17. Casos de entrenamiento y E2E

- [ ] **17.1** Codificar los 23 casos de `docs/documento_fuente.md §15` en `datos/casos_entrenamiento/` con resultados esperados. El caso 17 usa 4AT en lugar de Mini-Cog. _(docs/documento_fuente.md §15, R15.2)_
- [ ] **17.2** Añadir los casos derivados de las decisiones: GLP-1 diario (última dosis 4 días antes), GLP-1 semanal (dosis omitida entre 7 días antes y el día de la intervención, ambos incluidos, con fecha exacta), dabigatrán + neuroaxial en 72/96/120 h, anti-Xa + neuroaxial con CrCl < 30 (96 h), stent reciente + neuroaxial (doble alerta), bomba de insulina CMA bajo riesgo (sin confirmación) vs. ingreso (con confirmación), sugammadex oral y no oral. _(R15.2)_
- [ ] **17.3** Pruebas E2E que ejecutan cada caso como flujo completo y comparan con lo esperado. _(R15.1)_

---

## 18. Documentación y despliegue

- [ ] **18.1** `README.md` en español (despliegue, edición de contenido, cómo añadir fármaco/procedimiento/módulo/plantilla/caso, funcionamiento y límites de los QR, nota de caducidad no cifrada). _(§16)_
- [ ] **18.2** `scripts/generar-contenido-clinico.ts` y `CONTENIDO_CLINICO.md` autogenerado con reglas y fuentes. _(§16)_
- [ ] **18.3** `.github/workflows/deploy.yml`: build + test + publicación en GitHub Pages. _(§16)_
- [ ] **18.4** Verificar despliegue en GitHub Pages con `base` correcto y CSP activa.

---

## Orden de ejecución recomendado

1. Bloques **1–4** (andamiaje, datos, escalas): base sólida y testeable.
2. Bloques **5–9** (riesgo, pruebas, medicación, ayuno, mtND4): el corazón clínico.
3. Bloque **10** (coherencia) y **11–12** (salidas y QR).
4. Bloque **13** (UI de la entrevista) integrando lo anterior.
5. Bloques **14–15** (privacidad y PWA).
6. Bloques **16–17** (herramientas y casos E2E).
7. Bloque **18** (documentación y despliegue).

> Las escalas y reglas (bloques 4, 6, 7, 8) se desarrollan **con sus pruebas unitarias en la misma tarea** (TDD), ya que son el elemento de mayor riesgo clínico.
