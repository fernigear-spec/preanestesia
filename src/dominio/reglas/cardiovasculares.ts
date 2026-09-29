/**
 * Cardiovasculares — docs/documento_fuente.md §8.10.
 * - IECA/ARA-II: suspender 24 h antes, salvo IC con disfunción sistólica,
 *   infarto reciente o proteinuria/nefropatía (mantener). Si falta info, preguntar.
 * - Diuréticos: no tomar la dosis de la mañana de la intervención.
 * - Betabloqueantes, calcioantagonistas, nitratos, amiodarona, digoxina,
 *   estatinas: mantener.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { plazoDesdeHoras, TEXTO_MANTENER } from './motor.ts';

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

  const p = plazoDesdeHoras(ctx, 24);
  return {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: p.fechaHoraUltimaToma,
    textoPaciente: p.textoPaciente,
    reglaAplicada: 'IECA/ARA-II: suspender 24 h',
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

export function reglaDiuretico(e: EntradaDiuretico): ResultadoFarmaco {
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'ajustar',
    textoPaciente: 'No tome la dosis de la mañana del día de la intervención. El resto, como siempre.',
    reglaAplicada: 'Diuréticos: no tomar la dosis de la mañana de la intervención',
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}
