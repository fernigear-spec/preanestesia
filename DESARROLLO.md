# Notas de desarrollo — tramo «motor de dominio»

> Este documento describe el estado del código en la rama `desarrollo`. La
> especificación vive en `.kiro/specs/preanestesia/` y el documento clínico
> fuente en `docs/documento_fuente.md`.

## Alcance de este tramo

Motor de dominio (TypeScript puro, sin interfaz) + datos iniciales + pruebas:

- **Escalas** (`src/dominio/escalas/`): ASA, EGRI, Langeron, STOP-Bang, STBUR,
  Apfel, POVOC, CHA2DS2-VA, DASI/METs, Cockcroft-Gault, morfina equivalente,
  AUDIT-C, CFS, 4AT.
- **Reglas de medicación** (`src/dominio/reglas/`): motor (contexto, técnica
  efectiva, más restrictiva), ACOD, antiagregantes (AAS, P2Y12, stent,
  oftalmología), antivitamina K (con terapia puente), litio, AINE,
  cardiovasculares (IECA/ARA-II, diuréticos), antidiabéticos (metformina,
  SGLT2, GLP-1 semanal/diario, bomba de insulina), genéricas y plazo no
  alcanzable.
- **Datos** (`datos/`): `config.json`, `reglas_farmacos.json`, `opioides.json`,
  `farmacos.csv`, `procedimientos.csv`.
- **Carga/validación** (`src/datos/`): parser CSV y validador (caso 21 §15).

No incluye: interfaz (React), service worker, QR, generador SAP, hoja del
paciente, asistente de coherencia, tabla de pruebas, ayuno, mtND4 ni el flujo de
entrevista. Se abordarán en tramos posteriores.

## Cómo ejecutar las pruebas (sin acceso a npm)

El proxy de npm está bloqueado en el sandbox actual, así que **no se pueden
instalar dependencias** (React, Vite, Vitest). Como solución temporal, las
pruebas se ejecutan con el runner nativo de Node 22 y TypeScript por
type-stripping:

```bash
# Suite de pruebas unitarias
node --experimental-strip-types --test "tests/unit/**/*.test.ts"

# Informe de casos §15 (obtenido vs esperado)
node --experimental-strip-types tests/casos15.report.ts

# Typecheck del dominio (tsc global)
tsc --noEmit --strict --module esnext --moduleResolution bundler \
  --allowImportingTsExtensions --target ES2022 --lib ES2022 $(find src -name '*.ts')
```

## Migración a Vitest / Vite (cuando haya npm)

- `package.json` ya declara Vite, React, Vitest y Playwright en `devDependencies`.
- Los tests usan `describe`/`it`/`expect(...)` importados de `tests/_harness.ts`.
  Para migrar a Vitest, basta con cambiar ese import por `from 'vitest'` (o
  configurar un alias) y borrar el harness. Las aserciones ya usan el estilo
  `toBe/toEqual/...` de Vitest.
- Marcadas con `PENDIENTE:` en el código las decisiones atadas al bloqueo de npm:
  - `tsconfig.json`: falta `@types/node`.
  - `src/datos/validador.ts`: validación mínima en TS puro en lugar de `zod`.
  - `vite.config.ts` e `index.html`: plugins de React/PWA por habilitar.
