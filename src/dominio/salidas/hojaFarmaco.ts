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

export function textoHojaPaciente(r: ResultadoFarmaco): string {
  if (r.requiereConfirmacion && !r.confirmadoPor) {
    return `Sobre ${r.nombreComercial}, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.`;
  }
  return r.textoPaciente;
}

/** Marca un resultado como confirmado por el anestesiólogo (con su nombre). */
export function confirmar(r: ResultadoFarmaco, nombreAnestesiologo: string): ResultadoFarmaco {
  return { ...r, confirmadoPor: nombreAnestesiologo };
}
