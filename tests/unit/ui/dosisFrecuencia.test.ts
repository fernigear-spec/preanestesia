/**
 * Dosis y frecuencia informativas del paso 8 (§8): texto legible para el resumen
 * y la hoja del paciente, y horas de toma que implica cada frecuencia (para el
 * aviso de descuadre entre la frecuencia elegida y las horas marcadas).
 */
import { describe, it, expect } from '../../_harness.ts';
import { textoDosisFrecuencia, horasEsperadasDeFrecuencia } from '../../../src/ui/estadoEntrevista.ts';

describe('§8 · textoDosisFrecuencia', () => {
  it('dosis genérica con unidad conocida + frecuencia: «100 mg cada 24 h»', () => {
    expect(textoDosisFrecuencia({ dosisCantidad: 100, dosisUnidad: 'mg', frecuencia: 'c24h' }))
      .toBe('100 mg cada 24 h');
  });

  it('traduce la unidad mcg a su símbolo µg', () => {
    expect(textoDosisFrecuencia({ dosisCantidad: 50, dosisUnidad: 'mcg', frecuencia: 'c12h' }))
      .toBe('50 µg cada 12 h');
  });

  it('unidad «otra» usa el texto libre; frecuencia «otra» también', () => {
    expect(textoDosisFrecuencia({
      dosisCantidad: 2, dosisUnidad: 'otra', dosisUnidadOtra: 'sobres',
      frecuencia: 'otra', frecuenciaOtra: 'en ayunas',
    })).toBe('2 sobres en ayunas');
  });

  it('«a demanda» se escribe en minúsculas y sin dosis si no se indica', () => {
    expect(textoDosisFrecuencia({ frecuencia: 'a_demanda' })).toBe('a demanda');
  });

  it('sin dosis genérica, usa la dosis específica (mg) de la regla', () => {
    expect(textoDosisFrecuencia({ dosisMg: 100, frecuencia: 'c24h' })).toBe('100 mg cada 24 h');
  });

  it('la dosis genérica tiene prioridad sobre la específica cuando existe', () => {
    expect(textoDosisFrecuencia({ dosisCantidad: 75, dosisUnidad: 'mg', dosisMg: 100 }))
      .toBe('75 mg');
  });

  it('sin ningún dato devuelve cadena vacía', () => {
    expect(textoDosisFrecuencia({})).toBe('');
  });

  it('ignora cantidades no positivas', () => {
    expect(textoDosisFrecuencia({ dosisCantidad: 0, dosisUnidad: 'mg', frecuencia: 'c8h' }))
      .toBe('cada 8 h');
  });
});

describe('§8 · horasEsperadasDeFrecuencia', () => {
  it('cada 24 h → 1 toma, cada 12 h → 2, cada 8 h → 3, cada 6 h → 4', () => {
    expect(horasEsperadasDeFrecuencia('c24h')).toBe(1);
    expect(horasEsperadasDeFrecuencia('c12h')).toBe(2);
    expect(horasEsperadasDeFrecuencia('c8h')).toBe(3);
    expect(horasEsperadasDeFrecuencia('c6h')).toBe(4);
  });

  it('semanal, a demanda, otra o indefinida no implican un nº fijo de tomas', () => {
    expect(horasEsperadasDeFrecuencia('semanal')).toBe(undefined);
    expect(horasEsperadasDeFrecuencia('a_demanda')).toBe(undefined);
    expect(horasEsperadasDeFrecuencia('otra')).toBe(undefined);
    expect(horasEsperadasDeFrecuencia(undefined)).toBe(undefined);
  });
});
