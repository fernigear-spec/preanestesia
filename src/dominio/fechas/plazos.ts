/**
 * Utilidades de fecha/hora para los plazos de medicación —
 * docs/documento_fuente.md §8.0.
 * Los plazos se expresan en horas desde la última toma hasta la hora prevista
 * de la intervención. La fecha/hora límite = intervención − horas.
 * La traducción a lenguaje del paciente incluye siempre el día de la semana.
 */

export const HORAS_POR_DIA = 24;

export function diasAHoras(dias: number): number {
  return dias * HORAS_POR_DIA;
}

/** Fecha/hora límite de la última toma dado un plazo en horas antes de la intervención. */
export function fechaHoraLimite(intervencion: Date, horasAntes: number): Date {
  return new Date(intervencion.getTime() - horasAntes * 60 * 60 * 1000);
}

/** true si la fecha límite ya pasó o cae hoy respecto a `ahora` (R3.2.5). */
export function plazoNoAlcanzable(limite: Date, ahora: Date): boolean {
  const finDeHoy = new Date(ahora);
  finDeHoy.setHours(23, 59, 59, 999);
  return limite.getTime() <= finDeHoy.getTime();
}

// `fechaLarga`, `horaReloj` y las utilidades de franja horaria vivían también aquí;
// se retiraron (2026-10-04) por duplicar las de `ultimaToma.ts` (las que se usan).

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
