/**
 * Dolor crónico y opioides (§5.7, §6.8): a partir de los opioides recogidos en el
 * paso 8 (con su dosis y pauta) calcula la dosis diaria equivalente de morfina oral
 * y las alertas del §5.7. No inventa datos: si falta la dosis, ese opioide aporta 0.
 */
import type { Via } from '../tipos.ts';
import {
  calcularMorfinaEquivalente,
  type OpioideTomado,
  type ResultadoMorfina,
} from '../escalas/morfinaEquivalente.ts';

/** id del catálogo (farmacos.csv) → clave del factor en opioides.json. */
export const OPIOIDE_CATALOGO_A_FACTOR: Record<string, string> = {
  morfina: 'morfina_oral',
  codeina: 'codeina',
  tramadol: 'tramadol',
  tapentadol: 'tapentadol',
  oxicodona: 'oxicodona',
  hidromorfona: 'hidromorfona_oral',
  fentanilo_transdermico: 'fentanilo_transdermico',
  buprenorfina: 'buprenorfina',
  metadona: 'metadona',
};

export interface OpioideUi {
  /** id del catálogo. */
  idFarmaco: string;
  /** Vía: 'transdermica' = parche (dosis en µg/h). */
  via: Via;
  /** Dosis por toma (mg) o, en parche, la tasa (µg/h). */
  dosis?: number;
  /** Tomas al día (no aplica en parches). */
  tomasDia?: number;
}

/**
 * Dosis diaria a efectos de conversión: el parche transdérmico usa su tasa (µg/h),
 * que el factor de conversión ya interpreta; el resto, dosis por toma × tomas al día.
 */
export function dosisDiariaOpioide(o: OpioideUi): number {
  const dosis = o.dosis ?? 0;
  if (o.via === 'transdermica') return dosis;
  return dosis * (o.tomasDia ?? 0);
}

export function derivarMorfina(
  opioides: OpioideUi[],
  factores?: Record<string, number>,
): ResultadoMorfina {
  const tomados: OpioideTomado[] = opioides.map((o) => ({
    id: OPIOIDE_CATALOGO_A_FACTOR[o.idFarmaco] ?? o.idFarmaco,
    dosisDiaria: dosisDiariaOpioide(o),
  }));
  return calcularMorfinaEquivalente(tomados, factores);
}
