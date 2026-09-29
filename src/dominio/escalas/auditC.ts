/**
 * AUDIT-C — docs/documento_fuente.md §6.9.
 * 3 preguntas, 0-12 puntos. Positivo >= 4 (hombres) / >= 3 (mujeres):
 * consejo breve y hoja de reducción. >= 8: alerta de abstinencia.
 */
import type { ResultadoEscala, Sexo } from '../tipos.ts';

export interface EntradaAuditC {
  /** Cada pregunta 0-4. */
  frecuenciaConsumo: number;
  cantidadTipica: number;
  frecuenciaAtracon: number;
  sexo: Sexo;
}

export type CategoriaAuditC = 'negativo' | 'positivo' | 'riesgo_abstinencia';

export interface ResultadoAuditC extends ResultadoEscala {
  categoria: CategoriaAuditC;
  positivo: boolean;
  riesgoAbstinencia: boolean;
}

export function calcularAuditC(e: EntradaAuditC): ResultadoAuditC {
  const p = e.frecuenciaConsumo + e.cantidadTipica + e.frecuenciaAtracon;
  const umbral = e.sexo === 'hombre' ? 4 : 3;
  const positivo = p >= umbral;
  const riesgoAbstinencia = p >= 8;

  let categoria: CategoriaAuditC;
  if (riesgoAbstinencia) categoria = 'riesgo_abstinencia';
  else if (positivo) categoria = 'positivo';
  else categoria = 'negativo';

  return {
    puntuacion: p,
    categoria,
    positivo,
    riesgoAbstinencia,
    componentes: [
      `frecuencia ${e.frecuenciaConsumo}`,
      `cantidad ${e.cantidadTipica}`,
      `atracón ${e.frecuenciaAtracon}`,
      `umbral ${umbral} (${e.sexo})`,
    ],
  };
}
