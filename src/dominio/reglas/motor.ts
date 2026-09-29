/**
 * Motor de reglas de medicación — docs/documento_fuente.md §8.0 (design.md).
 * - Resuelve la técnica anestésica efectiva ("no se sabe" → neuroaxial si el
 *   procedimiento tiene neuroaxial probable, R3.2.3).
 * - Convierte plazos (días/horas) en fecha/hora límite y texto de paciente.
 * - Resuelve la regla "más restrictiva" en combinaciones.
 *
 * Los números salen de datos/reglas_farmacos.json; la lógica condicional vive aquí.
 */
import type {
  ContextoReglas,
  DatosIntervencion,
  ResultadoFarmaco,
  AccionFarmaco,
} from '../tipos.ts';
import { diasAHoras, fechaHoraLimite, fechaConFranja } from '../fechas/plazos.ts';

/** Resuelve el contexto de reglas a partir de la intervención y el aclaramiento. */
export function construirContexto(
  intervencion: DatosIntervencion,
  pesoKg: number,
  aclaramiento: number | null,
  indicacion?: string,
): ContextoReglas {
  // Técnica efectiva: "no se sabe" + neuroaxial probable ⇒ tratar como neuroaxial (R3.2.3).
  const neuroaxial =
    intervencion.tecnica === 'neuroaxial' ||
    (intervencion.tecnica === 'no_se_sabe' && intervencion.neuroaxialProbable);
  const bloqueoProfundo = intervencion.tecnica === 'bloqueo_profundo';

  const ctx: ContextoReglas = {
    fechaHoraIntervencion: intervencion.fechaHora,
    riesgoHemorragico: intervencion.riesgoHemorragico,
    riesgoCardiovascular: intervencion.riesgoCardiovascular,
    grupoOftalmologico: intervencion.grupoOftalmologico,
    neuroaxial,
    bloqueoProfundo,
    riesgoTromboticoAlto: intervencion.riesgoTromboticoAlto,
    regimen: intervencion.regimen,
    pesoKg,
    aclaramiento,
  };
  if (indicacion !== undefined) ctx.indicacion = indicacion;
  return ctx;
}

/** ¿La técnica efectiva exige plazos de neuroaxial o bloqueo profundo? */
export function neuroaxialOProfundo(ctx: ContextoReglas): boolean {
  return ctx.neuroaxial || ctx.bloqueoProfundo;
}

export interface PlazoCalculado {
  horas: number;
  fechaHoraUltimaToma: Date;
  textoPaciente: string;
}

/** Construye el plazo (fecha/hora límite + texto) a partir de un plazo en horas. */
export function plazoDesdeHoras(ctx: ContextoReglas, horas: number): PlazoCalculado {
  const limite = fechaHoraLimite(ctx.fechaHoraIntervencion, horas);
  const texto = `Tome la última dosis ${fechaConFranja(limite)}. Después no vuelva a tomarlo hasta que se lo indiquen.`;
  return { horas, fechaHoraUltimaToma: limite, textoPaciente: texto };
}

export function plazoDesdeDias(ctx: ContextoReglas, dias: number): PlazoCalculado {
  return plazoDesdeHoras(ctx, diasAHoras(dias));
}

/** Texto estándar de "mantener" (§8.0). */
export const TEXTO_MANTENER =
  'Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua.';

/**
 * Resuelve la acción más restrictiva entre varios resultados de los componentes
 * de una combinación. Orden de restricción: consultar > suspender/ajustar (mayor
 * plazo) > mantener. Devuelve el resultado ganador.
 */
export function masRestrictiva(resultados: ResultadoFarmaco[]): ResultadoFarmaco {
  if (resultados.length === 0) throw new Error('masRestrictiva: sin resultados');
  const rango: Record<AccionFarmaco, number> = {
    consultar: 3,
    suspender: 2,
    ajustar: 2,
    mantener: 0,
  };
  return resultados.reduce((mejor, actual) => {
    // Requiere confirmación gana siempre.
    if (actual.requiereConfirmacion && !mejor.requiereConfirmacion) return actual;
    if (mejor.requiereConfirmacion && !actual.requiereConfirmacion) return mejor;
    // Mayor rango de acción.
    if (rango[actual.accion] !== rango[mejor.accion]) {
      return rango[actual.accion] > rango[mejor.accion] ? actual : mejor;
    }
    // A igual acción, el plazo más largo (fecha límite más temprana).
    const ta = actual.fechaHoraUltimaToma?.getTime() ?? Infinity;
    const tm = mejor.fechaHoraUltimaToma?.getTime() ?? Infinity;
    return ta < tm ? actual : mejor;
  });
}
