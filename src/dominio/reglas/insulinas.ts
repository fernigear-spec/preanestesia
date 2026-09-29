/**
 * Insulinas — docs/documento_fuente.md §8.5.
 * - Basal (glargina, detemir, degludec): 80 % de la dosis habitual (reducción del
 *   20 %, guía CPOC), redondeando a la unidad inferior, en las tomas que caen la
 *   noche previa o la mañana de la intervención. Las tomas de días anteriores se
 *   ponen completas.
 * - NPH: dosis completa la noche previa y 50 % la mañana de la intervención.
 * - Premezcladas: 50 % de la dosis de la mañana de la intervención.
 * - Rápida/ultrarrápida: suspender la del desayuno; solo pauta correctora según
 *   glucemia capilar.
 *
 * El "momento" se decide con las horas de toma registradas y la fecha/hora de la
 * intervención: noche previa = tomas del día anterior a partir de las 18:00;
 * mañana de la intervención = tomas del propio día antes de la inducción.
 */
import type { ResultadoFarmaco } from '../tipos.ts';
import { fechaLarga } from '../fechas/ultimaToma.ts';

const FUENTE = 'docs/documento_fuente.md §8.5';
export const PCT_BASAL = 80; // reducción del 20 % (CPOC)

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

export interface TomaBasal {
  /** Hora "HH:MM". */
  hora: string;
  /** Dosis habitual en UI a esa hora. */
  dosisUi: number;
}

export interface EntradaInsulinaBasal {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Tomas habituales (hora + dosis). Una sola en pauta diaria, dos si mañana y noche. */
  tomas: TomaBasal[];
  /** Fecha/hora de la intervención (para decidir qué tomas se reducen). */
  intervencion: Date;
}

/** Clasifica una toma por su hora habitual: >=18:00 → noche previa; si no, mañana de la intervención. */
function momentoDeToma(hora: string): 'noche_previa' | 'manana_intervencion' {
  const [h] = hora.split(':').map((x) => parseInt(x, 10));
  return (h ?? 0) >= 18 ? 'noche_previa' : 'manana_intervencion';
}

export function reglaInsulinaBasal(e: EntradaInsulinaBasal): ResultadoInsulina {
  const ajustes: AjusteInsulina[] = [];
  const frases: string[] = [];
  for (const t of e.tomas) {
    const momento = momentoDeToma(t.hora);
    const reducida = dosisAjustada(t.dosisUi, PCT_BASAL);
    if (momento === 'noche_previa') {
      ajustes.push({ momento: 'noche_previa', dosisUi: reducida, descripcion: `${reducida} UI (80 % de ${t.dosisUi}) la noche previa` });
      frases.push(`la noche previa, ${reducida} UI (en vez de ${t.dosisUi})`);
    } else {
      ajustes.push({ momento: 'manana_intervencion', dosisUi: reducida, descripcion: `${reducida} UI (80 % de ${t.dosisUi}) la mañana de la intervención` });
      const dia = new Date(e.intervencion);
      frases.push(`la mañana de la intervención (${fechaLarga(dia)}), ${reducida} UI (en vez de ${t.dosisUi})`);
    }
  }
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'ajustar',
    textoPaciente: `Reduzca su insulina basal al 80 %: ${frases.join('; ')}. Los días anteriores, la dosis de siempre.`,
    reglaAplicada: 'Insulina basal: 80 % (reducción del 20 %, CPOC) en la noche previa y la mañana de la intervención',
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
