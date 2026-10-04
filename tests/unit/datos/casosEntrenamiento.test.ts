/**
 * Casos de entrenamiento (§14.2): comprueba que TODOS los ficheros de
 * casos_entrenamiento/ cargan sin errores, que su procedimiento existe en el
 * catálogo y que tienen lo necesario para llegar al resumen del anestesiólogo
 * (datos de intervención, básicos y cribado). Así, un caso con un id de
 * procedimiento equivocado o incompleto no pasa desapercibido.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { parseCsv } from '../../../src/datos/csv.ts';

const DIR_CASOS = fileURLToPath(new URL('../../../casos_entrenamiento/', import.meta.url));
const RUTA_CSV = fileURLToPath(new URL('../../../datos/procedimientos.csv', import.meta.url));

interface CasoJson {
  id?: string;
  titulo?: string;
  modalidad?: string;
  esperado?: unknown;
  intervencion?: { procedimientoId?: string };
  basicos?: unknown;
  cribado?: unknown;
}

function leerCasos(): Array<{ fichero: string; caso: CasoJson }> {
  return readdirSync(DIR_CASOS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ fichero: f, caso: JSON.parse(readFileSync(DIR_CASOS + f, 'utf8')) as CasoJson }));
}

describe('§14.2 · casos de entrenamiento', () => {
  const casos = leerCasos();
  const idsProc = new Set(parseCsv(readFileSync(RUTA_CSV, 'utf8')).filas.map((f) => f.valores.id ?? ''));

  it('hay al menos un caso', () => {
    expect(casos.length).toBeGreaterThan(0);
  });

  it('cada caso tiene la estructura mínima (id, título, modalidad, esperado, intervención, básicos, cribado)', () => {
    const fallos: string[] = [];
    for (const { fichero, caso } of casos) {
      if (typeof caso.id !== 'string' || caso.id.trim() === '') fallos.push(`${fichero}: sin id`);
      if (typeof caso.titulo !== 'string' || caso.titulo.trim() === '') fallos.push(`${fichero}: sin título`);
      if (caso.modalidad !== 'presencial' && caso.modalidad !== 'telefonica') fallos.push(`${fichero}: modalidad inválida`);
      if (!Array.isArray(caso.esperado)) fallos.push(`${fichero}: «esperado» no es una lista`);
      if (!caso.intervencion || typeof caso.intervencion.procedimientoId !== 'string') fallos.push(`${fichero}: sin procedimientoId`);
      // Básicos y cribado son imprescindibles para que el resumen se renderice.
      if (caso.basicos === undefined || caso.basicos === null) fallos.push(`${fichero}: sin básicos`);
      if (caso.cribado === undefined || caso.cribado === null) fallos.push(`${fichero}: sin cribado`);
    }
    expect(fallos).toEqual([]);
  });

  it('el procedimiento de cada caso existe en el catálogo (si no, el resumen no se generaría)', () => {
    const fallos: string[] = [];
    for (const { fichero, caso } of casos) {
      const pid = caso.intervencion?.procedimientoId ?? '';
      if (!idsProc.has(pid)) fallos.push(`${fichero}: procedimiento inexistente «${pid}»`);
    }
    expect(fallos).toEqual([]);
  });

  it('los ids de los casos son únicos', () => {
    const vistos = new Set<string>();
    const dup: string[] = [];
    for (const { caso } of casos) {
      const id = caso.id ?? '';
      if (vistos.has(id)) dup.push(id);
      vistos.add(id);
    }
    expect(dup).toEqual([]);
  });
});
