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
import { neuroaxialOProfundo, plazoDesdeHoras, faltaHora, resultadoFaltaHora } from './motor.ts';
import { fechaHoraLimite } from '../fechas/plazos.ts';

const FUENTE = 'docs/documento_fuente.md §8.4 (SETH; ASRA 2018; protocolo del servicio)';

// ————————————— HBPM —————————————

export type TipoHbpm = 'profilactica' | 'terapeutica' | 'indeterminada';

/**
 * Umbrales SETH de una HBPM (de reglas_farmacos.json → tablas_seth). Admite umbrales
 * por peso (unidad/kg/día) y fijos (unidad/día), y un umbral de tratamiento reducido
 * cuando el aclaramiento es < 30 mL/min (ajuste renal). Los números salen del JSON.
 */
export interface TablaSeth {
  unidad?: 'mg' | 'UI';
  // Estilo umbral por kg (enoxaparina).
  profilaxis_max_por_kg_dia?: number;
  tratamiento_min_por_kg_dia?: number;
  tratamiento_min_por_kg_dia_crcl_lt30?: number;
  // Profilaxis fija (unidad/día) del resto de heparinas.
  profilaxis_dia?: number;
  profilaxis_crcl_lt30_dia?: number;
  /** Profilaxis por bandas de peso (≤ umbral_kg → hasta; > umbral_kg → desde). */
  profilaxis_dia_bandas?: { umbral_kg: number; hasta: number; desde: number };
  // Objetivo de tratamiento por kg/día (se clasifica dentro de ±20 %).
  tratamiento_por_kg_dia?: number;
  tratamiento_por_kg_dia_crcl_lt30?: number;
  tratamiento_crcl_lt30_contraindicado?: boolean;
  tratamiento_crcl_lt30_confirmar?: boolean;
}

/** Datos necesarios para clasificar una HBPM (§8.4): no basta la dosis. */
export interface EntradaClasificacionHbpm {
  /** Dosis por toma (mg para enoxaparina; UI para el resto). */
  dosisPorToma: number;
  /** Tomas al día (1 = cada 24 h; 2 = cada 12 h). */
  tomasDia: number;
  /** Peso real del paciente (kg). */
  pesoKg: number;
  /** Aclaramiento de creatinina (mL/min) o null si no se conoce. */
  aclaramiento: number | null;
}

/**
 * Clasifica una HBPM en profiláctica/terapéutica usando dosis, pauta, peso y
 * aclaramiento contra las dos tablas de la SETH del fármaco (§8.4). Si no encaja en
 * ninguna, devuelve 'indeterminada' (la regla preguntará). Ejemplos: enoxaparina
 * 60 mg/24 h en 90 kg es profilaxis; 40 mg/12 h en 110 kg es profilaxis;
 * 1 mg/kg/12 h es tratamiento; 1 mg/kg/24 h con aclaramiento < 30 es tratamiento.
 */
export function clasificarHbpm(e: EntradaClasificacionHbpm, tabla: TablaSeth): TipoHbpm {
  const diaria = e.dosisPorToma * e.tomasDia;
  const porKgDia = e.pesoKg > 0 ? diaria / e.pesoKg : null;
  const renal = e.aclaramiento !== null && e.aclaramiento < 30;
  const dentro20 = (valor: number, objetivo: number): boolean => objetivo > 0 && Math.abs(valor - objetivo) <= 0.2 * objetivo;

  // —— Tratamiento (prima la dosis terapéutica) ——
  // Umbral por kg (enoxaparina).
  if (renal && tabla.tratamiento_min_por_kg_dia_crcl_lt30 !== undefined && porKgDia !== null
    && porKgDia >= tabla.tratamiento_min_por_kg_dia_crcl_lt30) return 'terapeutica';
  if (tabla.tratamiento_min_por_kg_dia !== undefined && porKgDia !== null
    && porKgDia >= tabla.tratamiento_min_por_kg_dia) return 'terapeutica';
  // Objetivo por kg dentro de ±20 % (resto de heparinas).
  const objTrat = renal ? (tabla.tratamiento_por_kg_dia_crcl_lt30 ?? tabla.tratamiento_por_kg_dia) : tabla.tratamiento_por_kg_dia;
  if (objTrat !== undefined && porKgDia !== null && dentro20(porKgDia, objTrat)) return 'terapeutica';

  // —— Profilaxis ——
  if (tabla.profilaxis_max_por_kg_dia !== undefined && porKgDia !== null
    && porKgDia <= tabla.profilaxis_max_por_kg_dia) return 'profilactica';
  let objProf: number | undefined;
  if (renal && tabla.profilaxis_crcl_lt30_dia !== undefined) objProf = tabla.profilaxis_crcl_lt30_dia;
  else if (tabla.profilaxis_dia_bandas) objProf = e.pesoKg <= tabla.profilaxis_dia_bandas.umbral_kg ? tabla.profilaxis_dia_bandas.hasta : tabla.profilaxis_dia_bandas.desde;
  else objProf = tabla.profilaxis_dia;
  if (objProf !== undefined && dentro20(diaria, objProf)) return 'profilactica';

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
  if (faltaHora(plazo)) return resultadoFaltaHora(base);
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
    if (faltaHora(plazo)) return { farmaco: resultadoFaltaHora(base) };
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
  if (faltaHora(plazo)) return { farmaco: resultadoFaltaHora(base) };
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
