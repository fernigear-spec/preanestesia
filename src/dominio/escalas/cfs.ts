/**
 * Clinical Frailty Scale (CFS) — docs/documento_fuente.md §6.10.
 * 1 a 9. >= 5: fragilidad (alerta).
 */
import type { ResultadoEscala } from '../tipos.ts';

export const CFS_UMBRAL_FRAGILIDAD = 5;

export interface ResultadoCfs extends ResultadoEscala {
  fragilidad: boolean;
}

export function evaluarCfs(nivel: number): ResultadoCfs {
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 9) {
    throw new RangeError(`CFS fuera de rango (1-9): ${nivel}`);
  }
  const fragilidad = nivel >= CFS_UMBRAL_FRAGILIDAD;
  return {
    puntuacion: nivel,
    fragilidad,
    categoria: fragilidad ? 'fragilidad' : 'sin fragilidad',
    componentes: [`CFS ${nivel}`],
  };
}
