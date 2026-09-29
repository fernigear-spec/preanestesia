import { describe, it, expect } from '../../_harness.ts';
import type { ContextoReglas } from '../../../src/dominio/tipos.ts';
import { reglaAcod } from '../../../src/dominio/reglas/acod.ts';
import {
  reglaAas,
  reglaP2y12,
  evaluarStent,
  reglaP2y12Oftalmo,
} from '../../../src/dominio/reglas/antiagregantes.ts';
import { reglaAvk } from '../../../src/dominio/reglas/antivitaminaK.ts';
import { reglaLitio } from '../../../src/dominio/reglas/psicofarmacos.ts';
import { reglaAine } from '../../../src/dominio/reglas/aine.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal, reglaGlp1Diario, reglaBombaInsulina } from '../../../src/dominio/reglas/antidiabeticos.ts';
import { reglaSacubitriloValsartan, reglaIecaAra2 } from '../../../src/dominio/reglas/cardiovasculares.ts';
import { reglaNoCatalogado, aplicarPlazoNoAlcanzable } from '../../../src/dominio/reglas/otros.ts';
import { fechaHoraLimite } from '../../../src/dominio/fechas/plazos.ts';

// Intervención de referencia: jueves 15 de octubre de 2026, 08:00.
const IV = new Date(2026, 9, 15, 8, 0);

function ctx(parcial: Partial<ContextoReglas> = {}): ContextoReglas {
  return {
    fechaHoraIntervencion: IV,
    riesgoHemorragico: 'alto',
    riesgoCardiovascular: 'intermedio',
    grupoOftalmologico: 'no_aplica',
    neuroaxial: false,
    bloqueoProfundo: false,
    riesgoTromboticoAlto: false,
    regimen: 'ingreso',
    pesoKg: 80,
    aclaramiento: null,
    ...parcial,
  };
}

/** Horas entre la fecha límite y la intervención. */
function horasAntes(limite: Date): number {
  return Math.round((IV.getTime() - limite.getTime()) / 3_600_000);
}

describe('ACOD (§8.2)', () => {
  it('caso 1 §15: apixabán (anti-Xa), prótesis rodilla (hemorrágico alto) + raquídea, CrCl 45 → 72 h', () => {
    const r = reglaAcod(
      { idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' },
      ctx({ riesgoHemorragico: 'alto', neuroaxial: true, aclaramiento: 45 }),
    );
    expect(r.accion).toBe('suspender');
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(72);
    expect(r.requiereConfirmacion).toBeFalse();
  });

  it('caso 2 §15: dabigatrán, CrCl 40, colecistectomía AG (sin neuroaxial) → 48 + 48 = 96 h', () => {
    const r = reglaAcod(
      { idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' },
      // colecistectomía laparoscópica: riesgo hemorrágico bajo, sin neuroaxial → base 48
      ctx({ riesgoHemorragico: 'bajo', neuroaxial: false, aclaramiento: 40 }),
    );
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(96);
  });

  it('dabigatrán + neuroaxial: 72/96/120 h según CrCl', () => {
    const mk = (crcl: number) =>
      reglaAcod(
        { idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' },
        ctx({ neuroaxial: true, aclaramiento: crcl }),
      );
    expect(horasAntes(mk(90).fechaHoraUltimaToma as Date)).toBe(72);
    expect(horasAntes(mk(60).fechaHoraUltimaToma as Date)).toBe(96);
    expect(horasAntes(mk(40).fechaHoraUltimaToma as Date)).toBe(120);
  });

  it('anti-Xa + neuroaxial + CrCl < 30 → 96 h', () => {
    const r = reglaAcod(
      { idFarmaco: 'rivaroxaban', nombreComercial: 'Xarelto', principioActivo: 'rivaroxaban', subtipo: 'antixa' },
      ctx({ neuroaxial: true, aclaramiento: 25 }),
    );
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(96);
  });

  it('oftalmología riesgo bajo: no suspender', () => {
    const r = reglaAcod(
      { idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' },
      ctx({ grupoOftalmologico: 'riesgo_bajo' }),
    );
    expect(r.accion).toBe('mantener');
  });

  it('sin aclaramiento → requiere confirmación e indica el dato que falta', () => {
    const r = reglaAcod(
      { idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' },
      ctx({ neuroaxial: false, riesgoHemorragico: 'bajo', aclaramiento: null }),
    );
    expect(r.requiereConfirmacion).toBeTrue();
    expect(r.datoQueFalta).toBe('aclaramiento de creatinina');
  });
});

describe('Antiagregantes (§8.3)', () => {
  it('AAS 100 mg: mantener', () => {
    const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 100 }, ctx());
    expect(r.accion).toBe('mantener');
  });

  it('caso 7 §15: prótesis de cadera con raquídea y ticagrelor → 7 días', () => {
    const r = reglaP2y12(
      { idFarmaco: 'ticagrelor', nombreComercial: 'Brilique', principio: 'ticagrelor', monoterapia: false },
      ctx({ neuroaxial: true }),
    );
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(7 * 24);
  });

  it('clopidogrel sin neuroaxial → 5 días', () => {
    const r = reglaP2y12(
      { idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false },
      ctx({ neuroaxial: false }),
    );
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(5 * 24);
  });

  it('caso 6 §15: vitrectomía (oftalmo moderado/alto) con clopidogrel monoterapia → sustituir por AAS y suspender 5 días', () => {
    const r = reglaP2y12Oftalmo(
      { idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: true },
      ctx({ grupoOftalmologico: 'riesgo_moderado_alto', riesgoHemorragico: 'minimo' }),
    );
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(5 * 24);
    expect(r.textoAnestesiologo).toContain('AAS 100');
  });

  it('caso 3 §15: stent farmacoactivo 4 meses tras SCA → alerta de diferir, requiere confirmación, suprime pauta en hoja', () => {
    const s = evaluarStent({ mesesDesdeImplante: 4, traSca: true }, ctx({ neuroaxial: false }));
    expect(s.recienteRequiereConfirmacion).toBeTrue();
    expect(s.suprimirPautaAntiagregantesEnHoja).toBeTrue();
    expect(s.alertas[0]?.gravedad).toBe('roja');
  });

  it('caso Decisión 3: stent reciente + neuroaxial → doble alerta, stent primero y en rojo', () => {
    const s = evaluarStent({ mesesDesdeImplante: 4, traSca: true }, ctx({ neuroaxial: true }));
    expect(s.alertas).toHaveLength(2);
    expect(s.alertas[0]?.gravedad).toBe('roja');
    expect(s.alertas[0]?.origen).toContain('§8.3');
  });

  it('stent antiguo (SCA hace 18 meses) → no reciente', () => {
    const s = evaluarStent({ mesesDesdeImplante: 18, traSca: true }, ctx());
    expect(s.recienteRequiereConfirmacion).toBeFalse();
  });
});

describe('Antivitamina K (§8.1)', () => {
  it('caso 5 §15: catarata (oftalmo riesgo bajo) con acenocumarol → no suspender', () => {
    const r = reglaAvk(
      { idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false },
      ctx({ grupoOftalmologico: 'riesgo_bajo' }),
    );
    expect(r.farmaco.accion).toBe('mantener');
  });

  it('caso 12 §15: warfarina por prótesis mitral mecánica, 80 kg → puente enoxaparina 80 mg/12 h, requiere confirmación', () => {
    const r = reglaAvk(
      { idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: true },
      ctx({ pesoKg: 80, aclaramiento: 90 }),
    );
    expect(r.farmaco.requiereConfirmacion).toBeTrue();
    expect(r.puente?.dosisMgPorToma).toBe(80);
    expect(r.puente?.intervaloHoras).toBe(12);
    expect(r.farmaco.textoAnestesiologo).toContain('80 mg');
  });

  it('puente con CrCl < 30 → cada 24 h', () => {
    const r = reglaAvk(
      { idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: true },
      ctx({ pesoKg: 70, aclaramiento: 25 }),
    );
    expect(r.puente?.intervaloHoras).toBe(24);
  });

  it('acenocumarol estándar → suspender 3 días', () => {
    const r = reglaAvk(
      { idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false },
      ctx({ riesgoHemorragico: 'alto' }),
    );
    expect(horasAntes(r.farmaco.fechaHoraUltimaToma as Date)).toBe(3 * 24);
  });
});

describe('Litio (§8.7)', () => {
  it('caso 13 §15: litio y cirugía de alto riesgo → 72 h', () => {
    const r = reglaLitio({ idFarmaco: 'litio', nombreComercial: 'Plenur' }, ctx({ riesgoCardiovascular: 'alto' }));
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(72);
  });
  it('litio riesgo bajo → 24 h', () => {
    const r = reglaLitio({ idFarmaco: 'litio', nombreComercial: 'Plenur' }, ctx({ riesgoCardiovascular: 'bajo' }));
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(24);
  });
});

describe('AINE (§8.6)', () => {
  it('ibuprofeno → 24 h con nota de alternativa', () => {
    const r = reglaAine({ idFarmaco: 'ibuprofeno', nombreComercial: 'Neobrufen', principio: 'ibuprofeno' }, ctx());
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(24);
    expect(r.textoPaciente).toContain('paracetamol o metamizol');
  });
  it('naproxeno → 72 h', () => {
    const r = reglaAine({ idFarmaco: 'naproxeno', nombreComercial: 'Naprosyn', principio: 'naproxeno' }, ctx());
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(72);
  });
  it('celecoxib → mantener', () => {
    const r = reglaAine({ idFarmaco: 'celecoxib', nombreComercial: 'Celebrex', principio: 'celecoxib' }, ctx());
    expect(r.accion).toBe('mantener');
  });
});

describe('Antidiabéticos (§8.5)', () => {
  it('caso 4 §15: metformina → no tomar el día de la IQ (suspender, última toma el día previo)', () => {
    const r = reglaMetformina({ idFarmaco: 'metformina', nombreComercial: 'Dianben' }, ctx());
    expect(r.accion).toBe('suspender');
    expect(r.textoPaciente).toContain('No la tome el día');
    // Última toma el día previo (miércoles 14).
    expect((r.fechaHoraUltimaToma as Date).getDate()).toBe(14);
  });

  it('caso 4 §15: empagliflozina (SGLT2) → 3 días', () => {
    const r = reglaSglt2({ idFarmaco: 'empagliflozina', nombreComercial: 'Jardiance', principio: 'empagliflozina' }, ctx());
    const dias = Math.round((IV.getTime() - (r.fechaHoraUltimaToma as Date).getTime()) / 86_400_000);
    expect(dias).toBe(3);
  });

  it('ertugliflozina → 4 días', () => {
    const r = reglaSglt2({ idFarmaco: 'ertugliflozina', nombreComercial: 'Steglatro', principio: 'ertugliflozina' }, ctx());
    const dias = Math.round((IV.getTime() - (r.fechaHoraUltimaToma as Date).getTime()) / 86_400_000);
    expect(dias).toBe(4);
  });

  it('caso 4 §15: semaglutida semanal cuya dosis cae en la ventana de 7 días → omitir + dieta líquida', () => {
    const proxima = new Date(2026, 9, 12, 9, 0); // lunes 12, dentro de los 7 días previos al jueves 15
    const r = reglaGlp1Semanal(
      { idFarmaco: 'semaglutida', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: proxima },
      ctx(),
    );
    expect(r.accion).toBe('suspender');
    expect(r.textoPaciente).toContain('líquidos claros');
  });

  it('GLP-1 semanal: dosis el mismo día de la intervención también se omite (ambos incluidos)', () => {
    const r = reglaGlp1Semanal(
      { idFarmaco: 'semaglutida', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 15, 12, 0) },
      ctx(),
    );
    expect(r.accion).toBe('suspender');
  });

  it('GLP-1 semanal: dosis fuera de la ventana (8 días antes) → mantener', () => {
    const r = reglaGlp1Semanal(
      { idFarmaco: 'semaglutida', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 7, 9, 0) },
      ctx(),
    );
    expect(r.accion).toBe('mantener');
  });

  it('GLP-1 diario → última dosis 4 días antes', () => {
    const r = reglaGlp1Diario({ idFarmaco: 'semaglutida_oral', nombreComercial: 'Rybelsus', principio: 'semaglutida' }, ctx());
    const dias = Math.round((IV.getTime() - (r.fechaHoraUltimaToma as Date).getTime()) / 86_400_000);
    expect(dias).toBe(4);
  });

  it('bomba de insulina: CMA de riesgo bajo → sin confirmación', () => {
    const r = reglaBombaInsulina({ idFarmaco: 'bomba', nombreComercial: 'Bomba' }, ctx({ regimen: 'cma', riesgoCardiovascular: 'bajo' }));
    expect(r.requiereConfirmacion).toBeFalse();
  });

  it('bomba de insulina: ingreso → requiere confirmación', () => {
    const r = reglaBombaInsulina({ idFarmaco: 'bomba', nombreComercial: 'Bomba' }, ctx({ regimen: 'ingreso', riesgoCardiovascular: 'bajo' }));
    expect(r.requiereConfirmacion).toBeTrue();
  });
});

describe('Cardiovasculares (§8.10)', () => {
  it('sacubitrilo/valsartán → requiere confirmación', () => {
    const r = reglaSacubitriloValsartan({ idFarmaco: 'sacubitrilo_valsartan', nombreComercial: 'Entresto' });
    expect(r.accion).toBe('consultar');
    expect(r.requiereConfirmacion).toBeTrue();
  });
  it('IECA sin IC con disfunción sistólica (todas las excepciones false) → suspender 24 h', () => {
    const r = reglaIecaAra2(
      { idFarmaco: 'enalapril', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false },
      ctx(),
    );
    expect(r.accion).toBe('suspender');
    expect(horasAntes(r.fechaHoraUltimaToma as Date)).toBe(24);
  });
  it('IECA con IC con disfunción sistólica → mantener', () => {
    const r = reglaIecaAra2(
      { idFarmaco: 'enalapril', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: true, infartoReciente: false, proteinuriaONefropatia: false },
      ctx(),
    );
    expect(r.accion).toBe('mantener');
  });
  it('IECA con información incompleta → requiere confirmación', () => {
    const r = reglaIecaAra2(
      { idFarmaco: 'enalapril', nombreComercial: 'Renitec', principio: 'enalapril' },
      ctx(),
    );
    expect(r.requiereConfirmacion).toBeTrue();
  });
});

describe('Genéricas y plazo no alcanzable', () => {
  it('caso 20 §15: fármaco no catalogado → mantener y consultar', () => {
    const r = reglaNoCatalogado('MedicamentoRaro');
    expect(r.accion).toBe('mantener');
    expect(r.requiereConfirmacion).toBeTrue();
  });

  it('caso 15 §15: clopidogrel con IQ dentro de 3 días → plazo no alcanzable, requiere confirmación', () => {
    // Plazo 5 días para clopidogrel, pero "ahora" es 3 días antes de la IQ.
    const r = reglaP2y12(
      { idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false },
      ctx({ neuroaxial: false }),
    );
    const ahora = fechaHoraLimite(IV, 3 * 24); // 3 días antes de la IQ
    const { resultado, alerta } = aplicarPlazoNoAlcanzable(r, ctx(), ahora);
    expect(resultado.requiereConfirmacion).toBeTrue();
    expect(resultado.accion).toBe('consultar');
    expect(alerta?.gravedad).toBe('roja');
  });

  it('plazo alcanzable no altera el resultado', () => {
    const r = reglaP2y12(
      { idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false },
      ctx({ neuroaxial: false }),
    );
    const ahora = fechaHoraLimite(IV, 10 * 24); // 10 días antes: hay margen
    const { resultado, alerta } = aplicarPlazoNoAlcanzable(r, ctx(), ahora);
    expect(resultado.requiereConfirmacion).toBeFalse();
    expect(alerta).toBeUndefined();
  });
});
