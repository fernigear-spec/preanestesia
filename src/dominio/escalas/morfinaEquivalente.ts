/**
 * Dosis equivalente de morfina oral — docs/documento_fuente.md §6.8.
 * Suma de dosis diarias × factor (opioides.json, factores CDC 2022).
 * Buprenorfina y metadona: sin conversión automática (§5.7).
 * >= 50 mg/día: alerta; >= 90 mg/día: alerta alta.
 */
import type { ResultadoEscala } from '../tipos.ts';

/** Factores por defecto (CDC 2022). En producción se leen de opioides.json. */
export const FACTORES_MORFINA: Record<string, number> = {
  morfina_oral: 1,
  codeina: 0.15,
  tramadol: 0.2,
  tapentadol: 0.4,
  oxicodona: 1.5,
  hidromorfona_oral: 5,
  fentanilo_transdermico: 2.4, // µg/h × 2,4
};

/** Opioides sin conversión automática. */
export const SIN_CONVERSION = new Set(['buprenorfina', 'metadona']);

export interface OpioideTomado {
  /** id del opioide (clave en FACTORES_MORFINA o SIN_CONVERSION). */
  id: string;
  /** Dosis diaria total en mg (o µg/h para fentanilo transdérmico). */
  dosisDiaria: number;
}

export type CategoriaMorfina = 'sin_alerta' | 'alerta' | 'alerta_alta';

export interface ResultadoMorfina extends ResultadoEscala {
  mgDia: number;
  categoria: CategoriaMorfina;
  /** Opioides presentes sin conversión (buprenorfina, metadona). */
  sinConversion: string[];
}

export function calcularMorfinaEquivalente(
  opioides: OpioideTomado[],
  factores: Record<string, number> = FACTORES_MORFINA,
): ResultadoMorfina {
  const comp: string[] = [];
  const sinConversion: string[] = [];
  let mgDia = 0;

  for (const o of opioides) {
    if (SIN_CONVERSION.has(o.id)) {
      sinConversion.push(o.id);
      continue;
    }
    const factor = factores[o.id];
    if (factor === undefined) continue;
    const aporte = o.dosisDiaria * factor;
    mgDia += aporte;
    comp.push(`${o.id}: ${o.dosisDiaria} × ${factor} = ${Number(aporte.toFixed(1))} mg`);
  }

  mgDia = Number(mgDia.toFixed(1));

  let categoria: CategoriaMorfina;
  if (mgDia >= 90) categoria = 'alerta_alta';
  else if (mgDia >= 50) categoria = 'alerta';
  else categoria = 'sin_alerta';

  return {
    puntuacion: mgDia,
    mgDia,
    categoria,
    sinConversion,
    componentes: comp,
  };
}
