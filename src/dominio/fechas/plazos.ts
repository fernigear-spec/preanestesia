/**
 * Utilidades de fecha/hora para los plazos de medicación —
 * docs/documento_fuente.md §8.0.
 * Los plazos se expresan en horas desde la última toma hasta la hora prevista
 * de la intervención. La fecha/hora límite = intervención − horas.
 * La traducción a lenguaje del paciente incluye siempre el día de la semana.
 */

const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
] as const;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

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

/** "martes 13 de octubre" (con día de la semana, §8.0). */
export function fechaLarga(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export type FranjaDia = 'mañana' | 'mediodía' | 'tarde' | 'noche';

export function franja(d: Date): FranjaDia {
  const h = d.getHours();
  if (h < 12) return 'mañana';
  if (h < 15) return 'mediodía';
  if (h < 21) return 'tarde';
  return 'noche';
}

/** "el martes 13 de octubre por la mañana" */
export function fechaConFranja(d: Date): string {
  return `el ${fechaLarga(d)} por la ${franja(d)}`;
}

/** Hora de reloj "HH:MM" (para ayuno, §8.14). */
export function horaReloj(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

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
