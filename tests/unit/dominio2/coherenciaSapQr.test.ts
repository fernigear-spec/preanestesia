import { describe, it, expect } from '../../_harness.ts';
import {
  tarjetaFarmacoAEnfermedad,
  tarjetasEnfermedadAFarmaco,
  tarjetasDatoQueFalta,
} from '../../../src/dominio/coherencia/coherencia.ts';
import { enumerar, plural, fechaCorta, soloAscii, generarSap, lineasNegativos } from '../../../src/dominio/salidas/sap.ts';
import { serializar, deserializar, cabeEnQr, type Payload } from '../../../src/dominio/salidas/qr/serializar.ts';

describe('Coherencia §5b (caso 22)', () => {
  it('enalapril sin HTA ni IC marcadas → tarjeta con indicaciones posibles', () => {
    const t = tarjetaFarmacoAEnfermedad(
      { nombre: 'Enalapril', indicacionesPosibles: ['hipertension', 'insuficiencia_cardiaca', 'nefropatia_proteinuria'] },
      new Set(), // nada recogido
    );
    expect(t).not.toBe(null);
    expect(t?.tipo).toBe('farmaco_a_enfermedad');
    expect(t?.mensaje).toContain('Enalapril');
    expect(t?.opciones).toContain('hipertensión'); // etiqueta legible, no el id interno
    expect(t?.mensaje).toContain('insuficiencia cardiaca');
    expect(t?.opciones).toContain('no lo sabe');
  });

  it('enalapril con HTA ya recogida → no hay tarjeta', () => {
    const t = tarjetaFarmacoAEnfermedad(
      { nombre: 'Enalapril', indicacionesPosibles: ['hipertension', 'insuficiencia_cardiaca'] },
      new Set(['hipertension']),
    );
    expect(t).toBe(null);
  });

  it('fibrilación auricular marcada sin anticoagulante ni antiagregante → tarjeta inversa', () => {
    const ts = tarjetasEnfermedadAFarmaco(new Set(['fibrilacion_auricular']), new Set());
    expect(ts).toHaveLength(1);
    expect(ts[0]?.tipo).toBe('enfermedad_a_farmaco');
    expect(ts[0]?.mensaje).toContain('Fibrilación auricular');
  });

  it('fibrilación auricular con anticoagulante presente → sin tarjeta inversa', () => {
    const ts = tarjetasEnfermedadAFarmaco(new Set(['fibrilacion_auricular']), new Set(['anticoagulante']));
    expect(ts).toHaveLength(0);
  });

  it('diabetes sin HbA1c → tarjeta de dato que falta', () => {
    const ts = tarjetasDatoQueFalta(new Set(['diabetes']), new Set());
    expect(ts.some((t) => t.mensaje.includes('HbA1c'))).toBeTrue();
  });

  it('diabetes con HbA1c presente → sin tarjeta de dato', () => {
    const ts = tarjetasDatoQueFalta(new Set(['diabetes']), new Set(['diabetes:hba1c']));
    expect(ts).toHaveLength(0);
  });
});

describe('Generador SAP §10.1', () => {
  it('enumeración con y final', () => {
    expect(enumerar(['a', 'b', 'c'])).toBe('a, b y c');
    expect(enumerar(['solo'])).toBe('solo');
    expect(enumerar([])).toBe('');
  });
  it('plural y fecha corta', () => {
    expect(plural(1, 'día', 'días')).toBe('día');
    expect(plural(2, 'día', 'días')).toBe('días');
    expect(fechaCorta(new Date(2026, 8, 28))).toBe('28/09/2026');
  });
  it('solo ASCII sustituye tildes y símbolos', () => {
    expect(soloAscii('anestésico «º»')).toBe('anestesico "o"');
  });
  it('omite bloques y líneas vacíos', () => {
    const r = generarSap([
      { clave: 'a', lineas: ['línea 1', '', '  '] },
      { clave: 'vacio', lineas: ['', ''] },
      { clave: 'b', lineas: ['línea 2'] },
    ]);
    expect(r.texto).toBe('línea 1\nlínea 2');
  });
  it('aplica abreviaturas', () => {
    const r = generarSap(
      [{ clave: 'a', lineas: ['Hipertension arterial en tratamiento'] }],
      { usarAbreviaturas: true, abreviaturas: { 'Hipertension arterial': 'HTA' } },
    );
    expect(r.texto).toContain('HTA');
  });
  it('negativos que se escriben (§10.1)', () => {
    const l = lineasNegativos({ alergiasConocidas: false, hipertermiaMalignaFamiliar: false, antecedentesFamiliaresAnestesicos: false, mtnd4Positivo: false, hemstopPositivo: false });
    expect(l).toContain('NAMC');
    expect(l).toContain('niega HM');
    expect(l).toContain('cribado mtND4 negativo');
    expect(l).toContain('HEMSTOP negativo');
  });
});

describe('QR §11 (caso 19)', () => {
  const AHORA = new Date(2026, 9, 15, 8, 0);
  function payload(x: number, v = '0.1.0'): Payload {
    return { t: 'paciente', e: 1, v, c: AHORA.getTime(), x, d: { fármacos: [{ n: 'Eliquis', a: 'suspender', h: '12/10 20:00' }], ayuno: '06:00' } };
  }

  it('round-trip sin pérdida', async () => {
    const p = payload(AHORA.getTime() + 30 * 86_400_000);
    const s = await serializar(p);
    const r = await deserializar(s, AHORA, '0.1.0');
    expect(r.estado).toBe('ok');
    if (r.estado === 'ok') {
      expect(r.payload.t).toBe('paciente');
      expect(JSON.stringify(r.payload.d)).toBe(JSON.stringify(p.d));
      expect(r.avisoVersion).toBeFalse();
    }
  });

  it('tamaño dentro del límite del QR', async () => {
    const s = await serializar(payload(AHORA.getTime() + 30 * 86_400_000));
    expect(cabeEnQr(s)).toBeTrue();
  });

  it('enlace caducado → no muestra datos', async () => {
    const s = await serializar(payload(AHORA.getTime() - 86_400_000)); // caducó ayer
    const r = await deserializar(s, AHORA, '0.1.0');
    expect(r.estado).toBe('caducado');
  });

  it('aviso de versión de contenido distinta', async () => {
    const s = await serializar(payload(AHORA.getTime() + 30 * 86_400_000, '0.0.9'));
    const r = await deserializar(s, AHORA, '0.1.0');
    expect(r.estado).toBe('ok');
    if (r.estado === 'ok') expect(r.avisoVersion).toBeTrue();
  });

  it('cadena inválida → invalido', async () => {
    const r = await deserializar('esto-no-es-valido!!!', AHORA, '0.1.0');
    expect(r.estado).toBe('invalido');
  });
});
