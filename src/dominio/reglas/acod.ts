/**
 * ACOD (dabigatrán, rivaroxabán, apixabán, edoxabán) —
 * docs/documento_fuente.md §8.2 (Decisión 1).
 * - Oftalmología de riesgo bajo: no suspender.
 * - Riesgo hemorrágico bajo sin neuroaxial ni bloqueo profundo: 48 h.
 * - Riesgo hemorrágico alto, neuroaxial o bloqueo profundo: 72 h.
 * - Dabigatrán con neuroaxial: 72 h (CrCl>80), 96 h (50-80), 120 h (<50).
 *   Fuera de neuroaxial: +24 h (CrCl 50-80), +48 h (CrCl<50) sobre el base.
 * - Anti-Xa con neuroaxial y CrCl<30: 96 h. Fuera de neuroaxial: +24 h (CrCl<30).
 * - Sin aclaramiento: requiere confirmación indicando qué dato falta (R12.5).
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { neuroaxialOProfundo, plazoDesdeHoras, faltaHora, resultadoFaltaHora, TEXTO_MANTENER } from './motor.ts';

export type SubtipoAcod = 'dabigatran' | 'antixa';

const FUENTE = 'docs/documento_fuente.md §8.2 (EHRA 2021; protocolo del servicio)';

export interface EntradaAcod {
  idFarmaco: string;
  nombreComercial: string;
  principioActivo: string;
  subtipo: SubtipoAcod;
  /** true si cumple criterio de alto riesgo trombótico de §8.1 (p. ej. ictus < 3 meses). */
  altoRiesgoTromboticoConfirmar?: boolean;
}

export function reglaAcod(e: EntradaAcod, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principioActivo],
    fuente: FUENTE,
  };

  // Oftalmología de riesgo bajo: no suspender.
  if (ctx.grupoOftalmologico === 'riesgo_bajo') {
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'ACOD, oftalmología de riesgo bajo: no suspender',
      requiereConfirmacion: false,
    };
  }

  // Criterio de alto riesgo trombótico de §8.1 (§8.2): requiere confirmación con
  // la sugerencia de cambiar a acenocumarol para poder hacer terapia puente.
  if (e.altoRiesgoTromboticoConfirmar) {
    return {
      ...base,
      accion: 'consultar',
      textoPaciente:
        'Sobre este anticoagulante, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
      reglaAplicada: 'ACOD con alto riesgo trombótico (§8.1): requiere confirmación',
      requiereConfirmacion: true,
      textoAnestesiologo:
        'Consultar con hematología o cardiología el cambio a acenocumarol para poder hacer terapia puente.',
    };
  }

  const conNeuroaxial = ctx.neuroaxial; // los tramos especiales aplican a neuroaxial
  const altoOProfundo = ctx.riesgoHemorragico === 'alto' || neuroaxialOProfundo(ctx);

  // Plazo base.
  let horas = altoOProfundo ? 72 : 48;
  let regla = `ACOD, ${altoOProfundo ? 'riesgo alto/neuroaxial/bloqueo profundo' : 'riesgo bajo'}: ${horas} h base`;

  // Ajustes por aclaramiento.
  const crcl = ctx.aclaramiento;
  const faltaAclaramiento = crcl === null;

  if (e.subtipo === 'dabigatran') {
    if (conNeuroaxial) {
      // Tramos fijos con neuroaxial (Decisión 1).
      if (faltaAclaramiento) {
        return {
          ...base,
          accion: 'consultar',
          textoPaciente:
            'Sobre este anticoagulante, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
          reglaAplicada: 'Dabigatrán con neuroaxial: falta aclaramiento para fijar 72/96/120 h',
          requiereConfirmacion: true,
          datoQueFalta: 'aclaramiento de creatinina',
        };
      }
      if (crcl > 80) {
        horas = 72;
        regla = 'Dabigatrán + neuroaxial, CrCl > 80: 72 h';
      } else if (crcl >= 50) {
        horas = 96;
        regla = 'Dabigatrán + neuroaxial, CrCl 50-80: 96 h';
      } else {
        horas = 120;
        regla = 'Dabigatrán + neuroaxial, CrCl < 50: 120 h';
      }
    } else {
      // Fuera de neuroaxial: base + ajuste.
      if (faltaAclaramiento) {
        return sinAclaramiento(base);
      }
      if (crcl >= 50 && crcl <= 80) {
        horas += 24;
        regla += ' + 24 h (CrCl 50-80)';
      } else if (crcl < 50) {
        horas += 48;
        regla += ' + 48 h (CrCl < 50)';
      }
    }
  } else {
    // Anti-Xa (rivaroxabán, apixabán, edoxabán).
    if (conNeuroaxial) {
      if (faltaAclaramiento) return sinAclaramiento(base);
      if (crcl < 30) {
        horas = 96;
        regla = 'Anti-Xa + neuroaxial, CrCl < 30: 96 h';
      }
      // CrCl >= 30 con neuroaxial: se mantiene el base 72 h.
    } else {
      if (faltaAclaramiento) return sinAclaramiento(base);
      if (crcl < 30) {
        horas += 24;
        regla += ' + 24 h (CrCl < 30)';
      }
    }
  }

  const plazo = plazoDesdeHoras(ctx, horas, { permitirAdelanto: true });
  if (faltaHora(plazo)) return resultadoFaltaHora(base);

  const resultado: ResultadoFarmaco = {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: regla,
    requiereConfirmacion: false,
  };

  // Nota informativa (§8.2): riesgo bajo, sin neuroaxial/profundo y CrCl > 50.
  if (
    ctx.riesgoHemorragico === 'bajo' &&
    !neuroaxialOProfundo(ctx) &&
    crcl !== null &&
    crcl > 50
  ) {
    resultado.textoAnestesiologo = 'Podría considerarse suspender solo 24 h.';
  }

  return resultado;
}

function sinAclaramiento(base: {
  idFarmaco: string;
  nombreComercial: string;
  principiosActivos: string[];
  fuente: string;
}): ResultadoFarmaco {
  return {
    ...base,
    accion: 'consultar',
    textoPaciente:
      'Sobre este anticoagulante, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
    reglaAplicada: 'ACOD: falta aclaramiento de creatinina para ajustar el plazo',
    requiereConfirmacion: true,
    datoQueFalta: 'aclaramiento de creatinina',
  };
}
