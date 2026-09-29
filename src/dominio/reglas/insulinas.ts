/**
 * Insulinas — docs/documento_fuente.md §8.5.
 * - Basal (glargina, detemir, degludec): 70-80 % de la dosis habitual la noche
 *   previa y la mañana de la intervención, redondeando a la unidad inferior.
 * - NPH: dosis completa la noche previa y 50 % la mañana de la intervención.
 * - Premezcladas: 50 % de la dosis de la mañana de la intervención.
 * - Rápida/ultrarrápida: suspender la del desayuno; solo pauta correctora según
 *   glucemia capilar.
 *
 * Se calcula la dosis ajustada (unidad inferior) por momento: noche previa y/o
 * mañana de la intervención. No usa plazos horarios; el "momento" es fijo.
 */
import type { ResultadoFarmaco } from '../tipos.ts';

const FUENTE = 'docs/documento_fuente.md §8.5';

export interface AjusteInsulina {
  momento: 'noche_previa' | 'manana_intervencion';
  /** Dosis en UI (undefined si es "pauta correctora"). */
  dosisUi?: number;
  /** true si en ese momento no se administra (salvo correctora). */
  suspender?: boolean;
  descripcion: string;
}

export interface ResultadoInsulina extends ResultadoFarmaco {
  ajustes: AjusteInsulina[];
}

/** Redondeo a la unidad inferior del porcentaje indicado. */
export function dosisAjustada(dosisHabitual: number, pct: number): number {
  return Math.floor((dosisHabitual * pct) / 100);
}

// ————————————— Basal (70-80 %) —————————————

export interface EntradaInsulinaBasal {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Dosis habitual de la noche (UI). */
  dosisNocheUi: number;
  /** Dosis habitual de la mañana (UI), si la pone por la mañana. */
  dosisMananaUi?: number;
  /** Porcentaje a aplicar (70-80). Por defecto 75. */
  pct?: number;
}

export function reglaInsulinaBasal(e: EntradaInsulinaBasal): ResultadoInsulina {
  const pct = e.pct ?? 75;
  const ajustes: AjusteInsulina[] = [];
  const noche = dosisAjustada(e.dosisNocheUi, pct);
  ajustes.push({ momento: 'noche_previa', dosisUi: noche, descripcion: `${noche} UI (${pct} % de ${e.dosisNocheUi})` });
  if (e.dosisMananaUi !== undefined) {
    const manana = dosisAjustada(e.dosisMananaUi, pct);
    ajustes.push({ momento: 'manana_intervencion', dosisUi: manana, descripcion: `${manana} UI (${pct} % de ${e.dosisMananaUi})` });
  }
  const textoManana = e.dosisMananaUi !== undefined
    ? ` y ${dosisAjustada(e.dosisMananaUi, pct)} UI la mañana de la intervención`
    : '';
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'ajustar',
    textoPaciente: `Póngase ${noche} UI la noche previa${textoManana} (${pct} % de su dosis habitual).`,
    reglaAplicada: `Insulina basal: ${pct} % la noche previa y la mañana (redondeo a la unidad inferior)`,
    fuente: FUENTE,
    requiereConfirmacion: false,
    ajustes,
  };
}

// ————————————— NPH —————————————

export interface EntradaInsulinaNph {
  idFarmaco: string;
  nombreComercial: string;
  dosisNocheUi: number;
  dosisMananaUi: number;
}

export function reglaInsulinaNph(e: EntradaInsulinaNph): ResultadoInsulina {
  const manana = dosisAjustada(e.dosisMananaUi, 50);
  const ajustes: AjusteInsulina[] = [
    { momento: 'noche_previa', dosisUi: e.dosisNocheUi, descripcion: `${e.dosisNocheUi} UI (dosis completa)` },
    { momento: 'manana_intervencion', dosisUi: manana, descripcion: `${manana} UI (50 %)` },
  ];
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['insulina_nph'],
    accion: 'ajustar',
    textoPaciente: `Póngase su dosis completa (${e.dosisNocheUi} UI) la noche previa y ${manana} UI (la mitad) la mañana de la intervención.`,
    reglaAplicada: 'Insulina NPH: dosis completa la noche previa y 50 % la mañana',
    fuente: FUENTE,
    requiereConfirmacion: false,
    ajustes,
  };
}

// ————————————— Premezcladas (50 % mañana) —————————————

export interface EntradaInsulinaPremezclada {
  idFarmaco: string;
  nombreComercial: string;
  dosisMananaUi: number;
}

export function reglaInsulinaPremezclada(e: EntradaInsulinaPremezclada): ResultadoInsulina {
  const manana = dosisAjustada(e.dosisMananaUi, 50);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['insulina_premezclada'],
    accion: 'ajustar',
    textoPaciente: `Póngase ${manana} UI (la mitad de su dosis habitual) la mañana de la intervención.`,
    reglaAplicada: 'Insulina premezclada: 50 % de la dosis de la mañana de la intervención',
    fuente: FUENTE,
    requiereConfirmacion: false,
    ajustes: [{ momento: 'manana_intervencion', dosisUi: manana, descripcion: `${manana} UI (50 %)` }],
  };
}

// ————————————— Rápida / ultrarrápida —————————————

export interface EntradaInsulinaRapida {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

export function reglaInsulinaRapida(e: EntradaInsulinaRapida): ResultadoInsulina {
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'ajustar',
    textoPaciente: 'No se ponga la dosis del desayuno el día de la intervención. Solo pauta correctora según la glucemia capilar, siguiendo las indicaciones del hospital.',
    reglaAplicada: 'Insulina rápida/ultrarrápida: suspender la del desayuno; solo pauta correctora',
    fuente: FUENTE,
    requiereConfirmacion: false,
    ajustes: [{ momento: 'manana_intervencion', suspender: true, descripcion: 'suspender desayuno; pauta correctora' }],
  };
}
