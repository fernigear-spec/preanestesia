/**
 * Bloque III-A (§8.16): la VISTA DEL PACIENTE es un build independiente de la
 * aplicación de enfermería. Debe contener solo su hoja, el cambio de idioma, el
 * PDF, los anexos y el recálculo de fechas; y NO el motor de reglas, los catálogos
 * de fármacos, los módulos, el panel de administración ni la entrevista.
 *
 * Esta prueba recorre el grafo de imports de VALOR (los `import type` se borran al
 * compilar y no pesan en el paquete) a partir del punto de entrada del paciente
 * (`src/mainPaciente.tsx`) y comprueba que ese cierre nunca alcanza las rutas
 * prohibidas (motor de reglas, catálogos, módulos, admin, entrevista). Así se
 * garantiza, sin depender del empaquetado, que el paquete del paciente queda limpio.
 *
 * (La prueba E2E `vistaPrevia.spec.ts` comprueba, de forma complementaria, que la
 * hoja se abre en la ruta «/paciente/» a partir del QR.)
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../../..');
const SRC = resolve(RAIZ, 'src');

/** Punto de entrada de la vista del paciente. */
const ENTRADA = resolve(SRC, 'mainPaciente.tsx');

/**
 * Rutas (bajo src/) cuyo código NO debe acabar en el paquete del paciente.
 * Se comparan como prefijos del camino relativo a src/, con «/» normalizado.
 */
const PROHIBIDAS = [
  'dominio/reglas/', // motor de reglas de medicación
  'dominio/coherencia/', // comprobaciones del motor
  'datos/farmacos', // catálogo de fármacos
  'datos/modulos', // catálogo de módulos
  'datos/procedimientos', // catálogo de procedimientos
  'ui/admin/', // panel de administración
  'ui/pasos/', // la entrevista (pasos)
  'ui/entrenamiento/', // modo entrenamiento
  'ui/App', // orquestador de la app de enfermería
];

/** Resuelve un import relativo a la ruta real del fichero fuente. */
function resolverImport(desde: string, especificador: string): string | null {
  if (!especificador.startsWith('.')) return null; // paquetes externos (react, qrcode…): no se recorren
  let ruta = resolve(dirname(desde), especificador);
  // Los imports del proyecto llevan la extensión explícita (.ts/.tsx/.json),
  // pero aceptamos también resolución por si acaso.
  const candidatos = [ruta, `${ruta}.ts`, `${ruta}.tsx`, `${ruta}.json`, resolve(ruta, 'index.ts'), resolve(ruta, 'index.tsx')];
  for (const c of candidatos) {
    if (existsSync(c) && !c.endsWith('/')) {
      try {
        // Descarta directorios: readFileSync sobre un dir lanza.
        readFileSync(c);
        return c;
      } catch {
        /* seguir */
      }
    }
  }
  return ruta;
}

/**
 * Extrae los especificadores de los imports de VALOR de un fichero.
 * Ignora `import type …` y los miembros marcados individualmente con `type`.
 */
function importsDeValor(codigo: string): string[] {
  const out: string[] = [];
  // import … from '…'  /  export … from '…'  /  import('…')
  const re = /(?:^|\n)\s*(import|export)\b([^;]*?)\bfrom\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(codigo)) !== null) {
    const clausula = m[2] ?? '';
    const espec = m[3] ?? '';
    // `import type { … }` / `export type { … }`: se borra al compilar → no pesa.
    if (/^\s*type\b/.test(clausula)) continue;
    out.push(espec);
  }
  // import('…') dinámico (de valor).
  const reDin = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reDin.exec(codigo)) !== null) out.push(m[1] ?? '');
  return out;
}

/** Camino relativo a src/ con separadores «/». */
function relSrc(ruta: string): string {
  return ruta.slice(SRC.length + 1).split('\\').join('/');
}

/** Cierre de imports de valor alcanzables desde la entrada del paciente. */
function alcanzablesDesdePaciente(): string[] {
  const vistos = new Set<string>();
  const pila = [ENTRADA];
  while (pila.length > 0) {
    const actual = pila.pop() as string;
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    let codigo: string;
    try {
      codigo = readFileSync(actual, 'utf8');
    } catch {
      continue;
    }
    for (const espec of importsDeValor(codigo)) {
      const destino = resolverImport(actual, espec);
      if (destino && destino.startsWith(SRC)) pila.push(destino);
    }
  }
  vistos.delete(ENTRADA);
  return [...vistos];
}

describe('Bloque III-A · aislamiento del paquete del paciente (§8.16)', () => {
  const alcanzables = alcanzablesDesdePaciente();

  it('el punto de entrada del paciente existe y arrastra algún módulo', () => {
    expect(existsSync(ENTRADA)).toBeTrue();
    expect(alcanzables.length).toBeGreaterThan(0);
  });

  it('no alcanza el motor de reglas, los catálogos, los módulos, el admin ni la entrevista', () => {
    const relativos = alcanzables.map(relSrc);
    const infractores = relativos.filter((r) => PROHIBIDAS.some((p) => r.startsWith(p)));
    // Si falla, el mensaje enseña qué rutas prohibidas se colaron.
    expect(infractores).toEqual([]);
  });

  it('incluye lo que SÍ debe tener: la vista del paciente y el recálculo de fechas', () => {
    const relativos = alcanzables.map(relSrc);
    expect(relativos.some((r) => r.startsWith('ui/paciente/VistaPaciente'))).toBeTrue();
    expect(relativos.some((r) => r.startsWith('dominio/salidas/qr/hojaPaciente'))).toBeTrue();
    expect(relativos.some((r) => r.startsWith('dominio/fechas/'))).toBeTrue();
  });
});
