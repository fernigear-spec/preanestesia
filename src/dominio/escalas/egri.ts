/**
 * Índice de El-Ganzouri (EGRI) — docs/documento_fuente.md §6.2 (R6.2.2).
 * Predice laringoscopia difícil. EGRI >= 4: riesgo elevado.
 *
 * En modalidad telefónica se calcula un EGRI parcial con los componentes de
 * anamnesis disponibles (R6.2.5); esta función acepta componentes indefinidos
 * y suma solo los presentes.
 */
import type { ResultadoEscala } from '../tipos.ts';

export type AperturaBucal = 'ge_4' | 'lt_4';
export type DistanciaTiromentoniana = 'gt_6_5' | '6_a_6_5' | 'lt_6';
export type Mallampati = 1 | 2 | 3 | 4;
export type MovilidadCervical = 'gt_90' | '80_a_90' | 'lt_80';
export type IntubacionDificilPrevia = 'no' | 'dudoso' | 'confirmado';

export interface EntradaEgri {
  aperturaBucal?: AperturaBucal;
  distanciaTiromentoniana?: DistanciaTiromentoniana;
  mallampati?: Mallampati;
  movilidadCervical?: MovilidadCervical;
  /** false = no puede protruir la mandíbula. */
  puedeProtruir?: boolean;
  pesoKg?: number;
  intubacionDificilPrevia?: IntubacionDificilPrevia;
}

export const EGRI_UMBRAL_RIESGO = 4;

export function calcularEgri(e: EntradaEgri): ResultadoEscala {
  const comp: string[] = [];
  let p = 0;

  if (e.aperturaBucal === 'lt_4') {
    p += 1;
    comp.push('apertura bucal < 4 cm (+1)');
  }

  if (e.distanciaTiromentoniana === '6_a_6_5') {
    p += 1;
    comp.push('DTM 6-6,5 cm (+1)');
  } else if (e.distanciaTiromentoniana === 'lt_6') {
    p += 2;
    comp.push('DTM < 6 cm (+2)');
  }

  if (e.mallampati === 2) {
    p += 1;
    comp.push('Mallampati II (+1)');
  } else if (e.mallampati === 3 || e.mallampati === 4) {
    p += 2;
    comp.push(`Mallampati ${e.mallampati === 3 ? 'III' : 'IV'} (+2)`);
  }

  if (e.movilidadCervical === '80_a_90') {
    p += 1;
    comp.push('movilidad cervical 80-90° (+1)');
  } else if (e.movilidadCervical === 'lt_80') {
    p += 2;
    comp.push('movilidad cervical < 80° (+2)');
  }

  if (e.puedeProtruir === false) {
    p += 1;
    comp.push('no puede protruir la mandíbula (+1)');
  }

  if (typeof e.pesoKg === 'number') {
    if (e.pesoKg > 110) {
      p += 2;
      comp.push('peso > 110 kg (+2)');
    } else if (e.pesoKg >= 90) {
      p += 1;
      comp.push('peso 90-110 kg (+1)');
    }
  }

  if (e.intubacionDificilPrevia === 'dudoso') {
    p += 1;
    comp.push('intubación difícil previa dudosa (+1)');
  } else if (e.intubacionDificilPrevia === 'confirmado') {
    p += 2;
    comp.push('intubación difícil previa confirmada (+2)');
  }

  return {
    puntuacion: p,
    categoria: p >= EGRI_UMBRAL_RIESGO ? 'riesgo elevado' : 'riesgo no elevado',
    componentes: comp,
  };
}
