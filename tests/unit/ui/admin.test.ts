/**
 * Panel de administración (§14.1): serialización CSV (ida y vuelta), diff por líneas
 * y validación de contenido.
 */
import { describe, it, expect } from '../../_harness.ts';
import { parseCsv, serializarCsv } from '../../../src/datos/csv.ts';
import { diffLineas, resumenDiff } from '../../../src/ui/admin/diff.ts';
import { validarContenido } from '../../../src/ui/admin/validar.ts';

describe('Admin · serialización CSV', () => {
  it('ida y vuelta conserva columnas y valores', () => {
    const csv = 'id;nombre;via\na;Uno;oral\nb;Dos;no_oral\n';
    const { columnas, filas } = parseCsv(csv);
    const texto = serializarCsv(columnas, filas.map((f) => f.valores));
    const reparseado = parseCsv(texto);
    expect(reparseado.filas.length).toBe(2);
    expect(reparseado.filas[0]!.valores.nombre).toBe('Uno');
    expect(reparseado.filas[1]!.valores.via).toBe('no_oral');
  });

  it('entrecomilla los campos con el separador o comillas', () => {
    const texto = serializarCsv(['id', 'texto'], [{ id: 'x', texto: 'a;b "c"' }]);
    expect(texto).toContain('"a;b ""c"""');
    // Y se recupera igual.
    const { filas } = parseCsv(texto);
    expect(filas[0]!.valores.texto).toBe('a;b "c"');
  });
});

describe('Admin · diff por líneas', () => {
  it('detecta líneas añadidas y quitadas', () => {
    const d = diffLineas('a\nb\nc', 'a\nB\nc\nd');
    const r = resumenDiff(d);
    expect(r.anadidas).toBe(2); // "B" y "d"
    expect(r.quitadas).toBe(1); // "b"
  });

  it('sin cambios cuando el texto es idéntico', () => {
    const r = resumenDiff(diffLineas('a\nb', 'a\nb'));
    expect(r.anadidas).toBe(0);
    expect(r.quitadas).toBe(0);
  });
});

describe('Admin · validación', () => {
  it('marca un id_regla inexistente en un CSV de fármacos (caso 21)', () => {
    const csv = 'id;id_regla\nx;regla_inventada\ny;aas\n';
    const res = validarContenido('csv', csv, { idsRegla: new Set(['aas']) });
    expect(res.ok).toBe(false);
    expect(res.mensajes.join(' ')).toContain('regla_inventada');
  });

  it('acepta un CSV de fármacos con reglas válidas', () => {
    const csv = 'id;id_regla\ny;aas\n';
    const res = validarContenido('csv', csv, { idsRegla: new Set(['aas']) });
    expect(res.ok).toBe(true);
  });

  it('rechaza JSON no válido y acepta JSON válido', () => {
    expect(validarContenido('json', '{ mal').ok).toBe(false);
    expect(validarContenido('json', '{"a":1}').ok).toBe(true);
  });

  it('valida la estructura de un módulo', () => {
    const bueno = JSON.stringify({ id: 'm', titulo: 'M', preguntas: [{ id: 'p', etiqueta: 'E', tipo: 'boolean' }] });
    expect(validarContenido('modulo', bueno).ok).toBe(true);
    const malo = JSON.stringify({ id: 'm', preguntas: [] });
    expect(validarContenido('modulo', malo).ok).toBe(false);
  });
});
