/**
 * Predictores de ventilación difícil con mascarilla (Langeron) —
 * docs/documento_fuente.md §6.2 (R6.2.3). >= 2 predictores: riesgo.
 */
import type { ResultadoEscala } from '../tipos.ts';

export interface EntradaLangeron {
  barba: boolean;
  imc: number;
  edentulo: boolean;
  edadAnios: number;
  ronquido: boolean;
}

export const LANGERON_UMBRAL_RIESGO = 2;

export function calcularLangeron(e: EntradaLangeron): ResultadoEscala {
  const comp: string[] = [];
  if (e.barba) comp.push('barba');
  if (e.imc > 26) comp.push('IMC > 26');
  if (e.edentulo) comp.push('edéntulo');
  if (e.edadAnios > 55) comp.push('edad > 55 años');
  if (e.ronquido) comp.push('ronquido');

  const p = comp.length;
  return {
    puntuacion: p,
    categoria: p >= LANGERON_UMBRAL_RIESGO ? 'riesgo' : 'sin riesgo aumentado',
    componentes: comp,
  };
}
