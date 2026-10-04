/**
 * Cobertura de `etiquetaSap` (§10.1, 2026-10-04). Toda pregunta booleana de los
 * módulos debe llevar una etiqueta breve para el texto de SAP (sí = la palabra;
 * no = "no " + la palabra). Esta prueba falla si alguna booleana no la tiene.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarModulos } from '../../../src/datos/modulos.ts';

const DIR = fileURLToPath(new URL('../../../datos/modulos/', import.meta.url));

function leerModulos() {
  const objetos: Record<string, unknown> = {};
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    objetos[`datos/modulos/${f}`] = JSON.parse(readFileSync(DIR + f, 'utf8'));
  }
  return cargarModulos(objetos);
}

describe('etiquetaSap · cobertura (§10.1)', () => {
  it('toda pregunta booleana de los módulos tiene etiquetaSap no vacía', () => {
    const modulos = leerModulos();
    const faltan: string[] = [];
    for (const m of modulos) {
      for (const p of m.preguntas) {
        if (p.tipo === 'boolean' && (!p.etiquetaSap || p.etiquetaSap.trim() === '')) {
          faltan.push(`${m.id}.${p.id}`);
        }
      }
    }
    expect(faltan).toEqual([]);
  });

  it('hay un número razonable de preguntas booleanas con etiquetaSap (guardia de regresión)', () => {
    const modulos = leerModulos();
    let n = 0;
    for (const m of modulos) for (const p of m.preguntas) if (p.tipo === 'boolean' && p.etiquetaSap) n++;
    expect(n).toBeGreaterThan(60);
  });
});
