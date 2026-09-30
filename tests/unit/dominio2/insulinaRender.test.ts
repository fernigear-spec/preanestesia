/**
 * Render estructurado del ajuste de insulina (§8.5): mismas cifras/fechas que el
 * motor, compuesto por plantillas (para poder localizarlo sin frases genéricas).
 */
import { describe, it, expect } from '../../_harness.ts';
import { renderInsulina } from '../../../src/ui/paciente/render.ts';
import type { TextosPaciente } from '../../../src/ui/paciente/textosPaciente.ts';
import type { InsulinaQr } from '../../../src/dominio/salidas/qr/hojaPaciente.ts';

const IV = new Date(2026, 9, 15, 8, 0).getTime();

const T = {
  dias_semana: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  med: {
    insulina: {
      momento_manana_fecha: 'la mañana de la intervención ({fecha} a las {hora})',
      momento_manana: 'la mañana de la intervención',
      momento_noche_fecha: 'la noche previa ({fecha} a las {hora})',
      momento_noche: 'la noche previa',
      basal: 'Reduzca su insulina basal: {cuando}, póngase {d} UI en lugar de {o}. Los días anteriores, la dosis de siempre.',
      nph: '{cuandoNoche}, su dosis completa ({noche} UI). {cuandoManana}, {manana} UI en lugar de {mananaOrig} (la mitad).',
      premezclada: '{cuandoManana}, póngase {manana} UI en lugar de {mananaOrig} (la mitad de su dosis habitual).',
      rapida: '{cuandoManana} no se ponga la dosis del desayuno. Solo pauta correctora.',
    },
  },
} as unknown as TextosPaciente;

describe('§8.5 · render de insulina', () => {
  it('basal 30 UI a las 09:00 → 24 UI (80 %) la mañana de la intervención', () => {
    const ins: InsulinaQr = { tipo: 'basal', tomas: [{ m: 'manana_intervencion', d: 24, o: 30, h: '09:00' }] };
    const txt = renderInsulina(ins, T, IV);
    expect(txt).toContain('24 UI');
    expect(txt).toContain('en lugar de 30');
    expect(txt).toContain('jueves 15 de octubre');
  });

  it('NPH: dosis completa la noche previa y mitad la mañana', () => {
    const ins: InsulinaQr = { tipo: 'nph', nocheUi: 10, mananaUi: 10, mananaOrig: 20, horaNoche: '21:00', horaManana: '08:00' };
    const txt = renderInsulina(ins, T, IV);
    expect(txt).toContain('miércoles 14 de octubre'); // noche previa
    expect(txt).toContain('dosis completa (10 UI)');
    expect(txt).toContain('10 UI en lugar de 20');
  });

  it('sin fecha, usa los momentos genéricos sin fecha', () => {
    const ins: InsulinaQr = { tipo: 'premezclada', mananaUi: 10, mananaOrig: 20, horaManana: '08:00' };
    const txt = renderInsulina(ins, T, null);
    expect(txt).toContain('mañana de la intervención');
    expect(txt).toContain('10 UI en lugar de 20');
  });
});
