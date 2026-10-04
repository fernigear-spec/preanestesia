/**
 * Cargador y validador de módulos de patología (§3, §5).
 * Comprueba que todos los ficheros datos/modulos/*.json son válidos y que cada
 * casilla del paso 7 abre un módulo existente.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarModulos, validarModulo } from '../../../src/datos/modulos.ts';
import { APARATOS, moduloDeEnfermedad } from '../../../src/ui/estadoEntrevista.ts';

const DIR = fileURLToPath(new URL('../../../datos/modulos/', import.meta.url));

function leerModulos(): Record<string, unknown> {
  const objetos: Record<string, unknown> = {};
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    objetos[`datos/modulos/${f}`] = JSON.parse(readFileSync(DIR + f, 'utf8'));
  }
  return objetos;
}

describe('Módulos de patología · cargador y validador', () => {
  it('todos los ficheros datos/modulos/*.json son válidos', () => {
    const modulos = cargarModulos(leerModulos());
    expect(modulos.length).toBeGreaterThan(20);
  });

  it('cada casilla del paso 7 abre un módulo existente (salvo las de solo presencia)', () => {
    const modulos = cargarModulos(leerModulos());
    const ids = new Set(modulos.map((m) => m.id));
    // Casillas que son solo "presencia" (§5.1): no abren preguntas, solo alimentan la
    // clase de riesgo, la comorbilidad CV para el BNP (§7.3) y CHA2DS2-VA (enf. vascular).
    const SOLO_PRESENCIA = new Set(['arteriopatia_periferica', 'aneurisma_aorta']);
    const sinModulo: string[] = [];
    for (const grupo of APARATOS) {
      for (const e of grupo.enfermedades) {
        if (SOLO_PRESENCIA.has(e.id)) continue;
        if (!ids.has(moduloDeEnfermedad(e.id))) sinModulo.push(e.id);
      }
    }
    expect(sinModulo).toEqual([]);
  });

  it('el validador detecta un módulo con una pregunta sin tipo válido', () => {
    const malo = { id: 'x', titulo: 'X', preguntas: [{ id: 'p1', etiqueta: 'P', tipo: 'no_existe' }] };
    const errs = validarModulo(malo, 'x.json');
    expect(errs.length).toBeGreaterThan(0);
  });

  it('el validador detecta una opción sin valor/etiqueta', () => {
    const malo = { id: 'x', titulo: 'X', preguntas: [{ id: 'p1', etiqueta: 'P', tipo: 'opcion', opciones: [{ valor: 'a' }] }] };
    const errs = validarModulo(malo, 'x.json');
    expect(errs.length).toBeGreaterThan(0);
  });
});
