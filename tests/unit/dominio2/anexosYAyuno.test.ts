/**
 * Hojas anexas (§8.14 bis) y bebida de carbohidratos en diabéticos (§8.14).
 */
import { describe, it, expect } from '../../_harness.ts';
import { derivarHojaExtras, type EntradaHojaExtras } from '../../../src/dominio/entrevista/hojaExtras.ts';
import { calcularAyuno } from '../../../src/dominio/ayuno/ayuno.ts';

const IV = new Date(2026, 9, 15, 8, 0);

function base(p: Partial<EntradaHojaExtras> = {}): EntradaHojaExtras {
  return {
    edadAnios: 50, enfermedades: new Set(), respuestas: {}, tabacoActivo: false,
    auditPositivo: false, edadPediatricaMaxima: 17, glp1Semanal: false, diabetes: false, ...p,
  };
}
const anexos = (p: Partial<EntradaHojaExtras>) => derivarHojaExtras(base(p)).extras.anexos;

describe('§8.14 bis · selección de hojas anexas', () => {
  it('GLP-1 semanal sin diabetes → anexo 1 (dieta líquida 24 h)', () => {
    expect(anexos({ glp1Semanal: true })).toContain('liquida24h');
  });
  it('GLP-1 semanal con diabetes → anexo 2 (dieta líquida diabético)', () => {
    expect(anexos({ glp1Semanal: true, diabetes: true })).toContain('liquida24h_diabetes');
  });
  it('diabetes sin GLP-1 semanal → anexo 3 (ayuno diabético)', () => {
    expect(anexos({ diabetes: true })).toContain('ayuno_diabetico');
  });
  it('fumador → anexo 4 (tabaco); AUDIT-C positivo → anexo 5 (alcohol)', () => {
    expect(anexos({ tabacoActivo: true })).toContain('tabaco');
    expect(anexos({ auditPositivo: true })).toContain('alcohol');
  });
  it('sin factores → sin anexos', () => {
    expect(anexos({}).length).toBe(0);
  });
});

describe('§8.14 · bebida de carbohidratos en diabéticos', () => {
  const tieneCarbs = (situacion: 'diabetes' | 'diabetes_gastroparesia') =>
    calcularAyuno({ induccion: IV, pediatrico: false, situacion }).lineas.some((l) => l.codigo === 'bebida_carbohidratos');

  it('diabético sin gastroparesia: SÍ se ofrece la bebida de carbohidratos', () => {
    expect(tieneCarbs('diabetes')).toBeTrue();
  });
  it('diabético con gastroparesia: NO se ofrece la bebida de carbohidratos', () => {
    expect(tieneCarbs('diabetes_gastroparesia')).toBeFalse();
  });
});
