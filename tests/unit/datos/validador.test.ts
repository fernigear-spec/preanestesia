import { describe, it, expect } from '../../_harness.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validarFarmacos, validarProcedimientos } from '../../../src/datos/validador.ts';
import { parseCsv } from '../../../src/datos/csv.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '../../..');

function leer(rel: string): string {
  return readFileSync(join(RAIZ, rel), 'utf8');
}

function idsRegla(): Set<string> {
  const reglas = JSON.parse(leer('datos/reglas_farmacos.json')) as { reglas: Record<string, unknown> };
  return new Set(Object.keys(reglas.reglas));
}

describe('Parser CSV', () => {
  it('separador ; y numeración de filas (cabecera = 1)', () => {
    const r = parseCsv('a;b\n1;2\n3;4');
    expect(r.columnas).toEqual(['a', 'b']);
    expect(r.filas).toHaveLength(2);
    expect(r.filas[0]?.numeroFila).toBe(2);
    expect(r.filas[1]?.valores.b).toBe('4');
  });

  it('campo entrecomillado con ; interno no rompe columnas', () => {
    const r = parseCsv('a;b;c\n1;"tiene; punto y coma";3');
    expect(r.filas[0]?.valores.b).toBe('tiene; punto y coma');
    expect(r.filas[0]?.valores.c).toBe('3');
  });

  it('campo entrecomillado con salto de línea interno', () => {
    const r = parseCsv('a;b\n1;"línea 1\nlínea 2"\n2;x');
    expect(r.filas).toHaveLength(2);
    expect(r.filas[0]?.valores.b).toBe('línea 1\nlínea 2');
    expect(r.filas[1]?.valores.a).toBe('2');
    // La numeración lógica cuenta registros, no '\n' físicos.
    expect(r.filas[1]?.numeroFila).toBe(3);
  });

  it('comillas escapadas ("") dentro de campo', () => {
    const r = parseCsv('a;b\n1;"dijo ""hola"""');
    expect(r.filas[0]?.valores.b).toBe('dijo "hola"');
  });

  it('farmacos.csv se parsea sin desplazar columnas (textos con ; entrecomillados)', () => {
    const { filas } = parseCsv(leer('datos/farmacos.csv'));
    const bupren = filas.find((f) => f.valores.id === 'buprenorfina');
    expect(bupren?.valores.requiere_confirmacion).toBe('no');
    expect(bupren?.valores.verificado_cima).toBe('si');
    expect(bupren?.valores.texto_paciente).toContain('planificar analgesia');
  });
});

describe('Validador de datos iniciales', () => {
  it('farmacos.csv inicial es válido (toda id_regla existe)', () => {
    const r = validarFarmacos(leer('datos/farmacos.csv'), idsRegla());
    if (!r.ok) console.error(r.errores);
    expect(r.ok).toBeTrue();
  });

  it('procedimientos.csv inicial es válido', () => {
    const r = validarProcedimientos(leer('datos/procedimientos.csv'));
    if (!r.ok) console.error(r.errores);
    expect(r.ok).toBeTrue();
  });
});

describe('Caso 21 §15: regla inexistente', () => {
  it('detecta id_regla inexistente y señala fichero/fila/columna', () => {
    const csv = [
      'id;principios_activos;nombres_comerciales;grupo;subgrupo;pauta_tipica;id_regla;requiere_confirmacion;indicaciones_posibles;fuente;fecha_revision;verificado_cima',
      'x;x;X;g;s;diaria;REGLA_QUE_NO_EXISTE;no;;f;2026-09-29;no',
    ].join('\n');
    const r = validarFarmacos(csv, idsRegla());
    expect(r.ok).toBeFalse();
    const err = r.errores[0];
    expect(err?.fichero).toBe('datos/farmacos.csv');
    expect(err?.fila).toBe(2);
    expect(err?.columna).toBe('id_regla');
    expect(err?.mensaje).toContain('regla inexistente');
  });

  it('detecta columna obligatoria ausente', () => {
    const csv = ['id;grupo', 'x;g'].join('\n');
    const r = validarFarmacos(csv, idsRegla());
    expect(r.ok).toBeFalse();
    expect(r.errores.some((e) => e.mensaje.includes('columna obligatoria'))).toBeTrue();
  });

  it('detecta valor fuera de lista en pauta_tipica', () => {
    const csv = [
      'id;principios_activos;nombres_comerciales;grupo;subgrupo;pauta_tipica;id_regla;requiere_confirmacion;indicaciones_posibles;fuente;fecha_revision;verificado_cima',
      'x;x;X;g;s;CADA_LUNA_LLENA;mantener_generico;no;;f;2026-09-29;no',
    ].join('\n');
    const r = validarFarmacos(csv, idsRegla());
    expect(r.ok).toBeFalse();
    expect(r.errores.some((e) => e.columna === 'pauta_tipica')).toBeTrue();
  });
});
