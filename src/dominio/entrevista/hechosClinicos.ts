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
}

/** Hechos "vacíos": nada conocido. Base segura (todo se pedirá o requerirá confirmación). */
export const HECHOS_VACIOS: DatosClinicos = {
  aclaramiento: null,
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
};
