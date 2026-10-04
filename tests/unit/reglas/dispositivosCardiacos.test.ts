/**
 * Dispositivos cardiacos implantables (§5.1 bis, BHRS 2022). Una prueba por fila
 * de la tabla (tipo × dependencia × zona), más el marcapasos sin cables, el DAI
 * subcutáneo, la colocación del imán por fabricante y los puntos de validación por
 * revisión atrasada y batería.
 */
import { describe, it, expect } from '../../_harness.ts';
import { evaluarDispositivoCardiaco, type EntradaDispositivo } from '../../../src/dominio/reglas/dispositivosCardiacos.ts';

const HOY = new Date(2026, 9, 15, 9, 0); // 15/10/2026
/** Revisión reciente (dentro de plazo) para aislar las pruebas que no van de revisión. */
const REV_RECIENTE = '2026-09-15';

function ev(e: Partial<EntradaDispositivo>) {
  return evaluarDispositivoCardiaco({ ultimaRevision: REV_RECIENTE, dependiente: 'no', ...e }, HOY);
}
const notasTexto = (r: ReturnType<typeof evaluarDispositivoCardiaco>) => r.notas.join(' · ');
const tieneP = (r: ReturnType<typeof evaluarDispositivoCardiaco>, id: string) => r.puntos.some((p) => p.id === id);

describe('§5.1 bis · dispositivos cardiacos implantables', () => {
  it('sin tipo: no genera nada', () => {
    const r = evaluarDispositivoCardiaco({}, HOY);
    expect(r.notas).toEqual([]);
    expect(r.puntos).toEqual([]);
  });

  it('Holter: sin precauciones; sin puntos de validación', () => {
    const r = ev({ tipo: 'holter' });
    expect(notasTexto(r)).toMatch(/sin precauciones especiales/);
    expect(r.puntos).toEqual([]);
  });

  it('marcapasos NO dependiente, supraumbilical: monitorizar sin reprogramar; sin punto de dependencia', () => {
    const r = ev({ tipo: 'marcapasos', dependiente: 'no', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/monitorizar para detectar inhibición, sin reprogramar/);
    expect(tieneP(r, 'dispositivo_marcapasos_dependiente')).toBeFalse();
  });

  it('marcapasos dependiente, supraumbilical: modo asíncrono + punto de validación', () => {
    const r = ev({ tipo: 'marcapasos', dependiente: 'si', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/asíncrono/);
    expect(tieneP(r, 'dispositivo_marcapasos_dependiente')).toBeTrue();
  });

  it('marcapasos, infraumbilical no dependiente: monitorizar sin reprogramar; sin punto', () => {
    const r = ev({ tipo: 'marcapasos', dependiente: 'no', zona: 'infraumbilical' });
    expect(notasTexto(r)).toMatch(/infraumbilical: monitorizar, sin reprogramar/);
    expect(r.puntos.filter((p) => p.id.startsWith('dispositivo_'))).toEqual([]);
  });

  it('marcapasos dependiente, infraumbilical: imán disponible, sin punto (baja interferencia)', () => {
    const r = ev({ tipo: 'marcapasos', dependiente: 'si', zona: 'infraumbilical' });
    expect(notasTexto(r)).toMatch(/imán clínico disponible/);
    expect(tieneP(r, 'dispositivo_marcapasos_dependiente')).toBeFalse();
  });

  it('DAI, supraumbilical: desactivar terapias + punto de validación', () => {
    const r = ev({ tipo: 'dai', dependiente: 'no', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/desactivar las terapias del DAI/);
    expect(tieneP(r, 'dispositivo_dai_interferencia')).toBeTrue();
  });

  it('DAI dependiente, supraumbilical: desactivar + frecuencia fija', () => {
    const r = ev({ tipo: 'dai', dependiente: 'si', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/frecuencia fija/);
  });

  it('DAI, infraumbilical: razonable no desactivar; sin punto de interferencia', () => {
    const r = ev({ tipo: 'dai', dependiente: 'no', zona: 'infraumbilical' });
    expect(notasTexto(r)).toMatch(/razonable no desactivar/);
    expect(tieneP(r, 'dispositivo_dai_interferencia')).toBeFalse();
  });

  it('cirugía cardiaca: reprogramación / desactivación', () => {
    const r = ev({ tipo: 'marcapasos', zona: 'cardiaca' });
    expect(notasTexto(r)).toMatch(/Cirugía cardiaca/);
  });

  it('ocular con DAI: como supraumbilical (desactivar) + punto', () => {
    const r = ev({ tipo: 'dai', zona: 'ocular' });
    expect(notasTexto(r)).toMatch(/desactivar las terapias del DAI/);
    expect(tieneP(r, 'dispositivo_dai_interferencia')).toBeTrue();
  });

  it('endoscopia con marcapasos dependiente: punto de validación', () => {
    const r = ev({ tipo: 'marcapasos', dependiente: 'si', zona: 'endoscopia' });
    expect(tieneP(r, 'dispositivo_marcapasos_dependiente')).toBeTrue();
  });

  it('odontología: ninguna medida salvo bisturí eléctrico', () => {
    const r = ev({ tipo: 'marcapasos', zona: 'dental' });
    expect(notasTexto(r)).toMatch(/Odontología/);
  });

  it('litotricia con marcapasos: revisar en el mes siguiente', () => {
    const r = ev({ tipo: 'marcapasos', zona: 'litotricia' });
    expect(notasTexto(r)).toMatch(/revisar el dispositivo en el mes siguiente/);
  });

  it('litotricia con DAI: desactivar o imán + punto', () => {
    const r = ev({ tipo: 'dai', zona: 'litotricia' });
    expect(notasTexto(r)).toMatch(/desactivar las terapias o colocar el imán/);
    expect(tieneP(r, 'dispositivo_dai_interferencia')).toBeTrue();
  });

  it('neurocirugía con DAI: preferir desactivación con programador al imán', () => {
    const r = ev({ tipo: 'dai', zona: 'neurocirugia' });
    expect(notasTexto(r)).toMatch(/preferir la DESACTIVACIÓN con programador/);
  });

  it('marcapasos sin cables: no responde al imán', () => {
    const r = ev({ tipo: 'marcapasos_sin_cables', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/NO responde al imán/);
  });

  it('DAI subcutáneo: no estimula; imán en la axila', () => {
    const r = ev({ tipo: 'dai_subcutaneo', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/no proporciona estimulación/);
  });

  it('imán por fabricante: Abbott desplazado; Biotronik se pierde a las 8 h', () => {
    expect(notasTexto(ev({ tipo: 'marcapasos', zona: 'supraumbilical', fabricante: 'abbott' }))).toMatch(/imán desplazado/);
    expect(notasTexto(ev({ tipo: 'marcapasos', zona: 'supraumbilical', fabricante: 'biotronik' }))).toMatch(/se pierde a las 8 h/);
    expect(notasTexto(ev({ tipo: 'marcapasos', zona: 'supraumbilical', fabricante: 'medtronic' }))).toMatch(/centrado sobre el generador/);
    expect(notasTexto(ev({ tipo: 'marcapasos', zona: 'supraumbilical', fabricante: 'microport' }))).toMatch(/descentrado/);
  });

  it('precauciones generales: ECG, desfibrilador externo, bisturí bipolar', () => {
    const r = ev({ tipo: 'marcapasos', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/ECG desde el inicio/);
    expect(notasTexto(r)).toMatch(/Desfibrilador externo/);
    expect(notasTexto(r)).toMatch(/bisturí bipolar/);
  });

  it('DAI desactivado: nota de reactivación y responsabilidad del equipo', () => {
    const r = ev({ tipo: 'dai', zona: 'supraumbilical' });
    expect(notasTexto(r)).toMatch(/reactivar/i);
    expect(notasTexto(r)).toMatch(/responsabilidad de reactivarlo es del equipo/);
  });

  it('punto por revisión atrasada: marcapasos > 12 meses', () => {
    const r = evaluarDispositivoCardiaco({ tipo: 'marcapasos', zona: 'infraumbilical', dependiente: 'no', ultimaRevision: '2025-01-01' }, HOY);
    expect(tieneP(r, 'dispositivo_revision_atrasada')).toBeTrue();
  });

  it('punto por revisión atrasada: DAI > 6 meses', () => {
    const r = evaluarDispositivoCardiaco({ tipo: 'dai', zona: 'infraumbilical', dependiente: 'no', ultimaRevision: '2026-01-01' }, HOY);
    expect(tieneP(r, 'dispositivo_revision_atrasada')).toBeTrue();
  });

  it('punto por revisión desconocida', () => {
    const r = evaluarDispositivoCardiaco({ tipo: 'marcapasos', zona: 'infraumbilical', dependiente: 'no', ultimaRevision: null }, HOY);
    expect(tieneP(r, 'dispositivo_revision_atrasada')).toBeTrue();
  });

  it('marcapasos revisado hace 3 meses y infraumbilical no dependiente: SIN puntos (solo notas)', () => {
    const r = evaluarDispositivoCardiaco({ tipo: 'marcapasos', zona: 'infraumbilical', dependiente: 'no', ultimaRevision: '2026-07-15' }, HOY);
    expect(r.puntos).toEqual([]);
    expect(r.notas.length).toBeGreaterThan(0);
  });

  it('punto por batería agotándose y por ensayo clínico', () => {
    const r1 = ev({ tipo: 'marcapasos', zona: 'infraumbilical', bateriaAgotandose: 'si' });
    expect(tieneP(r1, 'dispositivo_bateria')).toBeTrue();
    const r2 = ev({ tipo: 'marcapasos', zona: 'infraumbilical', ensayoClinico: true });
    expect(tieneP(r2, 'dispositivo_ensayo')).toBeTrue();
  });
});
