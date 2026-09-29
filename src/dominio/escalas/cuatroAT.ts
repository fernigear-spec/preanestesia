/**
 * Test 4AT (>= 65 años, presencial y telefónica) — docs/documento_fuente.md §6.10.
 * Componentes y puntuación:
 *  - Alerta: normal 0 / alterado 4.
 *  - AMT4 (edad, fecha de nacimiento, lugar, año): 0 errores 0; 1 error 1; 2 o más o no valorable 2.
 *  - Meses del año al revés: 7 o más correctos 0; empieza pero < 7 → 1; no valorable 2.
 *  - Cambio agudo o curso fluctuante: no 0 / sí 4.
 * Total 0: improbable. 1-3: posible deterioro cognitivo (alerta de delirium).
 * 4 o más: posible delirium actual (alerta roja).
 */
import type { ResultadoEscala } from '../tipos.ts';

export type Alerta4AT = 'normal' | 'alterado';
export type Amt4 = '0_errores' | '1_error' | '2_o_mas_o_no_valorable';
export type Meses = '7_o_mas' | 'menos_de_7' | 'no_valorable';
export type CambioAgudo = 'no' | 'si';

export interface Entrada4AT {
  alerta: Alerta4AT;
  amt4: Amt4;
  meses: Meses;
  cambioAgudo: CambioAgudo;
}

export type Categoria4AT =
  | 'improbable'
  | 'posible_deterioro_cognitivo'
  | 'posible_delirium';

export interface Resultado4AT extends ResultadoEscala {
  categoria: Categoria4AT;
}

export function calcular4AT(e: Entrada4AT): Resultado4AT {
  const comp: string[] = [];
  let p = 0;

  if (e.alerta === 'alterado') {
    p += 4;
    comp.push('alerta alterada (+4)');
  }

  if (e.amt4 === '1_error') {
    p += 1;
    comp.push('AMT4 1 error (+1)');
  } else if (e.amt4 === '2_o_mas_o_no_valorable') {
    p += 2;
    comp.push('AMT4 ≥ 2 errores o no valorable (+2)');
  }

  if (e.meses === 'menos_de_7') {
    p += 1;
    comp.push('meses al revés: empieza pero < 7 (+1)');
  } else if (e.meses === 'no_valorable') {
    p += 2;
    comp.push('meses al revés: no valorable (+2)');
  }

  if (e.cambioAgudo === 'si') {
    p += 4;
    comp.push('cambio agudo o curso fluctuante (+4)');
  }

  let categoria: Categoria4AT;
  if (p >= 4) categoria = 'posible_delirium';
  else if (p >= 1) categoria = 'posible_deterioro_cognitivo';
  else categoria = 'improbable';

  return { puntuacion: p, categoria, componentes: comp };
}
