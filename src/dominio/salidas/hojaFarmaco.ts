/**
 * Texto de un fármaco para la HOJA DEL PACIENTE — docs/documento_fuente.md §12.
 * Comportamiento único para todo fármaco que requiere confirmación:
 *  - Mientras NO está confirmado: la hoja muestra solo
 *    "Sobre [fármaco], el anestesiólogo le llamará para indicarle qué hacer.
 *     No lo cambie por su cuenta."
 *  - Una vez confirmado (con el nombre del anestesiólogo): se muestra la pauta
 *    calculada (el textoPaciente del resultado).
 */
import type { ResultadoFarmaco } from '../tipos.ts';

/**
 * Frase ÚNICA para cualquier fármaco no confirmado (§12). Es idéntica para todos
 * los fármacos; los matices (con su psiquiatra, uso hospitalario, etc.) van a las
 * notas del anestesiólogo, nunca a la hoja del paciente.
 * @param nombreComercial nombre comercial del fármaco (o genérico si no se conoce).
 */
export function fraseNoConfirmado(nombreComercial: string): string {
  return `Sobre ${nombreComercial}, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.`;
}

export function textoHojaPaciente(r: ResultadoFarmaco): string {
  if (r.requiereConfirmacion && !r.confirmadoPor) {
    return fraseNoConfirmado(r.nombreComercial);
  }
  return r.textoPaciente;
}

/** Marca un resultado como confirmado por el anestesiólogo (con su nombre). */
export function confirmar(r: ResultadoFarmaco, nombreAnestesiologo: string): ResultadoFarmaco {
  return { ...r, confirmadoPor: nombreAnestesiologo };
}
