/**
 * Cardiovasculares — docs/documento_fuente.md §8.10 (v4).
 * - IECA/ARA-II: no tomar el día de la intervención (la toma de la noche anterior
 *   sí se hace), salvo IC con disfunción sistólica, infarto reciente o
 *   proteinuria/nefropatía (mantener). Si falta info, preguntar.
 * - Diuréticos: no tomar la dosis de la mañana de la intervención.
 * - Betabloqueantes, calcioantagonistas, nitratos, amiodarona, digoxina,
 *   estatinas: mantener.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { TEXTO_MANTENER } from './motor.ts';
import { fechaLarga, horaReloj } from '../fechas/ultimaToma.ts';

/** Última toma el día previo a la intervención, a la hora habitual más tardía de la pauta. */
function ultimaTomaDiaPrevio(ctx: ContextoReglas): Date {
  const d = new Date(ctx.fechaHoraIntervencion);
  d.setDate(d.getDate() - 1);
  const horas = [...(ctx.pautaFarmaco?.horas ?? ['09:00'])].sort();
  const [hh, mm] = (horas[horas.length - 1] ?? '09:00').split(':').map((x) => parseInt(x, 10));
  d.setHours(hh ?? 9, mm ?? 0, 0, 0);
  return d;
}

const FUENTE = 'docs/documento_fuente.md §8.10 (ESC 2022)';

export interface EntradaIecaAra2 {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Excepciones que obligan a mantener. undefined si no se conoce. */
  icDisfuncionSistolica?: boolean;
  infartoReciente?: boolean;
  proteinuriaONefropatia?: boolean;
}

export function reglaIecaAra2(e: EntradaIecaAra2, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
  };

  const mantiene =
    e.icDisfuncionSistolica === true ||
    e.infartoReciente === true ||
    e.proteinuriaONefropatia === true;

  // Si todas las excepciones se conocen y son false → suspender 24 h.
  const conocidas =
    e.icDisfuncionSistolica !== undefined &&
    e.infartoReciente !== undefined &&
    e.proteinuriaONefropatia !== undefined;

  if (mantiene) {
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'IECA/ARA-II: mantener (IC con disfunción sistólica, infarto reciente o proteinuria/nefropatía)',
      requiereConfirmacion: false,
    };
  }

  if (!conocidas) {
    return {
      ...base,
      accion: 'consultar',
      textoPaciente:
        'Sobre este medicamento, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta.',
      reglaAplicada: 'IECA/ARA-II: falta información sobre IC/infarto/nefropatía para decidir',
      requiereConfirmacion: true,
      datoQueFalta: 'IC con disfunción sistólica / infarto reciente / proteinuria o nefropatía',
    };
  }

  const ultima = ultimaTomaDiaPrevio(ctx);
  return {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: ultima,
    textoPaciente: `No lo tome el día de la intervención (la toma de la noche anterior sí). Su última toma será el ${fechaLarga(ultima)} a las ${horaReloj(ultima)}.`,
    reglaAplicada: 'IECA/ARA-II: no tomar el día de la intervención',
    requiereConfirmacion: false,
  };
}

export interface EntradaSacubitriloValsartan {
  idFarmaco: string;
  nombreComercial: string;
}

/** Sacubitrilo/valsartán (§8.10): requiere confirmación del anestesiólogo. */
export function reglaSacubitriloValsartan(e: EntradaSacubitriloValsartan): ResultadoFarmaco {
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['sacubitrilo', 'valsartan'],
    accion: 'consultar',
    textoPaciente:
      'Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
    reglaAplicada: 'Sacubitrilo/valsartán: requiere confirmación',
    fuente: FUENTE,
    requiereConfirmacion: true,
  };
}

export interface EntradaDiuretico {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

export function reglaDiuretico(e: EntradaDiuretico, ctx: ContextoReglas): ResultadoFarmaco {
  const ultima = ultimaTomaDiaPrevio(ctx);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: ultima,
    textoPaciente: `No tome la dosis de la mañana del día de la intervención. Su última toma será el ${fechaLarga(ultima)} a las ${horaReloj(ultima)}.`,
    reglaAplicada: 'Diuréticos: no tomar la dosis de la mañana de la intervención',
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}
