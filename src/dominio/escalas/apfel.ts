/**
 * Apfel (adultos, NVPO) — docs/documento_fuente.md §6.4.
 * mujer, no fumador, NVPO/cinetosis previas, opioides postoperatorios previstos.
 * Si no se sabe si habrá opioides, se consideran previstos en cirugía de riesgo
 * intermedio o alto.
 * Probabilidades: 0=10 %, 1=20 %, 2=40 %, 3=60 %, 4=80 %.
 */
import type { ResultadoEscala, RiesgoCardiovascular } from '../tipos.ts';

export interface EntradaApfel {
  mujer: boolean;
  noFumador: boolean;
  nvpoOCinetosisPrevias: boolean;
  /** true/false conocido, o undefined si no se sabe. */
  opioidesPostoperatorios?: boolean;
  riesgoQuirurgico: RiesgoCardiovascular;
}

const PROBABILIDAD: Record<number, number> = { 0: 10, 1: 20, 2: 40, 3: 60, 4: 80 };

export interface ResultadoApfel extends ResultadoEscala {
  probabilidad: number; // %
}

export function calcularApfel(e: EntradaApfel): ResultadoApfel {
  const opioides =
    e.opioidesPostoperatorios ??
    (e.riesgoQuirurgico === 'intermedio' || e.riesgoQuirurgico === 'alto');

  const items: Array<[boolean, string]> = [
    [e.mujer, 'mujer'],
    [e.noFumador, 'no fumador'],
    [e.nvpoOCinetosisPrevias, 'NVPO o cinetosis previas'],
    [opioides, 'opioides postoperatorios previstos'],
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
