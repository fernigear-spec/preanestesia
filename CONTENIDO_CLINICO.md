# Contenido clínico

> **Documento generado automáticamente** a partir de los datos de la aplicación
> (`datos/`). Recoge, en lenguaje legible y con su fuente, todas las reglas que
> aplica la herramienta para que el Servicio de Anestesiología lo revise y lo firme.
>
> No sustituye al juicio clínico: es el reflejo de lo que hace la aplicación.
>
> **Versión de contenido:** 0.1.0 · **Fecha de revisión clínica:** 2026-09-29
>
> Para regenerarlo: `node --experimental-strip-types scripts/generar-contenido-clinico.ts`.

## 1. Parámetros de configuración

Valores que gobiernan la aplicación (`datos/config.json`).

| Parámetro | Valor |
| --- | --- |
| Borrado por inactividad | 30 minutos |
| Edad pediátrica máxima | 17 años |
| Límite de caracteres del texto SAP | 2000 |
| Validez del QR del paciente (con fecha) | 30 días |
| Validez del QR del paciente (sin fecha) | 90 días |
| Validez del QR del anestesiólogo | 60 días |

## 2. Reglas de medicación

_Fuente general: `datos/reglas_farmacos.json` · Parámetros de las reglas de medicación. Los números salen de aquí (docs/documento_fuente.md §8). La lógica que no cabe en parámetros va en src/dominio/reglas/._

### 2.1. Parámetros generales

**Bloqueos considerados «profundos»** (obligan a plazos de suspensión mayores): paravertebral, plexo lumbar, compartimento psoas, plexo cervical profundo, intercostal.

**Umbrales de dosis para clasificar la HBPM** (tablas SETH). Si la dosis diaria no
encaja en ningún rango, la aplicación pregunta.

| Heparina | Profilaxis (máx.) | Tratamiento (mín.) |
| --- | --- | --- |
| enoxaparina | 40 mg/día | 60 mg/día |
| bemiparina | 3500 UI/día | 5000 UI/día |
| tinzaparina | 4500 UI/día | 10000 UI/día |
| nadroparina | 3800 UI/día | 5700 UI/día |
| dalteparina | 5000 UI/día | 10000 UI/día |

### 2.2. Reglas por fármaco o grupo

#### `avk_warfarina` — Antivitamina K (Sintrom/warfarina)

- Suspender **5 días** antes.
- No se suspende en cirugía oftalmológica de bajo riesgo.
- No se suspende si el riesgo hemorrágico es mínimo.

_Fuente: docs/documento_fuente.md §8.1 (protocolo del servicio)_

#### `avk_acenocumarol` — Antivitamina K (Sintrom/warfarina)

- Suspender **3 días** antes.
- No se suspende en cirugía oftalmológica de bajo riesgo.
- No se suspende si el riesgo hemorrágico es mínimo.

_Fuente: docs/documento_fuente.md §8.1 (protocolo del servicio)_

#### `acod_dabigatran` — Anticoagulante oral de acción directa (ACOD)

- Riesgo hemorrágico bajo: última toma **48 h** antes.
- Riesgo hemorrágico alto o técnica neuroaxial: **72 h** antes.
- Aclaramiento 50-80 mL/min: **24 h** antes.
- Aclaramiento < 50 mL/min: **48 h** antes.
- Neuroaxial con aclaramiento > 80 mL/min: **72 h** antes.
- Neuroaxial con aclaramiento 50-80 mL/min: **96 h** antes.
- Neuroaxial con aclaramiento < 50 mL/min: **120 h** antes.
- No se suspende en cirugía oftalmológica de bajo riesgo.

_Fuente: docs/documento_fuente.md §8.2 (protocolo del servicio; EHRA 2021)_

#### `acod_antixa` — Anticoagulante oral de acción directa (ACOD)

- Riesgo hemorrágico bajo: última toma **48 h** antes.
- Riesgo hemorrágico alto o técnica neuroaxial: **72 h** antes.
- Aclaramiento < 30 mL/min: **24 h** antes.
- Neuroaxial con aclaramiento < 30 mL/min: **96 h** antes.
- No se suspende en cirugía oftalmológica de bajo riesgo.

_Fuente: docs/documento_fuente.md §8.2 (protocolo del servicio; EHRA 2021)_

#### `aas` — Ácido acetilsalicílico

- Se mantiene si la dosis diaria es ≤ **200 mg**.
- Con dosis alta, suspender **7 días** antes.

_Fuente: docs/documento_fuente.md §8.3 (ESC 2022)_

#### `p2y12_clopidogrel` — Antiagregante P2Y12 (clopidogrel, ticagrelor, prasugrel)

- Plazo estándar: **5 días** antes.
- Con técnica neuroaxial o bloqueo profundo: **7 días** antes.

_Fuente: docs/documento_fuente.md §8.3 (protocolo del servicio)_

#### `p2y12_ticagrelor` — Antiagregante P2Y12 (clopidogrel, ticagrelor, prasugrel)

- Plazo estándar: **5 días** antes.
- Con técnica neuroaxial o bloqueo profundo: **7 días** antes.

_Fuente: docs/documento_fuente.md §8.3 (protocolo del servicio)_

#### `p2y12_prasugrel` — Antiagregante P2Y12 (clopidogrel, ticagrelor, prasugrel)

- Plazo estándar: **7 días** antes.
- Con técnica neuroaxial o bloqueo profundo: **10 días** antes.

_Fuente: docs/documento_fuente.md §8.3 (protocolo del servicio)_

#### `triflusal` — Suspensión con plazo fijo en días

- Plazo estándar: **7 días** antes.
- Con técnica neuroaxial o bloqueo profundo: **10 días** antes.
- Si no aplica el plazo, acción: **suspender**.

_Fuente: docs/documento_fuente.md §8.3_

#### `dipiridamol` — Suspensión con plazo fijo en horas

- Plazo estándar: **24 h** antes.
- Con técnica neuroaxial o bloqueo profundo: **48 h** antes.

_Fuente: docs/documento_fuente.md §8.3_

#### `cilostazol` — Depende del riesgo hemorrágico / técnica neuroaxial

- Si riesgo hemorrágico alto o neuroaxial: **3 días** antes.
- En el resto de los casos, se mantiene.

_Fuente: docs/documento_fuente.md §8.3_

#### `sulodexida` — Depende del riesgo hemorrágico / técnica neuroaxial

- Si riesgo hemorrágico alto o neuroaxial: **48 h** antes.
- En el resto de los casos, se mantiene.
- No interviene en la decisión de pruebas complementarias.

_Fuente: docs/documento_fuente.md §8.3_

#### `aine_ibuprofeno` — Antiinflamatorio no esteroideo (AINE)

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_naproxeno` — Antiinflamatorio no esteroideo (AINE)

- Última toma **72 h** antes.

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_diclofenaco` — Antiinflamatorio no esteroideo (AINE)

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_dexketoprofeno` — Antiinflamatorio no esteroideo (AINE)

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_ketorolaco` — Antiinflamatorio no esteroideo (AINE)

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_celecoxib` — AINE que se mantiene (coxib)

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.6_

#### `aine_etoricoxib` — AINE que se mantiene (coxib)

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.6_

#### `metformina` — Antidiabético: no tomar el día de la intervención

- Con contraste yodado, suspender **48 h**.

_Fuente: docs/documento_fuente.md §8.5 (protocolo; CPOC)_

#### `sulfonilurea` — Antidiabético: no tomar el día de la intervención

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.5_

#### `glinida` — Antidiabético: no tomar el día de la intervención

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.5_

#### `dpp4` — Antidiabético: no tomar la mañana de la intervención

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.5_

#### `pioglitazona` — Antidiabético: no tomar el día de la intervención

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.5_

#### `sglt2` — Inhibidor SGLT2 (glicemia; riesgo de cetoacidosis)

- Suspender **3 días** antes.
- Ertugliflozina: **4 días** antes.

_Fuente: docs/documento_fuente.md §8.5_

#### `glp1_semanal` — Agonista GLP-1 semanal

- Ventana de omisión de la dosis: **7 días** alrededor de la intervención.
- Dieta líquida las 24 h previas.

_Fuente: docs/documento_fuente.md §8.5 (Decisión 8)_

#### `glp1_diario` — Agonista GLP-1 diario

- Última dosis **4 días** antes.

_Fuente: docs/documento_fuente.md §8.5 (Decisión 8)_

#### `bomba_insulina` — Bomba de insulina

- Insulina basal al **80%** (mínimo).
- Insulina basal al **80%** (máximo).

_Fuente: docs/documento_fuente.md §8.5 (Decisión 6)_

#### `insulina_glp1_fija` — Requiere confirmación del anestesiólogo

- Nota al anestesiólogo: «Combinación fija insulina basal + GLP-1: omitir el GLP-1 dejaría sin insulina basal.».

_Fuente: docs/documento_fuente.md §8.5_

#### `litio` — Litio

- Riesgo cardiovascular bajo: **24 h** antes.
- Riesgo cardiovascular intermedio: **48 h** antes.
- Riesgo cardiovascular alto: **72 h** antes.

_Fuente: docs/documento_fuente.md §8.7_

#### `ieca_ara2` — IECA / ARA-II

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.10 (ESC 2022)_

#### `sacubitrilo_valsartan` — Requiere confirmación del anestesiólogo

- Nota al anestesiólogo: «Sacubitrilo/valsartán: requiere confirmación del anestesiólogo.».

_Fuente: docs/documento_fuente.md §8.10_

#### `corticoide_sistemico` — Se mantiene

- Valorar dosis de estrés de corticoide perioperatoria.

_Fuente: docs/documento_fuente.md §8.11 / §5.3_

#### `diuretico` — No tomar la mañana de la intervención

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.10_

#### `hbpm` — Heparina de bajo peso molecular (HBPM)

- Dosis profiláctica: **12 h** antes.
- Dosis terapéutica: **24 h** antes.

_Fuente: docs/documento_fuente.md §8.4 (SETH; ASRA 2018)_

#### `heparina_sodica` — Heparina sódica

- Última toma **6 h** antes.

_Fuente: docs/documento_fuente.md §8.4_

#### `fondaparinux` — Fondaparinux

- Dosis profiláctica: **36 h** antes.
- Dosis profiláctica con neuroaxial: **48 h** antes.
- Dosis terapéutica: **48 h** antes.
- Dosis terapéutica (alargado): **72 h** antes.
- Contraindicado con aclaramiento < **20 mL/min**.

_Fuente: docs/documento_fuente.md §8.4_

#### `gp_iibiiia` — Inhibidor de la glicoproteína IIb/IIIa

- Requiere confirmación del anestesiólogo.

_Fuente: docs/documento_fuente.md §8.3_

#### `insulina_basal` — Insulina basal

- Dosis de la noche previa al **80%**.
- Dosis de la mañana al **80%**.

_Fuente: docs/documento_fuente.md §8.5_

#### `insulina_nph` — Insulina NPH

- Dosis de la mañana al **50%**.

_Fuente: docs/documento_fuente.md §8.5_

#### `insulina_rapida` — Insulina rápida

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.5_

#### `insulina_premezclada` — Insulina premezclada

- Dosis de la mañana al **50%**.

_Fuente: docs/documento_fuente.md §8.5_

#### `imao_irreversible` — IMAO irreversible

- Mínimo **10 días**.
- Máximo **14 días**.
- Requiere confirmación del anestesiólogo.

_Fuente: docs/documento_fuente.md §8.7_

#### `moclobemida` — Moclobemida (IMAO reversible)

- Última toma **24 h** antes.

_Fuente: docs/documento_fuente.md §8.7_

#### `imao_b` — IMAO-B (selegilina, rasagilina)

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.7_

#### `inmunosupresor_clasico` — Inmunosupresor clásico

- En enfermedad autoinmune: **2 días** antes.

_Fuente: docs/documento_fuente.md §8.8 (ACR 2022)_

#### `metotrexato` — Metotrexato

- Umbral: **20 mg/semana**.

_Fuente: docs/documento_fuente.md §8.8 (ACR 2022)_

#### `fame_mantener` — FAME que se mantiene

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.8 (ACR 2022)_

#### `jak` — Inhibidor JAK

- Suspender **3 días** antes.

_Fuente: docs/documento_fuente.md §8.8 (ACR 2022)_

#### `biologico` — Fármaco biológico

- Requiere confirmación del anestesiólogo.

_Fuente: docs/documento_fuente.md §8.8_

#### `tirosina_cinasa` — Inhibidor de la tirosina-cinasa

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.9_

#### `antiangiogenico` — Antiangiogénico

- Suspender **8 semanas** antes.
- Requiere confirmación del anestesiólogo.

_Fuente: docs/documento_fuente.md §8.9_

#### `antiangiogenico_intravitreo` — Se mantiene

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8.9_

#### `fitoterapia` — Fitoterapia / productos de herbolario

- Suspender **14 días** antes.
- Mínimo **7 días**.

_Fuente: docs/documento_fuente.md §8.11_

#### `anticonceptivo_ths` — Anticonceptivo hormonal / THS

- Sugerencia: valorar suspender **6 semanas** antes.

_Fuente: docs/documento_fuente.md §8.11_

#### `mantener_generico` — Se mantiene

- (Sin parámetros numéricos; la lógica está en el motor de reglas.)

_Fuente: docs/documento_fuente.md §8_

#### `alfabloqueante_flacido` — Se mantiene (aviso en cirugía oftalmológica)

- Aviso en oftalmología: «Riesgo de síndrome de iris flácido intraoperatorio: avisar al oftalmólogo.».

_Fuente: docs/documento_fuente.md §8_

#### `no_catalogado` — Fármaco no catalogado

- Texto al paciente: «Siga tomándolo como siempre y consúltelo con el anestesiólogo.».

_Fuente: docs/documento_fuente.md §8.0_

## 3. Catálogo de fármacos

_Fuente: `datos/farmacos.csv`. La columna «Regla» indica qué regla de la sección 2
se aplica a cada fármaco. `verificado_cima = no` significa que el nombre comercial
aún debe revisarse en CIMA (AEMPS) antes del uso clínico._

### 3.1. aine

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Espidifen\|Dalsy\|Neobrufen | ibuprofeno | `aine_ibuprofeno` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Naprosyn\|Antalgin | naproxeno | `aine_naproxeno` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Voltaren | diclofenaco | `aine_diclofenaco` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Enantyum | dexketoprofeno | `aine_dexketoprofeno` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| ketorolaco | ketorolaco | `aine_ketorolaco` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Toradol | ketorolaco | `aine_ketorolaco` | no | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Celebrex | celecoxib | `aine_celecoxib` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Arcoxia | etoricoxib | `aine_etoricoxib` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.2. analgesicos

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Gelocatil\|Termalgin\|Efferalgan | paracetamol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Nolotil | metamizol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.3. antiagregantes

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Adiro\|Tromalyt | acido_acetilsalicilico | `aas` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Plavix\|Iscover | clopidogrel | `p2y12_clopidogrel` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Efient | prasugrel | `p2y12_prasugrel` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Brilique | ticagrelor | `p2y12_ticagrelor` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Persantin | dipiridamol | `dipiridamol` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Disgren | triflusal | `triflusal` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Pletal | cilostazol | `cilostazol` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Integrilin | eptifibatida | `gp_iibiiia` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Aggrastat | tirofiban | `gp_iibiiia` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Kengrexal | cangrelor | `gp_iibiiia` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.4. anticoagulantes

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Sintrom | acenocumarol | `avk_acenocumarol` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Aldocumar | warfarina | `avk_warfarina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Pradaxa | dabigatran | `acod_dabigatran` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xarelto | rivaroxaban | `acod_antixa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Eliquis | apixaban | `acod_antixa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lixiana | edoxaban | `acod_antixa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Clexane\|Inhixa | enoxaparina | `hbpm` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Hibor | bemiparina | `hbpm` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Innohep | tinzaparina | `hbpm` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Fragmin | dalteparina | `hbpm` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Fraxiparina | nadroparina | `hbpm` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Arixtra | fondaparinux | `fondaparinux` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| heparina sodica | heparina_sodica | `heparina_sodica` | no | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.5. antidiabeticos

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Dianben | metformina | `metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Januvia\|Tesavel\|Xelevia | sitagliptina | `dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Galvus\|Jalra | vildagliptina | `dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trajenta | linagliptina | `dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Onglyza | saxagliptina | `dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Vipidia | alogliptina | `dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Janumet\|Velmetia\|Efficib | sitagliptina+metformina | `dpp4+metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Eucreas\|Icandra | vildagliptina+metformina | `dpp4+metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Jentadueto | linagliptina+metformina | `dpp4+metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Diamicron | gliclazida | `sulfonilurea` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Amaryl | glimepirida | `sulfonilurea` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Daonil | glibenclamida | `sulfonilurea` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Minodiab | glipizida | `sulfonilurea` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Novonorm | repaglinida | `glinida` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Starlix | nateglinida | `glinida` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Actos | pioglitazona | `pioglitazona` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Jardiance | empagliflozina | `sglt2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Forxiga | dapagliflozina | `sglt2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Invokana | canagliflozina | `sglt2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Steglatro | ertugliflozina | `sglt2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Synjardy | empagliflozina+metformina | `sglt2+metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xigduo | dapagliflozina+metformina | `sglt2+metformina` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Glyxambi | empagliflozina+linagliptina | `sglt2+dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Qtern | dapagliflozina+saxagliptina | `sglt2+dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trijardy | empagliflozina+metformina+linagliptina | `sglt2+metformina+dpp4` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.6. cardiovascular

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Renitec | enalapril | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zestril\|Prinivil | lisinopril | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Acovil | ramipril | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Coversyl | perindopril | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Capoten | captopril | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cozaar | losartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Diovan | valsartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Atacand\|Parapres | candesartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Aprovel\|Karvea | irbesartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Olmetec\|Openvas\|Ixia | olmesartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Micardis\|Pritor | telmisartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| eprosartan | eprosartan | `ieca_ara2` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Entresto | sacubitrilo+valsartan | `sacubitrilo_valsartan` | sí | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Emconcor | bisoprolol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tenormin | atenolol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Coropres | carvedilol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lobivon | nebivolol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Beloken | metoprolol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Norvas | amlodipino | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Masdil | diltiazem | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Manidon | verapamilo | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seguril | furosemida | `diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sutril | torasemida | `diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Esidrex | hidroclorotiazida | `diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Aldactone | espironolactona | `diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Elecor | eplerenona | `diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trangorex | amiodarona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| digoxina | digoxina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cardyl\|Zarator | atorvastatina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Crestor | rosuvastatina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zocor | simvastatina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Atacand Plus\|Parapres Plus | candesartan+hidroclorotiazida | `ieca_ara2+diuretico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Viacoram | perindopril+amlodipino | `ieca_ara2+mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sevikar | olmesartan+amlodipino | `ieca_ara2+mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.7. digestivo

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Nexium\|Axiago | esomeprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Opiren | lansoprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Pariet | rabeprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.8. fitoterapia

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| ginkgo | ginkgo | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| ajo | ajo | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| ginseng | ginseng | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| kava | kava | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| curcuma | curcuma | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| vitamina E | vitamina_e | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| omega 3 | omega_3 | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| hiperico | hiperico | `fitoterapia` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.9. glp1

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Ozempic\|Wegovy | semaglutida | `glp1_semanal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Rybelsus | semaglutida | `glp1_diario` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Victoza\|Saxenda | liraglutida | `glp1_diario` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trulicity | dulaglutida | `glp1_semanal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Byetta\|Bydureon | exenatida | `glp1_semanal` | no | subcutanea | ✓ verificado (2026-09-30, CIMA manual) |
| Lyxumia | lixisenatida | `glp1_diario` | no | subcutanea | ✓ verificado (2026-09-30, CIMA manual) |
| Mounjaro | tirzepatida | `glp1_semanal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.10. glucosaminoglucanos

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Aterina | sulodexida | `sulodexida` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.11. hematologia

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Fero-Gradumet\|Tardyferon | sulfato_ferroso | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Ferbisol | ferroglicina_sulfato | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Ferinject | hierro_carboximaltosa | `mantener_generico` | no | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Venofer | hierro_sacarosa | `mantener_generico` | no | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.12. hormonas

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Eutirox | levotiroxina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Dacortin | prednisona | `corticoide_sistemico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Urbason | metilprednisolona | `corticoide_sistemico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Hidroaltesona | hidrocortisona | `corticoide_sistemico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| terapia hormonal sustitutiva | terapia_hormonal_sustitutiva | `anticonceptivo_ths` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| omeprazol | omeprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| pantoprazol | pantoprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zyloric | alopurinol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Deltius\|Thorens | colecalciferol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Hidroferol | calcifediol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| anticonceptivo oral combinado | etinilestradiol | `anticonceptivo_ths` | no | oral | ✗ sin verificar |
| anticonceptivo oral solo gestágeno | desogestrel | `anticonceptivo_ths` | no | oral | ✗ sin verificar |
| implante anticonceptivo\|Implanon NXT | etonogestrel | `anticonceptivo_ths` | no | implante | ✗ sin verificar |
| DIU hormonal\|Mirena\|Kyleena\|Jaydess | levonorgestrel | `anticonceptivo_ths` | no | intrauterina | ✗ sin verificar |
| anillo vaginal\|NuvaRing\|Circlet | etonogestrel\|etinilestradiol | `anticonceptivo_ths` | no | vaginal | ✗ sin verificar |
| parche anticonceptivo\|Evra | norelgestromina\|etinilestradiol | `anticonceptivo_ths` | no | transdermica | ✗ sin verificar |
| anticonceptivo inyectable\|Depo-Progevera | medroxiprogesterona | `anticonceptivo_ths` | no | intramuscular | ✗ sin verificar |
| terapia hormonal sustitutiva oral\|THS oral | estradiol | `anticonceptivo_ths` | no | oral | ✗ sin verificar |
| terapia hormonal sustitutiva parche\|THS parche | estradiol | `anticonceptivo_ths` | no | transdermica | ✗ sin verificar |
| terapia hormonal sustitutiva vaginal\|THS vaginal | estradiol | `anticonceptivo_ths` | no | vaginal | ✗ sin verificar |

### 3.13. inmunosupresores

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Imurel | azatioprina | `inmunosupresor_clasico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sandimmun Neoral | ciclosporina | `inmunosupresor_clasico` | no | oral | ✓ verificado (2026-09-30, CIMA manual) |
| Prograf\|Advagraf\|Envarsus | tacrolimus | `inmunosupresor_clasico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| CellCept\|Myfortic | micofenolato | `inmunosupresor_clasico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Metoject\|Imeth\|Bertanel\|Nordimet | metotrexato | `metotrexato` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Arava | leflunomida | `fame_mantener` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Dolquine | hidroxicloroquina | `fame_mantener` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Salazopyrina | sulfasalazina | `fame_mantener` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xeljanz | tofacitinib | `jak` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Olumiant | baricitinib | `jak` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Rinvoq | upadacitinib | `jak` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Humira\|Amgevita\|Hyrimoz\|Imraldi\|Idacio\|Hulio\|Yuflyma | adalimumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Enbrel\|Benepali\|Erelzi | etanercept | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Remicade\|Inflectra\|Remsima | infliximab | `biologico` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cimzia | certolizumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Simponi | golimumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| RoActemra | tocilizumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Orencia | abatacept | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| MabThera\|Truxima\|Rixathon | rituximab | `biologico` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cosentyx | secukinumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Stelara | ustekinumab | `biologico` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.14. insulinas

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Xultophy | insulina_degludec+liraglutida | `insulina_glp1_fija` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Suliqua | insulina_glargina+lixisenatida | `insulina_glp1_fija` | sí | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lantus\|Abasaglar\|Toujeo | insulina_glargina | `insulina_basal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Levemir | insulina_detemir | `insulina_basal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tresiba | insulina_degludec | `insulina_basal` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Insulatard\|Humulina NPH | insulina_nph | `insulina_nph` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Humalog | insulina_lispro | `insulina_rapida` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| NovoRapid\|Fiasp | insulina_aspart | `insulina_rapida` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Apidra | insulina_glulisina | `insulina_rapida` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Actrapid\|Humulina Regular | insulina_regular | `insulina_rapida` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| NovoMix 30 | insulina_aspart | `insulina_premezclada` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Humalog Mix 25 | insulina_lispro | `insulina_premezclada` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Humalog Mix 50 | insulina_lispro | `insulina_premezclada` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Ryzodeg | insulina_degludec+insulina_aspart | `insulina_premezclada` | no | subcutanea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.15. neurologia

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Keppra | levetiracetam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Briviact | brivaracetam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lamictal\|Labileno | lamotrigina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Depakine | acido_valproico | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tegretol | carbamazepina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trileptal | oxcarbazepina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Vimpat | lacosamida | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Topamax | topiramato | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zonegran | zonisamida | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Neosidantoina | fenitoina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Fycompa | perampanel | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zebinix | eslicarbazepina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Neurontin | gabapentina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lyrica | pregabalina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.16. oftalmologia

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Timoftol | timolol | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Alphagan | brimonidina | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trusopt | dorzolamida | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Azopt | brinzolamida | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xalatan | latanoprost | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lumigan | bimatoprost | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Travatan | travoprost | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| pilocarpina | pilocarpina | `mantener_generico` | no | colirio | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Edemox | acetazolamida | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.17. oncologicos

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Glivec | imatinib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sprycel | dasatinib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tasigna | nilotinib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tarceva | erlotinib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Nexavar | sorafenib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sutent | sunitinib | `tirosina_cinasa` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Erbitux | cetuximab | `tirosina_cinasa` | no | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Avastin\|Mvasi\|Zirabev | bevacizumab | `antiangiogenico` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zaltrap | aflibercept | `antiangiogenico` | sí | intravenosa | ✓ verificado (2026-09-30, CIMA manual) |
| Eylea | aflibercept | `antiangiogenico_intravitreo` | no | intravitrea | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cyramza | ramucirumab | `antiangiogenico` | sí | intravenosa | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.18. opioides

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| MST Continus\|Sevredol | morfina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| codeina | codeina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Adolonta\|Zaldiar | tramadol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Palexia | tapentadol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Oxycontin\|Oxynorm\|Targin | oxicodona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Jurnista | hidromorfona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Durogesic | fentanilo | `mantener_generico` | no | transdermica | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Feliben\|Transtec | buprenorfina | `mantener_generico` | no | transdermica | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Suboxone | buprenorfina\|naloxona | `mantener_generico` | no | sublingual | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| metadona | metadona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.19. psicofarmacos

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Parnate | tranilcipromina | `imao_irreversible` | sí | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Manerix | moclobemida | `moclobemida` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| fenelzina | fenelzina | `imao_irreversible` | sí | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| isocarboxazida | isocarboxazida | `imao_irreversible` | sí | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Azilect | rasagilina | `imao_b` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Plurimen | selegilina | `imao_b` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xadago | safinamida | `imao_b` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Plenur | litio | `litio` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Sinemet | levodopa+carbidopa | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Prozac\|Adofen | fluoxetina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Besitran | sertralina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seroxat\|Motivan | paroxetina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seropram | citalopram | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cipralex\|Esertia | escitalopram | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Dumirox | fluvoxamina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Vandral\|Dobupal | venlafaxina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Pristiq | desvenlafaxina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Cymbalta\|Xeristar | duloxetina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Rexer | mirtazapina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Deprax | trazodona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Elontril | bupropion | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Brintellix | vortioxetina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tryptizol | amitriptilina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Paxtibi | nortriptilina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Anafranil | clomipramina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Valium | diazepam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Orfidal\|Idalprem | lorazepam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trankimazin | alprazolam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Rivotril | clonazepam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Lexatin | bromazepam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Noctamid | lormetazepam | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Tranxilium | clorazepato | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Stilnox\|Dalparan | zolpidem | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Limovan | zopiclona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seroquel | quetiapina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Zyprexa | olanzapina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Risperdal | risperidona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Invega | paliperidona | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Xeplion | paliperidona | `mantener_generico` | no | intramuscular | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Abilify | aripiprazol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| haloperidol | haloperidol | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Leponex | clozapina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Etumina | clotiapina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.20. respiratorio

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Ventolin\|Buto-Asma | salbutamol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Terbasmin | terbutalina | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Atrovent | ipratropio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Oxis\|Foradil | formoterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Serevent\|Beglan\|Inaspir | salmeterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Onbrez | indacaterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Spiriva | tiotropio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Incruse | umeclidinio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seebri | glicopirronio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Eklira | aclidinio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Pulmicort | budesonida | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Flixotide\|Flusonal | fluticasona | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Becloasma | beclometasona | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Symbicort\|Rilast | budesonida+formoterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Seretide\|Anasma\|Inaladuo\|Plusvent | fluticasona+salmeterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Foster\|Formodual | beclometasona+formoterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Relvar | fluticasona_furoato+vilanterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Anoro | umeclidinio+vilanterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Ultibro | glicopirronio+indacaterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Spiolto | tiotropio+olodaterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Duaklir | aclidinio+formoterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trelegy | fluticasona_furoato+umeclidinio+vilanterol | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Trimbow | beclometasona+formoterol+glicopirronio | `mantener_generico` | no | inhalada | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Singulair | montelukast | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

### 3.21. urologia

| Nombres comerciales | Principios activos | Regla | Confirmación | Vía | Verificación CIMA |
| --- | --- | --- | --- | --- | --- |
| Omnic\|Urolosin | tamsulosina | `alfabloqueante_flacido` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Silodyx\|Urorec | silodosina | `alfabloqueante_flacido` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Benestan | alfuzosina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| Carduran | doxazosina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |
| terazosina | terazosina | `mantener_generico` | no | oral | ✓ verificado (2026-09-30, cotejo CIMA asistido) |

## 4. Conversión de opioides a morfina oral equivalente

_Fuente: `datos/opioides.json` · Factores de conversión a morfina oral equivalente (docs/documento_fuente.md §6.8). (CDC 2022)_

| Opioide | Factor a morfina oral |
| --- | --- |
| morfina oral | 1 |
| codeina | 0.15 |
| tramadol | 0.2 |
| tapentadol | 0.4 |
| oxicodona | 1.5 |
| hidromorfona oral | 5 |
| fentanilo transdermico | 2.4 |

**Sin conversión directa** (requieren valoración específica): buprenorfina, metadona.

## 5. Procedimientos y su riesgo

_Fuente: `datos/procedimientos.csv`. Cada procedimiento fija el riesgo cardiovascular
y hemorrágico, si la técnica neuroaxial/bloqueo profundo es probable y otros factores
que alimentan las reglas y la decisión de pruebas._

### 5.1. cardiaca

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Bypass coronario | alto | alto | no | no |
| Recambio valvular | alto | alto | no | no |
| Reparacion valvular | alto | alto | no | no |
| Cirugia de aorta ascendente | alto | alto | no | no |

### 5.2. cardiologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Implante de marcapasos o DAI | intermedio | bajo | no | no |
| Ablacion cardiaca | intermedio | bajo | no | no |
| Estudio electrofisiologico | intermedio | bajo | no | no |
| Cateterismo coronario diagnostico | intermedio | bajo | no | no |
| Angioplastia coronaria con stent | alto | alto | no | no |
| Valvuloplastia percutanea | alto | alto | no | no |
| Implante valvular aortico transcateter (TAVI) | alto | alto | no | no |

### 5.3. cirugia general

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Hernioplastia inguinal abierta | bajo | bajo | no | no |
| Hernioplastia inguinal laparoscopica | bajo | bajo | no | no |
| Hernioplastia umbilical | bajo | bajo | no | no |
| Eventroplastia de pared abdominal | intermedio | alto | no | no |
| Colecistectomia laparoscopica | intermedio | bajo | no | no |
| Colecistectomia abierta | intermedio | alto | no | no |
| Apendicectomia | bajo | bajo | no | no |
| Colectomia no oncologica | intermedio | alto | no | no |
| Colectomia oncologica | alto | alto | no | no |
| Hemicolectomia | alto | alto | no | no |
| Reseccion anterior de recto | alto | alto | si | no |
| Amputacion abdominoperineal | alto | alto | si | no |
| Gastrectomia | alto | alto | no | no |
| Esofagectomia | alto | alto | no | no |
| Bypass gastrico | alto | alto | no | no |
| Gastrectomia vertical | intermedio | alto | no | no |
| Tiroidectomia | intermedio | bajo | no | no |
| Paratiroidectomia | intermedio | bajo | no | no |
| Suprarrenalectomia laparoscopica | alto | alto | no | no |
| Esplenectomia | alto | alto | no | no |
| Mastectomia | bajo | bajo | no | no |
| Tumorectomia de mama | bajo | bajo | no | no |
| Biopsia de ganglio centinela | bajo | bajo | no | no |
| Exeresis cutanea pequena | bajo | minimo | no | no |
| Drenaje de absceso | bajo | minimo | no | no |
| Cirugia de fistula anal | bajo | bajo | si | no |
| Hemorroidectomia | bajo | bajo | si | no |
| Exeresis de sinus pilonidal | bajo | bajo | no | no |
| Cirugia perineal o proctologica | bajo | bajo | si | no |
| Colocacion de reservorio subcutaneo | bajo | bajo | no | no |
| Otro procedimiento | intermedio | bajo | no | no |

### 5.4. dermatologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Exeresis de tumor cutaneo | bajo | minimo | no | no |
| Cirugia de Mohs | bajo | bajo | no | no |

### 5.5. digestivo

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Endoscopia digestiva alta diagnostica | bajo | minimo | no | no |
| Colonoscopia diagnostica | bajo | minimo | no | no |
| Endoscopia con biopsia | bajo | bajo | no | no |
| Colonoscopia con polipectomia | intermedio | alto | no | no |
| CPRE con esfinterotomia | intermedio | alto | no | no |
| Mucosectomia endoscopica | intermedio | alto | no | no |
| Gastrostomia endoscopica percutanea | intermedio | bajo | no | no |
| Ligadura endoscopica de varices esofagicas | intermedio | alto | no | no |
| Biopsia hepatica | intermedio | alto | no | no |
| Manometria esofagica | bajo | minimo | no | no |
| Gastroscopia terapeutica | intermedio | alto | no | no |
| Dilatacion esofagica endoscopica | intermedio | bajo | no | no |

### 5.6. ginecologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Histerectomia | intermedio | alto | no | no |
| Histerectomia laparoscopica | intermedio | alto | no | no |
| Anexectomia | intermedio | alto | no | no |
| Laparoscopia ginecologica diagnostica | bajo | bajo | no | no |
| Legrado uterino | bajo | bajo | no | no |
| Conizacion cervical | bajo | bajo | no | no |
| Histeroscopia | bajo | bajo | no | no |
| Cirugia de prolapso genital | intermedio | alto | si | no |
| Cabestrillo suburetral | bajo | bajo | si | no |
| Miomectomia | intermedio | alto | no | no |
| Cirugia oncologica ovarica | alto | alto | no | no |
| Biopsia endometrial | bajo | minimo | no | no |

### 5.7. maxilofacial

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Cirugia ortognatica | intermedio | alto | no | no |
| Extraccion de terceros molares | bajo | bajo | no | no |
| Extraccion de 1 a 3 piezas dentarias | bajo | minimo | no | no |
| Implante dental simple | bajo | minimo | no | no |
| Implante dental complejo con injerto | bajo | bajo | no | no |
| Cirugia periodontal | bajo | minimo | no | no |
| Osteosintesis de fractura mandibular | intermedio | bajo | no | no |
| Cirugia de tumor de cavidad oral | intermedio | alto | no | no |

### 5.8. neurocirugia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Craneotomia por tumor | alto | alto | no | si |
| Craneotomia por aneurisma | alto | alto | no | si |
| Evacuacion de hematoma subdural | alto | alto | no | si |
| Derivacion ventriculoperitoneal | intermedio | alto | no | si |
| Cirugia transesfenoidal de hipofisis | alto | alto | no | si |
| Cirugia del canal medular | alto | alto | si | si |
| Implante de estimulador medular | intermedio | alto | si | si |
| Puncion lumbar | bajo | alto | si | si |

### 5.9. obstetricia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Cesarea | intermedio | alto | si | no |
| Parto instrumental | intermedio | alto | si | no |
| Legrado obstetrico | bajo | bajo | no | no |
| Cerclaje cervical | bajo | bajo | si | no |

### 5.10. oftalmologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Cirugia de catarata con anestesia topica | bajo | minimo | no | no |
| Cirugia de chalazion | bajo | minimo | no | no |
| Cirugia de pterigion | bajo | minimo | no | no |
| Cirugia de catarata con bloqueo retrobulbar | bajo | bajo | no | no |
| Cirugia palpebral | bajo | bajo | no | no |
| Dacriocistorrinostomia | bajo | bajo | no | no |
| Dacriocistectomia | bajo | bajo | no | no |
| Queratoplastia | bajo | bajo | no | no |
| Evisceracion ocular | bajo | bajo | no | no |
| Enucleacion ocular | bajo | bajo | no | no |
| Cirugia de glaucoma | bajo | bajo | no | no |
| Cerclaje escleral | bajo | bajo | no | no |
| Vitrectomia | bajo | bajo | no | no |
| Cirugia de desprendimiento de retina | bajo | bajo | no | no |
| Cirugia de estrabismo | bajo | bajo | no | no |
| Descompresion orbitaria | intermedio | alto | no | no |
| Cirugia tumoral ocular | intermedio | alto | no | no |
| Inyeccion intravitrea | bajo | minimo | no | no |

### 5.11. orl

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Amigdalectomia | bajo | bajo | no | no |
| Adenoidectomia | bajo | bajo | no | no |
| Septoplastia | bajo | bajo | no | no |
| Rinoseptoplastia | bajo | bajo | no | no |
| Cirugia endoscopica nasosinusal | bajo | bajo | no | no |
| Timpanoplastia | bajo | bajo | no | no |
| Mastoidectomia | bajo | bajo | no | no |
| Tiroidectomia | intermedio | bajo | no | no |
| Parotidectomia | intermedio | bajo | no | no |
| Laringectomia | intermedio | alto | no | no |
| Vaciamiento cervical ganglionar | intermedio | alto | no | no |
| Microcirugia de laringe | bajo | bajo | no | no |
| Traqueotomia | intermedio | bajo | no | no |
| Septorrinoplastia de revision | bajo | bajo | no | no |
| Uvulopalatofaringoplastia | intermedio | bajo | no | no |

### 5.12. pediatria

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Amigdalectomia pediatrica | bajo | bajo | no | no |
| Adenoidectomia pediatrica | bajo | bajo | no | no |
| Drenajes timpanicos | bajo | minimo | no | no |
| Circuncision | bajo | minimo | no | no |
| Herniorrafia inguinal pediatrica | bajo | bajo | si | no |
| Orquidopexia | bajo | bajo | si | no |
| Cirugia de fimosis | bajo | minimo | no | no |
| Frenulectomia | bajo | minimo | no | no |
| Correccion de hipospadias | bajo | bajo | si | no |
| Apendicectomia pediatrica | bajo | bajo | no | no |
| Cirugia de estrabismo pediatrica | bajo | bajo | no | no |
| Cirugia de cardiopatia congenita | alto | alto | no | no |

### 5.13. plastica

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Rinoplastia | bajo | bajo | no | no |
| Abdominoplastia | intermedio | bajo | no | no |
| Mamoplastia de aumento | bajo | bajo | no | no |
| Mamoplastia de reduccion | bajo | bajo | no | no |
| Reconstruccion mamaria con colgajo | intermedio | alto | no | no |
| Lipectomia | bajo | bajo | no | no |
| Injerto de piel | bajo | bajo | no | no |
| Cirugia de colgajo | intermedio | alto | no | no |
| Dermolipectomia | intermedio | bajo | no | no |

### 5.14. radiologia intervencionista

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Angiografia no coronaria | intermedio | bajo | no | no |
| Embolizacion arterial | intermedio | alto | no | no |
| Drenaje percutaneo guiado | bajo | bajo | no | no |
| Biopsia percutanea guiada por imagen | bajo | bajo | no | no |
| Nefrostomia percutanea | intermedio | alto | no | no |
| Quimioembolizacion hepatica | alto | alto | no | no |

### 5.15. toracica

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Neumonectomia | alto | alto | no | no |
| Lobectomia pulmonar | alto | alto | no | no |
| Segmentectomia pulmonar | alto | alto | no | no |
| Videotoracoscopia (VATS) | alto | alto | si | no |
| Mediastinoscopia | intermedio | bajo | no | no |
| Biopsia pleural | intermedio | bajo | no | no |
| Pleurodesis | intermedio | bajo | no | no |
| Timectomia | alto | alto | no | no |

### 5.16. traumatologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Artroplastia total de rodilla | intermedio | alto | si | no |
| Artroplastia total de cadera | intermedio | alto | si | no |
| Artroplastia de hombro | intermedio | alto | si | no |
| Osteosintesis de fractura de cadera | intermedio | alto | si | no |
| Osteosintesis de femur | intermedio | alto | si | no |
| Osteosintesis de tibia | intermedio | alto | si | no |
| Osteosintesis de humero | intermedio | bajo | si | no |
| Osteosintesis de muneca | bajo | bajo | si | no |
| Artroscopia de rodilla | bajo | bajo | si | no |
| Artroscopia de hombro | bajo | bajo | si | no |
| Ligamentoplastia de rodilla | bajo | bajo | si | no |
| Meniscectomia artroscopica | bajo | bajo | si | no |
| Artrodesis lumbar | alto | alto | si | si |
| Discectomia lumbar | intermedio | alto | si | si |
| Laminectomia | intermedio | alto | si | si |
| Cirugia de mano | bajo | bajo | si | no |
| Liberacion del tunel carpiano | bajo | minimo | no | no |
| Cirugia de Dupuytren | bajo | bajo | si | no |
| Cirugia de hallux valgus | bajo | bajo | si | no |
| Artroscopia de tobillo | bajo | bajo | si | no |
| Retirada de material de osteosintesis | bajo | bajo | si | no |
| Amputacion de miembro inferior | alto | alto | si | no |
| Infiltracion articular | bajo | minimo | no | no |

### 5.17. urologia

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| RTU de prostata | intermedio | alto | si | no |
| RTU de tumor vesical | intermedio | alto | si | no |
| Nefrolitotomia percutanea | intermedio | alto | no | no |
| Ureteroscopia | bajo | bajo | si | no |
| Litotricia extracorporea | intermedio | alto | no | no |
| Prostatectomia radical | intermedio | alto | si | no |
| Nefrectomia | alto | alto | no | no |
| Nefrectomia parcial | alto | alto | no | no |
| Cistectomia radical | alto | alto | no | no |
| Biopsia de prostata | bajo | bajo | no | no |
| Biopsia renal | intermedio | alto | no | no |
| Vasectomia | bajo | minimo | no | no |
| Orquiectomia | bajo | bajo | no | no |
| Cirugia de hidrocele | bajo | bajo | si | no |
| Colocacion de cateter doble J | bajo | bajo | si | no |
| Cistoscopia diagnostica | bajo | minimo | no | no |
| Circuncision en adulto | bajo | minimo | no | no |

### 5.18. vascular

| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |
| --- | --- | --- | --- | --- |
| Cirugia de aorta abdominal | alto | alto | no | no |
| Reparacion endovascular de aneurisma (EVAR) | alto | alto | no | no |
| Revascularizacion arterial periferica | alto | alto | no | no |
| Bypass femoropopliteo | alto | alto | si | no |
| Endarterectomia carotidea | alto | alto | no | no |
| Amputacion por isquemia | alto | alto | si | no |
| Fistula arteriovenosa para dialisis | intermedio | bajo | no | no |
| Safenectomia por varices | bajo | bajo | si | no |
| Escleroterapia de varices | bajo | minimo | no | no |
| Ligadura de varices | bajo | minimo | no | no |
| Colocacion de reservorio venoso | bajo | bajo | no | no |

## 6. Módulos de enfermedades (anamnesis dirigida, §5.16)

_Fuente: `datos/modulos/*.json`. Preguntas que la aplicación abre al marcar cada
enfermedad en el cribado. El «porqué» explica su relevancia anestésica._

### Anemia

_Fuente: docs/documento_fuente.md §5.5_

- **Tipo de anemia (si se conoce)** — _opcion_: Ferropénica (falta de hierro) / Por déficit de B12 o fólico / De enfermedad crónica / Hemolítica / Talasemia / Desconocida
- **Tratamiento actual** — _opcion_: Hierro oral / Hierro intravenoso / Vitamina B12 / Eritropoyetina / Ninguno
- **Última hemoglobina** (g/dL) — _numero_
  - Por qué: Una Hb < 13 g/dL antes de cirugía con sangrado previsible aconseja optimizar la anemia y pedir ferritina.
- **Fecha de esa hemoglobina** — _fecha_
- **¿Ferropenia (falta de hierro) conocida?** — _boolean_
- **¿Sangrado reciente?** — _boolean_
- **Síntomas** — _opcion_multiple_: Cansancio / Falta de aire / Palidez

### Anticoagulación / antiagregación

_Fuente: docs/documento_fuente.md §5.5_

- **¿Por qué toma el anticoagulante/antiagregante?** — _opcion_: Fibrilación auricular / Prótesis valvular / Trombosis venosa / embolia (TVP/TEP) / Trombofilia / Stent coronario / Otra / no lo sabe
  - Por qué: La indicación determina si hay alto riesgo trombótico y si se puede suspender sin más.
- **Fecha de la TVP/TEP (si esa es la indicación)** — _fecha_

### Artritis reumatoide

_Fuente: docs/documento_fuente.md §5.8, §5.16.13_

- **¿Dolor, rigidez o limitación para mover el cuello?** — _boolean_
  - Por qué: En la artritis reumatoide puede haber inestabilidad de las vértebras del cuello: hay que evitar movimientos bruscos al dormir al paciente.
- **¿Dificultad para abrir la boca o problemas de la mandíbula?** — _boolean_
  - Por qué: Limita el acceso a la vía aérea para la intubación.
- **¿Ronquera crónica o falta de aire?** — _boolean_
  - Por qué: Puede indicar afectación de las articulaciones de la laringe (cricoaritenoidea).
- **Si toma inmunosupresores, ¿por qué motivo?** — _opcion_: Enfermedad autoinmune / Enfermedad sistémica grave / Trasplante
  - Por qué: La suspensión de los inmunosupresores clásicos depende de la indicación.
- **¿Ha tomado corticoides (cortisona) en los últimos 3 meses?** — _boolean_
  - Por qué: Una pauta prolongada de corticoides puede requerir una dosis de estrés perioperatoria (§5.3).
- **¿Cuál?** — _opcion_: Prednisona / Prednisolona / Metilprednisolona / Deflazacort / Dexametasona / Hidrocortisona
- **Dosis diaria** (mg) — _numero_
- **Duración** (semanas) — _numero_

### Asma o EPOC

_Fuente: docs/documento_fuente.md §5.2, §5.16.3, §5.16.4_

- **¿Qué enfermedad respiratoria tiene?** — _opcion_: Asma / EPOC / Ambas
- **Fecha de la última crisis** — _fecha_
- **¿Crisis o agudización en el último mes?** — _boolean_
  - Por qué: Una agudización reciente puede aconsejar posponer la cirugía programada; la intubación puede desencadenar broncoespasmo si no está controlada.
- **Visitas a urgencias o ingresos por asma/EPOC en el último año** — _numero_
- **¿Corticoides orales en el último año?** — _boolean_
- **¿Ingresos en el último año?** — _boolean_
- **Uso del inhalador de rescate (veces por semana)** — _numero_
  - Por qué: Usar el rescate más de 2 veces por semana indica que el asma no está bien controlada.
- **Desencadenantes de las crisis** — _opcion_multiple_: Infecciones / Frío / Estrés / Alergias / Ejercicio / AINE o aspirina / Otros
  - Por qué: Si los AINE o la aspirina desencadenan crisis, deben evitarse en el perioperatorio (alerta).
- **Disnea (escala mMRC), si es EPOC** — _opcion_: 0 — solo con ejercicio intenso / 1 — al andar deprisa o subir cuesta / 2 — anda más despacio que otros de su edad / 3 — para a los 100 m o pocos minutos / 4 — no sale de casa / al vestirse
- **¿Usa oxígeno en casa?** — _boolean_
  - Por qué: La oxigenoterapia domiciliaria sube la clase de riesgo del paciente.
- **Tipo de oxígeno domiciliario** — _opcion_: Nocturno / Continuo
- **¿Usa CPAP o BiPAP?** — _boolean_
- **¿Tos con expectoración habitual?** — _boolean_
- **¿Cambio reciente en el color o la cantidad del esputo, o síntomas respiratorios nuevos?** — _boolean_
  - Por qué: Un cambio reciente puede indicar infección activa y es uno de los supuestos que indican pedir radiografía de tórax.

### Cáncer en tratamiento

_Fuente: docs/documento_fuente.md §5.10, §8.9_

- **Tipo de cáncer** — _texto_
- **Tratamiento en curso** — _opcion_multiple_: Quimioterapia / Inmunoterapia / Antiangiogénico (bevacizumab u otros) / Hormonal / Ninguno ahora
- **Fecha de la última dosis del tratamiento sistémico** — _fecha_
  - Por qué: Los antiangiogénicos requieren separar la cirugía al menos 6-8 semanas de la última dosis.
- **¿Ha recibido antraciclinas o trastuzumab?** — _boolean_
  - Por qué: Estos fármacos pueden dañar el corazón: conviene revisar un ecocardiograma reciente.
- **¿Radioterapia en cuello o tórax?** — _boolean_
  - Por qué: La radioterapia cervical puede dificultar la vía aérea (alerta).

### Cardiopatía isquémica / infarto

_Fuente: docs/documento_fuente.md §5.1_

- **¿Ha tenido un infarto o un síndrome coronario agudo?** — _boolean_
  - Por qué: Un infarto reciente aumenta el riesgo perioperatorio y cambia el manejo de la medicación del corazón.
- **Fecha del infarto o síndrome coronario agudo** — _fecha_
- **¿Le han revascularizado las arterias del corazón?** — _opcion_: No / Sí, con cateterismo (angioplastia/stent) / Sí, con cirugía (bypass)
- **¿La revascularización fue completa o incompleta?** — _opcion_: Completa / Incompleta / No lo sabe
- **¿Le pusieron un stent (muelle) en las arterias del corazón?** — _boolean_
  - Por qué: El tipo de stent y el tiempo desde su colocación determinan si se puede suspender la antiagregación.
- **Fecha del stent** — _fecha_
- **Tipo de stent** — _opcion_: Farmacoactivo (liberador de fármaco) / Convencional (metálico) / Desconocido
- **Motivo del stent** — _opcion_: Programado (procedimiento electivo) / Por síndrome coronario agudo (infarto/angina inestable)
- **¿Tiene angina (dolor u opresión en el pecho al esforzarse) actualmente?** — _boolean_
- **¿Con qué esfuerzo le aparece la angina?** — _opcion_: Solo con grandes esfuerzos / Con esfuerzos moderados / Con mínimos esfuerzos / En reposo
- **¿La angina ha cambiado (más frecuente o más intensa) en las últimas semanas?** — _boolean_
  - Por qué: Una angina que cambia recientemente puede indicar isquemia inestable: es una señal de alerta.
- **Última prueba de esfuerzo o de detección de isquemia** — _opcion_: No se ha hecho / Negativa / Positiva / No concluyente
- **Fecha de la prueba de isquemia** — _fecha_
- **Fecha del último ecocardiograma** — _fecha_
- **Fracción de eyección (FEVI), si se conoce** (%) — _numero_
- **Cardiólogo de referencia** — _texto_

### Depresión o ansiedad

_Fuente: docs/documento_fuente.md §5.6_

- **Diagnóstico** — _texto_
- **¿Toma un IMAO o litio?** — _boolean_
  - Por qué: Los IMAO y el litio tienen reglas específicas de manejo perioperatorio.

### Dermatomiositis o polimiositis

_Fuente: docs/documento_fuente.md §5.8, §5.16.13_

- **¿Debilidad en el cuello o dificultad para tragar?** — _boolean_
  - Por qué: Aumenta el riesgo de aspiración durante la anestesia.
- **¿Falta de aire o fatiga inusual al caminar?** — _boolean_
  - Por qué: Puede indicar afectación de los músculos respiratorios o del pulmón.
- **¿Problemas de corazón conocidos?** — _boolean_
  - Por qué: Estas enfermedades pueden inflamar el corazón (miocarditis).
- **¿Ha tomado corticoides (cortisona) en los últimos 3 meses?** — _boolean_
  - Por qué: Una pauta prolongada de corticoides puede requerir una dosis de estrés perioperatoria (§5.3).
- **¿Cuál?** — _opcion_: Prednisona / Prednisolona / Metilprednisolona / Deflazacort / Dexametasona / Hidrocortisona
- **Dosis diaria** (mg) — _numero_
- **Duración** (semanas) — _numero_

### Demencia o deterioro cognitivo

_Fuente: docs/documento_fuente.md §5.6, §5.16.5_

- **Cuidador principal** — _texto_
- **Representante legal** — _texto_
- **¿Puede otorgar el consentimiento?** — _opcion_: Sí / No / Dudosa
  - Por qué: Si no puede consentir, el consentimiento lo firma su representante legal.
- **Nivel de dependencia** — _opcion_: Independiente / Dependencia parcial / Dependencia total
- **¿Episodios previos de agitación, delirio o desorientación nocturna?** — _boolean_
  - Por qué: Son un factor de riesgo importante de delirium después de la operación.

### Diabetes

_Fuente: docs/documento_fuente.md §5.3, §8.5_

- **Tipo de diabetes** — _opcion_: Tipo 1 / Tipo 2 / Otra / no lo sabe
- **Años de evolución** — _numero_
- **HbA1c más reciente** (%) — _numero_
  - Por qué: Una HbA1c > 8,5 % indica mal control y puede aconsejar optimizar antes de una cirugía programada.
- **Fecha de la HbA1c** — _fecha_
- **Tratamiento** — _opcion_: Solo dieta / Pastillas / Insulina / Pastillas e insulina
- **Frecuencia de hipoglucemias (bajadas de azúcar)** — _opcion_: Nunca / Alguna al mes / Alguna a la semana / A diario
  - Por qué: El ayuno y los ajustes de insulina aumentan el riesgo de hipoglucemia; conviene conocer su frecuencia.
- **¿Nota cuándo le baja el azúcar?** — _boolean_
  - Por qué: Las hipoglucemias inadvertidas son especialmente peligrosas en el ayuno perioperatorio.
- **Complicaciones crónicas** — _opcion_multiple_: Cardiopatía isquémica / Nefropatía / Pie diabético / Vasculopatía de extremidades / Retinopatía
- **¿Síntomas de gastroparesia (náuseas/vómitos de comida sin digerir, saciedad precoz, distensión, glucemias erráticas)?** — _boolean_
  - Por qué: La gastroparesia alarga el ayuno de sólidos y aconseja premedicación con metoclopramida.
- **¿Hipoglucemias frecuentes?** — _boolean_
- **¿Lleva bomba de insulina o sensor de glucosa?** — _opcion_: No / Bomba de insulina / Sensor / Bomba y sensor

### Distrofia o enfermedad neuromuscular

_Fuente: docs/documento_fuente.md §5.6, §5.16.11_

- **Tipo** — _opcion_: Distrofia de Duchenne / Distrofia de Becker / Distrofia miotónica / Miastenia gravis / Otra
- **¿Le cuesta respirar tumbado o usa ventilación nocturna (BiPAP)?** — _boolean_
  - Por qué: La debilidad de los músculos respiratorios aumenta el riesgo de insuficiencia respiratoria tras la anestesia.
- **Fecha del último ecocardiograma** — _fecha_
  - Por qué: Muchas distrofias afectan al corazón; sin ecocardiograma en los últimos 12 meses conviene valorarlo.
- **¿Fiebre muy alta o complicaciones graves en una anestesia, en usted o su familia?** — _boolean_
  - Por qué: Puede indicar susceptibilidad a hipertermia maligna o a reacciones musculares graves.

### Dolor crónico

_Fuente: docs/documento_fuente.md §5.7, §5.16.7_

- **Localización del dolor** — _texto_
- **Posturas en las que el dolor es insoportable o zonas sin sensibilidad** — _texto_
  - Por qué: Ayuda a colocar al paciente en el quirófano evitando posturas dolorosas o zonas con déficit.
- **¿Tiene un déficit neurológico previo?** — _boolean_
  - Por qué: Debe quedar documentado antes de la anestesia para poder compararlo después.
- **Descripción del déficit neurológico** — _texto_

### Enfermedad hepática / cirrosis

_Fuente: docs/documento_fuente.md §5.4_

- **Causa** — _opcion_: Alcohol / Viral (hepatitis B/C) / Metabólica (hígado graso) / Otra / no lo sabe
- **¿Tiene cirrosis?** — _boolean_
  - Por qué: La hepatopatía conocida hace que se añadan transaminasas y bilirrubina a la analítica.
- **¿Ascitis (líquido en el abdomen)?** — _boolean_
- **¿Varices esofágicas conocidas?** — _boolean_
- **¿Episodios de encefalopatía (confusión)?** — _boolean_
- **¿Plaquetas bajas conocidas?** — _boolean_

### Enfermedad inflamatoria intestinal

_Fuente: docs/documento_fuente.md §5b, §5.16.14, §8.8_

- **Tipo** — _opcion_: Enfermedad de Crohn / Colitis ulcerosa
- **Si toma inmunosupresores, ¿por qué motivo?** — _opcion_: Enfermedad autoinmune / Enfermedad sistémica grave
  - Por qué: La suspensión de los inmunosupresores clásicos depende de la indicación.
- **¿Ha tomado corticoides (cortisona) en los últimos 3 meses?** — _boolean_
  - Por qué: Una pauta prolongada de corticoides puede requerir una dosis de estrés perioperatoria (§5.3).
- **¿Cuál?** — _opcion_: Prednisona / Prednisolona / Metilprednisolona / Deflazacort / Dexametasona / Hidrocortisona
- **Dosis diaria** (mg) — _numero_
- **Duración** (semanas) — _numero_

### Enfermedad renal crónica

_Fuente: docs/documento_fuente.md §5.4, §6.7_

- **Estadio o filtrado conocido** — _opcion_: No lo sabe / Leve (filtrado > 60) / Moderada (filtrado 30-60) / Grave (filtrado 15-30) / Terminal (filtrado < 15)
- **Creatinina más reciente** (mg/dL) — _numero_
  - Por qué: La creatinina permite calcular el aclaramiento, del que dependen los plazos de varios anticoagulantes.
- **Fecha de esa creatinina** — _fecha_
- **¿Está en diálisis?** — _opcion_: No / Sí, hemodiálisis / Sí, diálisis peritoneal
- **Días de diálisis y brazo de la fístula** — _texto_
- **¿Tiene un trasplante renal?** — _boolean_
- **¿Tiene proteinuria o nefropatía conocida?** — _boolean_
  - Por qué: La proteinuria/nefropatía hace que los IECA/ARA-II se mantengan el día de la cirugía.

### Epilepsia

_Fuente: docs/documento_fuente.md §5.6, §5.16.9_

- **Fecha aproximada de la última crisis** — _fecha_
  - Por qué: Una crisis en el último mes indica epilepsia no bien controlada.
- **Frecuencia de las crisis** — _opcion_: Diaria / Semanal / Mensual / Anual / Menos de una al año
- **Tipo de crisis** — _opcion_: Generalizada tónico-clónica / Focal con pérdida de conciencia / Focal sin pérdida de conciencia / Ausencias / Desconocido
- **¿Tiene aura o pródromos antes de la crisis?** — _boolean_
- **Desencadenantes** — _opcion_multiple_: Falta de sueño / Estrés / Fiebre / Luces parpadeantes / Alcohol / Olvido de la medicación / Otros
- **¿Ha tenido un estatus epiléptico (crisis muy prolongada)?** — _boolean_
  - Por qué: Un estatus previo o crisis recientes indican epilepsia no controlada: no debe omitirse la medicación.

### Esclerosis múltiple

_Fuente: docs/documento_fuente.md §5.6, §5.16.12_

- **Fecha del último brote** — _fecha_
  - Por qué: Un brote en los últimos 3 meses es una señal de alerta.
- **Síntomas del último brote** — _texto_
- **Movilidad habitual** — _opcion_: Camina sin ayuda / Camina con ayuda / Silla de ruedas / Encamado
  - Por qué: La movilidad y la debilidad basales deben quedar documentadas para comparar tras la anestesia.
- **Debilidad basal (descripción)** — _texto_
- **¿Empeora con el calor (fenómeno de Uhthoff)?** — _boolean_
  - Por qué: Si empeora con el calor, conviene mantener una normotermia estricta durante la cirugía.
- **¿Ha tomado corticoides (cortisona) en los últimos 3 meses?** — _boolean_
  - Por qué: Una pauta prolongada de corticoides puede requerir una dosis de estrés perioperatoria (§5.3).
- **¿Cuál?** — _opcion_: Prednisona / Prednisolona / Metilprednisolona / Deflazacort / Dexametasona / Hidrocortisona
- **Dosis diaria** (mg) — _numero_
- **Duración** (semanas) — _numero_

### Fibrilación auricular / arritmia

_Fuente: docs/documento_fuente.md §5.1, §6.5_

- **Tipo de arritmia** — _opcion_: Fibrilación auricular paroxística / Fibrilación auricular persistente / Fibrilación auricular permanente / Flutter auricular / Otra arritmia
- **¿Ha tenido un ictus, un AIT o una embolia?** — _boolean_
  - Por qué: Un ictus/AIT reciente (menos de 3 meses) con FA es criterio de alto riesgo y puede requerir terapia puente.
- **Fecha del ictus/AIT/embolia** — _fecha_

### Tiroides

_Fuente: docs/documento_fuente.md §5.3_

- **Tipo de problema tiroideo** — _opcion_: Hipotiroidismo / Hipertiroidismo
- **¿Tiene bocio grande o le han operado del tiroides?** — _boolean_
  - Por qué: El bocio grande o la cirugía tiroidea previa pueden dificultar la vía aérea (señal de alerta).
- **Fecha del último control** — _fecha_

### Hipertensión arterial

_Fuente: docs/documento_fuente.md §5.1, §5.16.1_

- **Años de evolución** — _numero_
- **Cifras habituales en casa (p. ej. 130/80)** — _texto_
- **¿Está bien controlada?** — _opcion_: Bien controlada / Mal controlada / No lo sabe
- **Síntomas de mal control** — _opcion_multiple_: Cefalea frecuente / Acúfenos (pitidos en los oídos) / Visión borrosa
  - Por qué: Cefalea, acúfenos o visión borrosa pueden indicar que la tensión no está bien controlada.

### Ictus/AIT y trombosis venosa (TVP/TEP)

_Fuente: docs/documento_fuente.md §5.1_

- **¿Ha tenido un ictus o un AIT?** — _boolean_
- **Fecha del ictus/AIT** — _fecha_
  - Por qué: Menos de 3 meses desde el ictus/AIT es una señal de alerta.
- **Secuelas** — _texto_
- **¿Ha tenido una trombosis venosa (TVP) o una embolia de pulmón (TEP)?** — _boolean_
- **Fecha de la TVP/TEP** — _fecha_
  - Por qué: Una TVP/TEP de menos de 3 meses es criterio de alto riesgo trombótico (posible terapia puente).

### Infección respiratoria reciente

_Fuente: docs/documento_fuente.md §5.2, §5.12, §5.16.8_

- **Síntomas actuales** — _opcion_multiple_: Fiebre / Dolor de garganta / Malestar general / Mucosidad abundante / Tos productiva
  - Por qué: Una infección respiratoria activa aumenta el riesgo de complicaciones y puede aconsejar posponer la cirugía programada.
- **Días de evolución** — _numero_

### Insuficiencia cardiaca

_Fuente: docs/documento_fuente.md §5.1_

- **Clase funcional (NYHA)** — _opcion_: I — sin síntomas con la actividad normal / II — síntomas con esfuerzos moderados / III — síntomas con pequeños esfuerzos / IV — síntomas en reposo
  - Por qué: La clase NYHA describe cuánto le limita el corazón y sube la clase de riesgo del paciente.
- **Fracción de eyección (FEVI), si se conoce** (%) — _numero_
  - Por qué: Una FEVI reducida (≤ 40 %) hace que los IECA/ARA-II se mantengan el día de la cirugía.
- **¿Le han dicho que tiene el corazón «débil» o con la función disminuida (disfunción sistólica)?** — _boolean_
- **Fecha del último ingreso por insuficiencia cardiaca** — _fecha_
- **¿Necesita dormir incorporado o con varias almohadas (ortopnea)?** — _boolean_
- **¿Tiene hinchazón de piernas (edemas)?** — _boolean_
- **Fecha del último ecocardiograma** — _fecha_

### Lupus u otra conectivopatía

_Fuente: docs/documento_fuente.md §5.8, §5.16.13_

- **Órganos afectados** — _opcion_multiple_: Riñón / Corazón / Pulmón / Sistema nervioso / Hematológico / Piel y articulaciones
  - Por qué: La afectación de riñón, corazón o pulmón cambia las pruebas y el riesgo.
- **¿Trombosis previa o síndrome antifosfolípido?** — _boolean_
  - Por qué: El síndrome antifosfolípido es criterio de alto riesgo trombótico; márquelo también en el módulo de trombofilia.
- **¿Anemia o plaquetas bajas recientes?** — _boolean_
  - Por qué: Motiva hemograma y coagulación aunque la tabla no los pida.
- **¿Ha tomado corticoides (cortisona) en los últimos 3 meses?** — _boolean_
  - Por qué: Una pauta prolongada de corticoides puede requerir una dosis de estrés perioperatoria (§5.3).
- **¿Cuál?** — _opcion_: Prednisona / Prednisolona / Metilprednisolona / Deflazacort / Dexametasona / Hidrocortisona
- **Dosis diaria** (mg) — _numero_
- **Duración** (semanas) — _numero_

### Marcapasos o DAI

_Fuente: docs/documento_fuente.md §5.1_

- **Tipo de dispositivo** — _opcion_: Marcapasos / Desfibrilador (DAI) / Resincronizador (TRC)
- **Motivo de la implantación** — _texto_
- **¿Es dependiente del marcapasos (si se conoce)?** — _opcion_: Sí / No / No lo sabe
- **Fecha de la última revisión del dispositivo** — _fecha_
  - Por qué: El dispositivo debe revisarse antes de la cirugía; conviene saber cuándo fue la última revisión.
- **Hospital donde le siguen el dispositivo** — _texto_

### Obesidad

_Fuente: docs/documento_fuente.md §5.3_

- **Observaciones (el IMC se calcula con el peso y la talla del paso 2)** — _texto_
  - Por qué: El grado de obesidad se obtiene del IMC; un IMC ≥ 40 es una alerta y sube la clase de riesgo.

### Parkinson

_Fuente: docs/documento_fuente.md §5.6, §5.16.10_

- **Horario de la levodopa (no debe omitirse)** — _texto_
  - Por qué: La levodopa no se suspende; conviene conocer su horario para no interrumpirla.
- **¿Dificultad para tragar o mal manejo de la saliva?** — _boolean_
  - Por qué: Aumenta el riesgo de aspiración durante la anestesia.
- **¿Mareo intenso al ponerse de pie?** — _boolean_
  - Por qué: Indica disfunción autonómica, con riesgo de bajadas graves de tensión durante la anestesia.

### Pediatría

_Fuente: docs/documento_fuente.md §5.12, §6.3, §6.4_

- **¿Nació prematuro (antes de las 37 semanas)?** — _boolean_
  - Por qué: En lactantes con edad posconcepcional < 60 semanas hay riesgo de apnea postoperatoria.
- **Semanas de gestación al nacer** (semanas) — _numero_
- **¿Ha tenido catarro, mocos o tos en las últimas 2 a 4 semanas?** — _boolean_
  - Por qué: Una infección respiratoria de vías altas reciente puede aconsejar revalorar el día de la intervención (§5.12).
- **Síntomas actuales** — _opcion_multiple_: Fiebre / Mocos espesos o amarillentos / Tos con mucosidad
- **¿Ronca más de la mitad de las noches?** — _boolean_
  - Por qué: Componente del STBUR, escala de riesgo respiratorio en niños (§6.3).
- **¿Ronca fuerte?** — _boolean_
  - Por qué: Componente del STBUR (§6.3).
- **¿Se le oye esforzarse para respirar mientras duerme?** — _boolean_
  - Por qué: Componente del STBUR (§6.3).
- **¿Le han visto dejar de respirar mientras duerme?** — _boolean_
  - Por qué: Componente del STBUR (§6.3).
- **¿Se levanta cansado o está somnoliento durante el día?** — _boolean_
  - Por qué: Componente del STBUR (§6.3).
- **¿Padres o hermanos con náuseas o vómitos importantes tras una anestesia?** — _boolean_
  - Por qué: El antecedente familiar de NVPO suma en la escala POVOC del niño (§6.4).
- **¿Tiene una cardiopatía congénita?** — _boolean_
  - Por qué: Requiere valoración específica; se registra para el anestesiólogo (§5.12).
- **Diagnóstico y si está corregida** — _texto_
- **¿Tiene algún síndrome (por ejemplo, síndrome de Down)?** — _boolean_
  - Por qué: Algunos síndromes se asocian a vía aérea difícil o inestabilidad cervical (§5.12).
- **¿Cuál?** — _texto_
- **¿Ha recibido alguna vacuna en la última semana?** — _boolean_
- **¿El niño o los padres están muy nerviosos o creen que necesitará premedicación?** — _boolean_
  - Por qué: Se registra para que el anestesiólogo valore la premedicación (§5.12).

### Reflujo gastroesofágico

_Fuente: docs/documento_fuente.md §5.9, §8.14_

- **¿Cómo es el reflujo?** — _opcion_: Leve u ocasional / Grave / frecuente
- **¿Está con síntomas estos días?** — _boolean_
  - Por qué: El reflujo grave sintomático el día de la cirugía es una alerta de estómago lleno.
- **¿Toma tratamiento para el reflujo?** — _boolean_

### Apnea del sueño (SAOS)

_Fuente: docs/documento_fuente.md §5.2, §6.3_

- **¿Tiene diagnóstico confirmado de apnea del sueño?** — _boolean_
  - Por qué: Con diagnóstico confirmado no hace falta calcular STOP-Bang; sin diagnóstico, se calcula.
- **¿Usa CPAP o BiPAP?** — _boolean_
- **¿La usa la mayoría de las noches?** — _boolean_
- **Presión de la CPAP (si la sabe)** — _texto_
- **¿Ronca fuerte (se oye a través de la puerta o molesta a quien duerme al lado)?** — _boolean_
  - Por qué: Es uno de los cuatro componentes principales del STOP-Bang (§6.3).
- **¿Se siente cansado o somnoliento durante el día?** — _boolean_
  - Por qué: Componente STOP-Bang: somnolencia diurna (§6.3).
- **¿Alguien le ha visto dejar de respirar mientras duerme?** — _boolean_
  - Por qué: Componente STOP-Bang: apneas observadas (§6.3).
- **Perímetro del cuello** (cm) — _numero_
  - Por qué: Un cuello > 40 cm suma en el STOP-Bang (§6.3).

### Trasplante de órgano

_Fuente: docs/documento_fuente.md §5.10, §5.16.15, §8.8_

- **Órgano trasplantado** — _opcion_: Riñón / Hígado / Corazón / Pulmón / Páncreas / Médula ósea / Otro
- **Fecha del trasplante** — _fecha_
  - Por qué: Un trasplante de menos de 6 meses implica inmunosupresión intensa.
- **Fecha de la última analítica del injerto** — _fecha_
- **Creatinina más reciente (si es trasplante renal)** (mg/dL) — _numero_
  - Por qué: En el trasplante renal, la creatinina permite calcular el aclaramiento.
- **Fecha de esa creatinina** — _fecha_
- **Episodios de rechazo** — _opcion_: Nunca / En el pasado / En los últimos 6 meses
- **Fecha de la última revisión con el equipo de trasplante** — _fecha_
- **¿Aporta informe del equipo de trasplante?** — _boolean_
- **¿Los niveles de los inmunosupresores están en rango?** — _opcion_: Sí / No / No lo sabe
  - Por qué: Niveles fuera de rango pueden requerir ajuste antes de la cirugía.
- **¿Fiebre, infección reciente o antibiótico/antifúngico actual?** — _boolean_
  - Por qué: Una infección activa en un paciente inmunodeprimido puede aconsejar posponer la cirugía programada.
- **Profilaxis antiinfecciosa (cotrimoxazol, antivirales…)** — _texto_
- **Según el órgano: fatiga o falta de aire (corazón/pulmón), tos (pulmón), medicamentos sin receta (riñón)** — _texto_
  - Por qué: El corazón trasplantado puede tener isquemia indolora; en el riñón hay que evitar AINE; en el pulmón hay riesgo de retención de secreciones.

### Trastorno de la coagulación / trombofilia

_Fuente: docs/documento_fuente.md §5.5_

- **Tipo de trastorno conocido** — _opcion_multiple_: Hemofilia / Enfermedad de von Willebrand / Plaquetas bajas / Otro
- **Trombofilia (si la hay)** — _opcion_: No / Factor V Leiden heterocigoto / Factor V Leiden homocigoto / Protrombina G20210A heterocigota / Protrombina G20210A homocigota / Déficit de antitrombina / Déficit de proteína C o S con trombosis previas / Síndrome antifosfolípido
  - Por qué: Algunas trombofilias graves son criterio de alto riesgo trombótico (posible terapia puente).

### Valvulopatía / prótesis valvular

_Fuente: docs/documento_fuente.md §5.1_

- **¿Qué válvula está afectada?** — _opcion_: Aórtica / Mitral / Tricúspide / Pulmonar / Varias
- **Gravedad** — _opcion_: Leve / Moderada / Grave / No lo sabe
- **¿Lleva prótesis (válvula artificial)?** — _opcion_: No / Sí, mecánica / Sí, biológica
  - Por qué: Una prótesis mecánica obliga a coordinar la anticoagulación y puede requerir terapia puente.
- **Posición de la prótesis** — _opcion_: Aórtica / Mitral / Tricúspide
- **Fecha del último ecocardiograma** — _fecha_
  - Por qué: Si no hay ecocardiograma en los últimos 12 meses o hay síntomas nuevos, se solicita uno.
- **¿Síntomas nuevos (más disnea, síncope o angina)?** — _boolean_

---

_Documento generado el 2026-09-30 a partir de los datos del repositorio._
