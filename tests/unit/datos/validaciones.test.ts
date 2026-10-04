/**
 * Cargador y validador del catálogo de puntos de validación (§13 bis),
 * datos/validaciones.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarValidaciones, validarValidaciones } from '../../../src/datos/validaciones.ts';

const RUTA = fileURLToPath(new URL('../../../datos/validaciones.json', import.meta.url));

describe('§13 bis · validaciones.json', () => {
  it('el fichero real es válido y se carga', () => {
    const obj = JSON.parse(readFileSync(RUTA, 'utf8'));
    expect(validarValidaciones(obj)).toEqual([]);
    const cat = cargarValidaciones(obj);
    expect(cat.posponer.length).toBeGreaterThan(0);
    expect(cat.validar.length).toBeGreaterThan(0);
  });

  it('asigna el tipo según el grupo (posponer/validar), ignorando el que venga en el JSON', () => {
    const cat = cargarValidaciones({
      posponer: [{ id: 'a', origen: 'x.y', motivo: 'm' }],
      validar: [{ id: 'b', origen: 'z.w', motivo: 'm2', fuente: '§1' }],
    });
    expect(cat.posponer[0]!.tipo).toBe('posponer');
    expect(cat.validar[0]!.tipo).toBe('validar');
    expect(cat.validar[0]!.fuente).toBe('§1');
  });

  it('detecta puntos sin id, sin origen o sin motivo', () => {
    const errs = validarValidaciones({ posponer: [{ origen: 'x.y' }], validar: [{ id: 'b', motivo: 'm' }] });
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((e) => /id/.test(e.mensaje))).toBeTrue();
    expect(errs.some((e) => /origen/.test(e.mensaje) || /motivo/.test(e.mensaje))).toBeTrue();
  });

  it('detecta ids duplicados entre grupos', () => {
    const errs = validarValidaciones({
      posponer: [{ id: 'dup', origen: 'x.y', motivo: 'm' }],
      validar: [{ id: 'dup', origen: 'z.w', motivo: 'm2' }],
    });
    expect(errs.some((e) => /duplicado/.test(e.mensaje))).toBeTrue();
  });

  it('un grupo ausente se trata como vacío (no es error)', () => {
    expect(validarValidaciones({ posponer: [{ id: 'a', origen: 'x.y', motivo: 'm' }] })).toEqual([]);
    const cat = cargarValidaciones({ validar: [{ id: 'b', origen: 'z.w', motivo: 'm' }] });
    expect(cat.posponer).toEqual([]);
    expect(cat.validar.length).toBe(1);
  });

  it('cargar lanza si el catálogo es inválido', () => {
    expect(() => cargarValidaciones({ posponer: [{ origen: 'x.y' }] })).toThrow();
  });
});
