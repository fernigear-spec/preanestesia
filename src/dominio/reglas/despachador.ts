/**
 * Despachador de reglas para la interfaz (paso 8) — docs/documento_fuente.md §8.
 * Dado el id_regla de un fármaco del catálogo y los datos recogidos por la
 * enfermera (horas de toma, dosis, última dosis, unidades de insulina…) más el
 * contexto de la intervención, ejecuta la regla adecuada y devuelve un
 * ResultadoFarmaco. Los grupos no cubiertos aquí devuelven un resultado de
 * "consultar" (el anestesiólogo lo revisará), nunca una pauta inventada.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { type DatosClinicos, HECHOS_VACIOS } from '../entrevista/hechosClinicos.ts';
import { combinacionFija } from './motor.ts';
import type { IndicacionInmuno } from './inmunosupresores.ts';
import { reglaAcod } from './acod.ts';
import { reglaAvk } from './antivitaminaK.ts';
import { reglaAas, reglaP2y12, reglaTriflusal, reglaCilostazol, reglaDipiridamol, reglaSulodexida, reglaGpIibIiia, type GpIibIiia } from './antiagregantes.ts';
import { reglaHbpm, reglaFondaparinux, reglaHeparinaSodica, type TipoHbpm } from './heparinas.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal, reglaGlp1Diario, reglaAntidiabeticoNoDiaIq, reglaDpp4, reglaInsulinaGlp1Fija } from './antidiabeticos.ts';
import { reglaInsulinaBasal, reglaInsulinaNph, reglaInsulinaPremezclada, reglaInsulinaRapida } from './insulinas.ts';
import { reglaIecaAra2, reglaDiuretico, reglaSacubitriloValsartan } from './cardiovasculares.ts';
import { reglaLitio, reglaMoclobemida, reglaImaoIrreversible, reglaImaoB } from './psicofarmacos.ts';
import { reglaAine } from './aine.ts';
import { reglaMetotrexato, reglaBiologico, reglaInmunosupresorClasico, reglaFameMantener, reglaJak } from './inmunosupresores.ts';
import { reglaAntiangiogenico, reglaTirosinaCinasa } from './oncologicos.ts';
import { reglaFitoterapia, reglaAnticonceptivoThs, reglaCorticoide, reglaNoCatalogado, reglaMantener } from './otros.ts';

/** Datos recogidos por la enfermera para un fármaco en el paso 8. */
export interface DatosFarmacoUi {
  idFarmaco: string;
  nombreComercial: string;
  principiosActivos: string[];
  idRegla: string; // primer id_regla del catálogo (una sola regla por ahora)
  via: 'oral' | 'no_oral';
  /** Horas habituales de toma ("HH:MM"). */
  horas: string[];
  /** Dosis en mg (cuando la regla depende de ella: AAS, metotrexato, HBPM). */
  dosisMg?: number;
  /** Día de la semana del fármaco semanal (0 domingo … 6 sábado) → próxima dosis. */
  proximaDosisSemanal?: Date;
  /** Fecha de la última dosis (biológicos/antiangiogénicos). */
  fechaUltimaDosis?: Date;
  /** Periodicidad en días (biológicos). */
  periodicidadDias?: number;
  /** Insulinas: unidades. */
  insulinaBasalUi?: number;
  insulinaNocheUi?: number;
  insulinaMananaUi?: number;
  /** Clasificación de HBPM si el fármaco es heparina. */
  tipoHbpm?: TipoHbpm;
  /** Indicación cardiovascular del AAS (para la sugerencia de bajar a 100 mg, §8.3). */
  indicacionCardiovascular?: boolean;
  /** Indicación del inmunosupresor clásico (trasplante/sistémica grave/autoinmune, §8.8). */
  indicacionInmuno?: IndicacionInmuno;
  /** Texto para el paciente del catálogo (farmacos.csv) que sobrescribe el de la regla (§3). */
  textoPacienteOverride?: string;
  /** Texto para el anestesiólogo del catálogo que sobrescribe el de la regla (§3). */
  textoAnestesiologoOverride?: string;
  /** requiere_confirmacion = sí en el catálogo: fuerza la confirmación (§8.0). */
  requiereConfirmacionCatalogo?: boolean;
}

const P = (horas: string[]) => ({ horas });

function consultarGenerico(d: DatosFarmacoUi, motivo: string): ResultadoFarmaco {
  return {
    idFarmaco: d.idFarmaco,
    nombreComercial: d.nombreComercial,
    principiosActivos: d.principiosActivos,
    accion: 'consultar',
    textoPaciente: `Sobre ${d.nombreComercial}, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.`,
    reglaAplicada: motivo,
    fuente: 'docs/documento_fuente.md §8',
    requiereConfirmacion: true,
  };
}

/** Mapea el principio activo de un inhibidor GP IIb/IIIa (tolerante a tildes). */
function principioGpIibIiia(principio: string): GpIibIiia {
  const p = principio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (p.includes('tirofiban')) return 'tirofiban';
  if (p.includes('cangrelor')) return 'cangrelor';
  if (p.includes('abciximab')) return 'abciximab';
  return 'eptifibatida';
}

/**
 * Aplica los textos personalizados del catálogo (farmacos.csv §3) y el
 * `requiere_confirmacion = sí` del catálogo sobre el resultado de la regla.
 */
function aplicarOverridesCatalogo(d: DatosFarmacoUi, r: ResultadoFarmaco): ResultadoFarmaco {
  const out: ResultadoFarmaco = { ...r };
  if (d.textoPacienteOverride) out.textoPaciente = d.textoPacienteOverride;
  if (d.textoAnestesiologoOverride) {
    out.textoAnestesiologo = out.textoAnestesiologo
      ? `${out.textoAnestesiologo} ${d.textoAnestesiologoOverride}`
      : d.textoAnestesiologoOverride;
  }
  if (d.requiereConfirmacionCatalogo) out.requiereConfirmacion = true;
  return out;
}

/**
 * Ejecuta la regla del fármaco con los datos recogidos, el contexto y los hechos
 * clínicos derivados de la entrevista (§5, §7). Ningún dato se cablea a un valor
 * fijo: si falta, la regla devuelve "requiere dato"/"requiere confirmación".
 *
 * @param d datos del fármaco recogidos en la UI.
 * @param ctx contexto de la intervención (con aclaramiento y peso reales); solo
 *   cuando hay fecha (sin fecha se usa el modo margen del QR, no este despachador).
 * @param clin hechos clínicos de la entrevista (stent, válvula, IC, etc.).
 */
export function evaluarFarmacoUi(d: DatosFarmacoUi, ctx: ContextoReglas, clin: DatosClinicos = HECHOS_VACIOS): ResultadoFarmaco {
  return aplicarOverridesCatalogo(d, evaluarRegla(d, { ...ctx, pautaFarmaco: P(d.horas) }, clin));
}

/**
 * Evalúa un medicamento comercial que puede ser una combinación fija (varios
 * id_regla, uno por principio activo, §8.0 / Decisión 5). Evalúa cada componente
 * y aplica el plazo más restrictivo en una única instrucción. Para un solo
 * id_regla, equivale a `evaluarFarmacoUi`.
 *
 * @param idReglas ids de regla del catálogo (columna id_regla separada por '+').
 */
export function evaluarCombinacionUi(
  d: DatosFarmacoUi,
  idReglas: string[],
  ctx: ContextoReglas,
  clin: DatosClinicos = HECHOS_VACIOS,
): ResultadoFarmaco {
  if (idReglas.length <= 1) {
    return evaluarFarmacoUi({ ...d, idRegla: idReglas[0] ?? d.idRegla }, ctx, clin);
  }
  const componentes = idReglas.map((idr, i) =>
    evaluarFarmacoUi(
      { ...d, idRegla: idr, principiosActivos: [d.principiosActivos[i] ?? d.principiosActivos[0] ?? ''] },
      ctx,
      clin,
    ),
  );
  const contieneMetformina = d.principiosActivos.includes('metformina');
  return combinacionFija(d.idFarmaco, d.nombreComercial, componentes, contieneMetformina);
}

function evaluarRegla(d: DatosFarmacoUi, ctxPauta: ContextoReglas, clin: DatosClinicos): ResultadoFarmaco {
  const nc = d.nombreComercial;
  const id = d.idFarmaco;
  const portadorStent = clin.stent !== null;
  const valvulaOStent = clin.valvulaMecanica || portadorStent;

  switch (d.idRegla) {
    case 'acod_antixa':
      return reglaAcod({ idFarmaco: id, nombreComercial: nc, principioActivo: d.principiosActivos[0] ?? '', subtipo: 'antixa', altoRiesgoTromboticoConfirmar: clin.altoRiesgoTrombotico }, ctxPauta);
    case 'acod_dabigatran':
      return reglaAcod({ idFarmaco: id, nombreComercial: nc, principioActivo: 'dabigatran', subtipo: 'dabigatran', altoRiesgoTromboticoConfirmar: clin.altoRiesgoTrombotico }, ctxPauta);

    case 'avk_acenocumarol':
      return reglaAvk({ idFarmaco: id, nombreComercial: nc, principio: 'acenocumarol', altoRiesgoTromboembolico: clin.altoRiesgoTrombotico, portadorValvulaMecanicaOStent: valvulaOStent }, ctxPauta).farmaco;
    case 'avk_warfarina':
      return reglaAvk({ idFarmaco: id, nombreComercial: nc, principio: 'warfarina', altoRiesgoTromboembolico: clin.altoRiesgoTrombotico, portadorValvulaMecanicaOStent: valvulaOStent }, ctxPauta).farmaco;

    case 'aas':
      return reglaAas({ idFarmaco: id, nombreComercial: nc, dosisDiariaMg: d.dosisMg ?? 100, indicacionCardiovascular: d.indicacionCardiovascular === true, neurocirugiaIntracranealOMedular: clin.neurocirugiaIntracranealOMedular }, ctxPauta);
    case 'p2y12_clopidogrel':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'clopidogrel', monoterapia: !clin.tieneAas, portadorStent }, ctxPauta);
    case 'p2y12_prasugrel':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'prasugrel', monoterapia: !clin.tieneAas, portadorStent }, ctxPauta);
    case 'p2y12_ticagrelor':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'ticagrelor', monoterapia: !clin.tieneAas, portadorStent }, ctxPauta);
    case 'triflusal':
      return reglaTriflusal(id, nc, ctxPauta);
    case 'dipiridamol':
      return reglaDipiridamol(id, nc, ctxPauta);
    case 'cilostazol':
      return reglaCilostazol(id, nc, ctxPauta);
    case 'sulodexida':
      return reglaSulodexida(id, nc, ctxPauta);
    case 'gp_iibiiia':
      return reglaGpIibIiia(id, nc, principioGpIibIiia(d.principiosActivos[0] ?? ''), ctxPauta);

    case 'hbpm':
      return reglaHbpm({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'hbpm', tipo: d.tipoHbpm ?? 'indeterminada' }, ctxPauta);
    case 'fondaparinux':
      return reglaFondaparinux({ idFarmaco: id, nombreComercial: nc, dosis: d.tipoHbpm === 'terapeutica' ? 'terapeutico' : 'profilactico' }, ctxPauta).farmaco;
    case 'heparina_sodica':
      return reglaHeparinaSodica(id, nc, ctxPauta);

    case 'metformina':
      return reglaMetformina({ idFarmaco: id, nombreComercial: nc, contrasteYodadoPrevisto: clin.contrasteYodadoPrevisto }, ctxPauta);
    case 'sulfonilurea':
      return reglaAntidiabeticoNoDiaIq({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'sulfonilurea', grupo: 'sulfonilurea' }, ctxPauta);
    case 'glinida':
      return reglaAntidiabeticoNoDiaIq({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'glinida', grupo: 'glinida' }, ctxPauta);
    case 'pioglitazona':
      return reglaAntidiabeticoNoDiaIq({ idFarmaco: id, nombreComercial: nc, principio: 'pioglitazona', grupo: 'pioglitazona' }, ctxPauta);
    case 'dpp4':
      return reglaDpp4({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'dpp4' }, ctxPauta);
    case 'insulina_glp1_fija':
      return reglaInsulinaGlp1Fija({ idFarmaco: id, nombreComercial: nc, principiosActivos: d.principiosActivos });
    case 'sglt2':
      return reglaSglt2({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'empagliflozina' }, ctxPauta);
    case 'glp1_semanal':
      if (!d.proximaDosisSemanal) return consultarGenerico(d, 'GLP-1 semanal: falta el día de la próxima dosis');
      return reglaGlp1Semanal({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'semaglutida', proximaDosis: d.proximaDosisSemanal }, ctxPauta);
    case 'glp1_diario':
      return reglaGlp1Diario({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'semaglutida' }, ctxPauta);

    case 'insulina_basal':
      return reglaInsulinaBasal({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'insulina', tomas: tomasBasal(d), intervencion: ctxPauta.fechaHoraIntervencion });
    case 'insulina_nph':
      return reglaInsulinaNph({ idFarmaco: id, nombreComercial: nc, dosisNocheUi: d.insulinaNocheUi ?? 0, dosisMananaUi: d.insulinaMananaUi ?? 0, intervencion: ctxPauta.fechaHoraIntervencion, horaNoche: horaNoche(d), horaManana: horaManana(d) });
    case 'insulina_premezclada':
      return reglaInsulinaPremezclada({ idFarmaco: id, nombreComercial: nc, dosisMananaUi: d.insulinaMananaUi ?? 0, intervencion: ctxPauta.fechaHoraIntervencion, horaManana: horaManana(d) });
    case 'insulina_rapida':
      return reglaInsulinaRapida({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'insulina', intervencion: ctxPauta.fechaHoraIntervencion, horaDesayuno: horaManana(d) });

    case 'ieca_ara2':
      return reglaIecaAra2({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'ieca', icDisfuncionSistolica: clin.icDisfuncionSistolica, infartoReciente: clin.infartoReciente, proteinuriaONefropatia: clin.proteinuriaONefropatia }, ctxPauta);
    case 'diuretico':
      return reglaDiuretico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'diuretico' }, ctxPauta);
    case 'sacubitrilo_valsartan':
      return reglaSacubitriloValsartan({ idFarmaco: id, nombreComercial: nc });

    case 'litio':
      return reglaLitio({ idFarmaco: id, nombreComercial: nc }, ctxPauta);
    case 'moclobemida':
      return reglaMoclobemida({ idFarmaco: id, nombreComercial: nc, principio: 'moclobemida' }, ctxPauta);
    case 'imao_irreversible':
      return reglaImaoIrreversible({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'imao' });
    case 'imao_b':
      return reglaImaoB({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'imao_b' });

    case 'aine_ibuprofeno':
    case 'aine_naproxeno':
    case 'aine_diclofenaco':
    case 'aine_dexketoprofeno':
    case 'aine_ketorolaco':
    case 'aine_celecoxib':
    case 'aine_etoricoxib':
      return reglaAine({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'aine' }, ctxPauta);

    case 'metotrexato':
      return reglaMetotrexato({ idFarmaco: id, nombreComercial: nc, dosisSemanalMg: d.dosisMg ?? 0 });
    case 'biologico':
      if (!d.fechaUltimaDosis || d.periodicidadDias === undefined) return consultarGenerico(d, 'Biológico: falta la fecha de la última dosis o la periodicidad');
      return reglaBiologico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'biologico', periodicidadDias: d.periodicidadDias, fechaUltimaDosis: d.fechaUltimaDosis }, ctxPauta.fechaHoraIntervencion);
    case 'inmunosupresor_clasico':
      return reglaInmunosupresorClasico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'inmunosupresor', ...(d.indicacionInmuno ? { indicacion: d.indicacionInmuno } : {}) });
    case 'fame_mantener':
      return reglaFameMantener({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'fame' });
    case 'jak':
      return reglaJak({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'jak' }, ctxPauta);

    case 'antiangiogenico': {
      // Las semanas desde la última dosis salen del módulo oncológico (fecha real).
      const semanas = d.fechaUltimaDosis
        ? Math.floor((ctxPauta.fechaHoraIntervencion.getTime() - d.fechaUltimaDosis.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : undefined;
      return reglaAntiangiogenico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'antiangiogenico', ...(semanas !== undefined ? { semanasDesdeUltimaDosis: semanas } : {}) }).farmaco;
    }
    case 'antiangiogenico_intravitreo':
      return reglaAntiangiogenico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'antiangiogenico', intravitreo: true }).farmaco;
    case 'tirosina_cinasa':
      return reglaTirosinaCinasa({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'tirosina_cinasa' });

    case 'corticoide_sistemico':
      return reglaCorticoide({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'corticoide', dosisEstres: clin.corticoideDosisEstres });
    case 'fitoterapia':
      return reglaFitoterapia({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'fitoterapia' }, ctxPauta);
    case 'anticonceptivo_ths':
      return reglaAnticonceptivoThs({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'anticonceptivo', esOral: d.via === 'oral' }, ctxPauta);

    case 'mantener_generico':
      return reglaMantener(id, nc, d.principiosActivos, 'Mantener (§8)', d.via);
    case 'no_catalogado':
      return reglaNoCatalogado(nc);

    default:
      // Comodín (§8.0): lo que NO tiene regla propia requiere confirmación del
      // anestesiólogo, nunca "mantener".
      return consultarGenerico(d, `Regla '${d.idRegla}' sin rama propia en el despachador: requiere confirmación del anestesiólogo`);
  }
}

/**
 * Metadatos de plazo de un fármaco para el modo margen (sin fecha) y el QR:
 * tipo de plazo, duración, si admite adelanto y si es anticoagulante. Derivados de
 * la regla; para lo no cubierto, 'sin_plazo'.
 */
export function metadatosPlazo(idRegla: string, dosisMg?: number, tipoHbpm?: TipoHbpm): {
  pt: 'dias' | 'horas' | 'no_dia_iq' | 'sin_plazo';
  pd?: number;
  ad: boolean;
  ac: boolean;
} {
  switch (idRegla) {
    case 'acod_antixa':
      return { pt: 'horas', pd: 48, ad: true, ac: true };
    case 'acod_dabigatran':
      return { pt: 'horas', pd: 72, ad: true, ac: true };
    case 'avk_acenocumarol':
      return { pt: 'dias', pd: 3, ad: false, ac: true };
    case 'avk_warfarina':
      return { pt: 'dias', pd: 5, ad: false, ac: true };
    case 'aas':
      return (dosisMg ?? 100) > 200 ? { pt: 'dias', pd: 7, ad: false, ac: false } : { pt: 'sin_plazo', ad: false, ac: false };
    case 'p2y12_clopidogrel':
    case 'p2y12_ticagrelor':
      return { pt: 'dias', pd: 5, ad: false, ac: false };
    case 'p2y12_prasugrel':
      return { pt: 'dias', pd: 7, ad: false, ac: false };
    case 'triflusal':
      return { pt: 'dias', pd: 7, ad: false, ac: false };
    case 'cilostazol':
      return { pt: 'dias', pd: 3, ad: false, ac: false };
    case 'hbpm':
      return { pt: 'horas', pd: tipoHbpm === 'terapeutica' ? 24 : 12, ad: true, ac: true };
    case 'fondaparinux':
      return { pt: 'horas', pd: tipoHbpm === 'terapeutica' ? 48 : 36, ad: true, ac: true };
    case 'sglt2':
      return { pt: 'dias', pd: 3, ad: false, ac: false };
    case 'glp1_diario':
      return { pt: 'dias', pd: 3, ad: false, ac: false };
    case 'metformina':
    case 'ieca_ara2':
    case 'diuretico':
    case 'sulfonilurea':
    case 'glinida':
    case 'pioglitazona':
    case 'dpp4':
      return { pt: 'no_dia_iq', ad: false, ac: false };
    case 'dipiridamol':
      return { pt: 'horas', pd: 24, ad: false, ac: false };
    case 'aine_ibuprofeno':
    case 'aine_naproxeno':
    case 'aine_diclofenaco':
    case 'aine_dexketoprofeno':
    case 'aine_ketorolaco':
      return { pt: 'horas', pd: 72, ad: false, ac: false };
    case 'fitoterapia':
      return { pt: 'dias', pd: 14, ad: false, ac: false };
    default:
      return { pt: 'sin_plazo', ad: false, ac: false };
  }
}

function tomasBasal(d: DatosFarmacoUi): Array<{ hora: string; dosisUi: number }> {
  // Una sola toma basal: usa la primera hora y la dosis basal.
  const hora = d.horas[0] ?? '09:00';
  return [{ hora, dosisUi: d.insulinaBasalUi ?? 0 }];
}
function horaNoche(d: DatosFarmacoUi): string {
  return d.horas.find((h) => parseInt(h.split(':')[0] ?? '0', 10) >= 18) ?? '21:00';
}
function horaManana(d: DatosFarmacoUi): string {
  return d.horas.find((h) => parseInt(h.split(':')[0] ?? '0', 10) < 18) ?? '08:00';
}
