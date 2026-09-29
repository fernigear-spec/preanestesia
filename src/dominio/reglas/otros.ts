/**
 * Reglas genéricas y utilidades transversales — docs/documento_fuente.md §8.0.
 * - Fármaco no catalogado: mantener y consultar con el anestesiólogo.
 * - Mantener genérico.
 * - Detección de plazo no alcanzable (R3.2.5): si la fecha límite calculada ya
 *   pasó o cae hoy, el fármaco pasa a requerir confirmación y se alerta.
 */
import type { ContextoReglas, ResultadoFarmaco, Alerta } from '../tipos.ts';
import { TEXTO_MANTENER } from './motor.ts';
import { plazoNoAlcanzable } from '../fechas/plazos.ts';

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
): ResultadoFarmaco {
  return {
    idFarmaco,
    nombreComercial,
    principiosActivos,
    accion: 'mantener',
    textoPaciente: TEXTO_MANTENER,
    reglaAplicada: motivo,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

/**
 * Comprueba si el plazo de suspensión de un fármaco ya no se puede cumplir
 * (R3.2.5). Si es así, marca el fármaco como "requiere confirmación" y devuelve
 * una alerta por fármaco. Muta y devuelve una COPIA del resultado.
 */
export function aplicarPlazoNoAlcanzable(
  r: ResultadoFarmaco,
  ctx: ContextoReglas,
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
