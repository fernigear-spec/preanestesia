/**
 * Clase de riesgo del paciente — docs/documento_fuente.md §7.2.
 * La más alta de las que asignen los módulos: bajo, bajo-moderado, moderado, alto.
 * Las asignaciones concretas por respuesta viven en datos/modulos/*.json; esta
 * función agrega el máximo de las asignaciones ya evaluadas.
 */

export type ClaseRiesgoPaciente = 'bajo' | 'bajo-moderado' | 'moderado' | 'alto';

const ORDEN: Record<ClaseRiesgoPaciente, number> = {
  bajo: 0,
  'bajo-moderado': 1,
  moderado: 2,
  alto: 3,
};

export interface AsignacionRiesgo {
  clase: ClaseRiesgoPaciente;
  motivo: string;
}

export interface ResultadoClaseRiesgo {
  clase: ClaseRiesgoPaciente;
  determinantes: string[];
}

export function calcularClaseRiesgoPaciente(
  asignaciones: AsignacionRiesgo[],
): ResultadoClaseRiesgo {
  let clase: ClaseRiesgoPaciente = 'bajo';
  for (const a of asignaciones) {
    if (ORDEN[a.clase] > ORDEN[clase]) clase = a.clase;
  }
  const determinantes = asignaciones
    .filter((a) => a.clase === clase)
    .map((a) => a.motivo);
  return { clase, determinantes };
}
