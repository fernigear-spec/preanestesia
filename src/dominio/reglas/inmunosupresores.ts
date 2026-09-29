/**
 * Inmunosupresores y reumatología — docs/documento_fuente.md §8.8 (ACR 2022).
 * - Azatioprina/ciclosporina/tacrolimus/micofenolato: mantener por trasplante o
 *   enfermedad sistémica grave; por autoinmune con riesgo alto → requiere
 *   confirmación (la enfermera no valora ese riesgo).
 * - Metotrexato <= 20 mg/semana: mantener; > 20 mg/semana (cirugía mayor, alto
 *   riesgo de infección o función renal alterada) → requiere confirmación.
 * - Leflunomida/hidroxicloroquina/sulfasalazina: mantener.
 * - Inhibidores JAK (tofacitinib, baricitinib, upadacitinib): suspender 3 días.
 * - Biológicos: planificación por ciclo; requiere confirmación.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { plazoDesdeDias, faltaHora, resultadoFaltaHora, TEXTO_MANTENER } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.8 (ACR 2022)';

export type IndicacionInmuno = 'trasplante' | 'enfermedad_sistemica_grave' | 'autoinmune';

export interface EntradaInmunosupresorClasico {
  idFarmaco: string;
  nombreComercial: string;
  principio: string; // azatioprina, ciclosporina, tacrolimus, micofenolato
  indicacion?: IndicacionInmuno;
}

export function reglaInmunosupresorClasico(e: EntradaInmunosupresorClasico): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
  };
  if (e.indicacion === 'trasplante' || e.indicacion === 'enfermedad_sistemica_grave') {
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: `${e.principio}: mantener (${e.indicacion})`,
      requiereConfirmacion: false,
    };
  }
  // Autoinmune o indicación desconocida: la enfermera no puede valorar el riesgo → confirmación.
  return {
    ...base,
    accion: 'consultar',
    textoPaciente:
      'Sobre este medicamento, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta.',
    reglaAplicada: `${e.principio}: por enfermedad autoinmune, valorar suspender 1-2 días (requiere confirmación)`,
    requiereConfirmacion: true,
    ...(e.indicacion === undefined ? { datoQueFalta: 'indicación del inmunosupresor' } : {}),
  };
}

export interface EntradaMetotrexato {
  idFarmaco: string;
  nombreComercial: string;
  dosisSemanalMg: number;
}

export function reglaMetotrexato(e: EntradaMetotrexato): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['metotrexato'],
    fuente: FUENTE,
  };
  if (e.dosisSemanalMg <= 20) {
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'Metotrexato ≤ 20 mg/semana: mantener',
      requiereConfirmacion: false,
    };
  }
  return {
    ...base,
    accion: 'consultar',
    textoPaciente:
      'Sobre este medicamento, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta.',
    reglaAplicada: 'Metotrexato > 20 mg/semana: requiere confirmación',
    requiereConfirmacion: true,
    textoAnestesiologo: 'Valorar omitir 1 o 2 dosis tras consultar con reumatología.',
  };
}

export interface EntradaSimpleReuma {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

/** Leflunomida, hidroxicloroquina, sulfasalazina: mantener (ACR 2022). */
export function reglaFameMantener(e: EntradaSimpleReuma): ResultadoFarmaco {
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'mantener',
    textoPaciente: TEXTO_MANTENER,
    reglaAplicada: `${e.principio}: mantener (ACR 2022)`,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

/** Inhibidores JAK (tofacitinib, baricitinib, upadacitinib): suspender 3 días. */
export function reglaJak(e: EntradaSimpleReuma, ctx: ContextoReglas): ResultadoFarmaco {
  const plazo = plazoDesdeDias(ctx, 3);
  const base = { idFarmaco: e.idFarmaco, nombreComercial: e.nombreComercial, principiosActivos: [e.principio], fuente: FUENTE };
  if (faltaHora(plazo)) return resultadoFaltaHora(base);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: `Inhibidor JAK (${e.principio}): suspender 3 días`,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

export interface EntradaBiologico {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Días del ciclo (p.ej. adalimumab 14). */
  periodicidadDias?: number;
  /** Fecha de la última dosis, si se conoce. */
  fechaUltimaDosis?: Date;
}

/** Biológicos (anti-TNF, rituximab, tocilizumab, abatacept...): planificación por ciclo; confirmación. */
export function reglaBiologico(e: EntradaBiologico, intervencion?: Date): ResultadoFarmaco {
  const res: ResultadoFarmaco = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'consultar',
    textoPaciente:
      'Sobre este tratamiento biológico, el anestesiólogo le indicará qué hacer. No lo cambie por su cuenta.',
    reglaAplicada: 'Biológico: programar la cirugía al final del ciclo (idealmente omitiendo uno); requiere confirmación',
    fuente: FUENTE,
    requiereConfirmacion: true,
    textoAnestesiologo:
      'Programar al final del ciclo (p. ej. adalimumab/2 semanas: operar justo antes de la siguiente dosis; ' +
      'rituximab: esperar 6 meses desde la infusión si es posible).',
  };
  if (e.fechaUltimaDosis === undefined) {
    res.datoQueFalta = 'fecha de la última dosis del biológico';
    return res;
  }
  // Con fecha y periodicidad, se calcula en qué punto del ciclo cae la cirugía.
  if (e.periodicidadDias !== undefined && intervencion !== undefined) {
    const diasDesde = Math.round((intervencion.getTime() - e.fechaUltimaDosis.getTime()) / 86_400_000);
    const puntoCiclo = diasDesde % e.periodicidadDias;
    const proxima = e.periodicidadDias - puntoCiclo;
    const mitad = puntoCiclo > 0 && proxima > 0;
    res.textoAnestesiologo +=
      ` La cirugía cae a ${diasDesde} días de la última dosis (ciclo de ${e.periodicidadDias} días): ` +
      `${mitad ? 'a mitad de ciclo; próxima dosis en ' + proxima + ' días — valorar reprogramar cerca de la siguiente dosis' : 'al final del ciclo'}.`;
  }
  return res;
}
