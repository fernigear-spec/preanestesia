/**
 * STOP-Bang (adultos sin SAOS diagnosticado) — docs/documento_fuente.md §6.3.
 * 0-2 bajo; 3-4 intermedio; 5-8 alto. También alto si >= 2 de los cuatro
 * primeros (STOP) más varón, IMC > 35 o cuello > 40 cm. Alto: alerta.
 */
import type { ResultadoEscala } from '../tipos.ts';

export interface EntradaStopBang {
  ronquidoFuerte: boolean; // S - Snoring
  cansancioDiurno: boolean; // T - Tiredness
  apneasObservadas: boolean; // O - Observed apnea
  htaEnTratamiento: boolean; // P - Pressure
  imcMayor35: boolean; // B - BMI
  edadMayor50: boolean; // A - Age
  cuelloMayor40: boolean; // N - Neck
  varon: boolean; // G - Gender
}

export type CategoriaStopBang = 'bajo' | 'intermedio' | 'alto';

export interface ResultadoStopBang extends ResultadoEscala {
  categoria: CategoriaStopBang;
  alto: boolean;
}

export function calcularStopBang(e: EntradaStopBang): ResultadoStopBang {
  const items: Array<[boolean, string]> = [
    [e.ronquidoFuerte, 'ronquido fuerte'],
    [e.cansancioDiurno, 'cansancio/somnolencia diurna'],
    [e.apneasObservadas, 'apneas observadas'],
    [e.htaEnTratamiento, 'HTA en tratamiento'],
    [e.imcMayor35, 'IMC > 35'],
    [e.edadMayor50, 'edad > 50'],
    [e.cuelloMayor40, 'cuello > 40 cm'],
    [e.varon, 'varón'],
  ];
  const comp = items.filter(([v]) => v).map(([, t]) => t);
  const p = comp.length;

  // Regla del subgrupo alto (>= 2 de STOP + varón/IMC/cuello).
  const stopPositivos =
    Number(e.ronquidoFuerte) +
    Number(e.cansancioDiurno) +
    Number(e.apneasObservadas) +
    Number(e.htaEnTratamiento);
  const subgrupoAlto =
    stopPositivos >= 2 && (e.varon || e.imcMayor35 || e.cuelloMayor40);

  let categoria: CategoriaStopBang;
  if (p >= 5) categoria = 'alto';
  else if (p >= 3) categoria = 'intermedio';
  else categoria = 'bajo';

  const alto = categoria === 'alto' || subgrupoAlto;
  if (alto && categoria !== 'alto') {
    categoria = 'alto';
    comp.push('subgrupo de alto riesgo (≥2 STOP + varón/IMC/cuello)');
  }

  return { puntuacion: p, categoria, alto, componentes: comp };
}
