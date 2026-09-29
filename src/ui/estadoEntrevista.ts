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

export interface EstadoEntrevista {
  intervencion: DatosIntervencion | null;
  procedimiento: Procedimiento | null;
  basicos: DatosBasicosUi | null;
  antecedentes: AntecedentesUi | null;
  mtnd4: EntradaMtnd4 | null;
}

export const ESTADO_INICIAL: EstadoEntrevista = {
  intervencion: null,
  procedimiento: null,
  basicos: null,
  antecedentes: null,
  mtnd4: null,
};

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
