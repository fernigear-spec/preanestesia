/**
 * Estado en memoria de la entrevista mientras se recorren los pasos de la interfaz.
 * (No se persiste: privacidad, caso 23.) Cada paso rellena su parte.
 */
import type { DatosIntervencion, DatosBasicos, Sexo } from '../dominio/tipos.ts';
import type { EntradaMtnd4 } from '../dominio/mtnd4/mtnd4.ts';
import type { Procedimiento } from '../datos/procedimientos.ts';

/** Datos del paso 2 recogidos en la interfaz (superset de DatosBasicos). */
export interface DatosBasicosUi extends DatosBasicos {
  /** Posibilidad de embarazo (mujeres 12-55). undefined si no se ha preguntado. */
  posibleEmbarazo?: boolean;
  /** Fecha de la última regla (ISO yyyy-mm-dd), si aplica. */
  fechaUltimaRegla?: string;
  /** Semanas de gestación (procedimiento obstétrico → embarazo asumido). */
  semanasGestacion?: number;
  /** Módulo obstétrico activo (procedimiento obstétrico o embarazo confirmado). */
  moduloObstetrico?: boolean;
}

/** Una intervención previa (paso 3, R3.2.10). */
export interface IntervencionPrevia {
  procedimiento: string;
  anio: string;
  tipoAnestesia: 'general' | 'neuroaxial' | 'sedacion' | 'local' | 'no_lo_sabe';
  incidencias: string[];
}

/** Antecedentes del paso 3 (R3.2.10–R3.2.12). */
export interface AntecedentesUi {
  intervencionesPrevias: IntervencionPrevia[];
  /** Antecedentes familiares de anestesia (R3.2.12). */
  familiaresHipertermiaMaligna: boolean;
  familiaresDeficitPseudocolinesterasa: boolean;
  familiaresComplicacionesGraves: boolean;
}

/** Una alergia a medicamento con su reacción (paso 5, R3.2.14). */
export interface AlergiaMedicamento {
  farmaco: string;
  reaccion: string;
}

/** Alergias del paso 5 (R3.2.14–R3.2.15). */
export interface AlergiasUi {
  /** «No alergias conocidas» marcado explícitamente (R3.2.15). */
  ningunaConocida: boolean;
  medicamentos: AlergiaMedicamento[];
  latex: boolean;
  contrastesYodados: boolean;
  clorhexidina: boolean;
  adhesivos: boolean;
  /** Alimentos relevantes marcados (huevo, soja, frutos secos, frutas tropicales). */
  alimentos: string[];
}

/** Hábitos y capacidad funcional del paso 6 (R3.2.16–R3.2.20). */
export interface HabitosUi {
  tabaco: 'nunca' | 'activo' | 'exfumador';
  /** Datos de exfumador. */
  paquetesAnio?: number;
  fechaAbandonoTabaco?: string;
  /** AUDIT-C (0-4 cada pregunta). */
  auditFrecuencia: number;
  auditCantidad: number;
  auditAtracon: number;
  /** Capacidad funcional: ¿sube dos pisos sin parar? */
  subeDosPisos: 'si' | 'no' | 'dudoso';
  /** Ítems DASI positivos (solo si no sube dos pisos con claridad). */
  itemsDasi: string[];
  /** Solo si edad >= 65: CFS 1-9 y 4AT. */
  cfs?: number;
  cuatroAt?: {
    alerta: 'normal' | 'alterado';
    amt4: '0_errores' | '1_error' | '2_o_mas_o_no_valorable';
    meses: '7_o_mas' | 'menos_de_7' | 'no_valorable';
    cambioAgudo: 'no' | 'si';
  };
}

import type { EntradaHemstop } from '../dominio/escalas/hemstop.ts';
import type { RespuestasModulos } from '../datos/modulos.ts';

/** Cribado por aparatos del paso 7 (R3.2.21–R3.2.23). */
export interface CribadoUi {
  /** «Ninguna enfermedad conocida» marcado explícitamente (R3.2.22). */
  ningunaConocida: boolean;
  /** Enfermedades marcadas (ids del catálogo por aparatos). */
  enfermedades: string[];
  /** Respuestas de los módulos de patología desplegados (moduloId → respuestas). */
  respuestasModulos: RespuestasModulos;
  /** HEMSTOP, que se hace siempre (R3.2.23). */
  hemstop: EntradaHemstop;
}

/** Un fármaco que el paciente toma, recogido en el paso 8. */
export interface FarmacoTomadoUi {
  idFarmaco: string;
  nombreComercial: string;
  principiosActivos: string[];
  /** id de regla principal (primero del catálogo). */
  idRegla: string;
  /** Todos los id_regla del catálogo (para combinaciones fijas, §8.0). */
  idReglas: string[];
  grupo: string;
  subgrupo: string;
  pautaTipica: string;
  via: 'oral' | 'no_oral';
  requiereConfirmacionCatalogo: boolean;
  indicacionesPosibles: string[];
  /** Horas de toma ("HH:MM"). */
  horas: string[];
  dosisMg?: number;
  /** Día de la semana (0-6) del fármaco semanal. */
  diaSemana?: number;
  /** Fecha de la última dosis (ISO) para biológicos/antiangiogénicos. */
  fechaUltimaDosis?: string;
  periodicidadDias?: number;
  insulinaBasalUi?: number;
  insulinaNocheUi?: number;
  insulinaMananaUi?: number;
  tipoHbpm?: 'profilactica' | 'terapeutica' | 'indeterminada';
  /** Texto para el paciente del catálogo (sobrescribe el de la regla, §3). */
  textoPaciente?: string;
  /** Texto para el anestesiólogo del catálogo (§3). */
  textoAnestesiologo?: string;
}

export interface EstadoEntrevista {
  intervencion: DatosIntervencion | null;
  procedimiento: Procedimiento | null;
  basicos: DatosBasicosUi | null;
  antecedentes: AntecedentesUi | null;
  mtnd4: EntradaMtnd4 | null;
  alergias: AlergiasUi | null;
  habitos: HabitosUi | null;
  cribado: CribadoUi | null;
  medicacion: FarmacoTomadoUi[] | null;
}

/** Horas más habituales para los botones rápidos del paso 8 (tablet). */
export const HORAS_FRECUENTES = ['08:00', '09:00', '14:00', '20:00', '21:00', '22:00'];

/** ¿La regla necesita las horas de toma para calcular un plazo? */
export function reglaNecesitaHoras(idRegla: string): boolean {
  const sinHoras = new Set([
    'biologico', 'antiangiogenico', 'antiangiogenico_intravitreo', 'tirosina_cinasa',
    'corticoide_sistemico', 'fame_mantener', 'inmunosupresor_clasico', 'jak',
    'mantener_generico', 'metotrexato', 'imao_irreversible', 'imao_b',
    'sacubitrilo_valsartan', 'glp1_semanal',
  ]);
  return !sinHoras.has(idRegla);
}

export const ESTADO_INICIAL: EstadoEntrevista = {
  intervencion: null,
  procedimiento: null,
  basicos: null,
  antecedentes: null,
  mtnd4: null,
  alergias: null,
  habitos: null,
  cribado: null,
  medicacion: null,
};

/** HEMSTOP vacío (todas las respuestas en «no»). */
export const HEMSTOP_VACIO: EntradaHemstop = {
  hematomasSinTrauma: false,
  sangradoProlongadoHeridas: false,
  menstruacionAbundante: false,
  sangradoTrasCirugia: false,
  sangradoTrasDental: false,
  sangradoEnParto: false,
  familiaresTrastornoCoagulacion: false,
};

/** Preguntas del HEMSTOP (§5.5), en el orden del cuestionario. */
export const PREGUNTAS_HEMSTOP: Array<{ id: keyof EntradaHemstop; etiqueta: string }> = [
  { id: 'hematomasSinTrauma', etiqueta: '¿Hematomas o sangrados sin golpe que le llevaran a consultar o a tratamiento?' },
  { id: 'sangradoProlongadoHeridas', etiqueta: '¿Sangrado que dura mucho tras una herida?' },
  { id: 'menstruacionAbundante', etiqueta: '¿Reglas muy abundantes que motivaran consulta o tratamiento?' },
  { id: 'sangradoTrasCirugia', etiqueta: '¿Sangrado anómalo tras una operación?' },
  { id: 'sangradoTrasDental', etiqueta: '¿Sangrado anómalo tras una extracción dental?' },
  { id: 'sangradoEnParto', etiqueta: '¿Sangrado anómalo en el parto?' },
  { id: 'familiaresTrastornoCoagulacion', etiqueta: '¿Familiares con trastorno de la coagulación?' },
];

/**
 * Mapeo casilla del paso 7 → módulo de patología que despliega (§5).
 * Por defecto la casilla abre el módulo con su mismo id; aquí van las excepciones
 * (varias casillas que comparten un mismo módulo).
 */
export const MODULO_DE_ENFERMEDAD: Record<string, string> = {
  stent_o_infarto: 'cardiopatia_isquemica',
  protesis_mecanica: 'valvulopatia',
};

/** id del módulo que despliega una casilla del paso 7. */
export function moduloDeEnfermedad(idEnfermedad: string): string {
  return MODULO_DE_ENFERMEDAD[idEnfermedad] ?? idEnfermedad;
}

/** Cribado por aparatos (R3.2.21). Los ids que empiezan por una enfermedad de
 *  §5b.2 permiten al asistente de coherencia detectar tratamientos ausentes. */
export const APARATOS: Array<{ aparato: string; enfermedades: Array<{ id: string; etiqueta: string }> }> = [
  {
    aparato: 'Cardiovascular',
    enfermedades: [
      { id: 'hta', etiqueta: 'Hipertensión' },
      { id: 'fibrilacion_auricular', etiqueta: 'Fibrilación auricular' },
      { id: 'insuficiencia_cardiaca', etiqueta: 'Insuficiencia cardiaca' },
      { id: 'cardiopatia_isquemica', etiqueta: 'Cardiopatía isquémica / infarto' },
      { id: 'stent_o_infarto', etiqueta: 'Stent coronario' },
      { id: 'protesis_mecanica', etiqueta: 'Prótesis valvular mecánica' },
      { id: 'valvulopatia', etiqueta: 'Valvulopatía' },
      { id: 'marcapasos', etiqueta: 'Marcapasos o DAI' },
    ],
  },
  {
    aparato: 'Respiratorio',
    enfermedades: [
      { id: 'asma_epoc', etiqueta: 'Asma o EPOC' },
      { id: 'saos', etiqueta: 'Apnea del sueño (SAOS)' },
    ],
  },
  {
    aparato: 'Endocrino y metabolismo',
    enfermedades: [
      { id: 'diabetes', etiqueta: 'Diabetes' },
      { id: 'hipotiroidismo', etiqueta: 'Hipotiroidismo' },
      { id: 'obesidad', etiqueta: 'Obesidad' },
    ],
  },
  {
    aparato: 'Renal y hepático',
    enfermedades: [
      { id: 'enfermedad_renal', etiqueta: 'Enfermedad renal crónica' },
      { id: 'enfermedad_hepatica', etiqueta: 'Enfermedad hepática' },
    ],
  },
  {
    aparato: 'Hematológico',
    enfermedades: [
      { id: 'anticoagulacion', etiqueta: 'Toma anticoagulantes' },
      { id: 'trastorno_coagulacion', etiqueta: 'Trastorno de la coagulación conocido' },
      { id: 'anemia', etiqueta: 'Anemia' },
    ],
  },
  {
    aparato: 'Neurológico y psiquiátrico',
    enfermedades: [
      { id: 'epilepsia', etiqueta: 'Epilepsia' },
      { id: 'ictus_o_tvp', etiqueta: 'Ictus o AIT' },
      { id: 'parkinson', etiqueta: 'Parkinson' },
      { id: 'depresion_ansiedad', etiqueta: 'Depresión o ansiedad' },
    ],
  },
  {
    aparato: 'Musculoesquelético y reumatológico',
    enfermedades: [
      { id: 'artritis_reumatoide', etiqueta: 'Artritis reumatoide u otra enfermedad autoinmune' },
    ],
  },
  {
    aparato: 'Digestivo',
    enfermedades: [
      { id: 'reflujo', etiqueta: 'Reflujo gastroesofágico' },
      { id: 'enfermedad_inflamatoria_intestinal', etiqueta: 'Enfermedad inflamatoria intestinal' },
    ],
  },
  {
    aparato: 'Oncológico e infeccioso',
    enfermedades: [
      { id: 'cancer', etiqueta: 'Cáncer en tratamiento' },
      { id: 'trasplante', etiqueta: 'Trasplante de órgano' },
    ],
  },
];

/** Alimentos relevantes en alergias (R3.2.14). */
export const ALIMENTOS_ALERGIA: Array<{ id: string; etiqueta: string }> = [
  { id: 'huevo', etiqueta: 'Huevo' },
  { id: 'soja', etiqueta: 'Soja' },
  { id: 'frutos_secos', etiqueta: 'Frutos secos' },
  { id: 'frutas_tropicales', etiqueta: 'Frutas tropicales (si alergia al látex)' },
];

/** Incidencias anestésicas a preguntar de forma explícita (R3.2.11). */
export const INCIDENCIAS_ANESTESICAS: Array<{ id: string; etiqueta: string }> = [
  { id: 'intubacion_dificil', etiqueta: 'Intubación o ventilación difícil conocida' },
  { id: 'nvpo', etiqueta: 'Náuseas o vómitos postoperatorios (NVPO)' },
  { id: 'despertar_prolongado', etiqueta: 'Despertar prolongado' },
  { id: 'reaccion_alergica', etiqueta: 'Reacción alérgica en quirófano' },
  { id: 'despertar_intraoperatorio', etiqueta: 'Despertar intraoperatorio' },
  { id: 'dificultad_epidural_raquidea', etiqueta: 'Dificultad con epidural o raquídea' },
  { id: 'transfusiones', etiqueta: 'Transfusiones' },
  { id: 'reaccion_transfusional', etiqueta: 'Reacción transfusional' },
];

export const SEXOS: Array<{ valor: Sexo; etiqueta: string }> = [
  { valor: 'hombre', etiqueta: 'Hombre' },
  { valor: 'mujer', etiqueta: 'Mujer' },
];

/** IMC redondeado a un decimal, o null si faltan datos válidos. */
export function calcularImc(pesoKg: number, tallaCm: number): number | null {
  if (!(pesoKg > 0) || !(tallaCm > 0)) return null;
  const m = tallaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}
