/**
 * Despachador de reglas para la interfaz (paso 8) — docs/documento_fuente.md §8.
 * Dado el id_regla de un fármaco del catálogo y los datos recogidos por la
 * enfermera (horas de toma, dosis, última dosis, unidades de insulina…) más el
 * contexto de la intervención, ejecuta la regla adecuada y devuelve un
 * ResultadoFarmaco. Los grupos no cubiertos aquí devuelven un resultado de
 * "consultar" (el anestesiólogo lo revisará), nunca una pauta inventada.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { reglaAcod } from './acod.ts';
import { reglaAvk } from './antivitaminaK.ts';
import { reglaAas, reglaP2y12, reglaTriflusal, reglaCilostazol } from './antiagregantes.ts';
import { reglaHbpm, reglaFondaparinux, type TipoHbpm } from './heparinas.ts';
import { reglaMetformina, reglaSglt2, reglaGlp1Semanal, reglaGlp1Diario } from './antidiabeticos.ts';
import { reglaInsulinaBasal, reglaInsulinaNph, reglaInsulinaPremezclada, reglaInsulinaRapida } from './insulinas.ts';
import { reglaIecaAra2, reglaDiuretico, reglaSacubitriloValsartan } from './cardiovasculares.ts';
import { reglaLitio, reglaMoclobemida, reglaImaoIrreversible, reglaImaoB } from './psicofarmacos.ts';
import { reglaAine } from './aine.ts';
import { reglaMetotrexato, reglaBiologico, reglaInmunosupresorClasico, reglaFameMantener, reglaJak } from './inmunosupresores.ts';
import { reglaAntiangiogenico, reglaTirosinaCinasa } from './oncologicos.ts';
import { reglaFitoterapia, reglaAnticonceptivoThs, reglaCorticoide, reglaNoCatalogado } from './otros.ts';

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

/**
 * Ejecuta la regla del fármaco con los datos recogidos y el contexto.
 * @param d datos del fármaco recogidos en la UI.
 * @param ctx contexto de la intervención (solo cuando hay fecha; sin fecha se usa
 *   el modo margen del QR, no este despachador).
 */
export function evaluarFarmacoUi(d: DatosFarmacoUi, ctx: ContextoReglas): ResultadoFarmaco {
  const ctxPauta: ContextoReglas = { ...ctx, pautaFarmaco: P(d.horas) };
  const nc = d.nombreComercial;
  const id = d.idFarmaco;

  switch (d.idRegla) {
    case 'acod_antixa':
      return reglaAcod({ idFarmaco: id, nombreComercial: nc, principioActivo: d.principiosActivos[0] ?? '', subtipo: 'antixa' }, ctxPauta);
    case 'acod_dabigatran':
      return reglaAcod({ idFarmaco: id, nombreComercial: nc, principioActivo: 'dabigatran', subtipo: 'dabigatran' }, ctxPauta);

    case 'avk_acenocumarol':
      return reglaAvk({ idFarmaco: id, nombreComercial: nc, principio: 'acenocumarol', altoRiesgoTromboembolico: false }, ctxPauta).farmaco;
    case 'avk_warfarina':
      return reglaAvk({ idFarmaco: id, nombreComercial: nc, principio: 'warfarina', altoRiesgoTromboembolico: false }, ctxPauta).farmaco;

    case 'aas':
      return reglaAas({ idFarmaco: id, nombreComercial: nc, dosisDiariaMg: d.dosisMg ?? 100 }, ctxPauta);
    case 'p2y12_clopidogrel':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'clopidogrel', monoterapia: false }, ctxPauta);
    case 'p2y12_prasugrel':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'prasugrel', monoterapia: false }, ctxPauta);
    case 'p2y12_ticagrelor':
      return reglaP2y12({ idFarmaco: id, nombreComercial: nc, principio: 'ticagrelor', monoterapia: false }, ctxPauta);
    case 'triflusal':
      return reglaTriflusal(id, nc, ctxPauta);
    case 'cilostazol':
      return reglaCilostazol(id, nc, ctxPauta);

    case 'hbpm':
      return reglaHbpm({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'hbpm', tipo: d.tipoHbpm ?? 'indeterminada' }, ctxPauta);
    case 'fondaparinux':
      return reglaFondaparinux({ idFarmaco: id, nombreComercial: nc, dosis: d.tipoHbpm === 'terapeutica' ? 'terapeutico' : 'profilactico' }, ctxPauta).farmaco;

    case 'metformina':
      return reglaMetformina({ idFarmaco: id, nombreComercial: nc }, ctxPauta);
    case 'sglt2':
      return reglaSglt2({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'empagliflozina' }, ctxPauta);
    case 'glp1_semanal':
      if (!d.proximaDosisSemanal) return consultarGenerico(d, 'GLP-1 semanal: falta el día de la próxima dosis');
      return reglaGlp1Semanal({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'semaglutida', proximaDosis: d.proximaDosisSemanal }, ctxPauta);
    case 'glp1_diario':
      return reglaGlp1Diario({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'semaglutida' }, ctxPauta);

    case 'insulina_basal':
      return reglaInsulinaBasal({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'insulina', tomas: tomasBasal(d), intervencion: ctx.fechaHoraIntervencion });
    case 'insulina_nph':
      return reglaInsulinaNph({ idFarmaco: id, nombreComercial: nc, dosisNocheUi: d.insulinaNocheUi ?? 0, dosisMananaUi: d.insulinaMananaUi ?? 0, intervencion: ctx.fechaHoraIntervencion, horaNoche: horaNoche(d), horaManana: horaManana(d) });
    case 'insulina_premezclada':
      return reglaInsulinaPremezclada({ idFarmaco: id, nombreComercial: nc, dosisMananaUi: d.insulinaMananaUi ?? 0, intervencion: ctx.fechaHoraIntervencion, horaManana: horaManana(d) });
    case 'insulina_rapida':
      return reglaInsulinaRapida({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'insulina', intervencion: ctx.fechaHoraIntervencion, horaDesayuno: horaManana(d) });

    case 'ieca_ara2':
      // Sin conocer las excepciones (IC/infarto/nefropatía) se pregunta; en la UI se
      // asumen false salvo que un futuro módulo cardiovascular las aporte.
      return reglaIecaAra2({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'ieca', icDisfuncionSistolica: false, infartoReciente: false, proteinuriaONefropatia: false }, ctxPauta);
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
      return reglaBiologico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'biologico', periodicidadDias: d.periodicidadDias, fechaUltimaDosis: d.fechaUltimaDosis }, ctx.fechaHoraIntervencion);
    case 'inmunosupresor_clasico':
      return reglaInmunosupresorClasico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'inmunosupresor' });
    case 'fame_mantener':
      return reglaFameMantener({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'fame' });
    case 'jak':
      return reglaJak({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'jak' }, ctxPauta);

    case 'antiangiogenico':
      return reglaAntiangiogenico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'antiangiogenico' }).farmaco;
    case 'antiangiogenico_intravitreo':
      return reglaAntiangiogenico({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'antiangiogenico', intravitreo: true }).farmaco;
    case 'tirosina_cinasa':
      return reglaTirosinaCinasa({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'tirosina_cinasa' });

    case 'corticoide_sistemico':
      return reglaCorticoide({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'corticoide' });
    case 'fitoterapia':
      return reglaFitoterapia({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'fitoterapia' }, ctxPauta);
    case 'anticonceptivo_ths':
      return reglaAnticonceptivoThs({ idFarmaco: id, nombreComercial: nc, principio: d.principiosActivos[0] ?? 'anticonceptivo', esOral: d.via === 'oral' }, ctxPauta);

    case 'mantener_generico':
      return reglaNoCatalogado(nc);

    default:
      // Reglas no cubiertas explícitamente en la UI (dpp4, glinida, sulfonilurea,
      // pioglitazona, dipiridamol, gp_iibiiia, sulodexida, heparina_sodica, etc.).
      return consultarGenerico(d, `Regla '${d.idRegla}' pendiente de conectar en la interfaz`);
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
      return { pt: 'no_dia_iq', ad: false, ac: false };
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
