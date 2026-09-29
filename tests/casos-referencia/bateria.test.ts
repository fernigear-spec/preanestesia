/**
 * Batería de casos de referencia — docs/casos_referencia.md (84 casos).
 * Cada caso se compara con el resultado calculado a mano por el servicio. Si el
 * motor difiere, NO se ajusta la prueba: se informa la discrepancia al servicio.
 *
 * Convenciones: intervención jueves 15/10/2026 08:00 salvo que el caso diga otra cosa.
 */
import { describe, it, expect } from '../_harness.ts';
import type { ContextoReglas } from '../../src/dominio/tipos.ts';
import { reglaAcod } from '../../src/dominio/reglas/acod.ts';
import { reglaAvk } from '../../src/dominio/reglas/antivitaminaK.ts';
import { reglaAas, reglaP2y12, evaluarStent, reglaTriflusal, reglaCilostazol } from '../../src/dominio/reglas/antiagregantes.ts';
import { reglaHbpm, clasificarHbpm, reglaFondaparinux } from '../../src/dominio/reglas/heparinas.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal, reglaGlp1Diario, reglaBombaInsulina } from '../../src/dominio/reglas/antidiabeticos.ts';
import { reglaIecaAra2, reglaDiuretico, reglaSacubitriloValsartan } from '../../src/dominio/reglas/cardiovasculares.ts';
import { reglaLitio, reglaMoclobemida, reglaImaoIrreversible, reglaImaoB } from '../../src/dominio/reglas/psicofarmacos.ts';
import { reglaAine } from '../../src/dominio/reglas/aine.ts';
import { reglaMetotrexato, reglaBiologico } from '../../src/dominio/reglas/inmunosupresores.ts';
import { reglaAntiangiogenico } from '../../src/dominio/reglas/oncologicos.ts';
import { reglaFitoterapia, reglaAnticonceptivoThs } from '../../src/dominio/reglas/otros.ts';
import { avisoSugammadex } from '../../src/dominio/reglas/sugammadex.ts';
import { calcularStopBang } from '../../src/dominio/escalas/stopBang.ts';
import { calcularApfel } from '../../src/dominio/escalas/apfel.ts';
import { calcularCha2ds2va } from '../../src/dominio/escalas/cha2ds2va.ts';
import { calcularDasi } from '../../src/dominio/escalas/dasi.ts';
import { calcularAclaramiento } from '../../src/dominio/escalas/cockcroftGault.ts';
import { calcular4AT } from '../../src/dominio/escalas/cuatroAT.ts';
import { calcularEgri } from '../../src/dominio/escalas/egri.ts';
import { calcularLangeron } from '../../src/dominio/escalas/langeron.ts';
import { calcularMorfinaEquivalente } from '../../src/dominio/escalas/morfinaEquivalente.ts';
import { calcularAuditC } from '../../src/dominio/escalas/auditC.ts';
import { calcularHemstop } from '../../src/dominio/escalas/hemstop.ts';
import { reglaInsulinaBasal, reglaInsulinaNph, reglaInsulinaPremezclada } from '../../src/dominio/reglas/insulinas.ts';
import { decidirPruebas, pruebaVigente, type FactoresPruebas } from '../../src/dominio/pruebas/tablaPruebas.ts';
import { calcularAyuno } from '../../src/dominio/ayuno/ayuno.ts';
import { evaluarMtnd4 } from '../../src/dominio/mtnd4/mtnd4.ts';
import { tarjetaFarmacoAEnfermedad, tarjetasEnfermedadAFarmaco } from '../../src/dominio/coherencia/coherencia.ts';

const IV = new Date(2026, 9, 15, 8, 0);
const IV13 = new Date(2026, 9, 15, 13, 0);

function ctx(p: Partial<ContextoReglas> = {}): ContextoReglas {
  return {
    fechaHoraIntervencion: IV, riesgoHemorragico: 'alto', riesgoCardiovascular: 'intermedio',
    grupoOftalmologico: 'no_aplica', neuroaxial: false, bloqueoProfundo: false,
    riesgoTromboticoAlto: false, regimen: 'ingreso', pesoKg: 80, aclaramiento: null, ...p,
  };
}
/** fecha/hora esperada de la última toma. */
function esFecha(d: Date | undefined, y: number, mes: number, dia: number, h: number, min = 0): boolean {
  if (!d) return false;
  return d.getFullYear() === y && d.getMonth() === mes && d.getDate() === dia && d.getHours() === h && d.getMinutes() === min;
}
const P = (...horas: string[]) => ({ horas });

// ————————————————————— A. Anticoagulantes —————————————————————
describe('Casos A · anticoagulantes', () => {
  it('A1 apixabán 09/21, CrCl 70, riesgo bajo: 48 h, adelantar mar 13/10 09:00→08:00, nota 24 h; CHA2DS2-VA 2', () => {
    const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', neuroaxial: false, aclaramiento: 70, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 13, 8, 0)).toBeTrue();
    expect(r.textoPaciente).toContain('a las 08:00 en lugar de a las 09:00');
    expect(r.textoAnestesiologo).toContain('24 h');
    const cha = calcularCha2ds2va({ insuficienciaCardiaca: false, hta: true, edadAnios: 70, diabetes: false, ictusAitTromboembolismo: false, enfermedadVascular: false });
    expect(cha.puntuacion).toBe(2);
    expect(r.requiereConfirmacion).toBeFalse();
  });
  it('A2 igual con CrCl 25: 72 h, adelantar lun 12/10 09:00→08:00, sin nota 24 h', () => {
    const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', neuroaxial: false, aclaramiento: 25, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 12, 8, 0)).toBeTrue();
    expect(r.textoAnestesiologo).toBeUndefined();
  });
  it('A2b intervención 13:00, 48 h: no se adelanta (quedaría <6 h), última mar 13/10 09:00', () => {
    const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, { ...ctx({ riesgoHemorragico: 'bajo', aclaramiento: 70, pautaFarmaco: P('09:00', '21:00') }), fechaHoraIntervencion: IV13 });
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 13, 9, 0)).toBeTrue();
  });
  it('A3 rivaroxabán 21:00, CrCl 25, raquídea: 96 h, no adelanta, última sáb 10/10 21:00', () => {
    const r = reglaAcod({ idFarmaco: 'rivaroxaban', nombreComercial: 'Xarelto', principioActivo: 'rivaroxaban', subtipo: 'antixa' }, ctx({ neuroaxial: true, aclaramiento: 25, pautaFarmaco: P('21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 10, 21, 0)).toBeTrue();
  });
  it('A3b rivaroxabán 21:00, CrCl 60, raquídea (72 h), intervención 13:00: adelantar lun 12/10 21:00→13:00', () => {
    const r = reglaAcod({ idFarmaco: 'rivaroxaban', nombreComercial: 'Xarelto', principioActivo: 'rivaroxaban', subtipo: 'antixa' }, { ...ctx({ neuroaxial: true, aclaramiento: 60, pautaFarmaco: P('21:00') }), fechaHoraIntervencion: IV13 });
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 12, 13, 0)).toBeTrue();
  });
  it('A4 dabigatrán 09/21, CrCl 90, raquídea: 72 h, adelantar lun 12/10 09:00→08:00', () => {
    const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 90, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 12, 8, 0)).toBeTrue();
  });
  it('A5 dabigatrán CrCl 65, raquídea: 96 h, adelantar dom 11/10 09:00→08:00', () => {
    const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 65, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 11, 8, 0)).toBeTrue();
  });
  it('A6 dabigatrán CrCl 45, raquídea: 120 h, adelantar sáb 10/10 09:00→08:00', () => {
    const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 45, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 10, 8, 0)).toBeTrue();
  });
  it('A7 edoxabán sin creatinina: requiere confirmación e indica el dato que falta', () => {
    const r = reglaAcod({ idFarmaco: 'edoxaban', nombreComercial: 'Lixiana', principioActivo: 'edoxaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', neuroaxial: false, aclaramiento: null, pautaFarmaco: P('09:00') }));
    expect(r.requiereConfirmacion).toBeTrue();
    expect(r.datoQueFalta).toContain('aclaramiento');
  });
  it('A9 acenocumarol 18:00 por FA sin alto riesgo: 3 días, última dom 11/10 18:00', () => {
    const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctx({ riesgoHemorragico: 'bajo', pautaFarmaco: P('18:00') }));
    expect(esFecha(r.farmaco.fechaHoraUltimaToma, 2026, 9, 11, 18, 0)).toBeTrue();
    expect(r.farmaco.requiereConfirmacion).toBeFalse();
  });
  it('A10 warfarina 18:00, sin ictus reciente: 5 días, última vie 09/10 18:00, sin puente', () => {
    const r = reglaAvk({ idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: false }, ctx({ riesgoHemorragico: 'alto', pautaFarmaco: P('18:00') }));
    expect(esFecha(r.farmaco.fechaHoraUltimaToma, 2026, 9, 9, 18, 0)).toBeTrue();
    expect(r.puente).toBeUndefined();
  });
  it('A8 apixabán por FA con ictus < 3 meses: alto riesgo trombótico → confirmación con cambio a acenocumarol', () => {
    const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa', altoRiesgoTromboticoConfirmar: true }, ctx({ riesgoHemorragico: 'alto', pautaFarmaco: P('09:00', '21:00') }));
    expect(r.requiereConfirmacion).toBeTrue();
    expect(r.textoAnestesiologo).toContain('acenocumarol');
  });
  it('A11 warfarina por válvula aórtica mecánica sin FA: confirmación por válvula (sin puente)', () => {
    const r = reglaAvk({ idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: false, portadorValvulaMecanicaOStent: true }, ctx({ riesgoHemorragico: 'alto', pautaFarmaco: P('18:00') }));
    expect(r.farmaco.requiereConfirmacion).toBeTrue();
    expect(r.puente).toBeUndefined();
  });
  it('A13 acenocumarol + catarata con bloqueo retrobulbar (oftalmo moderado-alto): suspender 3 días, no mantener', () => {
    const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctx({ grupoOftalmologico: 'riesgo_moderado_alto', riesgoHemorragico: 'bajo', pautaFarmaco: P('18:00') }));
    expect(r.farmaco.accion).toBe('suspender');
    expect(esFecha(r.farmaco.fechaHoraUltimaToma, 2026, 9, 11, 18, 0)).toBeTrue();
  });
  it('A12 acenocumarol por TVP 6 sem, CrCl 25, 70 kg: puente enoxaparina 70 mg/24 h, confirmación', () => {
    const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: true }, ctx({ pesoKg: 70, aclaramiento: 25, pautaFarmaco: P('18:00') }));
    expect(r.puente?.dosisMgPorToma).toBe(70);
    expect(r.puente?.intervaloHoras).toBe(24);
    expect(r.farmaco.requiereConfirmacion).toBeTrue();
  });
});

// ————————————————————— B. Heparinas —————————————————————
describe('Casos B · heparinas y fondaparinux', () => {
  it('B1 enoxaparina 40 mg 18:00 profiláctica, raquídea: 12 h, última mié 14/10 18:00', () => {
    const r = reglaHbpm({ idFarmaco: 'enoxaparina', nombreComercial: 'Clexane', principio: 'enoxaparina', tipo: 'profilactica' }, ctx({ neuroaxial: true, pautaFarmaco: P('18:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 18, 0)).toBeTrue();
  });
  it('B1 clasificación SETH: 40 mg enoxaparina → profiláctica', () => {
    expect(clasificarHbpm(40, { profilaxis_max: 40, tratamiento_min: 60 })).toBe('profilactica');
  });
  it('B3 enoxaparina 160 mg/día (80 mg/12h) → terapéutica; 24 h, adelantar mié 14/10 09:00→08:00', () => {
    expect(clasificarHbpm(160, { profilaxis_max: 40, tratamiento_min: 60 })).toBe('terapeutica');
    const r = reglaHbpm({ idFarmaco: 'enoxaparina', nombreComercial: 'Clexane', principio: 'enoxaparina', tipo: 'terapeutica' }, ctx({ aclaramiento: 60, pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 8, 0)).toBeTrue();
  });
  it('B4 fondaparinux 2,5 mg 09:00, CrCl 60, riesgo bajo sin neuroaxial: 36 h, no adelanta, última mar 13/10 09:00', () => {
    const r = reglaFondaparinux({ idFarmaco: 'f', nombreComercial: 'Arixtra', dosis: 'profilactico' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 60, pautaFarmaco: P('09:00') }));
    expect(esFecha(r.farmaco.fechaHoraUltimaToma, 2026, 9, 13, 9, 0)).toBeTrue();
  });
  it('B5 fondaparinux 7,5 mg 09:00, CrCl 40 terapéutico: 72 h, adelantar lun 12/10 09:00→08:00', () => {
    const r = reglaFondaparinux({ idFarmaco: 'f', nombreComercial: 'Arixtra', dosis: 'terapeutico' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 40, pautaFarmaco: P('09:00') }));
    expect(esFecha(r.farmaco.fechaHoraUltimaToma, 2026, 9, 12, 8, 0)).toBeTrue();
  });
});

// ————————————————————— C. Antiagregantes —————————————————————
describe('Casos C · antiagregantes', () => {
  it('C1 AAS 100 mg: mantener', () => {
    expect(reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 100 }, ctx()).accion).toBe('mantener');
  });
  it('C2 AAS 100 mg craneotomía intracraneal: confirmación', () => {
    expect(reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 100, neurocirugiaIntracranealOMedular: true }, ctx()).requiereConfirmacion).toBeTrue();
  });
  it('C3 AAS 300 mg 09:00 no cardiovascular: 7 días, última mié 07/10 09:00', () => {
    const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 300 }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 7, 9, 0)).toBeTrue();
  });
  it('C4 AAS 300 mg cardiovascular: confirmación + sugerencia 100 mg', () => {
    const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 300, indicacionCardiovascular: true }, ctx());
    expect(r.requiereConfirmacion).toBeTrue();
    expect(r.textoAnestesiologo).toContain('100 mg');
  });
  it('C5 stent farmacoactivo programado 4 meses: alerta roja, confirmación, sin pauta en hoja', () => {
    const s = evaluarStent({ mesesDesdeImplante: 4, traSca: false }, ctx());
    expect(s.recienteRequiereConfirmacion).toBeTrue();
    expect(s.suprimirPautaAntiagregantesEnHoja).toBeTrue();
    expect(s.alertas[0]?.gravedad).toBe('roja');
  });
  it('C6 stent por SCA hace 14 meses: no reciente; clopidogrel 5 días (vie 09/10 09:00)', () => {
    const s = evaluarStent({ mesesDesdeImplante: 14, traSca: true }, ctx());
    expect(s.recienteRequiereConfirmacion).toBeFalse();
    const r = reglaP2y12({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 9, 9, 0)).toBeTrue();
  });
  it('C7 clopidogrel 09:00 monoterapia, raquídea: 7 días, última mié 07/10 09:00, confirmación', () => {
    const r = reglaP2y12({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: true }, ctx({ neuroaxial: true, pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 7, 9, 0)).toBeTrue();
    expect(r.requiereConfirmacion).toBeTrue();
  });
  it('C8 triflusal 300 mg 09/21: 7 días, última mié 07/10 21:00', () => {
    const r = reglaTriflusal('t', 'Disgren', ctx({ pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 7, 21, 0)).toBeTrue();
  });
  it('C9 cilostazol artroscopia AG (riesgo bajo, sin neuroaxial): mantener', () => {
    expect(reglaCilostazol('c', 'Pletal', ctx({ riesgoHemorragico: 'bajo' })).accion).toBe('mantener');
  });
  it('C10 cilostazol 09/21 con raquídea: 3 días, última dom 11/10 21:00', () => {
    const r = reglaCilostazol('c', 'Pletal', ctx({ neuroaxial: true, riesgoHemorragico: 'bajo', pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 11, 21, 0)).toBeTrue();
  });
});

// ————————————————————— D. Antidiabéticos —————————————————————
describe('Casos D · antidiabéticos', () => {
  it('D2 empagliflozina 09:00: última dom 11/10 09:00; metformina 09/21: última mié 14/10 21:00', () => {
    const emp = reglaSglt2({ idFarmaco: 'empagliflozina', nombreComercial: 'Jardiance', principio: 'empagliflozina' }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(emp.fechaHoraUltimaToma, 2026, 9, 11, 9, 0)).toBeTrue();
    const met = reglaMetformina({ idFarmaco: 'metformina', nombreComercial: 'Dianben' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(met.fechaHoraUltimaToma, 2026, 9, 14, 21, 0)).toBeTrue();
  });
  it('D3 ertugliflozina 09:00: 4 días, última sáb 10/10 09:00', () => {
    const r = reglaSglt2({ idFarmaco: 'ertugliflozina', nombreComercial: 'Steglatro', principio: 'ertugliflozina' }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 10, 9, 0)).toBeTrue();
  });
  it('D4 Ozempic los lunes: se omite lun 12/10', () => {
    const r = reglaGlp1Semanal({ idFarmaco: 'sem', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 12, 9, 0) }, ctx());
    expect(r.accion).toBe('suspender');
    expect(r.textoPaciente).toContain('lunes 12 de octubre');
  });
  it('D5 Ozempic los jueves: se omite jue 15/10; la de jue 08/10 (7 días antes) se administra', () => {
    const omitida = reglaGlp1Semanal({ idFarmaco: 'sem', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 15, 6, 0) }, ctx());
    expect(omitida.accion).toBe('suspender');
    const previa = reglaGlp1Semanal({ idFarmaco: 'sem', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 8, 9, 0) }, ctx());
    expect(previa.accion).toBe('mantener');
  });
  it('D6 Rybelsus diario 08:00: última dom 11/10', () => {
    const r = reglaGlp1Diario({ idFarmaco: 'r', nombreComercial: 'Rybelsus', principio: 'semaglutida' }, ctx({ pautaFarmaco: P('08:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 11, 8, 0)).toBeTrue();
  });
  it('D7 Tresiba 30 UI: completa la noche previa no; 70-80 % → mañana 21-24 UI (75 %: 22)', () => {
    const r = reglaInsulinaBasal({ idFarmaco: 't', nombreComercial: 'Tresiba', principio: 'insulina_degludec', dosisNocheUi: 30, dosisMananaUi: 30 });
    const manana = r.ajustes.find((a) => a.momento === 'manana_intervencion');
    expect(manana?.dosisUi).toBeGreaterThanOrEqual(21);
    expect(manana?.dosisUi as number).toBeLessThan(25);
    expect(manana?.dosisUi).toBe(22); // 75 % de 30 = 22,5 → 22 (unidad inferior)
  });
  it('D8 Insulatard NPH 20 mañana / 10 noche: noche 10 completa, mañana 10 (50 % de 20)', () => {
    const r = reglaInsulinaNph({ idFarmaco: 'n', nombreComercial: 'Insulatard', dosisNocheUi: 10, dosisMananaUi: 20 });
    expect(r.ajustes.find((a) => a.momento === 'noche_previa')?.dosisUi).toBe(10);
    expect(r.ajustes.find((a) => a.momento === 'manana_intervencion')?.dosisUi).toBe(10);
  });
  it('D9 NovoMix 30, 20 UI mañana: 10 UI (50 %) la mañana', () => {
    const r = reglaInsulinaPremezclada({ idFarmaco: 'nm', nombreComercial: 'NovoMix 30', dosisMananaUi: 20 });
    expect(r.ajustes.find((a) => a.momento === 'manana_intervencion')?.dosisUi).toBe(10);
  });
  it('D10 bomba CMA riesgo bajo: sin confirmación', () => {
    expect(reglaBombaInsulina({ idFarmaco: 'b', nombreComercial: 'Bomba' }, ctx({ regimen: 'cma', riesgoCardiovascular: 'bajo' })).requiereConfirmacion).toBeFalse();
  });
  it('D11 bomba ingreso: confirmación', () => {
    expect(reglaBombaInsulina({ idFarmaco: 'b', nombreComercial: 'Bomba' }, ctx({ regimen: 'ingreso' })).requiereConfirmacion).toBeTrue();
  });
});

// ————————————————————— E. Otros fármacos —————————————————————
describe('Casos E · otros fármacos', () => {
  it('E1 enalapril 09:00 HTA sin IC: no tomar el día; última mié 14/10 09:00', () => {
    const r = reglaIecaAra2({ idFarmaco: 'ena', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 9, 0)).toBeTrue();
  });
  it('E1b losartán 21:00 HTA: última mié 14/10 21:00', () => {
    const r = reglaIecaAra2({ idFarmaco: 'los', nombreComercial: 'Cozaar', principio: 'losartan', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false }, ctx({ pautaFarmaco: P('21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 21, 0)).toBeTrue();
  });
  it('E2 enalapril + IC con FEVI 30 %: mantener', () => {
    expect(reglaIecaAra2({ idFarmaco: 'ena', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: true, infartoReciente: false, proteinuriaONefropatia: false }, ctx()).accion).toBe('mantener');
  });
  it('E3 Entresto: confirmación', () => {
    expect(reglaSacubitriloValsartan({ idFarmaco: 's', nombreComercial: 'Entresto' }).requiereConfirmacion).toBeTrue();
  });
  it('E4 furosemida 09:00: no la mañana; última mié 14/10 09:00', () => {
    const r = reglaDiuretico({ idFarmaco: 'f', nombreComercial: 'Seguril', principio: 'furosemida' }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 9, 0)).toBeTrue();
  });
  it('E5 litio 09/21 cirugía intermedia: 48 h, última lun 12/10 21:00', () => {
    const r = reglaLitio({ idFarmaco: 'li', nombreComercial: 'Plenur' }, ctx({ riesgoCardiovascular: 'intermedio', pautaFarmaco: P('09:00', '21:00') }));
    // 48 h antes de jue 08:00 = mar 13/10 08:00; última toma <= límite con pauta 09/21 = lun 12/10 21:00
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 12, 21, 0)).toBeTrue();
  });
  it('E6 moclobemida 09/21: 24 h, última mar 13/10 21:00, nota IMAO', () => {
    const r = reglaMoclobemida({ idFarmaco: 'm', nombreComercial: 'Manerix', principio: 'moclobemida' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 13, 21, 0)).toBeTrue();
    expect(r.textoAnestesiologo).toContain('meperidina');
  });
  it('E7 tranilcipromina: confirmación + nota IMAO', () => {
    const r = reglaImaoIrreversible({ idFarmaco: 't', nombreComercial: 'Parnate', principio: 'tranilcipromina' });
    expect(r.requiereConfirmacion).toBeTrue();
    expect(r.textoAnestesiologo).toContain('azul de metileno');
  });
  it('E8 rasagilina: mantener + nota', () => {
    const r = reglaImaoB({ idFarmaco: 'r', nombreComercial: 'Azilect', principio: 'rasagilina' });
    expect(r.accion).toBe('mantener');
    expect(r.textoAnestesiologo).toContain('vasopresores');
  });
  it('E9 ibuprofeno 00/08/16: 24 h, última mié 14/10 08:00 (en el límite exacto)', () => {
    const r = reglaAine({ idFarmaco: 'ibu', nombreComercial: 'Neobrufen', principio: 'ibuprofeno' }, ctx({ pautaFarmaco: P('00:00', '08:00', '16:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 14, 8, 0)).toBeTrue();
    expect(r.textoPaciente).toContain('paracetamol o metamizol');
  });
  it('E10 naproxeno 09/21: 72 h, adelantar? no (AINE no adelanta); última lun 12/10 anterior al límite', () => {
    // AINE no adelanta; límite = lun 12/10 08:00; última toma <= límite con 09/21 = dom 11/10 21:00
    const r = reglaAine({ idFarmaco: 'nap', nombreComercial: 'Naprosyn', principio: 'naproxeno' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 9, 11, 21, 0)).toBeTrue();
  });
  it('E11 metotrexato 15 mg/sem: mantener', () => {
    expect(reglaMetotrexato({ idFarmaco: 'm', nombreComercial: 'Metoject', dosisSemanalMg: 15 }).accion).toBe('mantener');
  });
  it('E12 adalimumab: confirmación (planificación por ciclo)', () => {
    expect(reglaBiologico({ idFarmaco: 'a', nombreComercial: 'Humira', principio: 'adalimumab' }).requiereConfirmacion).toBeTrue();
  });
  it('E13 bevacizumab hace 4 semanas: alerta de diferir + confirmación', () => {
    const r = reglaAntiangiogenico({ idFarmaco: 'b', nombreComercial: 'Avastin', principio: 'bevacizumab', semanasDesdeUltimaDosis: 4 });
    expect(r.farmaco.requiereConfirmacion).toBeTrue();
    expect(r.alerta?.mensaje).toContain('6-8 semanas');
  });
  it('E14 aflibercept intravítreo: mantener', () => {
    expect(reglaAntiangiogenico({ idFarmaco: 'e', nombreComercial: 'Eylea', principio: 'aflibercept', intravitreo: true }).farmaco.accion).toBe('mantener');
  });
  it('E15 ginkgo: suspender 14 días', () => {
    const r = reglaFitoterapia({ idFarmaco: 'g', nombreComercial: 'Ginkgo', principio: 'ginkgo' }, ctx({ pautaFarmaco: P('09:00') }));
    expect(esFecha(r.fechaHoraUltimaToma, 2026, 8, 30, 9, 0)).toBeTrue(); // día 15 previo = 30/09
  });
  it('E16 anticonceptivo oral, riesgo trombótico alto, AG: confirmación + sugammadex oral', () => {
    const r = reglaAnticonceptivoThs({ idFarmaco: 'aco', nombreComercial: 'ACO', principio: 'etinilestradiol', esOral: true }, ctx({ riesgoTromboticoAlto: true }));
    expect(r.requiereConfirmacion).toBeTrue();
    const sg = avisoSugammadex({ mujerConAnticonceptivoHormonal: true, tipo: 'oral', posibleAnestesiaGeneral: true });
    expect(sg.textoPaciente).toContain('olvidada');
  });
  it('E17 implante, sin riesgo trombótico alto, AG: sin regla trombótica; sugammadex no oral 7 días', () => {
    const r = reglaAnticonceptivoThs({ idFarmaco: 'imp', nombreComercial: 'Implante', principio: 'etonogestrel', esOral: false }, ctx({ riesgoTromboticoAlto: false }));
    expect(r.accion).toBe('mantener');
    const sg = avisoSugammadex({ mujerConAnticonceptivoHormonal: true, tipo: 'no_oral', posibleAnestesiaGeneral: true });
    expect(sg.textoPaciente).toContain('7 días');
  });
});

// ————————————————————— F. Escalas —————————————————————
describe('Casos F · escalas', () => {
  it('F1 STOP-Bang varón 56, ronca, HTA, IMC 36, cuello 42: 6, alto', () => {
    const r = calcularStopBang({ ronquidoFuerte: true, cansancioDiurno: false, apneasObservadas: false, htaEnTratamiento: true, imcMayor35: true, edadMayor50: true, cuelloMayor40: true, varon: true });
    expect(r.puntuacion).toBe(6);
    expect(r.categoria).toBe('alto');
  });
  it('F2 STOP-Bang mujer 45, ronca+cansancio, IMC 30, cuello 36: 2, bajo', () => {
    const r = calcularStopBang({ ronquidoFuerte: true, cansancioDiurno: true, apneasObservadas: false, htaEnTratamiento: false, imcMayor35: false, edadMayor50: false, cuelloMayor40: false, varon: false });
    expect(r.puntuacion).toBe(2);
    expect(r.categoria).toBe('bajo');
  });
  it('F3 Apfel mujer no fumadora con cinetosis, intermedia, opioides no sabe: 4, 80 %', () => {
    const r = calcularApfel({ mujer: true, noFumador: true, nvpoOCinetosisPrevias: true, riesgoQuirurgico: 'intermedio' });
    expect(r.puntuacion).toBe(4);
    expect(r.probabilidad).toBe(80);
  });
  it('F4 CHA2DS2-VA mujer 76, DM, IC: 4', () => {
    const r = calcularCha2ds2va({ insuficienciaCardiaca: true, hta: false, edadAnios: 76, diabetes: true, ictusAitTromboembolismo: false, enfermedadVascular: false });
    expect(r.puntuacion).toBe(4);
  });
  it('F5 DASI 24,2; capacidad reducida', () => {
    const r = calcularDasi(['autocuidado', 'caminarDentroCasa', 'caminar1a2Manzanas', 'subirUnPisoOCuesta', 'tareasLigerasCasa', 'tareasModeradasCasa', 'relacionesSexuales']);
    expect(r.dasi).toBeCloseTo(24.2, 1);
    expect(r.capacidadReducida).toBeTrue();
  });
  it('F6 Cockcroft varón 80, 60 kg, cr 1,2: 42; mujer: 35', () => {
    expect(calcularAclaramiento({ edadAnios: 80, pesoKg: 60, sexo: 'hombre', creatinina: 1.2, unidad: 'mg_dl' })).toBeCloseTo(41.7, 0);
    expect(calcularAclaramiento({ edadAnios: 80, pesoKg: 60, sexo: 'mujer', creatinina: 1.2, unidad: 'mg_dl' })).toBeCloseTo(35.4, 0);
  });
  it('F7 4AT: 1 error AMT4 + meses <7: 2, posible deterioro', () => {
    const r = calcular4AT({ alerta: 'normal', amt4: '1_error', meses: 'menos_de_7', cambioAgudo: 'no' });
    expect(r.puntuacion).toBe(2);
    expect(r.categoria).toBe('posible_deterioro_cognitivo');
  });
  it('F8 4AT cambio agudo: 4, posible delirium', () => {
    const r = calcular4AT({ alerta: 'normal', amt4: '0_errores', meses: '7_o_mas', cambioAgudo: 'si' });
    expect(r.puntuacion).toBe(4);
    expect(r.categoria).toBe('posible_delirium');
  });
  it('F9 EGRI telefónico parcial: peso 115, intubación difícil dudosa: 3', () => {
    const r = calcularEgri({ pesoKg: 115, intubacionDificilPrevia: 'dudoso' });
    expect(r.puntuacion).toBe(3);
  });
  it('F10 Langeron varón 60, barba, IMC 27, dentado, no ronca: 3, riesgo', () => {
    const r = calcularLangeron({ barba: true, imc: 27, edentulo: false, edadAnios: 60, ronquido: false });
    expect(r.puntuacion).toBe(3);
    expect(r.categoria).toBe('riesgo');
  });
  it('F11 morfina: fentanilo 25 µg/h + tapentadol 200 mg/día: 140 mg, alerta alta', () => {
    const r = calcularMorfinaEquivalente([{ id: 'fentanilo_transdermico', dosisDiaria: 25 }, { id: 'tapentadol', dosisDiaria: 200 }]);
    expect(r.mgDia).toBe(140);
    expect(r.categoria).toBe('alerta_alta');
  });
  it('F12 AUDIT-C mujer 3: positivo sin abstinencia', () => {
    const r = calcularAuditC({ frecuenciaConsumo: 1, cantidadTipica: 1, frecuenciaAtracon: 1, sexo: 'mujer' });
    expect(r.positivo).toBeTrue();
    expect(r.riesgoAbstinencia).toBeFalse();
  });
  it('F13 HEMSTOP 2 positivas: positivo → pedir coagulación + alerta', () => {
    const r = calcularHemstop({
      hematomasSinTrauma: true, sangradoProlongadoHeridas: true, menstruacionAbundante: false,
      sangradoTrasCirugia: false, sangradoTrasDental: false, sangradoEnParto: false, familiaresTrastornoCoagulacion: false,
    });
    expect(r.puntuacion).toBe(2);
    expect(r.positivo).toBeTrue();
    expect(r.pedirCoagulacion).toBeTrue();
    expect(r.alerta?.gravedad).toBe('amarilla');
  });
  it('F13b HEMSTOP 1 positiva: negativo', () => {
    const r = calcularHemstop({
      hematomasSinTrauma: true, sangradoProlongadoHeridas: false, menstruacionAbundante: false,
      sangradoTrasCirugia: false, sangradoTrasDental: false, sangradoEnParto: false, familiaresTrastornoCoagulacion: false,
    });
    expect(r.positivo).toBeFalse();
    expect(r.pedirCoagulacion).toBeFalse();
  });
});

// ————————————————————— G. Pruebas complementarias —————————————————————
describe('Casos G · pruebas complementarias', () => {
  const sinF: FactoresPruebas = { anemiaOHbBaja: false, trastornoCoagulacionOAnticoagulante: false, anestesiaRegionalPosible: false, sangradoPrevisible: false, hemstopPositivo: false, supuestoRxTorax: false, supuestoEcocardiograma: false };
  const nombres = (ps: { prueba: string }[]) => ps.map((p) => p.prueba).sort();
  it('G1 varón 70 HTA, METs≥4, prótesis rodilla (intermedio), paciente bajo-moderado: hemograma, coag, bioquímica, ECG; sin Rx', () => {
    const r = decidirPruebas('intermedio', 'bajo-moderado', sinF);
    expect(nombres(r)).toEqual(['bioquimica', 'coagulacion', 'ecg', 'hemograma']);
  });
  it('G2 mujer 40 sana, colecistectomía (intermedio), paciente bajo: hemograma y coagulación', () => {
    const r = decidirPruebas('intermedio', 'bajo', sinF);
    expect(nombres(r)).toEqual(['coagulacion', 'hemograma']);
  });
  it('G3 varón 60 IC NYHA III, colectomía (intermedio), paciente alto: +Rx; ECG vigente no se repite; coag caducada sí', () => {
    const r = decidirPruebas('intermedio', 'alto', sinF);
    expect(nombres(r)).toContain('rx_torax');
    // ECG de hace 2 meses vigente (90 días), coagulación de hace 20 días caducada (14 días)
    expect(pruebaVigente('ecg', new Date(2026, 7, 15), IV)).toBeTrue();
    expect(pruebaVigente('coagulacion', new Date(2026, 8, 25), IV)).toBeFalse();
  });
});

// ————————————————————— H. Ayuno —————————————————————
describe('Casos H · ayuno', () => {
  it('H1 adulto sin factores: ligera 02:00, claros libres 04:00, límite 06:00, carbohidratos', () => {
    const r = calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'ninguna' });
    expect(r.lineas.find((l) => l.concepto.includes('ligera'))?.hora).toBe('02:00');
    expect(r.lineas.find((l) => l.horasAntes === 4)?.hora).toBe('04:00');
    expect(r.lineas.some((l) => l.concepto.includes('carbohidratos'))).toBeTrue();
  });
  it('H2 niño 2 años: fórmula/sólidos 02:00, leche materna 05:00, claros 07:00', () => {
    const r = calcularAyuno({ induccion: IV, pediatrico: true, situacion: 'ninguna' });
    expect(r.lineas.find((l) => l.concepto.includes('fórmula y sólidos'))?.hora).toBe('02:00');
    expect(r.lineas.find((l) => l.concepto === 'Leche materna')?.hora).toBe('05:00');
    expect(r.lineas.find((l) => l.concepto === 'Líquidos claros')?.hora).toBe('07:00');
  });
  it('H3 lactante 4 meses fórmula: fórmula 04:00 + aviso hipoglucemia', () => {
    const r = calcularAyuno({ induccion: IV, pediatrico: true, edadMeses: 4, situacion: 'ninguna' });
    expect(r.lineas.some((l) => l.concepto.includes('menor de 6 meses') && l.hora === '04:00')).toBeTrue();
    expect(r.alertas.some((a) => a.mensaje.includes('hipoglucemia'))).toBeTrue();
  });
  it('H4 diabético con gastroparesia: sólidos 00:00 (8 h), sin carbohidratos, alerta metoclopramida', () => {
    const r = calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'diabetes_gastroparesia' });
    expect(r.lineas[0]?.hora).toBe('00:00');
    expect(r.lineas.some((l) => l.concepto.includes('carbohidratos'))).toBeFalse();
    expect(r.alertas.some((a) => a.mensaje.includes('metoclopramida'))).toBeTrue();
  });
});

// ————————————————————— I. mtND4 y coherencia —————————————————————
describe('Casos I · mtND4 y coherencia', () => {
  it('I1 madre venezolana, test negativo: informativa (variante ausente)', () => {
    const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: true, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'negativo' });
    expect(r.alerta.gravedad).toBe('informativa');
    expect(r.alerta.mensaje).toContain('ausente');
  });
  it('I2 abuela materna venezolana, sin test: alerta roja', () => {
    const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: true, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'no_hecho' });
    expect(r.alerta.gravedad).toBe('roja');
  });
  it('I3 abuela paterna venezolana (no línea materna): sin alerta roja', () => {
    const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: false, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'no_hecho' });
    expect(r.alerta.gravedad).toBe('informativa');
  });
  it('I4 prednisona sin indicación recogida: tarjeta de coherencia; no marca enfermedad', () => {
    const t = tarjetaFarmacoAEnfermedad({ nombre: 'Prednisona', indicacionesPosibles: ['trasplante', 'artritis_reumatoide', 'lupus', 'asma_epoc', 'insuficiencia_suprarrenal'] }, new Set());
    expect(t).not.toBe(null);
    expect(t?.tipo).toBe('farmaco_a_enfermedad');
  });
  it('I5 SAOS marcado sin CPAP: tarjeta inversa', () => {
    const ts = tarjetasEnfermedadAFarmaco(new Set(['saos']), new Set());
    expect(ts.some((t) => t.mensaje.toLowerCase().includes('cpap'))).toBeTrue();
  });
});

/**
 * Casos PENDIENTES (dependen de módulos aún no construidos en el motor):
 *  - D7 (insulina basal Tresiba 70-80 %), D8 (NPH), D9 (premezclada 50 %): falta
 *    el módulo de ajuste de dosis de insulina por porcentajes (§8.5). Las reglas
 *    de insulina están declaradas en reglas_farmacos.json pero no calculan la
 *    dosis ajustada todavía.
 *  - F13 (HEMSTOP ≥ 2 → pedir coagulación + alerta): la lógica de pruebas admite
 *    el factor `hemstopPositivo` (verificado en Push 4), pero el CUESTIONARIO
 *    HEMSTOP como tal pertenece al flujo de entrevista (módulo hematológico), aún
 *    no construido. La consecuencia sobre pruebas sí está cubierta.
 *  - D1 (Synjardy): cubierto en tests/unit/reglas/reglas2.test.ts.
 */

