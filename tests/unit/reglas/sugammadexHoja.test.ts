/**
 * Advertencia del sugammadex en la HOJA DEL PACIENTE (§8.15). Debe aparecer según
 * la vía del anticonceptivo hormonal y NO aparecer con la terapia hormonal
 * sustitutiva (THS, que no es anticonceptiva) ni sin posible anestesia general.
 */
import { describe, it, expect } from '../../_harness.ts';
import { sugammadexParaHoja, esAnticonceptivoHormonal } from '../../../src/dominio/reglas/sugammadex.ts';
import { derivarHojaExtras, type EntradaHojaExtras } from '../../../src/dominio/entrevista/hojaExtras.ts';

function base(p: Partial<EntradaHojaExtras> = {}): EntradaHojaExtras {
  return {
    edadAnios: 35, enfermedades: new Set(), respuestas: {}, tabacoActivo: false,
    auditPositivo: false, edadPediatricaMaxima: 17, glp1Semanal: false, diabetes: false, ...p,
  };
}

describe('§8.15 · advertencia del sugammadex en la hoja del paciente', () => {
  it('anticonceptivo ORAL + posible anestesia general → aviso "oral"', () => {
    const v = sugammadexParaHoja([{ idFarmaco: 'anticonceptivo_oral_combinado', via: 'oral' }], true);
    expect(v).toBe('oral');
  });

  it('anticonceptivo NO oral (implante) → aviso "no_oral"', () => {
    expect(sugammadexParaHoja([{ idFarmaco: 'anticonceptivo_implante', via: 'implante' }], true)).toBe('no_oral');
    expect(sugammadexParaHoja([{ idFarmaco: 'anticonceptivo_diu_hormonal', via: 'intrauterina' }], true)).toBe('no_oral');
    expect(sugammadexParaHoja([{ idFarmaco: 'anticonceptivo_parche', via: 'transdermica' }], true)).toBe('no_oral');
  });

  it('THS (no anticonceptiva) → sin aviso, aunque haya posible anestesia general', () => {
    expect(esAnticonceptivoHormonal('ths_oral')).toBeFalse();
    expect(sugammadexParaHoja([{ idFarmaco: 'ths_oral', via: 'oral' }], true)).toBeUndefined();
    expect(sugammadexParaHoja([{ idFarmaco: 'ths', via: 'oral' }], true)).toBeUndefined();
  });

  it('sin posible anestesia general → sin aviso', () => {
    expect(sugammadexParaHoja([{ idFarmaco: 'anticonceptivo_oral_combinado', via: 'oral' }], false)).toBeUndefined();
  });

  it('sin anticonceptivo → sin aviso', () => {
    expect(sugammadexParaHoja([{ idFarmaco: 'eutirox', via: 'oral' }], true)).toBeUndefined();
  });

  it('el aviso llega a los extras de la hoja (derivarHojaExtras)', () => {
    expect(derivarHojaExtras(base({ sugammadex: 'oral' })).extras.sugammadex).toBe('oral');
    expect(derivarHojaExtras(base({ sugammadex: 'no_oral' })).extras.sugammadex).toBe('no_oral');
    expect(derivarHojaExtras(base({})).extras.sugammadex).toBeUndefined();
  });
});
