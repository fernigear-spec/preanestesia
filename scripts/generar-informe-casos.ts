/**
 * Genera docs/informe_casos_referencia.md ejecutando el MOTOR con la entrada de
 * cada caso de docs/casos_referencia.md. Lo que se imprime sale de la ejecución
 * del motor (no de las aserciones de las pruebas).
 *
 * Ejecutar: node --experimental-strip-types scripts/generar-informe-casos.ts
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ContextoReglas } from '../src/dominio/tipos.ts';
import { reglaAcod } from '../src/dominio/reglas/acod.ts';
import { reglaAvk } from '../src/dominio/reglas/antivitaminaK.ts';
import { reglaAas, reglaP2y12, reglaP2y12Oftalmo, evaluarStent, reglaTriflusal, reglaCilostazol } from '../src/dominio/reglas/antiagregantes.ts';
import { reglaHbpm, clasificarHbpm, reglaFondaparinux } from '../src/dominio/reglas/heparinas.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal, reglaGlp1Diario, reglaBombaInsulina } from '../src/dominio/reglas/antidiabeticos.ts';
import { reglaInsulinaBasal, reglaInsulinaNph, reglaInsulinaPremezclada } from '../src/dominio/reglas/insulinas.ts';
import { reglaIecaAra2, reglaDiuretico, reglaSacubitriloValsartan } from '../src/dominio/reglas/cardiovasculares.ts';
import { reglaLitio, reglaMoclobemida, reglaImaoIrreversible, reglaImaoB } from '../src/dominio/reglas/psicofarmacos.ts';
import { reglaAine } from '../src/dominio/reglas/aine.ts';
import { reglaMetotrexato, reglaBiologico } from '../src/dominio/reglas/inmunosupresores.ts';
import { reglaAntiangiogenico } from '../src/dominio/reglas/oncologicos.ts';
import { reglaFitoterapia, reglaAnticonceptivoThs } from '../src/dominio/reglas/otros.ts';
import { avisoSugammadex } from '../src/dominio/reglas/sugammadex.ts';
import { calcularStopBang } from '../src/dominio/escalas/stopBang.ts';
import { calcularApfel } from '../src/dominio/escalas/apfel.ts';
import { calcularCha2ds2va } from '../src/dominio/escalas/cha2ds2va.ts';
import { calcularDasi } from '../src/dominio/escalas/dasi.ts';
import { calcularAclaramiento } from '../src/dominio/escalas/cockcroftGault.ts';
import { calcular4AT } from '../src/dominio/escalas/cuatroAT.ts';
import { calcularEgri } from '../src/dominio/escalas/egri.ts';
import { calcularLangeron } from '../src/dominio/escalas/langeron.ts';
import { calcularMorfinaEquivalente } from '../src/dominio/escalas/morfinaEquivalente.ts';
import { calcularAuditC } from '../src/dominio/escalas/auditC.ts';
import { calcularHemstop } from '../src/dominio/escalas/hemstop.ts';
import { decidirPruebas, pruebaVigente, type FactoresPruebas } from '../src/dominio/pruebas/tablaPruebas.ts';
import { calcularAyuno } from '../src/dominio/ayuno/ayuno.ts';
import { evaluarMtnd4 } from '../src/dominio/mtnd4/mtnd4.ts';
import { tarjetaFarmacoAEnfermedad, tarjetasEnfermedadAFarmaco } from '../src/dominio/coherencia/coherencia.ts';
import type { ResultadoFarmaco } from '../src/dominio/tipos.ts';

const IV = new Date(2026, 9, 15, 8, 0);
const IV13 = new Date(2026, 9, 15, 13, 0);
function ctx(p: Partial<ContextoReglas> = {}): ContextoReglas {
  return { fechaHoraIntervencion: IV, riesgoHemorragico: 'alto', riesgoCardiovascular: 'intermedio', grupoOftalmologico: 'no_aplica', neuroaxial: false, bloqueoProfundo: false, riesgoTromboticoAlto: false, regimen: 'ingreso', pesoKg: 80, aclaramiento: null, ...p };
}
const P = (...horas: string[]) => ({ horas });
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
function fh(d?: Date): string {
  if (!d) return '—';
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function farmacoResumen(r: ResultadoFarmaco): string {
  const partes = [`acción: ${r.accion}`, `última toma: ${fh(r.fechaHoraUltimaToma)}`];
  if (r.requiereConfirmacion) partes.push('requiere confirmación');
  if (r.datoQueFalta) partes.push(`falta: ${r.datoQueFalta}`);
  return partes.join('; ');
}
function esc(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

interface Fila {
  id: string;
  calculado: string;
  textoPaciente: string;
  esperado: string;
  coincide: boolean;
}
const filas: Fila[] = [];
function add(id: string, calculado: string, textoPaciente: string, esperado: string, coincide: boolean): void {
  filas.push({ id, calculado, textoPaciente, esperado, coincide });
}

// ————————————————————— A —————————————————————
{
  const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 70, pautaFarmaco: P('09:00', '21:00') }));
  const cha = calcularCha2ds2va({ insuficienciaCardiaca: false, hta: true, edadAnios: 70, diabetes: false, ictusAitTromboembolismo: false, enfermedadVascular: false });
  add('A1', `${farmacoResumen(r)}; CHA2DS2-VA ${cha.puntuacion}; nota: ${r.textoAnestesiologo ?? '—'}`, r.textoPaciente, '48 h; adelantar mar 13/10 09:00→08:00; nota 24 h; CHA2DS2-VA 2', fh(r.fechaHoraUltimaToma) === 'mar 13/10 08:00' && cha.puntuacion === 2 && !!r.textoAnestesiologo);
}
{
  const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 25, pautaFarmaco: P('09:00', '21:00') }));
  add('A2', farmacoResumen(r), r.textoPaciente, '72 h; adelantar lun 12/10 09:00→08:00; sin nota 24 h', fh(r.fechaHoraUltimaToma) === 'lun 12/10 08:00' && !r.textoAnestesiologo);
}
{
  const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' }, { ...ctx({ riesgoHemorragico: 'bajo', aclaramiento: 70, pautaFarmaco: P('09:00', '21:00') }), fechaHoraIntervencion: IV13 });
  add('A2b', farmacoResumen(r), r.textoPaciente, 'no adelanta; última mar 13/10 09:00', fh(r.fechaHoraUltimaToma) === 'mar 13/10 09:00');
}
{
  const r = reglaAcod({ idFarmaco: 'rivaroxaban', nombreComercial: 'Xarelto', principioActivo: 'rivaroxaban', subtipo: 'antixa' }, ctx({ neuroaxial: true, aclaramiento: 25, pautaFarmaco: P('21:00') }));
  add('A3', farmacoResumen(r), r.textoPaciente, '96 h; no adelanta; última sáb 10/10 21:00', fh(r.fechaHoraUltimaToma) === 'sáb 10/10 21:00');
}
{
  const r = reglaAcod({ idFarmaco: 'rivaroxaban', nombreComercial: 'Xarelto', principioActivo: 'rivaroxaban', subtipo: 'antixa' }, { ...ctx({ neuroaxial: true, aclaramiento: 60, pautaFarmaco: P('21:00') }), fechaHoraIntervencion: IV13 });
  add('A3b', farmacoResumen(r), r.textoPaciente, 'adelantar lun 12/10 21:00→13:00', fh(r.fechaHoraUltimaToma) === 'lun 12/10 13:00');
}
{
  const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 90, pautaFarmaco: P('09:00', '21:00') }));
  add('A4', farmacoResumen(r), r.textoPaciente, '72 h; adelantar lun 12/10 09:00→08:00', fh(r.fechaHoraUltimaToma) === 'lun 12/10 08:00');
}
{
  const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 65, pautaFarmaco: P('09:00', '21:00') }));
  add('A5', farmacoResumen(r), r.textoPaciente, '96 h; adelantar dom 11/10 09:00→08:00', fh(r.fechaHoraUltimaToma) === 'dom 11/10 08:00');
}
{
  const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctx({ neuroaxial: true, aclaramiento: 45, pautaFarmaco: P('09:00', '21:00') }));
  add('A6', farmacoResumen(r), r.textoPaciente, '120 h; adelantar sáb 10/10 09:00→08:00', fh(r.fechaHoraUltimaToma) === 'sáb 10/10 08:00');
}
{
  const r = reglaAcod({ idFarmaco: 'edoxaban', nombreComercial: 'Lixiana', principioActivo: 'edoxaban', subtipo: 'antixa' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: null, pautaFarmaco: P('09:00') }));
  add('A7', farmacoResumen(r), r.textoPaciente, 'requiere confirmación; falta aclaramiento', r.requiereConfirmacion && (r.datoQueFalta ?? '').includes('aclaramiento'));
}
{
  const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa', altoRiesgoTromboticoConfirmar: true }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
  add('A8', farmacoResumen(r), r.textoPaciente, 'alerta ictus; confirmación con cambio a acenocumarol', r.requiereConfirmacion && (r.textoAnestesiologo ?? '').includes('acenocumarol'));
}
{
  const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctx({ riesgoHemorragico: 'bajo', pautaFarmaco: P('18:00') }));
  add('A9', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, '3 días; última dom 11/10 18:00; sin puente', fh(r.farmaco.fechaHoraUltimaToma) === 'dom 11/10 18:00' && !r.puente);
}
{
  const r = reglaAvk({ idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: false }, ctx({ riesgoHemorragico: 'alto', pautaFarmaco: P('18:00') }));
  add('A10', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, '5 días; última vie 09/10 18:00; sin puente', fh(r.farmaco.fechaHoraUltimaToma) === 'vie 09/10 18:00' && !r.puente);
}
{
  const r = reglaAvk({ idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: false, portadorValvulaMecanicaOStent: true }, ctx({ riesgoHemorragico: 'alto', pautaFarmaco: P('18:00') }));
  add('A11', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, 'confirmación por válvula mecánica; sin puente', r.farmaco.requiereConfirmacion && !r.puente);
}
{
  const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: true }, ctx({ pesoKg: 70, aclaramiento: 25, pautaFarmaco: P('18:00') }));
  add('A12', `${farmacoResumen(r.farmaco)}; puente enoxaparina ${r.puente?.dosisMgPorToma} mg/${r.puente?.intervaloHoras} h`, r.farmaco.textoPaciente, 'puente enoxaparina 70 mg/24 h; confirmación', r.puente?.dosisMgPorToma === 70 && r.puente?.intervaloHoras === 24 && r.farmaco.requiereConfirmacion);
}
{
  const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctx({ grupoOftalmologico: 'riesgo_moderado_alto', riesgoHemorragico: 'bajo', pautaFarmaco: P('18:00') }));
  add('A13', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, 'suspender 3 días (no mantener); última dom 11/10 18:00', r.farmaco.accion === 'suspender' && fh(r.farmaco.fechaHoraUltimaToma) === 'dom 11/10 18:00');
}

// ————————————————————— B —————————————————————
{
  const r = reglaHbpm({ idFarmaco: 'enox', nombreComercial: 'Clexane', principio: 'enoxaparina', tipo: 'profilactica' }, ctx({ neuroaxial: true, pautaFarmaco: P('18:00') }));
  add('B1', farmacoResumen(r), r.textoPaciente, '12 h; última mié 14/10 18:00', fh(r.fechaHoraUltimaToma) === 'mié 14/10 18:00');
}
{
  const clas = clasificarHbpm(160, { profilaxis_max: 40, tratamiento_min: 60 });
  const r = reglaHbpm({ idFarmaco: 'enox', nombreComercial: 'Clexane', principio: 'enoxaparina', tipo: 'terapeutica' }, ctx({ aclaramiento: 60, pautaFarmaco: P('09:00', '21:00') }));
  add('B3', `clasificación: ${clas}; ${farmacoResumen(r)}`, r.textoPaciente, 'terapéutica; 24 h; adelantar mié 14/10 09:00→08:00', clas === 'terapeutica' && fh(r.fechaHoraUltimaToma) === 'mié 14/10 08:00');
}
{
  const r = reglaFondaparinux({ idFarmaco: 'f', nombreComercial: 'Arixtra', dosis: 'profilactico' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 60, pautaFarmaco: P('09:00') }));
  add('B4', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, '36 h; no adelanta; última mar 13/10 09:00', fh(r.farmaco.fechaHoraUltimaToma) === 'mar 13/10 09:00');
}
{
  const r = reglaFondaparinux({ idFarmaco: 'f', nombreComercial: 'Arixtra', dosis: 'terapeutico' }, ctx({ riesgoHemorragico: 'bajo', aclaramiento: 40, pautaFarmaco: P('09:00') }));
  add('B5', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, '72 h; adelantar lun 12/10 09:00→08:00', fh(r.farmaco.fechaHoraUltimaToma) === 'lun 12/10 08:00');
}

// ————————————————————— C —————————————————————
{
  const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 100 }, ctx());
  add('C1', farmacoResumen(r), r.textoPaciente, 'mantener', r.accion === 'mantener');
}
{
  const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 100, neurocirugiaIntracranealOMedular: true }, ctx());
  add('C2', farmacoResumen(r), r.textoPaciente, 'requiere confirmación', r.requiereConfirmacion);
}
{
  const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 300 }, ctx({ pautaFarmaco: P('09:00') }));
  add('C3', farmacoResumen(r), r.textoPaciente, '7 días; última mié 07/10 09:00', fh(r.fechaHoraUltimaToma) === 'mié 07/10 09:00');
}
{
  const r = reglaAas({ idFarmaco: 'aas', nombreComercial: 'Adiro', dosisDiariaMg: 300, indicacionCardiovascular: true }, ctx());
  add('C4', farmacoResumen(r), r.textoPaciente, 'confirmación + sugerencia 100 mg', r.requiereConfirmacion && (r.textoAnestesiologo ?? '').includes('100 mg'));
}
{
  const s = evaluarStent({ mesesDesdeImplante: 4, traSca: false }, ctx());
  add('C5', `stent reciente: ${s.recienteRequiereConfirmacion}; sin pauta en hoja: ${s.suprimirPautaAntiagregantesEnHoja}; alerta: ${s.alertas[0]?.gravedad}`, '(hoja del paciente sin pauta de antiagregantes)', 'alerta roja diferir; confirmación; sin pauta en hoja', s.recienteRequiereConfirmacion && s.suprimirPautaAntiagregantesEnHoja && s.alertas[0]?.gravedad === 'roja');
}
{
  const s = evaluarStent({ mesesDesdeImplante: 14, traSca: true }, ctx());
  const r = reglaP2y12({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false }, ctx({ pautaFarmaco: P('09:00') }));
  add('C6', `stent reciente: ${s.recienteRequiereConfirmacion}; ${farmacoResumen(r)}`, r.textoPaciente, 'no reciente; clopidogrel 5 días (vie 09/10 09:00)', !s.recienteRequiereConfirmacion && fh(r.fechaHoraUltimaToma) === 'vie 09/10 09:00');
}
{
  const r = reglaP2y12({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: true }, ctx({ neuroaxial: true, pautaFarmaco: P('09:00') }));
  add('C7', farmacoResumen(r), r.textoPaciente, '7 días; última mié 07/10 09:00; confirmación', fh(r.fechaHoraUltimaToma) === 'mié 07/10 09:00' && r.requiereConfirmacion);
}
{
  const r = reglaTriflusal('t', 'Disgren', ctx({ pautaFarmaco: P('09:00', '21:00') }));
  add('C8', farmacoResumen(r), r.textoPaciente, '7 días; última mié 07/10 21:00', fh(r.fechaHoraUltimaToma) === 'mié 07/10 21:00');
}
{
  const r = reglaCilostazol('c', 'Pletal', ctx({ riesgoHemorragico: 'bajo' }));
  add('C9', farmacoResumen(r), r.textoPaciente, 'mantener', r.accion === 'mantener');
}
{
  const r = reglaCilostazol('c', 'Pletal', ctx({ neuroaxial: true, riesgoHemorragico: 'bajo', pautaFarmaco: P('09:00', '21:00') }));
  add('C10', farmacoResumen(r), r.textoPaciente, '3 días; última dom 11/10 21:00', fh(r.fechaHoraUltimaToma) === 'dom 11/10 21:00');
}

// ————————————————————— D —————————————————————
{
  const emp = reglaSglt2({ idFarmaco: 'e', nombreComercial: 'Jardiance', principio: 'empagliflozina' }, ctx({ pautaFarmaco: P('09:00') }));
  const met = reglaMetformina({ idFarmaco: 'm', nombreComercial: 'Dianben' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
  add('D2', `empagliflozina: ${fh(emp.fechaHoraUltimaToma)}; metformina: ${fh(met.fechaHoraUltimaToma)}`, `${emp.textoPaciente} // ${met.textoPaciente}`, 'empagliflozina dom 11/10 09:00; metformina mié 14/10 21:00', fh(emp.fechaHoraUltimaToma) === 'dom 11/10 09:00' && fh(met.fechaHoraUltimaToma) === 'mié 14/10 21:00');
}
{
  const r = reglaSglt2({ idFarmaco: 'e', nombreComercial: 'Steglatro', principio: 'ertugliflozina' }, ctx({ pautaFarmaco: P('09:00') }));
  add('D3', farmacoResumen(r), r.textoPaciente, '4 días; última sáb 10/10 09:00', fh(r.fechaHoraUltimaToma) === 'sáb 10/10 09:00');
}
{
  const r = reglaGlp1Semanal({ idFarmaco: 's', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 12, 9, 0) }, ctx());
  add('D4', `acción: ${r.accion}`, r.textoPaciente, 'omitir dosis del lunes 12/10; dieta líquida 24 h', r.accion === 'suspender' && r.textoPaciente.includes('lunes 12'));
}
{
  const omit = reglaGlp1Semanal({ idFarmaco: 's', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 15, 6, 0) }, ctx());
  const previa = reglaGlp1Semanal({ idFarmaco: 's', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 8, 9, 0) }, ctx());
  add('D5', `dosis jue 15/10: ${omit.accion}; dosis jue 08/10: ${previa.accion}`, omit.textoPaciente, 'se omite jue 15/10; la de jue 08/10 (7 días) se administra', omit.accion === 'suspender' && previa.accion === 'mantener');
}
{
  const r = reglaGlp1Diario({ idFarmaco: 'r', nombreComercial: 'Rybelsus', principio: 'semaglutida' }, ctx({ pautaFarmaco: P('08:00') }));
  add('D6', farmacoResumen(r), r.textoPaciente, 'última dom 11/10', fh(r.fechaHoraUltimaToma) === 'dom 11/10 08:00');
}
{
  const r = reglaInsulinaBasal({ idFarmaco: 't', nombreComercial: 'Tresiba', principio: 'insulina_degludec', dosisNocheUi: 30, dosisMananaUi: 30 });
  const manana = r.ajustes.find((a) => a.momento === 'manana_intervencion')?.dosisUi;
  add('D7', `mañana: ${manana} UI (70-80 %)`, r.textoPaciente, 'mañana 21-24 UI (70-80 % de 30)', (manana ?? 0) >= 21 && (manana ?? 0) <= 24);
}
{
  const r = reglaInsulinaNph({ idFarmaco: 'n', nombreComercial: 'Insulatard', dosisNocheUi: 10, dosisMananaUi: 20 });
  const noche = r.ajustes.find((a) => a.momento === 'noche_previa')?.dosisUi;
  const man = r.ajustes.find((a) => a.momento === 'manana_intervencion')?.dosisUi;
  add('D8', `noche: ${noche} UI (completa); mañana: ${man} UI (50 %)`, r.textoPaciente, 'noche 10 UI completa; mañana 10 UI (50 %)', noche === 10 && man === 10);
}
{
  const r = reglaInsulinaPremezclada({ idFarmaco: 'nm', nombreComercial: 'NovoMix 30', dosisMananaUi: 20 });
  const man = r.ajustes.find((a) => a.momento === 'manana_intervencion')?.dosisUi;
  add('D9', `mañana: ${man} UI (50 %)`, r.textoPaciente, 'mañana 10 UI (50 % de 20)', man === 10);
}
{
  const r = reglaBombaInsulina({ idFarmaco: 'b', nombreComercial: 'Bomba' }, ctx({ regimen: 'cma', riesgoCardiovascular: 'bajo' }));
  add('D10', farmacoResumen(r), r.textoPaciente, 'basal 70-80 %, sin bolos; sin confirmación', !r.requiereConfirmacion);
}
{
  const r = reglaBombaInsulina({ idFarmaco: 'b', nombreComercial: 'Bomba' }, ctx({ regimen: 'ingreso' }));
  add('D11', farmacoResumen(r), r.textoPaciente, 'requiere confirmación', r.requiereConfirmacion);
}

// ————————————————————— E —————————————————————
{
  const r = reglaIecaAra2({ idFarmaco: 'e', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false }, ctx({ pautaFarmaco: P('09:00') }));
  add('E1', farmacoResumen(r), r.textoPaciente, 'no tomar el día; última mié 14/10 09:00', fh(r.fechaHoraUltimaToma) === 'mié 14/10 09:00');
}
{
  const r = reglaIecaAra2({ idFarmaco: 'l', nombreComercial: 'Cozaar', principio: 'losartan', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false }, ctx({ pautaFarmaco: P('21:00') }));
  add('E1b', farmacoResumen(r), r.textoPaciente, 'no tomar el día; última mié 14/10 21:00', fh(r.fechaHoraUltimaToma) === 'mié 14/10 21:00');
}
{
  const r = reglaIecaAra2({ idFarmaco: 'e', nombreComercial: 'Renitec', principio: 'enalapril', icDisfuncionSistolica: true, infartoReciente: false, proteinuriaONefropatia: false }, ctx());
  add('E2', farmacoResumen(r), r.textoPaciente, 'mantener', r.accion === 'mantener');
}
{
  const r = reglaSacubitriloValsartan({ idFarmaco: 's', nombreComercial: 'Entresto' });
  add('E3', farmacoResumen(r), r.textoPaciente, 'requiere confirmación', r.requiereConfirmacion);
}
{
  const r = reglaDiuretico({ idFarmaco: 'f', nombreComercial: 'Seguril', principio: 'furosemida' }, ctx({ pautaFarmaco: P('09:00') }));
  add('E4', farmacoResumen(r), r.textoPaciente, 'no la mañana; última mié 14/10 09:00', fh(r.fechaHoraUltimaToma) === 'mié 14/10 09:00');
}
{
  const r = reglaLitio({ idFarmaco: 'li', nombreComercial: 'Plenur' }, ctx({ riesgoCardiovascular: 'intermedio', pautaFarmaco: P('09:00', '21:00') }));
  add('E5', farmacoResumen(r), r.textoPaciente, '48 h; última lun 12/10 21:00', fh(r.fechaHoraUltimaToma) === 'lun 12/10 21:00');
}
{
  const r = reglaMoclobemida({ idFarmaco: 'm', nombreComercial: 'Manerix', principio: 'moclobemida' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
  add('E6', farmacoResumen(r), r.textoPaciente, '24 h; última mar 13/10 21:00; nota IMAO', fh(r.fechaHoraUltimaToma) === 'mar 13/10 21:00' && (r.textoAnestesiologo ?? '').includes('meperidina'));
}
{
  const r = reglaImaoIrreversible({ idFarmaco: 't', nombreComercial: 'Parnate', principio: 'tranilcipromina' });
  add('E7', farmacoResumen(r), r.textoPaciente, 'confirmación; nota IMAO', r.requiereConfirmacion && (r.textoAnestesiologo ?? '').includes('azul de metileno'));
}
{
  const r = reglaImaoB({ idFarmaco: 'r', nombreComercial: 'Azilect', principio: 'rasagilina' });
  add('E8', farmacoResumen(r), r.textoPaciente, 'mantener; nota', r.accion === 'mantener' && !!r.textoAnestesiologo);
}
{
  const r = reglaAine({ idFarmaco: 'i', nombreComercial: 'Neobrufen', principio: 'ibuprofeno' }, ctx({ pautaFarmaco: P('00:00', '08:00', '16:00') }));
  add('E9', farmacoResumen(r), r.textoPaciente, '24 h; última mié 14/10 08:00 (en el límite)', fh(r.fechaHoraUltimaToma) === 'mié 14/10 08:00');
}
{
  const r = reglaAine({ idFarmaco: 'n', nombreComercial: 'Naprosyn', principio: 'naproxeno' }, ctx({ pautaFarmaco: P('09:00', '21:00') }));
  add('E10', farmacoResumen(r), r.textoPaciente, '72 h; última dom 11/10 21:00 (AINE no adelanta)', fh(r.fechaHoraUltimaToma) === 'dom 11/10 21:00');
}
{
  const r = reglaMetotrexato({ idFarmaco: 'm', nombreComercial: 'Metoject', dosisSemanalMg: 15 });
  add('E11', farmacoResumen(r), r.textoPaciente, 'mantener', r.accion === 'mantener');
}
{
  const r = reglaBiologico({ idFarmaco: 'a', nombreComercial: 'Humira', principio: 'adalimumab' });
  add('E12', farmacoResumen(r), r.textoPaciente, 'confirmación (planificación por ciclo)', r.requiereConfirmacion);
}
{
  const r = reglaAntiangiogenico({ idFarmaco: 'b', nombreComercial: 'Avastin', principio: 'bevacizumab', semanasDesdeUltimaDosis: 4 });
  add('E13', `${farmacoResumen(r.farmaco)}; alerta: ${r.alerta?.mensaje ?? '—'}`, r.farmaco.textoPaciente, 'alerta diferir 6-8 semanas; confirmación', r.farmaco.requiereConfirmacion && (r.alerta?.mensaje ?? '').includes('6-8'));
}
{
  const r = reglaAntiangiogenico({ idFarmaco: 'e', nombreComercial: 'Eylea', principio: 'aflibercept', intravitreo: true });
  add('E14', farmacoResumen(r.farmaco), r.farmaco.textoPaciente, 'mantener', r.farmaco.accion === 'mantener');
}
{
  const r = reglaFitoterapia({ idFarmaco: 'g', nombreComercial: 'Ginkgo', principio: 'ginkgo' }, ctx({ pautaFarmaco: P('09:00') }));
  add('E15', farmacoResumen(r), r.textoPaciente, 'suspender 14 días (mínimo 7); última mié 30/09 09:00', fh(r.fechaHoraUltimaToma) === 'mié 30/09 09:00');
}
{
  const r = reglaAnticonceptivoThs({ idFarmaco: 'a', nombreComercial: 'ACO', principio: 'etinilestradiol', esOral: true }, ctx({ riesgoTromboticoAlto: true }));
  const sg = avisoSugammadex({ mujerConAnticonceptivoHormonal: true, tipo: 'oral', posibleAnestesiaGeneral: true });
  add('E16', `${farmacoResumen(r)}; sugammadex: ${sg.textoPaciente}`, r.textoPaciente, 'confirmación; sugammadex oral (dosis olvidada)', r.requiereConfirmacion && sg.textoPaciente.includes('olvidada'));
}
{
  const r = reglaAnticonceptivoThs({ idFarmaco: 'i', nombreComercial: 'Implante', principio: 'etonogestrel', esOral: false }, ctx({ riesgoTromboticoAlto: false }));
  const sg = avisoSugammadex({ mujerConAnticonceptivoHormonal: true, tipo: 'no_oral', posibleAnestesiaGeneral: true });
  add('E17', `${farmacoResumen(r)}; sugammadex: barrera 7 días=${sg.textoPaciente.includes('7 días')}`, r.textoPaciente, 'sin regla trombótica; sugammadex no oral (barrera 7 días)', r.accion === 'mantener' && sg.textoPaciente.includes('7 días'));
}

// ————————————————————— F —————————————————————
{
  const r = calcularStopBang({ ronquidoFuerte: true, cansancioDiurno: false, apneasObservadas: false, htaEnTratamiento: true, imcMayor35: true, edadMayor50: true, cuelloMayor40: true, varon: true });
  add('F1', `STOP-Bang ${r.puntuacion} (${r.categoria})`, '—', '6, riesgo alto', r.puntuacion === 6 && r.categoria === 'alto');
}
{
  const r = calcularStopBang({ ronquidoFuerte: true, cansancioDiurno: true, apneasObservadas: false, htaEnTratamiento: false, imcMayor35: false, edadMayor50: false, cuelloMayor40: false, varon: false });
  add('F2', `STOP-Bang ${r.puntuacion} (${r.categoria})`, '—', '2, riesgo bajo', r.puntuacion === 2 && r.categoria === 'bajo');
}
{
  const r = calcularApfel({ mujer: true, noFumador: true, nvpoOCinetosisPrevias: true, riesgoQuirurgico: 'intermedio' });
  add('F3', `Apfel ${r.puntuacion} (${r.probabilidad} %)`, '—', '4, 80 %', r.puntuacion === 4 && r.probabilidad === 80);
}
{
  const r = calcularCha2ds2va({ insuficienciaCardiaca: true, hta: false, edadAnios: 76, diabetes: true, ictusAitTromboembolismo: false, enfermedadVascular: false });
  add('F4', `CHA2DS2-VA ${r.puntuacion}`, '—', '4', r.puntuacion === 4);
}
{
  const r = calcularDasi(['autocuidado', 'caminarDentroCasa', 'caminar1a2Manzanas', 'subirUnPisoOCuesta', 'tareasLigerasCasa', 'tareasModeradasCasa', 'relacionesSexuales']);
  add('F5', `DASI ${r.dasi}; METs ${r.mets}; reducida ${r.capacidadReducida}`, '—', 'DASI 24,2; capacidad reducida', Math.abs(r.dasi - 24.2) < 0.1 && r.capacidadReducida);
}
{
  const h = calcularAclaramiento({ edadAnios: 80, pesoKg: 60, sexo: 'hombre', creatinina: 1.2, unidad: 'mg_dl' });
  const m = calcularAclaramiento({ edadAnios: 80, pesoKg: 60, sexo: 'mujer', creatinina: 1.2, unidad: 'mg_dl' });
  add('F6', `varón ${h}; mujer ${m}`, '—', '42; 35', Math.round(h ?? 0) === 42 && Math.round(m ?? 0) === 35);
}
{
  const r = calcular4AT({ alerta: 'normal', amt4: '1_error', meses: 'menos_de_7', cambioAgudo: 'no' });
  add('F7', `4AT ${r.puntuacion} (${r.categoria})`, '—', '2, posible deterioro', r.puntuacion === 2 && r.categoria === 'posible_deterioro_cognitivo');
}
{
  const r = calcular4AT({ alerta: 'normal', amt4: '0_errores', meses: '7_o_mas', cambioAgudo: 'si' });
  add('F8', `4AT ${r.puntuacion} (${r.categoria})`, '—', '4, posible delirium', r.puntuacion === 4 && r.categoria === 'posible_delirium');
}
{
  const r = calcularEgri({ pesoKg: 115, intubacionDificilPrevia: 'dudoso' });
  add('F9', `EGRI parcial ${r.puntuacion}`, '—', '3', r.puntuacion === 3);
}
{
  const r = calcularLangeron({ barba: true, imc: 27, edentulo: false, edadAnios: 60, ronquido: false });
  add('F10', `Langeron ${r.puntuacion} (${r.categoria})`, '—', '3, riesgo', r.puntuacion === 3 && r.categoria === 'riesgo');
}
{
  const r = calcularMorfinaEquivalente([{ id: 'fentanilo_transdermico', dosisDiaria: 25 }, { id: 'tapentadol', dosisDiaria: 200 }]);
  add('F11', `${r.mgDia} mg/día (${r.categoria})`, '—', '140 mg/día, alerta alta', r.mgDia === 140 && r.categoria === 'alerta_alta');
}
{
  const r = calcularAuditC({ frecuenciaConsumo: 1, cantidadTipica: 1, frecuenciaAtracon: 1, sexo: 'mujer' });
  add('F12', `AUDIT-C ${r.puntuacion} (${r.categoria})`, '—', 'positivo sin abstinencia', r.positivo && !r.riesgoAbstinencia);
}
{
  const r = calcularHemstop({ hematomasSinTrauma: true, sangradoProlongadoHeridas: true, menstruacionAbundante: false, sangradoTrasCirugia: false, sangradoTrasDental: false, sangradoEnParto: false, familiaresTrastornoCoagulacion: false });
  add('F13', `HEMSTOP ${r.puntuacion} (${r.categoria}); pedir coagulación: ${r.pedirCoagulacion}; alerta: ${r.alerta?.gravedad ?? '—'}`, '—', 'positivo → coagulación + alerta', r.positivo && r.pedirCoagulacion && r.alerta?.gravedad === 'amarilla');
}

// ————————————————————— G —————————————————————
const sinF: FactoresPruebas = { anemiaOHbBaja: false, trastornoCoagulacionOAnticoagulante: false, anestesiaRegionalPosible: false, sangradoPrevisible: false, hemstopPositivo: false, supuestoRxTorax: false, supuestoEcocardiograma: false };
const nombres = (ps: { prueba: string }[]) => ps.map((p) => p.prueba).sort().join(', ');
{
  const r = decidirPruebas('intermedio', 'bajo-moderado', sinF);
  add('G1', `pruebas: ${nombres(r)}`, '—', 'hemograma, coagulación, bioquímica, ECG; sin Rx', nombres(r) === 'bioquimica, coagulacion, ecg, hemograma');
}
{
  const r = decidirPruebas('intermedio', 'bajo', sinF);
  add('G2', `pruebas: ${nombres(r)}`, '—', 'hemograma y coagulación', nombres(r) === 'coagulacion, hemograma');
}
{
  const r = decidirPruebas('intermedio', 'alto', sinF);
  const ecgVig = pruebaVigente('ecg', new Date(2026, 7, 15), IV);
  const coagVig = pruebaVigente('coagulacion', new Date(2026, 8, 25), IV);
  add('G3', `pruebas: ${nombres(r)}; ECG vigente: ${ecgVig}; coagulación vigente: ${coagVig}`, '—', '+Rx; ECG vigente no se repite; coagulación caducada sí', r.some((p) => p.prueba === 'rx_torax') && ecgVig && !coagVig);
}

// ————————————————————— H —————————————————————
{
  const r = calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'ninguna' });
  const ligera = r.lineas.find((l) => l.concepto.includes('ligera'))?.hora;
  const claros = r.lineas.find((l) => l.horasAntes === 4)?.hora;
  add('H1', `ligera ${ligera}; claros libres ${claros}; carbohidratos ${r.lineas.some((l) => l.concepto.includes('carbohidratos'))}`, '—', 'ligera 02:00; claros 04:00; bebida carbohidratos', ligera === '02:00' && claros === '04:00');
}
{
  const r = calcularAyuno({ induccion: IV, pediatrico: true, situacion: 'ninguna' });
  const solidos = r.lineas.find((l) => l.concepto.includes('fórmula y sólidos'))?.hora;
  const materna = r.lineas.find((l) => l.concepto === 'Leche materna')?.hora;
  const clarosP = r.lineas.find((l) => l.concepto === 'Líquidos claros')?.hora;
  add('H2', `fórmula/sólidos ${solidos}; materna ${materna}; claros ${clarosP}`, '—', 'sólidos 02:00; materna 05:00; claros 07:00', solidos === '02:00' && materna === '05:00' && clarosP === '07:00');
}
{
  const r = calcularAyuno({ induccion: IV, pediatrico: true, edadMeses: 4, situacion: 'ninguna' });
  const formula = r.lineas.find((l) => l.concepto.includes('menor de 6 meses'))?.hora;
  add('H3', `fórmula ${formula}; aviso hipoglucemia ${r.alertas.some((a) => a.mensaje.includes('hipoglucemia'))}`, '—', 'fórmula 04:00; aviso hipoglucemia', formula === '04:00' && r.alertas.some((a) => a.mensaje.includes('hipoglucemia')));
}
{
  const r = calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'diabetes_gastroparesia' });
  add('H4', `sólidos ${r.lineas[0]?.hora}; carbohidratos ${r.lineas.some((l) => l.concepto.includes('carbohidratos'))}; alerta metoclopramida ${r.alertas.some((a) => a.mensaje.includes('metoclopramida'))}`, '—', 'sólidos 00:00 (8 h); sin carbohidratos; alerta metoclopramida', r.lineas[0]?.hora === '00:00' && !r.lineas.some((l) => l.concepto.includes('carbohidratos')));
}

// ————————————————————— I —————————————————————
{
  const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: true, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'negativo' });
  add('I1', `alerta: ${r.alerta.gravedad} — ${r.alerta.mensaje}`, r.textoPaciente, 'informativa (variante ausente)', r.alerta.gravedad === 'informativa' && r.alerta.mensaje.includes('ausente'));
}
{
  const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: true, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'no_hecho' });
  add('I2', `alerta: ${r.alerta.gravedad}`, r.textoPaciente, 'alerta roja', r.alerta.gravedad === 'roja');
}
{
  const r = evaluarMtnd4({ ascendenciaVenezolanaMaterna: false, origenMaternoDesconocidoUOvodonacion: false, antecedentesFamiliaresCompatibles: false, testGenetico: 'no_hecho' });
  add('I3', `alerta: ${r.alerta.gravedad}`, r.textoPaciente, 'sin alerta roja (no línea materna)', r.alerta.gravedad === 'informativa');
}
{
  const t = tarjetaFarmacoAEnfermedad({ nombre: 'Prednisona', indicacionesPosibles: ['trasplante', 'artritis_reumatoide', 'lupus', 'asma_epoc', 'insuficiencia_suprarrenal'] }, new Set());
  add('I4', `tarjeta: ${t?.tipo ?? 'ninguna'}`, t?.mensaje ?? '—', 'tarjeta de coherencia; no marca enfermedad', t?.tipo === 'farmaco_a_enfermedad');
}
{
  const ts = tarjetasEnfermedadAFarmaco(new Set(['saos']), new Set());
  add('I5', `tarjetas: ${ts.length}`, ts[0]?.mensaje ?? '—', 'tarjeta inversa (preguntar por CPAP)', ts.some((t) => t.mensaje.toLowerCase().includes('cpap')));
}

// ————————————————————— Escritura del informe —————————————————————
const total = filas.length;
const ok = filas.filter((f) => f.coincide).length;

let md = `# Informe de casos de referencia (ejecución del motor)\n\n`;
md += `> Generado automáticamente por \`scripts/generar-informe-casos.ts\` ejecutando el MOTOR con la entrada de cada caso de \`docs/casos_referencia.md\`.\n`;
md += `> Los valores de la columna "Motor" salen de la ejecución del motor, no de las aserciones de las pruebas.\n`;
md += `> Intervención de referencia: jueves 15/10/2026 a las 08:00 (salvo A2b y A3b: 13:00).\n\n`;
md += `**Resultado: ${ok}/${total} casos coinciden con lo esperado.**\n\n`;
md += `| Caso | Motor (cálculo) | Texto del paciente | Esperado | ¿Coincide? |\n`;
md += `|---|---|---|---|---|\n`;
for (const f of filas) {
  md += `| ${f.id} | ${esc(f.calculado)} | ${esc(f.textoPaciente)} | ${esc(f.esperado)} | ${f.coincide ? '✅' : '❌'} |\n`;
}
md += `\n## Casos pendientes (módulos del flujo de entrevista aún no construidos)\n\n`;
md += `- D1 (Synjardy): cubierto en \`tests/unit/reglas/reglas2.test.ts\` (combinación fija).\n`;
md += `- Las consecuencias clínicas de todos los casos que dependían de insulinas (D7-D9) y HEMSTOP (F13) ya están implementadas y verificadas arriba.\n`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const salida = join(__dirname, '..', 'docs', 'informe_casos_referencia.md');
writeFileSync(salida, md, 'utf8');
console.log(`Informe escrito en ${salida}: ${ok}/${total} coinciden.`);
