/**
 * Aclaramiento de creatinina (Cockcroft-Gault) — docs/documento_fuente.md §6.7.
 * ((140 − edad) × peso) / (72 × creatinina en mg/dL), × 0,85 en mujeres.
 * Acepta µmol/L con conversión (÷ 88,42 → mg/dL).
 * Sin dato: null (las reglas dependientes lo tratan como "requiere confirmación").
 */
import type { Sexo } from '../tipos.ts';

export const UMOL_L_A_MG_DL = 88.42;

export interface EntradaCockcroft {
  edadAnios: number;
  pesoKg: number;
  sexo: Sexo;
  creatinina: number;
  unidad: 'mg_dl' | 'umol_l';
}

/** Devuelve mL/min redondeado a 1 decimal, o null si falta la creatinina. */
export function calcularAclaramiento(e: EntradaCockcroft | null): number | null {
  if (e === null || e.creatinina <= 0) return null;
  const crMgDl = e.unidad === 'umol_l' ? e.creatinina / UMOL_L_A_MG_DL : e.creatinina;
  let cl = ((140 - e.edadAnios) * e.pesoKg) / (72 * crMgDl);
  if (e.sexo === 'mujer') cl *= 0.85;
  return Number(cl.toFixed(1));
}
