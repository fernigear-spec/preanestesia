/**
 * Reglas genéricas y utilidades transversales — docs/documento_fuente.md §8.0.
 * - Fármaco no catalogado: mantener y consultar con el anestesiólogo.
 * - Mantener genérico.
 * - Detección de plazo no alcanzable (R3.2.5): si la fecha límite calculada ya
 *   pasó o cae hoy, el fármaco pasa a requerir confirmación y se alerta.
 */
import type { ContextoReglas, ResultadoFarmaco, Alerta } from '../tipos.ts';
import { TEXTO_MANTENER } from './motor.ts';
// (textoMantener y ViaAdministracion se importan más abajo junto a plazoDesdeDias)
import { plazoNoAlcanzable } from '../fechas/plazos.ts';
import { plazoDesdeDias, faltaHora, resultadoFaltaHora, textoMantener, type ViaAdministracion } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.0';

export function reglaNoCatalogado(nombre: string): ResultadoFarmaco {
  return {
    idFarmaco: `no_catalogado:${nombre}`,
    nombreComercial: nombre,
    principiosActivos: [],
    accion: 'mantener',
    textoPaciente: 'Siga tomándolo como siempre y consúltelo con el anestesiólogo.',
    reglaAplicada: 'Fármaco no catalogado: mantener y consultar con el anestesiólogo',
    fuente: FUENTE,
    requiereConfirmacion: true,
  };
}

export function reglaMantener(
  idFarmaco: string,
  nombreComercial: string,
  principiosActivos: string[],
  motivo = 'mantener',
  via: ViaAdministracion = 'oral',
): ResultadoFarmaco {
  return {
    idFarmaco,
    nombreComercial,
    principiosActivos,
    accion: 'mantener',
    textoPaciente: textoMantener(via),
    reglaAplicada: motivo,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

// ————————————— Fitoterapia y suplementos (§8.11) —————————————

export interface EntradaFitoterapia {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

/** Fitoterapia/suplementos con efecto sobre coagulación/metabolismo: suspender 14 días (mínimo 7). */
export function reglaFitoterapia(e: EntradaFitoterapia, ctx: ContextoReglas): ResultadoFarmaco {
  const plazo = plazoDesdeDias(ctx, 14); // no tomar 14 días previos ni el día de la IQ
  const base = { idFarmaco: e.idFarmaco, nombreComercial: e.nombreComercial, principiosActivos: [e.principio], fuente: 'docs/documento_fuente.md §8.11' };
  if (faltaHora(plazo)) return resultadoFaltaHora(base);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: `Deje de tomarlo 14 días antes si es posible (mínimo 7). ${plazo.textoPaciente}`,
    reglaAplicada: 'Fitoterapia/suplemento con efecto sobre coagulación: suspender 14 días (mínimo 7)',
    fuente: 'docs/documento_fuente.md §8.11',
    requiereConfirmacion: false,
  };
}

// ————————————— Anticonceptivos / THS (§8.11, Decisión 4) —————————————

export interface EntradaAnticonceptivoThs {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Tipo de anticonceptivo hormonal (para la advertencia de sugammadex, §8.15). */
  esOral?: boolean;
}

/**
 * Anticonceptivos hormonales combinados y THS: en procedimientos de riesgo
 * trombótico alto, requiere confirmación. La sugerencia de suspensión va solo en
 * las notas del anestesiólogo; la hoja del paciente muestra la línea general de
 * requiere confirmación referida al anticonceptivo hasta que se confirme.
 */
export function reglaAnticonceptivoThs(e: EntradaAnticonceptivoThs, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: 'docs/documento_fuente.md §8.11',
  };
  if (ctx.riesgoTromboticoAlto) {
    return {
      ...base,
      accion: 'consultar',
      textoPaciente:
        'Sobre su anticonceptivo, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
      reglaAplicada: 'Anticonceptivo/THS con riesgo trombótico alto: requiere confirmación',
      requiereConfirmacion: true,
      textoAnestesiologo: 'Valorar suspender 4-6 semanas antes y método anticonceptivo alternativo.',
    };
  }
  return {
    ...base,
    accion: 'mantener',
    textoPaciente: TEXTO_MANTENER,
    reglaAplicada: 'Anticonceptivo/THS sin riesgo trombótico alto: mantener',
    requiereConfirmacion: false,
  };
}

// ————————————— Corticoides sistémicos (§8.11 / §5.3) —————————————

export interface EntradaCorticoide {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** true si cumple el criterio de dosis de estrés (≥ 5 mg/día prednisona > 3 sem). */
  dosisEstres?: boolean;
}

export function reglaCorticoide(e: EntradaCorticoide): ResultadoFarmaco {
  const res: ResultadoFarmaco = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'mantener',
    textoPaciente: TEXTO_MANTENER,
    reglaAplicada: 'Corticoide sistémico: mantener',
    fuente: 'docs/documento_fuente.md §8.11',
    requiereConfirmacion: false,
  };
  if (e.dosisEstres) {
    res.textoAnestesiologo = 'Valorar dosis de estrés perioperatoria (§5.3).';
  }
  return res;
}

/**
 * Comprueba si el plazo de suspensión de un fármaco ya no se puede cumplir
 * (R3.2.5). Si es así, marca el fármaco como "requiere confirmación" y devuelve
 * una alerta por fármaco. Muta y devuelve una COPIA del resultado.
 */
export function aplicarPlazoNoAlcanzable(
  r: ResultadoFarmaco,
  _ctx: ContextoReglas,
  ahora: Date,
): { resultado: ResultadoFarmaco; alerta?: Alerta } {
  if (r.fechaHoraUltimaToma === undefined || r.accion === 'mantener') {
    return { resultado: r };
  }
  if (!plazoNoAlcanzable(r.fechaHoraUltimaToma, ahora)) {
    return { resultado: r };
  }
  const resultado: ResultadoFarmaco = {
    ...r,
    accion: 'consultar',
    requiereConfirmacion: true,
    reglaAplicada: `${r.reglaAplicada} — plazo no alcanzable`,
    textoPaciente:
      'Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
  };
  const alerta: Alerta = {
    gravedad: 'roja',
    mensaje: `${r.nombreComercial}: ya no se puede cumplir el plazo de suspensión; consultar con el anestesiólogo.`,
    origen: 'plazos §3.2.5',
    soloAnestesiologo: false,
  };
  return { resultado, alerta };
}
