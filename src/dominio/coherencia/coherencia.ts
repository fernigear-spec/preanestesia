/**
 * Asistente de coherencia — docs/documento_fuente.md §5b (caso 22).
 * Basado en reglas (sin IA). Sugiere y pregunta; NUNCA marca nada por su cuenta.
 * Produce "tarjetas" no bloqueantes de tres tipos:
 *  - farmaco_a_enfermedad (§5b.1): fármaco cuya indicación no está recogida.
 *  - enfermedad_a_farmaco (§5b.2): enfermedad sin su tratamiento habitual.
 *  - dato_que_falta (§5b.3): módulo marcado al que le falta un dato clave.
 */

export type TipoTarjeta = 'farmaco_a_enfermedad' | 'enfermedad_a_farmaco' | 'dato_que_falta';

export interface Tarjeta {
  tipo: TipoTarjeta;
  mensaje: string;
  /** Opciones (indicaciones/acciones) que la enfermera puede confirmar. */
  opciones: string[];
  origen: string;
}

// —————————————————— §5b.1 fármaco → enfermedad ——————————————————

export interface FarmacoAnadido {
  nombre: string;
  /** Indicaciones posibles (de farmacos.csv → indicaciones_posibles). */
  indicacionesPosibles: string[];
}

/** Etiquetas legibles de las indicaciones (§5b.1). Nunca se muestran los ids internos. */
export const ETIQUETAS_INDICACION: Record<string, string> = {
  hipertension: 'hipertensión',
  insuficiencia_cardiaca: 'insuficiencia cardiaca',
  cardiopatia_isquemica: 'cardiopatía isquémica',
  arritmia: 'arritmia',
  nefropatia_proteinuria: 'nefropatía o proteinuria',
  migrana: 'migraña',
  edemas: 'síndrome nefrótico o edemas',
  trasplante: 'trasplante',
  polimialgia_reumatica: 'polimialgia reumática',
  artritis_reumatoide: 'artritis reumatoide',
  lupus: 'lupus',
  enfermedad_inflamatoria_intestinal: 'enfermedad inflamatoria intestinal',
  asma_epoc: 'asma o EPOC',
  insuficiencia_suprarrenal: 'insuficiencia suprarrenal',
  enfermedad_oncohematologica: 'enfermedad oncohematológica',
  enfermedad_autoinmune: 'enfermedad autoinmune',
  dermatologica: 'enfermedad dermatológica',
  fibrilacion_auricular: 'fibrilación auricular',
  protesis_valvular: 'prótesis valvular',
  tromboembolismo_venoso: 'tromboembolismo venoso',
  trombofilia: 'trombofilia',
  stent_coronario: 'stent coronario',
  infarto: 'infarto',
  ictus_ait: 'ictus o AIT',
  arteriopatia_periferica: 'arteriopatía periférica',
  prevencion_primaria: 'prevención primaria',
  diabetes: 'diabetes',
  obesidad: 'obesidad',
  epilepsia: 'epilepsia',
  dolor_neuropatico: 'dolor neuropático',
  trastorno_bipolar: 'trastorno bipolar',
  parkinson: 'Parkinson',
  hipotiroidismo: 'hipotiroidismo',
  tiroidectomia: 'tiroidectomía',
  dolor_cronico: 'dolor crónico',
  espondilitis: 'espondilitis',
  psoriasis: 'psoriasis',
  gota: 'gota',
  reflujo: 'reflujo',
  depresion: 'depresión',
  ansiedad: 'ansiedad',
  insomnio: 'insomnio',
  psicosis: 'psicosis',
  glaucoma: 'glaucoma',
  hiperplasia_prostatica: 'hiperplasia benigna de próstata',
  anemia: 'anemia',
  deficit_vitamina_d: 'déficit de vitamina D',
  osteoporosis: 'osteoporosis',
  dolor: 'dolor',
  otra: 'otra',
};

export function etiquetaIndicacion(id: string): string {
  return ETIQUETAS_INDICACION[id] ?? id.replace(/_/g, ' ');
}

/**
 * Si ninguna de las indicaciones posibles del fármaco está recogida en la
 * entrevista, devuelve una tarjeta. `indicacionesRecogidas` = módulos/casillas ya marcados.
 */
export function tarjetaFarmacoAEnfermedad(
  f: FarmacoAnadido,
  indicacionesRecogidas: Set<string>,
): Tarjeta | null {
  if (f.indicacionesPosibles.length === 0) return null;
  const algunaRecogida = f.indicacionesPosibles.some((i) => indicacionesRecogidas.has(i));
  if (algunaRecogida) return null;
  const etiquetas = f.indicacionesPosibles.map(etiquetaIndicacion);
  return {
    tipo: 'farmaco_a_enfermedad',
    mensaje: `${f.nombre} suele tomarse por ${listar(etiquetas)}. Pregúntele por qué lo toma.`,
    opciones: [...etiquetas, 'otra razón', 'no lo sabe'],
    origen: '§5b.1',
  };
}

// —————————————————— §5b.2 enfermedad → fármaco ——————————————————

export interface ReglaEnfermedadFarmaco {
  enfermedad: string;
  /** Grupos de fármaco esperados (basta con uno presente para no alertar). */
  tratamientosEsperados: string[];
  mensaje: string;
}

/** Reglas iniciales obligatorias (§5b.2). */
export const REGLAS_ENFERMEDAD_FARMACO: ReglaEnfermedadFarmaco[] = [
  { enfermedad: 'fibrilacion_auricular', tratamientosEsperados: ['anticoagulante', 'antiagregante'], mensaje: 'Fibrilación auricular sin anticoagulante ni antiagregante.' },
  { enfermedad: 'stent_o_infarto', tratamientosEsperados: ['antiagregante'], mensaje: 'Stent o infarto sin antiagregante.' },
  { enfermedad: 'protesis_mecanica', tratamientosEsperados: ['anticoagulante'], mensaje: 'Prótesis mecánica sin anticoagulante.' },
  { enfermedad: 'diabetes', tratamientosEsperados: ['antidiabetico', 'insulina'], mensaje: 'Diabetes sin tratamiento.' },
  { enfermedad: 'hta', tratamientosEsperados: ['antihipertensivo'], mensaje: 'HTA sin antihipertensivo.' },
  { enfermedad: 'asma_epoc', tratamientosEsperados: ['inhalador'], mensaje: 'Asma o EPOC sin inhalador.' },
  { enfermedad: 'saos', tratamientosEsperados: ['cpap'], mensaje: 'SAOS sin CPAP.' },
  { enfermedad: 'epilepsia', tratamientosEsperados: ['antiepiléptico'], mensaje: 'Epilepsia sin antiepiléptico.' },
  { enfermedad: 'hipotiroidismo', tratamientosEsperados: ['levotiroxina'], mensaje: 'Hipotiroidismo sin levotiroxina.' },
  { enfermedad: 'trasplante', tratamientosEsperados: ['inmunosupresor'], mensaje: 'Trasplante sin inmunosupresor.' },
  { enfermedad: 'tvp_tep_reciente', tratamientosEsperados: ['anticoagulante'], mensaje: 'TVP o TEP reciente sin anticoagulante.' },
];

/**
 * @param enfermedadesMarcadas enfermedades presentes en la entrevista.
 * @param gruposFarmacoPresentes grupos de fármaco que el paciente sí toma.
 */
export function tarjetasEnfermedadAFarmaco(
  enfermedadesMarcadas: Set<string>,
  gruposFarmacoPresentes: Set<string>,
  reglas: ReglaEnfermedadFarmaco[] = REGLAS_ENFERMEDAD_FARMACO,
): Tarjeta[] {
  const out: Tarjeta[] = [];
  for (const r of reglas) {
    if (!enfermedadesMarcadas.has(r.enfermedad)) continue;
    const tieneAlguno = r.tratamientosEsperados.some((t) => gruposFarmacoPresentes.has(t));
    if (tieneAlguno) continue;
    out.push({
      tipo: 'enfermedad_a_farmaco',
      mensaje: `${r.mensaje} Pregunte si lo ha dejado, se lo retiraron o se ha olvidado de mencionarlo.`,
      opciones: ['lo ha dejado', 'se lo retiraron', 'se ha olvidado de mencionarlo', 'no aplica'],
      origen: '§5b.2',
    });
  }
  return out;
}

// —————————————————— §5b.3 dato que falta ——————————————————

export interface ReglaDatoQueFalta {
  modulo: string;
  dato: string;
  mensaje: string;
}

export const REGLAS_DATO_QUE_FALTA: ReglaDatoQueFalta[] = [
  { modulo: 'diabetes', dato: 'hba1c', mensaje: 'Diabetes sin HbA1c.' },
  { modulo: 'stent', dato: 'fecha_o_motivo', mensaje: 'Stent sin fecha o motivo.' },
  { modulo: 'valvulopatia', dato: 'ecocardiograma', mensaje: 'Valvulopatía sin ecocardiograma con fecha.' },
  { modulo: 'anticoagulante', dato: 'creatinina', mensaje: 'Anticoagulante o dabigatrán sin creatinina reciente.' },
  { modulo: 'fumador', dato: 'paquetes_anio', mensaje: 'Fumador sin paquetes-año.' },
  { modulo: 'insuficiencia_cardiaca', dato: 'nyha', mensaje: 'Insuficiencia cardiaca sin clase NYHA.' },
  { modulo: 'marcapasos', dato: 'fecha_revision', mensaje: 'Marcapasos sin fecha de última revisión.' },
  { modulo: 'ictus_o_tvp', dato: 'fecha', mensaje: 'Ictus o TVP sin fecha.' },
  { modulo: 'biologico', dato: 'fecha_ultima_dosis', mensaje: 'Biológico sin fecha de última dosis.' },
];

/**
 * @param modulosMarcados módulos activos en la entrevista.
 * @param datosPresentes datos ya recogidos, en formato "modulo:dato".
 */
export function tarjetasDatoQueFalta(
  modulosMarcados: Set<string>,
  datosPresentes: Set<string>,
  reglas: ReglaDatoQueFalta[] = REGLAS_DATO_QUE_FALTA,
): Tarjeta[] {
  const out: Tarjeta[] = [];
  for (const r of reglas) {
    if (!modulosMarcados.has(r.modulo)) continue;
    if (datosPresentes.has(`${r.modulo}:${r.dato}`)) continue;
    out.push({
      tipo: 'dato_que_falta',
      mensaje: `${r.mensaje} Obtén el dato o marca "no disponible".`,
      opciones: ['obtener el dato', 'no disponible'],
      origen: '§5b.3',
    });
  }
  return out;
}

function listar(items: string[]): string {
  if (items.length === 1) return items[0] as string;
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}
