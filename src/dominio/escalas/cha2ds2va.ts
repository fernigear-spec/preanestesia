/**
 * CHA2DS2-VA (fibrilación auricular o flúter; ESC 2024) —
 * docs/documento_fuente.md §6.5.
 * IC 1, HTA 1, edad >= 75 = 2, DM 1, ictus/AIT/tromboembolismo 2,
 * enfermedad vascular 1, edad 65-74 = 1. Máximo 8. Informativo.
 * NOTA: no se calcula CHA2DS2-VASc (no incluye sexo).
 */
import type { ResultadoEscala } from '../tipos.ts';

export interface EntradaCha2ds2va {
  insuficienciaCardiaca: boolean;
  hta: boolean;
  edadAnios: number;
  diabetes: boolean;
  ictusAitTromboembolismo: boolean;
  enfermedadVascular: boolean; // infarto, arteriopatía periférica, placa aórtica
}

export function calcularCha2ds2va(e: EntradaCha2ds2va): ResultadoEscala {
  const comp: string[] = [];
  let p = 0;

  if (e.insuficienciaCardiaca) {
    p += 1;
    comp.push('insuficiencia cardiaca (+1)');
  }
  if (e.hta) {
    p += 1;
    comp.push('HTA (+1)');
  }
  if (e.edadAnios >= 75) {
    p += 2;
    comp.push('edad ≥ 75 (+2)');
  } else if (e.edadAnios >= 65) {
    p += 1;
    comp.push('edad 65-74 (+1)');
  }
  if (e.diabetes) {
    p += 1;
    comp.push('diabetes (+1)');
  }
  if (e.ictusAitTromboembolismo) {
    p += 2;
    comp.push('ictus/AIT/tromboembolismo (+2)');
  }
  if (e.enfermedadVascular) {
    p += 1;
    comp.push('enfermedad vascular (+1)');
  }

  return {
    puntuacion: p, // máximo 8
    categoria: 'informativo',
    componentes: comp,
  };
}
