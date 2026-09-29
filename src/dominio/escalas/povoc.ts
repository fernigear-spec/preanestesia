/**
 * POVOC / Eberhart (niños, NVPO) — docs/documento_fuente.md §6.4.
 * cirugía >= 30 min, edad >= 3 años, cirugía de estrabismo, NVPO previas del
 * niño o de familiares de primer grado.
 * Probabilidades: 0=9 %, 1=10 %, 2=30 %, 3=55 %, 4=70 %.
 */
import type { ResultadoEscala } from '../tipos.ts';

export interface EntradaPovoc {
  cirugiaMayor30min: boolean;
  edadMayorIgual3: boolean;
  cirugiaEstrabismo: boolean;
  nvpoNinioOFamiliares: boolean;
}

const PROBABILIDAD: Record<number, number> = { 0: 9, 1: 10, 2: 30, 3: 55, 4: 70 };

export interface ResultadoPovoc extends ResultadoEscala {
  probabilidad: number; // %
}

export function calcularPovoc(e: EntradaPovoc): ResultadoPovoc {
  const items: Array<[boolean, string]> = [
    [e.cirugiaMayor30min, 'cirugía ≥ 30 min'],
    [e.edadMayorIgual3, 'edad ≥ 3 años'],
    [e.cirugiaEstrabismo, 'cirugía de estrabismo'],
    [e.nvpoNinioOFamiliares, 'NVPO del niño o de familiares de 1.er grado'],
  ];
  const comp = items.filter(([v]) => v).map(([, t]) => t);
  const p = comp.length;

  return {
    puntuacion: p,
    categoria: `${PROBABILIDAD[p]} %`,
    probabilidad: PROBABILIDAD[p] ?? 0,
    componentes: comp,
  };
}
