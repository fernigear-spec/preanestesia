/**
 * Capacidad funcional: DASI y METs — docs/documento_fuente.md §6.6.
 * METs = (0,43 × DASI + 9,6) / 3,5. Capacidad reducida: < 4 METs o DASI <= 34.
 */
import type { ResultadoEscala } from '../tipos.ts';

/** Pesos DASI por ítem (docs/documento_fuente.md §6.6). */
export const PESOS_DASI = {
  autocuidado: 2.75,
  caminarDentroCasa: 1.75,
  caminar1a2Manzanas: 2.75,
  subirUnPisoOCuesta: 5.5,
  correrDistanciaCorta: 8.0,
  tareasLigerasCasa: 2.7,
  tareasModeradasCasa: 3.5,
  tareasPesadasCasa: 8.0,
  trabajoJardin: 4.5,
  relacionesSexuales: 5.25,
  actividadesRecreativasModeradas: 6.0,
  deportesIntensos: 7.5,
} as const;

export type ItemDasi = keyof typeof PESOS_DASI;

export function metsDesdeDasi(dasi: number): number {
  return (0.43 * dasi + 9.6) / 3.5;
}

export interface ResultadoDasi extends ResultadoEscala {
  dasi: number;
  mets: number;
  capacidadReducida: boolean;
}

/**
 * @param itemsPositivos ítems que el paciente SÍ puede hacer.
 */
export function calcularDasi(itemsPositivos: ItemDasi[]): ResultadoDasi {
  const comp: string[] = [];
  let dasi = 0;
  for (const item of itemsPositivos) {
    dasi += PESOS_DASI[item];
    comp.push(`${item} (+${PESOS_DASI[item]})`);
  }
  const mets = metsDesdeDasi(dasi);
  const capacidadReducida = mets < 4 || dasi <= 34;

  return {
    puntuacion: Number(dasi.toFixed(2)),
    dasi: Number(dasi.toFixed(2)),
    mets: Number(mets.toFixed(2)),
    capacidadReducida,
    categoria: capacidadReducida ? 'capacidad reducida (< 4 METs)' : '≥ 4 METs',
    componentes: comp,
  };
}
