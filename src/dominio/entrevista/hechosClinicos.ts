/**
 * Hechos clínicos derivados de la entrevista — docs/documento_fuente.md §5, §7, §8.
 *
 * El despachador de reglas (paso 8) NO debe inventar datos ni cablearlos a un valor
 * fijo: todo lo que una regla necesita sale de la entrevista (módulos del paso 7,
 * medicación del paso 8, datos básicos, procedimiento). Este módulo define ese
 * conjunto de hechos y su derivación a partir de las respuestas de los módulos.
 *
 * Si un dato que una regla necesita no está, el hecho queda en su valor "no
 * conocido" (null / false) y la propia regla devuelve "requiere dato" o "requiere
 * confirmación" (nunca "mantener" por defecto).
 */

/** Portador de stent coronario y sus datos (§5.1, alimenta §8.3). */
export interface HechoStent {
  /** Meses desde el implante, o null si no se conoce la fecha. */
  mesesDesdeImplante: number | null;
  /** true si fue tras un síndrome coronario agudo; false si programado; null si no se sabe. */
  traSca: boolean | null;
}

/**
 * Conjunto de hechos clínicos que las reglas de medicación necesitan y que se
 * obtienen de la entrevista. Los valores "no conocidos" son null/false y hacen que
 * la regla pida el dato o requiera confirmación.
 */
export interface DatosClinicos {
  /** Aclaramiento de creatinina (mL/min) o null si no se conoce (§6.7). */
  aclaramiento: number | null;
  /**
   * Fecha (ISO yyyy-mm-dd) de la analítica de la que sale el aclaramiento del
   * módulo (renal o injerto), o null si no se conoce. Sirve para avisar de que la
   * analítica es de hace más de 3 meses (§6.7). El aclaramiento manual lleva su
   * propia fecha en `aclaramientoManual`.
   */
  aclaramientoFecha: string | null;
  /** El paciente toma AAS (para detectar monoterapia con P2Y12, §8.3). */
  tieneAas: boolean;
  /** Portador de stent coronario, o null si no lo es (§5.1 → §8.3). */
  stent: HechoStent | null;
  /** Portador de válvula mecánica (§5.1 → §8.1/§8.3). */
  valvulaMecanica: boolean;
  /** Cumple algún criterio de alto riesgo tromboembólico de §8.1. */
  altoRiesgoTrombotico: boolean;
  /** Insuficiencia cardiaca con disfunción sistólica / FEVI reducida (§5.1 → §8.10). */
  icDisfuncionSistolica: boolean;
  /** Infarto reciente (§5.1 → §8.10 IECA/ARA-II mantener). */
  infartoReciente: boolean;
  /** Proteinuria o nefropatía (§5.3/§5.4 → §8.10 IECA/ARA-II mantener). */
  proteinuriaONefropatia: boolean;
  /** Neurocirugía intracraneal o cirugía del canal medular (§8.3, AAS). */
  neurocirugiaIntracranealOMedular: boolean;
  /** Corticoterapia crónica que cumple criterio de dosis de estrés (§5.3). */
  corticoideDosisEstres: boolean;
  /** Se prevé contraste yodado (afecta a la metformina, §8.5). */
  contrasteYodadoPrevisto: boolean;
  /** El contraste yodado es "no se sabe": se trata como no, con nota al anestesiólogo. */
  contrasteYodadoDesconocido: boolean;
  /** Indicación de los inmunosupresores clásicos (§8.8), si se conoce. */
  indicacionInmuno?: IndicacionInmuno;
}

/** Hechos "vacíos": nada conocido. Base segura (todo se pedirá o requerirá confirmación). */
export const HECHOS_VACIOS: DatosClinicos = {
  aclaramiento: null,
  aclaramientoFecha: null,
  tieneAas: false,
  stent: null,
  valvulaMecanica: false,
  altoRiesgoTrombotico: false,
  icDisfuncionSistolica: false,
  infartoReciente: false,
  proteinuriaONefropatia: false,
  neurocirugiaIntracranealOMedular: false,
  corticoideDosisEstres: false,
  contrasteYodadoPrevisto: false,
  contrasteYodadoDesconocido: false,
};

// —————————————————— Derivación desde la entrevista ——————————————————

import { calcularAclaramiento } from '../escalas/cockcroftGault.ts';
import type { Sexo } from '../tipos.ts';
import type { IndicacionInmuno } from '../reglas/inmunosupresores.ts';

/** Respuestas de un módulo (preguntaId → valor); valor sin tipar para desacoplar. */
type RespuestasModuloGen = Record<string, unknown>;

export interface EntradaDerivacion {
  /** Respuestas de los módulos activos: moduloId → { preguntaId: valor }. */
  respuestas: Record<string, RespuestasModuloGen>;
  /** Enfermedades marcadas en el paso 7 (ids de casilla). */
  enfermedades: Set<string>;
  /** Medicación recogida (principios activos e id_regla por fármaco). */
  medicacion: Array<{ principiosActivos: string[]; idRegla: string }>;
  edadAnios: number;
  pesoKg: number;
  sexo: Sexo;
  /** Fecha/hora de la intervención (o null si aún no se conoce, §8.16). */
  fechaIntervencion: Date | null;
  /** Cirugía en espacio cerrado (intracraneal/canal medular), del procedimiento. */
  espacioCerrado?: boolean;
  /** Contraste yodado previsto (del paso 1). */
  contrasteYodado?: 'si' | 'no' | 'no_se_sabe';
}

/** Factores para pasar de una dosis de corticoide a su equivalente en prednisona (§5.3). */
const FACTOR_PREDNISONA: Record<string, number> = {
  prednisona: 1,
  prednisolona: 1,
  deflazacort: 5 / 6, // 6 mg deflazacort ≈ 5 mg prednisona
  metilprednisolona: 5 / 4,
  dexametasona: 5 / 0.75,
  betametasona: 5 / 0.75,
  hidrocortisona: 5 / 20,
};

/**
 * ¿La corticoterapia crónica cumple el criterio de dosis de estrés (§5.3)?
 * ≥ 5 mg/día de prednisona (equivalente) durante > 3 semanas en los últimos 3 meses.
 * Lee la pregunta transversal de corticoides presente en los módulos autoinmunes.
 */
function corticoideDosisEstres(respuestas: Record<string, RespuestasModuloGen>): boolean {
  for (const m of Object.values(respuestas)) {
    if (m.corticoides_3m !== true) continue;
    const farmaco = typeof m.cortico_farmaco === 'string' ? m.cortico_farmaco : 'prednisona';
    const dosis = typeof m.cortico_dosis_dia === 'number' ? (m.cortico_dosis_dia as number) : NaN;
    const semanas = typeof m.cortico_semanas === 'number' ? (m.cortico_semanas as number) : NaN;
    if (!(dosis > 0) || !(semanas > 0)) continue;
    const equiv = dosis * (FACTOR_PREDNISONA[farmaco] ?? 1);
    if (equiv >= 5 && semanas > 3) return true;
  }
  return false;
}

function parseFecha(v: unknown): Date | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const [y, m, d] = v.slice(0, 10).split('-').map((x) => parseInt(x, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Meses (aprox.) entre una fecha y la intervención; null si falta algún dato. */
function mesesHasta(fecha: unknown, intervencion: Date | null): number | null {
  const f = parseFecha(fecha);
  if (f === null || intervencion === null) return null;
  const dias = (intervencion.getTime() - f.getTime()) / 86_400_000;
  return dias / 30.4375;
}

/**
 * ¿La fecha es "reciente" (dentro de N meses de la intervención)? Si el evento
 * consta pero falta la fecha, se considera reciente por seguridad (dispara la
 * confirmación del anestesiólogo en lugar de ocultar el riesgo).
 */
function eventoReciente(constaEvento: boolean, fecha: unknown, meses: number, intervencion: Date | null): boolean {
  if (!constaEvento) return false;
  const m = mesesHasta(fecha, intervencion);
  if (m === null) return true; // consta el evento pero sin fecha → conservador
  return m < meses;
}

const TROMBOFILIAS_ALTO_RIESGO = new Set([
  'saf', 'deficit_antitrombina', 'factor_v_leiden_homo', 'protrombina_homo', 'deficit_proteina_cs',
]);

/**
 * Deriva los hechos clínicos (DatosClinicos) desde las respuestas de los módulos,
 * la medicación y los datos básicos. Ningún valor se inventa: lo que falta queda
 * en null/false y la regla correspondiente pedirá el dato o requerirá confirmación.
 */
export function derivarHechosClinicos(e: EntradaDerivacion): DatosClinicos {
  const r = e.respuestas;
  const renal = r['enfermedad_renal'] ?? {};
  const ci = r['cardiopatia_isquemica'] ?? {};
  const valv = r['valvulopatia'] ?? {};
  const fa = r['fibrilacion_auricular'] ?? {};
  const it = r['ictus_o_tvp'] ?? {};
  const anticoag = r['anticoagulacion'] ?? {};
  const ic = r['insuficiencia_cardiaca'] ?? {};
  const diab = r['diabetes'] ?? {};
  const tromb = r['trastorno_coagulacion'] ?? {};
  const trasplante = r['trasplante'] ?? {};
  const ar = r['artritis_reumatoide'] ?? {};
  const eii = r['enfermedad_inflamatoria_intestinal'] ?? {};

  // Aclaramiento (Cockcroft-Gault) con la creatinina del módulo renal o, en su
  // defecto, la del injerto renal del módulo de trasplante.
  const creatRenal = typeof renal.creatinina === 'number' ? (renal.creatinina as number) : NaN;
  const creatTrasplante = typeof trasplante.creatinina === 'number' ? (trasplante.creatinina as number) : NaN;
  const usaCreatRenal = creatRenal > 0;
  const creat = usaCreatRenal ? creatRenal : creatTrasplante;
  const aclaramiento = creat > 0
    ? calcularAclaramiento({ edadAnios: e.edadAnios, pesoKg: e.pesoKg, sexo: e.sexo, creatinina: creat, unidad: 'mg_dl' })
    : null;
  // Fecha de la analítica usada (la del módulo que aportó la creatinina).
  const fechaCreatModulo = usaCreatRenal ? renal.creatinina_fecha : trasplante.creatinina_fecha;
  const aclaramientoFecha = aclaramiento !== null && typeof fechaCreatModulo === 'string' && fechaCreatModulo !== ''
    ? fechaCreatModulo
    : null;

  // AAS en la medicación → detecta monoterapia P2Y12.
  const tieneAas = e.medicacion.some(
    (f) => f.idRegla === 'aas' || f.principiosActivos.includes('acido_acetilsalicilico'),
  );

  // Stent coronario.
  const portadorStent = ci.portador_stent === true;
  const stent: HechoStent | null = portadorStent
    ? {
        mesesDesdeImplante: mesesHasta(ci.stent_fecha, e.fechaIntervencion),
        traSca: ci.stent_motivo === 'sca' ? true : ci.stent_motivo === 'programado' ? false : null,
      }
    : null;

  // Válvula mecánica.
  const protesisMecanica = valv.protesis === 'mecanica';
  const posicion = valv.protesis_posicion;

  // Insuficiencia cardiaca con disfunción sistólica / FEVI reducida.
  const fevi = typeof ic.fevi === 'number' ? (ic.fevi as number) : undefined;
  const icDisfuncionSistolica = ic.disfuncion_sistolica === true || (fevi !== undefined && fevi <= 40);

  const hayFa = e.enfermedades.has('fibrilacion_auricular') || Object.keys(fa).length > 0;

  // Alto riesgo tromboembólico (§8.1).
  let altoRiesgoTrombotico = false;
  if (protesisMecanica && (posicion === 'mitral' || posicion === 'tricuspide')) altoRiesgoTrombotico = true;
  if (protesisMecanica && posicion === 'aortica' && (hayFa || icDisfuncionSistolica)) altoRiesgoTrombotico = true;
  if (eventoReciente(fa.ictus_ait_previo === true, fa.ictus_ait_fecha, 3, e.fechaIntervencion)) altoRiesgoTrombotico = true;
  if (eventoReciente(it.tvp_tep === true, it.tvp_tep_fecha, 3, e.fechaIntervencion)) altoRiesgoTrombotico = true;
  if (anticoag.indicacion === 'tromboembolismo_venoso' && eventoReciente(true, anticoag.tev_fecha, 3, e.fechaIntervencion)) altoRiesgoTrombotico = true;
  if (typeof tromb.trombofilia === 'string' && TROMBOFILIAS_ALTO_RIESGO.has(tromb.trombofilia)) altoRiesgoTrombotico = true;

  // Infarto reciente (para mantener IECA/ARA-II, §8.10).
  const infartoReciente = eventoReciente(ci.infarto_previo === true, ci.infarto_fecha, 3, e.fechaIntervencion);

  // Proteinuria o nefropatía (para mantener IECA/ARA-II).
  const complicacionesDiab = Array.isArray(diab.complicaciones) ? (diab.complicaciones as string[]) : [];
  const proteinuriaONefropatia = renal.proteinuria === true || complicacionesDiab.includes('nefropatia');

  // Indicación de los inmunosupresores clásicos (§8.8): trasplante tiene prioridad.
  const indicacionInmuno = deducirIndicacionInmuno(
    e.enfermedades,
    typeof ar.indicacion_inmunosupresor === 'string' ? ar.indicacion_inmunosupresor : undefined,
    typeof eii.indicacion_inmunosupresor === 'string' ? eii.indicacion_inmunosupresor : undefined,
  );

  return {
    aclaramiento,
    aclaramientoFecha,
    tieneAas,
    stent,
    valvulaMecanica: protesisMecanica,
    altoRiesgoTrombotico,
    icDisfuncionSistolica,
    infartoReciente,
    proteinuriaONefropatia,
    neurocirugiaIntracranealOMedular: e.espacioCerrado === true,
    corticoideDosisEstres: corticoideDosisEstres(r),
    contrasteYodadoPrevisto: e.contrasteYodado === 'si',
    contrasteYodadoDesconocido: e.contrasteYodado === 'no_se_sabe',
    ...(indicacionInmuno ? { indicacionInmuno } : {}),
  };
}

/** Indicación de inmunosupresores: trasplante tiene prioridad; luego lo declarado en los módulos autoinmunes. */
function deducirIndicacionInmuno(
  enfermedades: Set<string>,
  arIndic: string | undefined,
  eiiIndic: string | undefined,
): IndicacionInmuno | undefined {
  if (enfermedades.has('trasplante')) return 'trasplante';
  const v = arIndic ?? eiiIndic;
  if (v === 'trasplante' || v === 'enfermedad_sistemica_grave' || v === 'autoinmune') return v;
  return undefined;
}
