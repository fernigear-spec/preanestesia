/**
 * ASA sugerido — docs/documento_fuente.md §6.1.
 * El ASA sugerido es el MÁXIMO de las clases mínimas asignadas por cada
 * respuesta de los módulos. La aplicación muestra qué respuestas lo determinan.
 * Modificable a mano; sufijo E en urgencias.
 *
 * Esta función no cablea el catálogo de respuestas→clase (eso vive en
 * datos/modulos/*.json y se agregará al integrar el motor de entrevista);
 * recibe la lista de determinantes ya evaluados por los módulos.
 */
import type { ResultadoEscala } from '../tipos.ts';

export type ClaseAsa = 1 | 2 | 3 | 4 | 5;

export interface DeterminanteAsa {
  clase: ClaseAsa;
  motivo: string;
}

export interface ResultadoAsa extends ResultadoEscala {
  clase: ClaseAsa;
  sufijoE: boolean;
  modificadoManualmente: boolean;
  /** Determinantes que fijaron la clase máxima. */
  determinantes: string[];
}

export interface OpcionesAsa {
  urgencia?: boolean;
  /** Override manual del anestesiólogo/enfermera. */
  claseManual?: ClaseAsa;
}

export function calcularAsa(
  determinantes: DeterminanteAsa[],
  opciones: OpcionesAsa = {},
): ResultadoAsa {
  // Clase base: máximo de determinantes, mínimo ASA I.
  let claseCalculada: ClaseAsa = 1;
  for (const d of determinantes) {
    if (d.clase > claseCalculada) claseCalculada = d.clase;
  }

  const modificadoManualmente = opciones.claseManual !== undefined;
  const clase = opciones.claseManual ?? claseCalculada;

  const motivosDeMax = determinantes
    .filter((d) => d.clase === claseCalculada)
    .map((d) => d.motivo);

  const sufijoE = opciones.urgencia === true;
  const ROMANO: Record<ClaseAsa, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
  const categoria = `ASA ${ROMANO[clase]}${sufijoE ? 'E' : ''}`;

  return {
    puntuacion: clase,
    clase,
    sufijoE,
    modificadoManualmente,
    determinantes: motivosDeMax,
    categoria,
    componentes: determinantes.map((d) => `ASA ${d.clase}: ${d.motivo}`),
  };
}
