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

export interface EstadoEntrevista {
  intervencion: DatosIntervencion | null;
  procedimiento: Procedimiento | null;
  basicos: DatosBasicosUi | null;
  antecedentes: AntecedentesUi | null;
  mtnd4: EntradaMtnd4 | null;
  alergias: AlergiasUi | null;
  habitos: HabitosUi | null;
}

export const ESTADO_INICIAL: EstadoEntrevista = {
  intervencion: null,
  procedimiento: null,
  basicos: null,
  antecedentes: null,
  mtnd4: null,
  alergias: null,
  habitos: null,
};

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
