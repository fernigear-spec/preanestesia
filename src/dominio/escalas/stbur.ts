/**
 * STBUR (niños) — docs/documento_fuente.md §6.3.
 * 5 ítems. >= 3 positivos: riesgo aumentado (alerta). 5 positivos: alerta alta.
 */
import type { ResultadoEscala } from '../tipos.ts';

export interface EntradaStbur {
  roncaMasMitadNoches: boolean;
  roncaFuerte: boolean;
  esfuerzoRespiratorioDormido: boolean;
  dejaDeRespirarDormido: boolean;
  cansadoOSomnolientoDia: boolean;
}

export type CategoriaStbur = 'sin_riesgo' | 'riesgo' | 'riesgo_alto';

export interface ResultadoStbur extends ResultadoEscala {
  categoria: CategoriaStbur;
}

export function calcularStbur(e: EntradaStbur): ResultadoStbur {
  const items: Array<[boolean, string]> = [
    [e.roncaMasMitadNoches, 'ronca más de la mitad de las noches'],
    [e.roncaFuerte, 'ronca fuerte'],
    [e.esfuerzoRespiratorioDormido, 'esfuerzo para respirar dormido'],
    [e.dejaDeRespirarDormido, 'deja de respirar dormido'],
    [e.cansadoOSomnolientoDia, 'cansado o somnoliento de día'],
  ];
  const comp = items.filter(([v]) => v).map(([, t]) => t);
  const p = comp.length;

  let categoria: CategoriaStbur;
  if (p >= 5) categoria = 'riesgo_alto';
  else if (p >= 3) categoria = 'riesgo';
  else categoria = 'sin_riesgo';

  return { puntuacion: p, categoria, componentes: comp };
}
