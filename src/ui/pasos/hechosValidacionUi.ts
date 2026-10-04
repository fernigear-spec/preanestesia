/**
 * Construye el mapa de HECHOS para los puntos de validación clínica (§13 bis) a
 * partir del estado de la entrevista. Son los orígenes que NO son «moduloId.preguntaId»:
 * escalas (4AT, STOP-Bang, STBUR, EGRI, AUDIT-C, CFS/METs, HEMSTOP), hechos clínicos
 * calculados (stent/infarto reciente, corticoide dosis de estrés), datos del paso 1
 * (riesgo quirúrgico, posible embarazo), alergias (látex), antecedentes (intubación
 * difícil, reacción en quirófano), condiciones especiales (hipertermia maligna/
 * pseudocolinesterasa) y vía aérea.
 *
 * Es una función pura compartida por el resumen del anestesiólogo (Salidas) y la
 * hoja del paciente (BloqueHojaPaciente), para que ambos vean los mismos puntos.
 */
import type { EstadoEntrevista } from '../estadoEntrevista.ts';
import type { HechosValidacion } from '../../dominio/entrevista/puntosValidacion.ts';
import { derivarHechosClinicos } from '../../dominio/entrevista/hechosClinicos.ts';
import { evaluarStent } from '../../dominio/reglas/antiagregantes.ts';
import { construirContexto } from '../../dominio/reglas/motor.ts';
import { calcular4AT } from '../../dominio/escalas/cuatroAT.ts';
import { calcularEgri, EGRI_UMBRAL_RIESGO } from '../../dominio/escalas/egri.ts';
import { calcularAuditC } from '../../dominio/escalas/auditC.ts';
import { calcularStopBang } from '../../dominio/escalas/stopBang.ts';
import { calcularStbur } from '../../dominio/escalas/stbur.ts';
import { calcularDasi } from '../../dominio/escalas/dasi.ts';
import { calcularHemstop } from '../../dominio/escalas/hemstop.ts';
import { calcularImc } from '../estadoEntrevista.ts';

const MS_DIA = 86_400_000;
const EDAD_PEDIATRICA_MAXIMA = 17;

/** Construye el mapa de hechos para `derivarPuntosValidacion`. */
export function construirHechosValidacion(e: EstadoEntrevista, hoy: Date): HechosValidacion {
  const { intervencion, basicos, cribado, habitos, viaAerea, antecedentes, medicacion } = e;
  if (!intervencion || !basicos || !cribado) return {};

  const enfermedades = new Set(cribado.enfermedades);
  const respuestas = cribado.respuestasModulos;
  const imc = calcularImc(basicos.pesoKg, basicos.tallaCm);

  const clin = derivarHechosClinicos({
    respuestas, enfermedades,
    medicacion: (medicacion ?? []).map((f) => ({ principiosActivos: f.principiosActivos, idRegla: f.idRegla })),
    edadAnios: basicos.edadAnios, pesoKg: basicos.pesoKg, sexo: basicos.sexo,
    fechaIntervencion: intervencion.fechaHora, espacioCerrado: intervencion.espacioCerrado, contrasteYodado: intervencion.contrasteYodado,
  });

  // Stent reciente (§8.3).
  let stentReciente = false;
  if (clin.stent && clin.stent.mesesDesdeImplante !== null) {
    const refFecha = intervencion.fechaHora ?? new Date(hoy.getTime() + 90 * MS_DIA);
    const ctx = construirContexto({ ...intervencion, fechaHora: refFecha, fechaDesconocida: false }, basicos.pesoKg, clin.aclaramiento, undefined, hoy);
    stentReciente = evaluarStent({ mesesDesdeImplante: clin.stent.mesesDesdeImplante, traSca: clin.stent.traSca ?? true }, ctx).recienteRequiereConfirmacion;
  }

  // 4AT y AUDIT-C.
  const cuatroAt = habitos?.cuatroAt ? calcular4AT(habitos.cuatroAt) : null;
  const auditCompleto = habitos != null && habitos.auditFrecuencia !== undefined && habitos.auditCantidad !== undefined && habitos.auditAtracon !== undefined;
  const audit = auditCompleto
    ? calcularAuditC({ frecuenciaConsumo: habitos.auditFrecuencia!, cantidadTipica: habitos.auditCantidad!, frecuenciaAtracon: habitos.auditAtracon!, sexo: basicos.sexo })
    : null;

  // HEMSTOP.
  const hemstop = calcularHemstop(cribado.hemstop);

  // STOP-Bang (adultos sin SAOS diagnosticado) o STBUR (pediátrico).
  const pediatrico = basicos.edadAnios <= EDAD_PEDIATRICA_MAXIMA;
  const saosResp = respuestas['saos'] ?? {};
  let stopBangAlto = false;
  let stburAlto = false;
  if (pediatrico) {
    const pediatriaResp = respuestas['pediatria'] ?? {};
    const stbur = calcularStbur({
      roncaMasMitadNoches: pediatriaResp['ronca_mitad_noches'] === true,
      roncaFuerte: pediatriaResp['ronca_fuerte'] === true,
      esfuerzoRespiratorioDormido: pediatriaResp['esfuerzo_respiratorio'] === true,
      dejaDeRespirarDormido: pediatriaResp['deja_de_respirar'] === true,
      cansadoOSomnolientoDia: pediatriaResp['cansado_dia'] === true,
    });
    stburAlto = stbur.puntuacion >= 3;
  } else if (enfermedades.has('saos') && saosResp['diagnosticado'] !== true) {
    const cuelloCm = typeof saosResp['perimetro_cuello'] === 'number' ? (saosResp['perimetro_cuello'] as number) : viaAerea?.perimetroCuello ?? 0;
    const sb = calcularStopBang({
      ronquidoFuerte: saosResp['ronquido_fuerte'] === true,
      cansancioDiurno: saosResp['cansancio_diurno'] === true,
      apneasObservadas: saosResp['apneas_observadas'] === true,
      htaEnTratamiento: enfermedades.has('hta'),
      imcMayor35: imc !== null && imc > 35,
      edadMayor50: basicos.edadAnios > 50,
      cuelloMayor40: cuelloCm > 40,
      varon: basicos.sexo === 'hombre',
    });
    stopBangAlto = sb.alto;
  }

  // EGRI (solo con exploración de vía aérea).
  let egriAlto = false;
  if (viaAerea) {
    const egri = calcularEgri({
      pesoKg: basicos.pesoKg,
      ...(viaAerea.aperturaBucal ? { aperturaBucal: viaAerea.aperturaBucal } : {}),
      ...(viaAerea.distanciaTiromentoniana ? { distanciaTiromentoniana: viaAerea.distanciaTiromentoniana } : {}),
      ...(viaAerea.mallampati ? { mallampati: viaAerea.mallampati } : {}),
      ...(viaAerea.movilidadCervical ? { movilidadCervical: viaAerea.movilidadCervical } : {}),
      ...(viaAerea.puedeProtruir !== undefined ? { puedeProtruir: viaAerea.puedeProtruir } : {}),
      ...(viaAerea.intubacionDificilPrevia ? { intubacionDificilPrevia: viaAerea.intubacionDificilPrevia } : {}),
    });
    egriAlto = egri.puntuacion >= EGRI_UMBRAL_RIESGO;
  }

  // Capacidad funcional reducida (< 4 METs o DASI ≤ 34).
  const dasiCapacidad = habitos && habitos.subeDosPisos !== 'si' && habitos.itemsDasi.length > 0 ? calcularDasi(habitos.itemsDasi as never[]) : null;
  const capacidadFuncionalReducida = habitos?.subeDosPisos === 'no' || (dasiCapacidad?.capacidadReducida ?? false);
  const cfsFragil = habitos?.cfs !== undefined && habitos.cfs >= 5;
  const riesgoQuirurgicoAlto = intervencion.riesgoCardiovascular === 'alto';

  // mtND4 rojo.
  const mtRojo = (() => {
    const m = e.mtnd4;
    if (!m) return false;
    if (m.testGenetico === 'positivo') return true;
    if (m.testGenetico === 'negativo') return false;
    return m.ascendenciaVenezolanaMaterna || m.origenMaternoDesconocidoUOvodonacion || m.antecedentesFamiliaresCompatibles;
  })();

  const incidencias = new Set((antecedentes?.intervencionesPrevias ?? []).flatMap((iq) => iq.incidencias));
  const ce = cribado.condicionesEspeciales;

  return {
    stent_reciente: stentReciente,
    infarto_reciente: clin.infartoReciente,
    cuatro_at_alto: !!cuatroAt && cuatroAt.puntuacion >= 4,
    mtnd4_rojo: mtRojo,
    stop_bang_alto: stopBangAlto,
    stbur_alto: stburAlto,
    egri_alto: egriAlto,
    audit_abstinencia: audit?.riesgoAbstinencia === true,
    hemstop_positivo: hemstop.positivo,
    corticoide_dosis_estres: clin.corticoideDosisEstres,
    fragilidad_mets_riesgo_alto: riesgoQuirurgicoAlto && (cfsFragil || capacidadFuncionalReducida),
    posible_embarazo: basicos.posibleEmbarazo === true && basicos.moduloObstetrico !== true,
    alergia_latex: e.alergias?.latex === true,
    reaccion_alergica_quirofano: incidencias.has('reaccion_alergica'),
    intubacion_dificil_previa: viaAerea?.intubacionDificilPrevia === 'confirmado' || incidencias.has('intubacion_dificil'),
    limitacion_cervical_reumatica: viaAerea?.limitacionCervicalReumatologica === true,
    radioterapia_tumor_cervical: viaAerea?.radioterapiaCervical === true || viaAerea?.tumorCabezaCuello === true,
    hipertermia_maligna_pseudocolinesterasa:
      ce.hipertermiaMalignaPersonal || ce.hipertermiaMalignaFamiliar || ce.pseudocolinesterasaPersonal || ce.pseudocolinesterasaFamiliar,
    testigo_jehova: basicos.rechazaHemoderivados === true,
    cocaina_reciente: habitos?.cocainaUltimaSemana === true,
  };
}
