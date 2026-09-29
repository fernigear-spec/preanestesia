/**
 * Heparinas y fondaparinux — docs/documento_fuente.md §8.4.
 * - Heparina sódica IV: suspender 4-6 h antes (uso hospitalario).
 * - HBPM profiláctica (dosis única diaria): última dosis 12 h antes.
 * - HBPM terapéutica: última dosis 24 h antes o más.
 * - Profiláctica/terapéutica se deduce comparando la dosis con las tablas SETH
 *   (reglas_farmacos.json → tablas_seth). Si no encaja, se pregunta.
 * - Fondaparinux profiláctico: 36 h (48 h con neuroaxial/bloqueo profundo/alto
 *   riesgo hemorrágico). CrCl < 20: contraindicado (alerta).
 * - Fondaparinux terapéutico: 48 h (72 h con neuroaxial/bloqueo profundo/alto
 *   riesgo hemorrágico/CrCl < 50).
 */
import type { ContextoReglas, ResultadoFarmaco, Alerta } from '../tipos.ts';
import { neuroaxialOProfundo, plazoDesdeHoras } from './motor.ts';
import { fechaHoraLimite } from '../fechas/plazos.ts';

const FUENTE = 'docs/documento_fuente.md §8.4 (SETH; ASRA 2018; protocolo del servicio)';

// ————————————— HBPM —————————————

export type TipoHbpm = 'profilactica' | 'terapeutica' | 'indeterminada';

export interface RangoSeth {
  profilaxis_max?: number;
  tratamiento_min?: number;
}

/**
 * Clasifica una HBPM por dosis usando la tabla SETH del fármaco.
 * @param dosisDiaria dosis total diaria (mg para enoxaparina, UI para las demás).
 * @param rango umbrales del fármaco (de tablas_seth).
 */
export function clasificarHbpm(dosisDiaria: number, rango: RangoSeth): TipoHbpm {
  if (rango.profilaxis_max !== undefined && dosisDiaria <= rango.profilaxis_max) {
    return 'profilactica';
  }
  if (rango.tratamiento_min !== undefined && dosisDiaria >= rango.tratamiento_min) {
    return 'terapeutica';
  }
  return 'indeterminada';
}

export interface EntradaHbpm {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Tipo ya clasificado (por dosis vía clasificarHbpm) o dado explícitamente. */
  tipo: TipoHbpm;
}

export function reglaHbpm(e: EntradaHbpm, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
  };

  if (e.tipo === 'indeterminada') {
    return {
      ...base,
      accion: 'consultar',
      textoPaciente:
        'Sobre esta heparina, el anestesiólogo le confirmará la última dosis. No la cambie por su cuenta.',
      reglaAplicada: 'HBPM: la dosis no encaja en profilaxis ni tratamiento (tablas SETH); preguntar',
      requiereConfirmacion: true,
      datoQueFalta: 'si la HBPM es a dosis profiláctica o terapéutica',
    };
  }

  const horas = e.tipo === 'profilactica' ? 12 : 24;
  const plazo = plazoDesdeHoras(ctx, horas, { permitirAdelanto: true });
  const res: ResultadoFarmaco = {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: `HBPM ${e.tipo}: última dosis ${horas} h antes`,
    requiereConfirmacion: false,
  };
  if (e.tipo === 'terapeutica') {
    res.textoAnestesiologo = 'Valorar actividad anti-Xa si hay dudas.';
  }
  return res;
}

// ————————————— Heparina sódica IV —————————————

export function reglaHeparinaSodica(idFarmaco: string, nombreComercial: string, ctx: ContextoReglas): ResultadoFarmaco {
  // Perfusión IV hospitalaria: no hay "toma del paciente"; la última administración
  // permitida es el propio límite (6 h antes, extremo conservador de 4-6 h).
  const limite = fechaHoraLimite(ctx.fechaHoraIntervencion, 6);
  return {
    idFarmaco,
    nombreComercial,
    principiosActivos: ['heparina_sodica'],
    accion: 'suspender',
    fechaHoraUltimaToma: limite,
    textoPaciente: 'Uso hospitalario: se suspenderá 4-6 h antes en el hospital.',
    reglaAplicada: 'Heparina sódica IV: suspender 4-6 h antes (uso hospitalario)',
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

// ————————————— Fondaparinux —————————————

export type DosisFondaparinux = 'profilactico' | 'terapeutico';

export interface EntradaFondaparinux {
  idFarmaco: string;
  nombreComercial: string;
  dosis: DosisFondaparinux;
}

export interface ResultadoFondaparinux {
  farmaco: ResultadoFarmaco;
  alerta?: Alerta;
}

export function reglaFondaparinux(e: EntradaFondaparinux, ctx: ContextoReglas): ResultadoFondaparinux {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['fondaparinux'],
    fuente: FUENTE,
  };
  const crcl = ctx.aclaramiento;
  const altoRiesgoHemo = ctx.riesgoHemorragico === 'alto';

  if (e.dosis === 'profilactico') {
    // CrCl < 20: contraindicado.
    if (crcl !== null && crcl < 20) {
      return {
        farmaco: {
          ...base,
          accion: 'consultar',
          textoPaciente:
            'Sobre este medicamento, el anestesiólogo le indicará qué hacer. No lo cambie por su cuenta.',
          reglaAplicada: 'Fondaparinux profiláctico con CrCl < 20: contraindicado',
          requiereConfirmacion: true,
        },
        alerta: {
          gravedad: 'roja',
          mensaje: 'Fondaparinux con aclaramiento < 20 mL/min: contraindicado.',
          origen: 'heparinas §8.4',
          soloAnestesiologo: false,
        },
      };
    }
    const horas = neuroaxialOProfundo(ctx) || altoRiesgoHemo ? 48 : 36;
    const plazo = plazoDesdeHoras(ctx, horas, { permitirAdelanto: true });
    return {
      farmaco: {
        ...base,
        accion: 'suspender',
        fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
        textoPaciente: plazo.textoPaciente,
        reglaAplicada: `Fondaparinux profiláctico: ${horas} h antes`,
        requiereConfirmacion: false,
      },
    };
  }

  // Terapéutico: 48 h; 72 h con neuroaxial/bloqueo profundo/alto riesgo hemorrágico/CrCl < 50.
  const alarga = neuroaxialOProfundo(ctx) || altoRiesgoHemo || (crcl !== null && crcl < 50);
  const horas = alarga ? 72 : 48;
  const plazo = plazoDesdeHoras(ctx, horas, { permitirAdelanto: true });
  return {
    farmaco: {
      ...base,
      accion: 'suspender',
      fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
      textoPaciente: plazo.textoPaciente,
      reglaAplicada: `Fondaparinux terapéutico: ${horas} h antes`,
      requiereConfirmacion: false,
    },
  };
}
