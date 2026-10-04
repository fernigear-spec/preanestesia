/**
 * Deriva la situación de ayuno (§8.14) y los elementos condicionales de la hoja
 * del paciente (§10.2): qué traer (CPAP, inhaladores, gafas/audífonos), prevención
 * del delirium (§6.10) y consejos de tabaco y alcohol (§6.9). Todo sale de la
 * entrevista; lo que no consta no se muestra.
 */
import type { SituacionEspecial } from '../ayuno/ayuno.ts';
import type { ExtrasHojaQr } from '../salidas/qr/hojaPaciente.ts';

type Resp = Record<string, Record<string, unknown>>;

export interface EntradaHojaExtras {
  edadAnios: number;
  semanasGestacion?: number;
  enfermedades: Set<string>;
  respuestas: Resp;
  tabacoActivo: boolean;
  auditPositivo: boolean;
  cfs?: number;
  cuatroAtPuntuacion?: number;
  edadPediatricaMaxima: number;
  /** El paciente toma un GLP-1 semanal (para la dieta líquida de 24 h). */
  glp1Semanal: boolean;
  /** El paciente es diabético. */
  diabetes: boolean;
  /** Hay puntos de validación clínica activos (§13 bis): aviso de revisión en la hoja. */
  revisionPendiente?: boolean;
}

export interface ResultadoHojaExtras {
  pediatrico: boolean;
  situacion: SituacionEspecial;
  extras: ExtrasHojaQr;
}

export function derivarHojaExtras(e: EntradaHojaExtras): ResultadoHojaExtras {
  const r = e.respuestas;
  const pediatrico = e.edadAnios <= e.edadPediatricaMaxima;

  // Situación de ayuno (la más restrictiva de las derivables).
  let situacion: SituacionEspecial = 'ninguna';
  const diab = r['diabetes'] ?? {};
  const reflujo = r['reflujo'] ?? {};
  if (diab.gastroparesia === true) situacion = 'diabetes_gastroparesia';
  else if ((e.semanasGestacion ?? 0) >= 20) situacion = 'embarazo_20sem';
  else if (reflujo.sintomatico_estos_dias === true && reflujo.gravedad === 'grave') situacion = 'reflujo_sintomatico';
  else if (e.enfermedades.has('diabetes')) situacion = 'diabetes';

  // Prevención del delirium (§6.10): fragilidad (CFS ≥ 5), 4AT ≥ 1 o deterioro conocido.
  const delirium =
    (e.cfs !== undefined && e.cfs >= 5) ||
    (e.cuatroAtPuntuacion !== undefined && e.cuatroAtPuntuacion >= 1) ||
    e.enfermedades.has('deterioro_cognitivo');

  // Hojas anexas (§8.14 bis): dieta líquida 24 h (GLP-1 semanal), ayuno diabético,
  // tabaco y alcohol.
  const anexos: string[] = [];
  if (e.glp1Semanal && e.diabetes) anexos.push('liquida24h_diabetes');
  else if (e.glp1Semanal) anexos.push('liquida24h');
  else if (e.diabetes) anexos.push('ayuno_diabetico');
  if (e.tabacoActivo) anexos.push('tabaco');
  if (e.auditPositivo) anexos.push('alcohol');

  const saos = r['saos'] ?? {};
  const extras: ExtrasHojaQr = {
    cpap: saos.cpap === true || e.enfermedades.has('saos'),
    inhaladores: e.enfermedades.has('asma_epoc'),
    delirium,
    tabaco: e.tabacoActivo,
    alcohol: e.auditPositivo,
    anexos,
  };
  if (e.revisionPendiente) extras.revisionPendiente = true;

  return { pediatrico, situacion, extras };
}
