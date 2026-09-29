import { describe, it, expect } from '../../_harness.ts';
import { calcularEgri } from '../../../src/dominio/escalas/egri.ts';

describe('EGRI (El-Ganzouri)', () => {
  it('caso 10 §15: AB 3,5 cm, DTM 5,5 cm, Mallampati III, 95 kg, resto normal → EGRI 6, riesgo elevado', () => {
    const r = calcularEgri({
      aperturaBucal: 'lt_4', // 3,5 cm → < 4 cm = 1
      distanciaTiromentoniana: 'lt_6', // 5,5 cm → < 6 cm = 2
      mallampati: 3, // III = 2
      movilidadCervical: 'gt_90', // normal = 0
      puedeProtruir: true, // 0
      pesoKg: 95, // 90-110 = 1
      intubacionDificilPrevia: 'no', // 0
    });
    expect(r.puntuacion).toBe(6);
    expect(r.categoria).toBe('riesgo elevado');
  });

  it('todo normal → EGRI 0', () => {
    const r = calcularEgri({
      aperturaBucal: 'ge_4',
      distanciaTiromentoniana: 'gt_6_5',
      mallampati: 1,
      movilidadCervical: 'gt_90',
      puedeProtruir: true,
      pesoKg: 70,
      intubacionDificilPrevia: 'no',
    });
    expect(r.puntuacion).toBe(0);
    expect(r.categoria).toBe('riesgo no elevado');
  });

  it('máximo de peso > 110 kg suma 2', () => {
    const r = calcularEgri({ pesoKg: 120 });
    expect(r.puntuacion).toBe(2);
  });

  it('parcial (telefónica): suma solo los componentes presentes', () => {
    const r = calcularEgri({ mallampati: 4 }); // III/IV = 2
    expect(r.puntuacion).toBe(2);
  });

  it('umbral: EGRI 4 es riesgo elevado', () => {
    const r = calcularEgri({ mallampati: 3, movilidadCervical: 'lt_80' }); // 2 + 2
    expect(r.puntuacion).toBe(4);
    expect(r.categoria).toBe('riesgo elevado');
  });
});
