/**
 * Resolución del aclaramiento de creatinina de la entrevista (§8.2/§8.4):
 * módulo renal/trasplante (prioritario) o dato manual del paso 8 (aclaramiento,
 * creatinina → Cockcroft-Gault, o «no disponible» → requiere confirmación, A7).
 */
import { describe, it, expect } from '../../_harness.ts';
import { resolverAclaramiento } from '../../../src/dominio/entrevista/aclaramiento.ts';

const DATOS = { edadAnios: 70, pesoKg: 70, sexo: 'hombre' as const };

describe('§8.2/§8.4 · resolverAclaramiento', () => {
  it('si el módulo aporta el aclaramiento, manda (fuente módulo), ignorando el manual', () => {
    const r = resolverAclaramiento(45, { tipo: 'aclaramiento', valor: 90 }, DATOS);
    expect(r.valor).toBe(45);
    expect(r.fuente).toBe('modulo');
  });

  it('sin módulo y con aclaramiento manual: usa el manual', () => {
    const r = resolverAclaramiento(null, { tipo: 'aclaramiento', valor: 55 }, DATOS);
    expect(r.valor).toBe(55);
    expect(r.fuente).toBe('manual');
  });

  it('sin módulo y con creatinina manual: calcula Cockcroft-Gault', () => {
    // ((140-70)*70)/(72*1) = 68,06 mL/min (varón, creatinina 1,0).
    const r = resolverAclaramiento(null, { tipo: 'creatinina', valor: 1.0 }, DATOS);
    expect(r.valor).toBeCloseTo(68.1, 1);
    expect(r.fuente).toBe('manual');
  });

  it('«no disponible» → null (regla requiere confirmación, A7)', () => {
    const r = resolverAclaramiento(null, { tipo: 'no_disponible' }, DATOS);
    expect(r.valor).toBe(null);
    expect(r.fuente).toBe('manual');
  });

  it('sin módulo y sin manual → null, fuente ninguno', () => {
    const r = resolverAclaramiento(null, null, DATOS);
    expect(r.valor).toBe(null);
    expect(r.fuente).toBe('ninguno');
  });

  it('aclaramiento manual no positivo se trata como desconocido', () => {
    expect(resolverAclaramiento(null, { tipo: 'aclaramiento', valor: 0 }, DATOS).valor).toBe(null);
  });
});
