/**
 * Cuestionario de hemostasia HEMSTOP — docs/documento_fuente.md §5.5.
 * 7 preguntas. Dos o más respuestas positivas: se pide estudio de coagulación
 * (aunque la tabla de pruebas no lo pida) y se genera una alerta.
 */
import type { ResultadoEscala, Alerta } from '../tipos.ts';

export interface EntradaHemstop {
  /** Hematomas/sangrados sin traumatismo que motivaran consulta o tratamiento. */
  hematomasSinTrauma: boolean;
  /** Sangrado prolongado tras heridas. */
  sangradoProlongadoHeridas: boolean;
  /** Menstruaciones abundantes que motivaran consulta o tratamiento (mujeres). */
  menstruacionAbundante: boolean;
  /** Sangrado anómalo tras cirugía. */
  sangradoTrasCirugia: boolean;
  /** Sangrado anómalo tras extracción dental. */
  sangradoTrasDental: boolean;
  /** Sangrado anómalo en el parto. */
  sangradoEnParto: boolean;
  /** Familiares con trastorno de la coagulación. */
  familiaresTrastornoCoagulacion: boolean;
}

export const HEMSTOP_UMBRAL_POSITIVO = 2;

export interface ResultadoHemstop extends ResultadoEscala {
  /** true si >= 2 positivas: pedir coagulación + alerta. */
  positivo: boolean;
  /** Alerta si es positivo, o undefined. */
  alerta?: Alerta;
  /** true si debe añadirse estudio de coagulación a las pruebas. */
  pedirCoagulacion: boolean;
}

export function calcularHemstop(e: EntradaHemstop): ResultadoHemstop {
  const items: Array<[boolean, string]> = [
    [e.hematomasSinTrauma, 'hematomas/sangrados sin traumatismo'],
    [e.sangradoProlongadoHeridas, 'sangrado prolongado tras heridas'],
    [e.menstruacionAbundante, 'menstruaciones abundantes'],
    [e.sangradoTrasCirugia, 'sangrado anómalo tras cirugía'],
    [e.sangradoTrasDental, 'sangrado anómalo tras extracción dental'],
    [e.sangradoEnParto, 'sangrado anómalo en el parto'],
    [e.familiaresTrastornoCoagulacion, 'familiares con trastorno de la coagulación'],
  ];
  const comp = items.filter(([v]) => v).map(([, t]) => t);
  const p = comp.length;
  const positivo = p >= HEMSTOP_UMBRAL_POSITIVO;

  const resultado: ResultadoHemstop = {
    puntuacion: p,
    categoria: positivo ? 'positivo (≥ 2)' : 'negativo',
    componentes: comp,
    positivo,
    pedirCoagulacion: positivo,
  };
  if (positivo) {
    resultado.alerta = {
      gravedad: 'amarilla',
      mensaje: 'HEMSTOP positivo (≥ 2): solicitar estudio de coagulación aunque la tabla no lo pida.',
      origen: 'HEMSTOP §5.5',
      soloAnestesiologo: false,
    };
  }
  return resultado;
}
