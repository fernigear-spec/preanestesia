/**
 * Tipos de dominio compartidos (R modelo de datos de design.md).
 * Motor de dominio en TypeScript puro, sin dependencias de UI ni de red.
 */

// ————————————————————————————————————————————————————————————————
// Entrada de la entrevista (estado en memoria)
// ————————————————————————————————————————————————————————————————

export type Modalidad = 'presencial' | 'telefonica';

export type TecnicaAnestesica =
  | 'general'
  | 'sedacion'
  | 'neuroaxial'
  | 'bloqueo_periferico'
  | 'bloqueo_profundo'
  | 'local'
  | 'no_se_sabe';

export type Regimen = 'cma' | 'ingreso' | 'uci_prevista';
export type Caracter = 'programada' | 'urgencia_diferida';

export type RiesgoCardiovascular = 'bajo' | 'intermedio' | 'alto';
export type RiesgoHemorragico = 'minimo' | 'bajo' | 'alto';
export type GrupoOftalmologico = 'no_aplica' | 'riesgo_bajo' | 'riesgo_moderado_alto';

export interface DatosIntervencion {
  fechaHora: Date;
  /** true si la hora era desconocida y se asumieron las 08:00 (R3.2.2). */
  horaAsumida: boolean;
  procedimientoId: string | null;
  riesgoCardiovascular: RiesgoCardiovascular;
  riesgoHemorragico: RiesgoHemorragico;
  grupoOftalmologico: GrupoOftalmologico;
  /** El procedimiento tiene técnica neuroaxial o bloqueo profundo probable. */
  neuroaxialProbable: boolean;
  duracionMayor30min: boolean;
  riesgoTromboticoAlto: boolean;
  regimen: Regimen;
  caracter: Caracter;
  tecnica: TecnicaAnestesica;
}

export type Sexo = 'hombre' | 'mujer';

export interface DatosBasicos {
  edadAnios: number;
  /** Edad en meses para < 2 años (opcional). */
  edadMeses?: number;
  sexo: Sexo;
  pesoKg: number;
  tallaCm: number;
  embarazada?: boolean;
}

/** Resultado de una escala: puntuación, categoría y componentes que sumaron. */
export interface ResultadoEscala {
  puntuacion: number;
  categoria: string;
  /** Componentes que han contribuido (para mostrarlos, R6). */
  componentes: string[];
}

// ————————————————————————————————————————————————————————————————
// Medicación y reglas
// ————————————————————————————————————————————————————————————————

export type PautaTipica = 'diaria' | 'dos_veces_dia' | 'semanal' | 'mensual' | 'ciclica';

export interface FarmacoCatalogo {
  id: string;
  principiosActivos: string[];
  nombresComerciales: string[];
  grupo: string;
  subgrupo: string;
  pautaTipica: PautaTipica;
  /** id de regla por principio activo (se aplica la más restrictiva). */
  idRegla: string[];
  textoPaciente?: string;
  textoAnestesiologo?: string;
  requiereConfirmacion: boolean;
  indicacionesPosibles: string[];
  fuente: string;
  fechaRevision: string;
  verificadoCima: boolean;
}

/** Fármaco tal como lo toma el paciente (recogido en el paso 8). */
export interface FarmacoTomado {
  idCatalogo: string | null; // null si "no catalogado"
  nombre: string;
  dosisMg?: number;
  dosisTexto?: string;
  pauta: PautaTipica;
  horaHabitual?: string; // "HH:MM"
  /** Indicación confirmada por la enfermera (para reglas que dependen de ella). */
  indicacion?: string;
  noCatalogado: boolean;
}

export type AccionFarmaco = 'mantener' | 'suspender' | 'ajustar' | 'consultar';

export interface ResultadoFarmaco {
  idFarmaco: string;
  nombreComercial: string;
  principiosActivos: string[];
  accion: AccionFarmaco;
  /** Fecha/hora límite de la última toma, si aplica. */
  fechaHoraUltimaToma?: Date;
  textoPaciente: string;
  textoAnestesiologo?: string;
  reglaAplicada: string;
  fuente: string;
  requiereConfirmacion: boolean;
  confirmadoPor?: string;
  /** Dato que falta y bloquea la recomendación (R12.5), si aplica. */
  datoQueFalta?: string;
}

// ————————————————————————————————————————————————————————————————
// Alertas y puntos pendientes
// ————————————————————————————————————————————————————————————————

export type GravedadAlerta = 'roja' | 'amarilla' | 'informativa';

export interface Alerta {
  gravedad: GravedadAlerta;
  mensaje: string;
  origen: string;
  /** No aparece en la hoja del paciente si es true. */
  soloAnestesiologo: boolean;
}

export interface PuntoConfirmacion {
  idFarmaco?: string;
  mensaje: string;
  datoQueFalta?: string;
}

// ————————————————————————————————————————————————————————————————
// Contexto de evaluación de reglas de medicación (design.md)
// ————————————————————————————————————————————————————————————————

/** Técnica anestésica "efectiva" tras resolver "no se sabe" (R3.2.3). */
export interface ContextoReglas {
  fechaHoraIntervencion: Date;
  riesgoHemorragico: RiesgoHemorragico;
  riesgoCardiovascular: RiesgoCardiovascular;
  grupoOftalmologico: GrupoOftalmologico;
  /** true si la técnica efectiva es neuroaxial (incluida la resolución de "no se sabe"). */
  neuroaxial: boolean;
  /** true si hay bloqueo profundo previsto. */
  bloqueoProfundo: boolean;
  riesgoTromboticoAlto: boolean;
  regimen: Regimen;
  pesoKg: number;
  /** Aclaramiento de creatinina (mL/min) o null si no se conoce (R6.7). */
  aclaramiento: number | null;
  /** Indicación del fármaco (para reglas que dependen de ella). */
  indicacion?: string;
  /** Pauta horaria del fármaco en evaluación (horas de toma del paciente). */
  pautaFarmaco?: PautaHorariaCtx;
}

/** Pauta horaria: horas "HH:MM" de toma en un día. */
export interface PautaHorariaCtx {
  horas: string[];
}
