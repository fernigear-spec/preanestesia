/**
 * Informe de los casos de docs/documento_fuente.md §15 ejecutables con el motor
 * actual (escalas + reglas de medicación). NO es un test con aserciones: imprime,
 * para cada caso, el resultado OBTENIDO frente al ESPERADO, para revisión clínica.
 *
 * Ejecutar: node --experimental-strip-types tests/casos15.report.ts
 */
import type { ContextoReglas } from '../src/dominio/tipos.ts';
import { reglaAcod } from '../src/dominio/reglas/acod.ts';
import { calcularCha2ds2va } from '../src/dominio/escalas/cha2ds2va.ts';
import { reglaP2y12, evaluarStent, reglaP2y12Oftalmo } from '../src/dominio/reglas/antiagregantes.ts';
import { reglaAvk } from '../src/dominio/reglas/antivitaminaK.ts';
import { reglaLitio } from '../src/dominio/reglas/psicofarmacos.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal } from '../src/dominio/reglas/antidiabeticos.ts';
import { calcularStbur } from '../src/dominio/escalas/stbur.ts';
import { calcularPovoc } from '../src/dominio/escalas/povoc.ts';
import { calcularEgri } from '../src/dominio/escalas/egri.ts';
import { calcularMorfinaEquivalente } from '../src/dominio/escalas/morfinaEquivalente.ts';
import { calcularAuditC } from '../src/dominio/escalas/auditC.ts';
import { evaluarCfs } from '../src/dominio/escalas/cfs.ts';
import { calcular4AT } from '../src/dominio/escalas/cuatroAT.ts';
import { reglaNoCatalogado, aplicarPlazoNoAlcanzable } from '../src/dominio/reglas/otros.ts';
import { fechaHoraLimite } from '../src/dominio/fechas/plazos.ts';

const IV = new Date(2026, 9, 15, 8, 0); // jueves 15 oct 2026, 08:00
const H = (d?: Date) => (d ? Math.round((IV.getTime() - d.getTime()) / 3_600_000) : NaN);
const D = (d?: Date) => (d ? Math.round((IV.getTime() - d.getTime()) / 86_400_000) : NaN);

function ctx(p: Partial<ContextoReglas> = {}): ContextoReglas {
  return {
    fechaHoraIntervencion: IV, riesgoHemorragico: 'alto', riesgoCardiovascular: 'intermedio',
    grupoOftalmologico: 'no_aplica', neuroaxial: false, bloqueoProfundo: false,
    riesgoTromboticoAlto: false, regimen: 'ingreso', pesoKg: 80, aclaramiento: null, ...p,
  };
}

interface Linea { caso: string; esperado: string; obtenido: string; ok: boolean }
const filas: Linea[] = [];
const add = (caso: string, esperado: string, obtenido: string, ok: boolean) =>
  filas.push({ caso, esperado, obtenido, ok });

// Caso 1
{
  const r = reglaAcod({ idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principioActivo: 'apixaban', subtipo: 'antixa' },
    ctx({ riesgoHemorragico: 'alto', neuroaxial: true, aclaramiento: 45 }));
  const cha = calcularCha2ds2va({ insuficienciaCardiaca: false, hta: true, edadAnios: 72, diabetes: true, ictusAitTromboembolismo: false, enfermedadVascular: false });
  add('1 · apixabán, prótesis rodilla+raquídea, CrCl 45', 'apixabán 72 h; CHA2DS2-VA 3',
    `apixabán ${H(r.fechaHoraUltimaToma)} h; CHA2DS2-VA ${cha.puntuacion}`, H(r.fechaHoraUltimaToma) === 72 && cha.puntuacion === 3);
}
// Caso 2
{
  const r = reglaAcod({ idFarmaco: 'dabigatran', nombreComercial: 'Pradaxa', principioActivo: 'dabigatran', subtipo: 'dabigatran' },
    ctx({ riesgoHemorragico: 'bajo', neuroaxial: false, aclaramiento: 40 }));
  add('2 · dabigatrán, CrCl 40, colecistectomía AG', '96 h (48+48)', `${H(r.fechaHoraUltimaToma)} h`, H(r.fechaHoraUltimaToma) === 96);
}
// Caso 3
{
  const s = evaluarStent({ mesesDesdeImplante: 4, traSca: true }, ctx({ neuroaxial: false }));
  const ok = s.recienteRequiereConfirmacion && s.suprimirPautaAntiagregantesEnHoja && s.alertas[0]?.gravedad === 'roja';
  add('3 · stent farmacoactivo 4 m tras SCA', 'alerta diferir, requiere confirmación, sin pauta en hoja',
    `reciente=${s.recienteRequiereConfirmacion}, sinPautaHoja=${s.suprimirPautaAntiagregantesEnHoja}, alerta=${s.alertas[0]?.gravedad}`, ok);
}
// Caso 4 (parcial: reglas de medicación; el ayuno/anexo se validará con el módulo de ayuno)
{
  const sem = reglaGlp1Semanal({ idFarmaco: 'semaglutida', nombreComercial: 'Ozempic', principio: 'semaglutida', proximaDosis: new Date(2026, 9, 12, 9, 0) }, ctx());
  const emp = reglaSglt2({ idFarmaco: 'empagliflozina', nombreComercial: 'Jardiance', principio: 'empagliflozina' }, ctx());
  const met = reglaMetformina({ idFarmaco: 'metformina', nombreComercial: 'Dianben' }, ctx());
  const ok = sem.accion === 'suspender' && D(emp.fechaHoraUltimaToma) === 3 && met.accion === 'suspender';
  add('4 · semaglutida sem + empagliflozina + metformina', 'omitir semaglutida (+dieta líquida), empagliflozina 3 d, metformina no el día IQ',
    `semaglutida=${sem.accion} (${sem.textoPaciente}), empagliflozina=${D(emp.fechaHoraUltimaToma)} d, metformina=${met.accion} (${met.textoPaciente})`, ok);
}
// Caso 5
{
  const r = reglaAvk({ idFarmaco: 'acenocumarol', nombreComercial: 'Sintrom', principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctx({ grupoOftalmologico: 'riesgo_bajo' }));
  add('5 · catarata tópica + acenocumarol', 'no suspender', `${r.farmaco.accion}`, r.farmaco.accion === 'mantener');
}
// Caso 6
{
  const r = reglaP2y12Oftalmo({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: true }, ctx({ grupoOftalmologico: 'riesgo_moderado_alto', riesgoHemorragico: 'minimo' }));
  add('6 · vitrectomía + clopidogrel monoterapia', 'sustituir por AAS 100, suspender clopidogrel 5 d', `clopidogrel ${D(r.fechaHoraUltimaToma)} d, nota=${(r.textoAnestesiologo ?? '').includes('AAS 100')}`, D(r.fechaHoraUltimaToma) === 5);
}
// Caso 7
{
  const r = reglaP2y12({ idFarmaco: 'ticagrelor', nombreComercial: 'Brilique', principio: 'ticagrelor', monoterapia: false }, ctx({ neuroaxial: true }));
  add('7 · prótesis cadera raquídea + ticagrelor', '7 días', `${D(r.fechaHoraUltimaToma)} d`, D(r.fechaHoraUltimaToma) === 7);
}
// Caso 8 (STBUR y POVOC; ayuno pediátrico pendiente del módulo de ayuno)
{
  const stbur = calcularStbur({ roncaMasMitadNoches: true, roncaFuerte: true, esfuerzoRespiratorioDormido: false, dejaDeRespirarDormido: true, cansadoOSomnolientoDia: false });
  const povoc = calcularPovoc({ cirugiaMayor30min: true, edadMayorIgual3: true, cirugiaEstrabismo: false, nvpoNinioOFamiliares: false });
  const ok = stbur.categoria === 'riesgo' && stbur.puntuacion >= 3 && povoc.probabilidad === 30;
  add('8 · niño 5 a, amigdalectomía, ronquido+apneas', 'STBUR ≥3 (alerta), POVOC calculado, sin STOP-Bang',
    `STBUR ${stbur.puntuacion} (${stbur.categoria}), POVOC ${povoc.probabilidad}%`, ok);
}
// Caso 10
{
  const r = calcularEgri({ aperturaBucal: 'lt_4', distanciaTiromentoniana: 'lt_6', mallampati: 3, movilidadCervical: 'gt_90', puedeProtruir: true, pesoKg: 95, intubacionDificilPrevia: 'no' });
  add('10 · AB 3,5 / DTM 5,5 / MP III / 95 kg', 'EGRI 6, riesgo elevado', `EGRI ${r.puntuacion}, ${r.categoria}`, r.puntuacion === 6 && r.categoria === 'riesgo elevado');
}
// Caso 12
{
  const r = reglaAvk({ idFarmaco: 'warfarina', nombreComercial: 'Aldocumar', principio: 'warfarina', altoRiesgoTromboembolico: true }, ctx({ pesoKg: 80, aclaramiento: 90 }));
  const ok = r.farmaco.requiereConfirmacion && r.puente?.dosisMgPorToma === 80 && r.puente?.intervaloHoras === 12;
  add('12 · warfarina, prótesis mitral mecánica, 80 kg', 'puente enoxaparina 80 mg/12 h, requiere confirmación',
    `puente ${r.puente?.dosisMgPorToma} mg/${r.puente?.intervaloHoras} h, confirm=${r.farmaco.requiereConfirmacion}`, !!ok);
}
// Caso 13
{
  const r = reglaLitio({ idFarmaco: 'litio', nombreComercial: 'Plenur' }, ctx({ riesgoCardiovascular: 'alto' }));
  add('13 · litio + cirugía de alto riesgo', '72 h', `${H(r.fechaHoraUltimaToma)} h`, H(r.fechaHoraUltimaToma) === 72);
}
// Caso 15
{
  const r = reglaP2y12({ idFarmaco: 'clopidogrel', nombreComercial: 'Plavix', principio: 'clopidogrel', monoterapia: false }, ctx({ neuroaxial: false }));
  const ahora = fechaHoraLimite(IV, 3 * 24);
  const { resultado, alerta } = aplicarPlazoNoAlcanzable(r, ctx(), ahora);
  const ok = resultado.requiereConfirmacion && resultado.accion === 'consultar' && alerta?.gravedad === 'roja';
  add('15 · IQ dentro de 3 días con clopidogrel', 'plazo no alcanzable, alerta, requiere confirmación',
    `accion=${resultado.accion}, confirm=${resultado.requiereConfirmacion}, alerta=${alerta?.gravedad}`, ok);
}
// Caso 16
{
  const r = calcularMorfinaEquivalente([{ id: 'oxicodona', dosisDiaria: 40 }, { id: 'tramadol', dosisDiaria: 300 }]);
  add('16 · oxicodona 20/12h + tramadol 100/8h', '120 mg/día morfina oral, alerta alta', `${r.mgDia} mg/día, ${r.categoria}`, r.mgDia === 120 && r.categoria === 'alerta_alta');
}
// Caso 17 (escalas; prehabilitación off por defecto)
{
  const cfs = evaluarCfs(6);
  const at = calcular4AT({ alerta: 'normal', amt4: '2_o_mas_o_no_valorable', meses: '7_o_mas', cambioAgudo: 'no' });
  const ok = cfs.fragilidad && at.puntuacion === 2 && at.categoria === 'posible_deterioro_cognitivo';
  add('17 · mujer 78 a, CFS 6, 4AT 2, Hb 11,5', 'fragilidad, 4AT posible deterioro (riesgo delirium), anemia',
    `CFS fragilidad=${cfs.fragilidad}, 4AT ${at.puntuacion} (${at.categoria})`, ok);
}
// Caso 18
{
  const r = calcularAuditC({ frecuenciaConsumo: 4, cantidadTipica: 3, frecuenciaAtracon: 2, sexo: 'hombre' });
  add('18 · AUDIT-C 9 en varón', 'alerta de abstinencia y hoja de alcohol', `AUDIT-C ${r.puntuacion}, ${r.categoria}`, r.puntuacion === 9 && r.riesgoAbstinencia);
}
// Caso 20
{
  const r = reglaNoCatalogado('MedicamentoRaro');
  add('20 · fármaco no catalogado', 'mantener y consultar', `${r.accion}, confirm=${r.requiereConfirmacion}`, r.accion === 'mantener' && r.requiereConfirmacion);
}

// ————————————— Impresión —————————————
const NO_EJECUTABLE = [
  ['9', 'mtND4 (módulo mtND4 pendiente en este tramo)'],
  ['11', 'tabla de pruebas complementarias (módulo pruebas pendiente)'],
  ['14', 'sin hora de cirugía → 08:00 + aviso (paso 1 / flujo pendiente)'],
  ['19', 'QR codificar/decodificar (módulo QR pendiente)'],
  ['21', 'validación de datos corruptos (cubierto en tests/unit/datos, no aquí)'],
  ['22', 'asistente de coherencia (módulo coherencia pendiente)'],
  ['23', 'privacidad localStorage/SW (fase de interfaz)'],
];

console.log('\n===== CASOS §15 EJECUTABLES CON EL MOTOR (obtenido vs esperado) =====\n');
let okCount = 0;
for (const f of filas) {
  console.log(`${f.ok ? 'OK ' : 'XX '} Caso ${f.caso}`);
  console.log(`    esperado: ${f.esperado}`);
  console.log(`    obtenido: ${f.obtenido}`);
  if (f.ok) okCount++;
}
console.log(`\nResumen: ${okCount}/${filas.length} coinciden con lo esperado.`);
console.log('\n----- Casos §15 aún NO ejecutables con este tramo (requieren módulos posteriores) -----');
for (const [n, motivo] of NO_EJECUTABLE) console.log(`  Caso ${n}: ${motivo}`);
console.log('');
