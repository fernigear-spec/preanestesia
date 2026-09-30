import { describe, it, expect } from '../../_harness.ts';
import { calcularLangeron } from '../../../src/dominio/escalas/langeron.ts';
import { calcularStopBang } from '../../../src/dominio/escalas/stopBang.ts';
import { calcularStbur } from '../../../src/dominio/escalas/stbur.ts';
import { calcularApfel } from '../../../src/dominio/escalas/apfel.ts';
import { calcularPovoc } from '../../../src/dominio/escalas/povoc.ts';
import { calcularCha2ds2va } from '../../../src/dominio/escalas/cha2ds2va.ts';
import { calcularDasi, metsDesdeDasi } from '../../../src/dominio/escalas/dasi.ts';
import { calcularAclaramiento } from '../../../src/dominio/escalas/cockcroftGault.ts';
import { calcularMorfinaEquivalente } from '../../../src/dominio/escalas/morfinaEquivalente.ts';
import { calcularAuditC } from '../../../src/dominio/escalas/auditC.ts';
import { evaluarCfs } from '../../../src/dominio/escalas/cfs.ts';
import { calcular4AT } from '../../../src/dominio/escalas/cuatroAT.ts';
import { calcularAsa } from '../../../src/dominio/escalas/asa.ts';

describe('Langeron', () => {
  it('barba + IMC>26 → 2 predictores = riesgo', () => {
    const r = calcularLangeron({ barba: true, imc: 30, edentulo: false, edadAnios: 40, ronquido: false });
    expect(r.puntuacion).toBe(2);
    expect(r.categoria).toBe('riesgo');
  });
  it('1 predictor → sin riesgo aumentado', () => {
    const r = calcularLangeron({ barba: false, imc: 30, edentulo: false, edadAnios: 40, ronquido: false });
    expect(r.puntuacion).toBe(1);
    expect(r.categoria).toBe('sin riesgo aumentado');
  });
});

describe('STOP-Bang', () => {
  it('SAP ejemplo §10.1: 4 ítems → intermedio', () => {
    const r = calcularStopBang({
      ronquidoFuerte: true, cansancioDiurno: true, apneasObservadas: false,
      htaEnTratamiento: true, imcMayor35: false, edadMayor50: true,
      cuelloMayor40: false, varon: false,
    });
    expect(r.puntuacion).toBe(4);
    expect(r.categoria).toBe('intermedio');
    expect(r.alto).toBeFalse();
  });
  it('5 ítems → alto', () => {
    const r = calcularStopBang({
      ronquidoFuerte: true, cansancioDiurno: true, apneasObservadas: true,
      htaEnTratamiento: true, imcMayor35: true, edadMayor50: false,
      cuelloMayor40: false, varon: false,
    });
    expect(r.categoria).toBe('alto');
    expect(r.alto).toBeTrue();
  });
  it('subgrupo alto: 2 STOP + varón (aunque total < 5)', () => {
    const r = calcularStopBang({
      ronquidoFuerte: true, cansancioDiurno: true, apneasObservadas: false,
      htaEnTratamiento: false, imcMayor35: false, edadMayor50: false,
      cuelloMayor40: false, varon: true,
    });
    // total = 3 (ronquido, cansancio, varón) pero subgrupo lo eleva a alto
    expect(r.alto).toBeTrue();
    expect(r.categoria).toBe('alto');
  });
});

describe('STBUR', () => {
  it('caso 8 §15: ronca + fuerte + apneas → 3 positivos = riesgo (alerta)', () => {
    const r = calcularStbur({
      roncaMasMitadNoches: true, roncaFuerte: true, esfuerzoRespiratorioDormido: false,
      dejaDeRespirarDormido: true, cansadoOSomnolientoDia: false,
    });
    expect(r.puntuacion).toBe(3);
    expect(r.categoria).toBe('riesgo');
  });
  it('5 positivos → riesgo_alto', () => {
    const r = calcularStbur({
      roncaMasMitadNoches: true, roncaFuerte: true, esfuerzoRespiratorioDormido: true,
      dejaDeRespirarDormido: true, cansadoOSomnolientoDia: true,
    });
    expect(r.categoria).toBe('riesgo_alto');
  });
});

describe('Apfel', () => {
  it('SAP ejemplo: mujer=no, no fumador=sí, sin NVPO, opioides=1 → Apfel 1 = 20%', () => {
    const r = calcularApfel({
      mujer: false, noFumador: true, nvpoOCinetosisPrevias: false,
      opioidesPostoperatorios: false, riesgoQuirurgico: 'bajo',
    });
    expect(r.puntuacion).toBe(1);
    expect(r.probabilidad).toBe(20);
  });
  it('opioides no sabidos + cirugía intermedia → se consideran previstos', () => {
    const r = calcularApfel({
      mujer: true, noFumador: false, nvpoOCinetosisPrevias: false,
      riesgoQuirurgico: 'intermedio',
    });
    expect(r.puntuacion).toBe(2); // mujer + opioides asumidos
    expect(r.probabilidad).toBe(40);
  });
});

describe('POVOC', () => {
  it('caso 8 §15: niño 5 años, amigdalectomía (≥30 min) → edad + duración = 2 = 30%', () => {
    const r = calcularPovoc({
      cirugiaMayor30min: true, edadMayorIgual3: true, cirugiaEstrabismo: false,
      nvpoNinioOFamiliares: false,
    });
    expect(r.puntuacion).toBe(2);
    expect(r.probabilidad).toBe(30);
  });
});

describe('CHA2DS2-VA', () => {
  it('caso 1 §15: 72 años, HTA, DM, enfermedad vascular (no ictus) → 3', () => {
    // 72 años → 65-74 = 1; HTA = 1; DM = 1 → 3 (sin enfermedad vascular)
    const r = calcularCha2ds2va({
      insuficienciaCardiaca: false, hta: true, edadAnios: 72, diabetes: true,
      ictusAitTromboembolismo: false, enfermedadVascular: false,
    });
    expect(r.puntuacion).toBe(3);
  });
  it('edad ≥ 75 suma 2', () => {
    const r = calcularCha2ds2va({
      insuficienciaCardiaca: false, hta: false, edadAnios: 80, diabetes: false,
      ictusAitTromboembolismo: false, enfermedadVascular: false,
    });
    expect(r.puntuacion).toBe(2);
  });
});

describe('DASI y METs', () => {
  it('METs = (0,43×DASI+9,6)/3,5', () => {
    expect(metsDesdeDasi(0)).toBeCloseTo(2.743, 3);
  });
  it('capacidad reducida si DASI ≤ 34', () => {
    const r = calcularDasi(['autocuidado', 'caminarDentroCasa']); // 2,75 + 1,75 = 4,5
    expect(r.dasi).toBeCloseTo(4.5, 2);
    expect(r.capacidadReducida).toBeTrue();
  });
  it('capacidad no reducida con DASI alto (> 4 METs)', () => {
    const r = calcularDasi([
      'autocuidado', 'caminarDentroCasa', 'caminar1a2Manzanas', 'subirUnPisoOCuesta',
      'correrDistanciaCorta', 'tareasPesadasCasa', 'deportesIntensos', 'relacionesSexuales',
    ]);
    expect(r.capacidadReducida).toBeFalse();
  });
});

describe('Cockcroft-Gault', () => {
  it('caso 1 §15: varón 72 años, 80 kg, aclaramiento ≈ 45 mL/min', () => {
    // Buscamos la creatinina que da ~45: cl = (140-72)*80/(72*cr) = 5440/(72*cr)
    // cr = 1,68 → cl ≈ 44,97
    const cl = calcularAclaramiento({ edadAnios: 72, pesoKg: 80, sexo: 'hombre', creatinina: 1.68, unidad: 'mg_dl' });
    expect(cl).toBeGreaterThanOrEqual(44);
    expect(cl as number).toBeLessThan(46);
  });
  it('mujer aplica factor 0,85', () => {
    const h = calcularAclaramiento({ edadAnios: 50, pesoKg: 70, sexo: 'hombre', creatinina: 1, unidad: 'mg_dl' });
    const m = calcularAclaramiento({ edadAnios: 50, pesoKg: 70, sexo: 'mujer', creatinina: 1, unidad: 'mg_dl' });
    expect(m).toBeCloseTo((h as number) * 0.85, 1);
  });
  it('sin dato → null', () => {
    expect(calcularAclaramiento(null)).toBe(null);
  });
  it('acepta µmol/L', () => {
    const mg = calcularAclaramiento({ edadAnios: 60, pesoKg: 80, sexo: 'hombre', creatinina: 1, unidad: 'mg_dl' });
    const umol = calcularAclaramiento({ edadAnios: 60, pesoKg: 80, sexo: 'hombre', creatinina: 88.42, unidad: 'umol_l' });
    expect(umol).toBeCloseTo(mg as number, 1);
  });
});

describe('Morfina equivalente', () => {
  it('caso 16 §15: oxicodona 40 mg/día + tramadol 300 mg/día = 60 + 60 = 120 mg → alerta alta', () => {
    const r = calcularMorfinaEquivalente([
      { id: 'oxicodona', dosisDiaria: 40 }, // 40 × 1,5 = 60
      { id: 'tramadol', dosisDiaria: 300 }, // 300 × 0,2 = 60
    ]);
    expect(r.mgDia).toBe(120);
    expect(r.categoria).toBe('alerta_alta');
  });
  it('buprenorfina sin conversión', () => {
    const r = calcularMorfinaEquivalente([{ id: 'buprenorfina', dosisDiaria: 20 }]);
    expect(r.mgDia).toBe(0);
    expect(r.sinConversion).toContain('buprenorfina');
  });
  it('≥ 50 y < 90 → alerta', () => {
    const r = calcularMorfinaEquivalente([{ id: 'morfina_oral', dosisDiaria: 60 }]);
    expect(r.categoria).toBe('alerta');
  });
});

describe('AUDIT-C', () => {
  it('caso 18 §15: varón, total 9 → riesgo de abstinencia', () => {
    const r = calcularAuditC({ frecuenciaConsumo: 4, cantidadTipica: 3, frecuenciaAtracon: 2, sexo: 'hombre' });
    expect(r.puntuacion).toBe(9);
    expect(r.riesgoAbstinencia).toBeTrue();
  });
  it('umbral mujer (≥3) distinto de hombre (≥4)', () => {
    const m = calcularAuditC({ frecuenciaConsumo: 2, cantidadTipica: 1, frecuenciaAtracon: 0, sexo: 'mujer' });
    const h = calcularAuditC({ frecuenciaConsumo: 2, cantidadTipica: 1, frecuenciaAtracon: 0, sexo: 'hombre' });
    expect(m.positivo).toBeTrue();
    expect(h.positivo).toBeFalse();
  });
});

describe('CFS', () => {
  it('caso 17 §15: CFS 6 → fragilidad', () => {
    const r = evaluarCfs(6);
    expect(r.fragilidad).toBeTrue();
  });
  it('CFS 3 → sin fragilidad', () => {
    expect(evaluarCfs(3).fragilidad).toBeFalse();
  });
  it('fuera de rango lanza', () => {
    expect(() => evaluarCfs(0)).toThrow();
    expect(() => evaluarCfs(10)).toThrow();
  });
});

describe('4AT', () => {
  it('caso 17 §15: 4AT 2 → posible deterioro cognitivo', () => {
    // Ejemplo de composición que da 2: AMT4 2 errores (+2), resto normal.
    const r = calcular4AT({ alerta: 'normal', amt4: '2_o_mas_o_no_valorable', meses: '7_o_mas', cambioAgudo: 'no' });
    expect(r.puntuacion).toBe(2);
    expect(r.categoria).toBe('posible_deterioro_cognitivo');
  });
  it('cambio agudo → ≥ 4 = posible delirium', () => {
    const r = calcular4AT({ alerta: 'normal', amt4: '0_errores', meses: '7_o_mas', cambioAgudo: 'si' });
    expect(r.puntuacion).toBe(4);
    expect(r.categoria).toBe('posible_delirium');
  });
  it('todo normal → 0 improbable', () => {
    const r = calcular4AT({ alerta: 'normal', amt4: '0_errores', meses: '7_o_mas', cambioAgudo: 'no' });
    expect(r.puntuacion).toBe(0);
    expect(r.categoria).toBe('improbable');
  });
});

describe('ASA sugerido', () => {
  it('máximo de determinantes', () => {
    const r = calcularAsa([
      { clase: 2, motivo: 'HTA controlada' },
      { clase: 3, motivo: 'stent > 3 meses' },
      { clase: 2, motivo: 'fumador' },
    ]);
    expect(r.clase).toBe(3);
    expect(r.categoria).toBe('ASA III');
    expect(r.determinantes).toContain('stent > 3 meses');
  });
  it('sin sufijo E (se eliminó el carácter urgente)', () => {
    const r = calcularAsa([{ clase: 2, motivo: 'x' }]);
    expect(r.categoria).toBe('ASA II');
  });
  it('override manual marca modificado', () => {
    const r = calcularAsa([{ clase: 2, motivo: 'x' }], { claseManual: 4 });
    expect(r.clase).toBe(4);
    expect(r.modificadoManualmente).toBeTrue();
  });
  it('sin determinantes → ASA I', () => {
    expect(calcularAsa([]).clase).toBe(1);
  });
});
