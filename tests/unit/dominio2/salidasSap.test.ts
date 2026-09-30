/**
 * Texto de SAP (§10.1) y ASA sugerido (§6.1).
 */
import { describe, it, expect } from '../../_harness.ts';
import { construirSap, type EntradaSap } from '../../../src/dominio/salidas/construirSap.ts';
import { derivarAsa, type EntradaAsa } from '../../../src/dominio/salidas/asaSugerido.ts';

function entradaSap(p: Partial<EntradaSap> = {}): EntradaSap {
  return {
    cabecera: 'VALORACION PREANESTESICA ENFERMERIA 30/09/2026 (presencial)',
    antecedentesPatologicos: ['Cardiopatia isquemica: IAM 2021, stent farmacoactivo 03/2024', 'diabetes mellitus, HbA1c 7,2%'],
    antecedentesQuirurgicos: ['colecistectomia, 2010, anestesia general, incidencias: nvpo'],
    ...p,
  };
}

describe('§10.1 · texto de SAP (solo antecedentes patológicos y quirúrgicos)', () => {
  it('compone AP y AQ y NO incluye alergias, hábitos, medicación, escalas, ASA ni pruebas', () => {
    const r = construirSap(entradaSap());
    expect(r.texto).toContain('AP: Cardiopatia isquemica');
    expect(r.texto).toContain('AQ: colecistectomia, 2010, anestesia general');
    expect(r.texto).not.toContain('Alergias');
    expect(r.texto).not.toContain('Habitos');
    expect(r.texto).not.toContain('Escalas');
    expect(r.texto).not.toContain('ASA');
    expect(r.texto).not.toContain('Pruebas');
  });

  it('sin antecedentes: indica que no hay patológicos ni quirúrgicos', () => {
    const r = construirSap(entradaSap({ antecedentesPatologicos: [], antecedentesQuirurgicos: [] }));
    expect(r.texto).toContain('sin antecedentes patologicos');
    expect(r.texto).toContain('sin intervenciones previas');
  });

  it('opción solo ASCII quita tildes y símbolos', () => {
    const r = construirSap(entradaSap(), { soloAscii: true });
    expect(/[áéíóúñ«»]/.test(r.texto)).toBeFalse();
  });
});

function entradaAsa(p: Partial<EntradaAsa> = {}): EntradaAsa {
  return { edadAnios: 50, imc: 24, embarazada: false, tabacoActivo: false, abusoAlcohol: false, enfermedades: new Set(), respuestas: {}, ...p };
}

describe('§6.1 · ASA sugerido', () => {
  it('sano → ASA I', () => {
    expect(derivarAsa(entradaAsa()).clase).toBe(1);
  });
  it('fumador activo → ASA II', () => {
    expect(derivarAsa(entradaAsa({ tabacoActivo: true })).clase).toBe(2);
  });
  it('EPOC → ASA III', () => {
    const r = derivarAsa(entradaAsa({ enfermedades: new Set(['asma_epoc']), respuestas: { asma_epoc: { enfermedad: 'epoc' } } }));
    expect(r.clase).toBe(3);
  });
  it('insuficiencia cardiaca NYHA IV → ASA IV', () => {
    const r = derivarAsa(entradaAsa({ enfermedades: new Set(['insuficiencia_cardiaca']), respuestas: { insuficiencia_cardiaca: { nyha: 'IV' } } }));
    expect(r.clase).toBe(4);
  });
  it('override manual', () => {
    expect(derivarAsa(entradaAsa({ claseManual: 3 })).clase).toBe(3);
  });
});
