/**
 * ASA sugerido a partir de los módulos y datos de la entrevista (§6.1). Deriva los
 * determinantes (respuesta → clase mínima) y devuelve el máximo, con la opción de
 * modificarlo a mano y el sufijo E en urgencias. Las asignaciones siguen los
 * ejemplos de §6.1; lo que no consta no suma.
 */
import { calcularAsa, type DeterminanteAsa, type ResultadoAsa, type ClaseAsa } from '../escalas/asa.ts';

type Resp = Record<string, Record<string, unknown>>;

export interface EntradaAsa {
  edadAnios: number;
  imc: number | null;
  embarazada: boolean;
  tabacoActivo: boolean;
  abusoAlcohol: boolean; // AUDIT-C ≥ 8
  enfermedades: Set<string>;
  respuestas: Resp;
  claseManual?: ClaseAsa;
}

const num = (v: unknown): number | null => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

export function derivarAsa(e: EntradaAsa): ResultadoAsa {
  const r = e.respuestas;
  const d: DeterminanteAsa[] = [];

  if (e.tabacoActivo) d.push({ clase: 2, motivo: 'fumador activo' });
  if (e.embarazada) d.push({ clase: 2, motivo: 'embarazo' });
  if (e.abusoAlcohol) d.push({ clase: 3, motivo: 'abuso de alcohol' });
  if (e.imc !== null && e.imc >= 40) d.push({ clase: 3, motivo: 'IMC ≥ 40' });
  else if (e.imc !== null && e.imc >= 30) d.push({ clase: 2, motivo: 'IMC 30-40' });

  if (e.enfermedades.has('hta')) {
    d.push((r['hta'] ?? {}).control === 'mal'
      ? { clase: 3, motivo: 'HTA mal controlada' }
      : { clase: 2, motivo: 'HTA' });
  }
  if (e.enfermedades.has('diabetes')) {
    const hba1c = num((r['diabetes'] ?? {}).hba1c);
    d.push(hba1c !== null && hba1c > 8.5
      ? { clase: 3, motivo: 'diabetes mal controlada' }
      : { clase: 2, motivo: 'diabetes' });
  }
  if (e.enfermedades.has('asma_epoc')) {
    const m = r['asma_epoc'] ?? {};
    if (m.enfermedad === 'epoc' || m.enfermedad === 'ambas') d.push({ clase: 3, motivo: 'EPOC' });
    else d.push({ clase: 2, motivo: 'asma' });
  }
  if (e.enfermedades.has('marcapasos')) d.push({ clase: 3, motivo: 'marcapasos/DAI' });

  if (e.enfermedades.has('insuficiencia_cardiaca')) {
    const nyha = str((r['insuficiencia_cardiaca'] ?? {}).nyha);
    d.push(nyha === 'III' || nyha === 'IV'
      ? { clase: 4, motivo: `insuficiencia cardiaca NYHA ${nyha}` }
      : { clase: 3, motivo: 'insuficiencia cardiaca' });
  }
  if (e.enfermedades.has('enfermedad_renal')) {
    const est = str((r['enfermedad_renal'] ?? {}).estadio);
    const dialisis = str((r['enfermedad_renal'] ?? {}).dialisis);
    if (est === 'terminal' && (dialisis === 'no' || dialisis === null)) d.push({ clase: 4, motivo: 'ERC terminal sin diálisis' });
    else if (dialisis === 'hemodialisis' || dialisis === 'peritoneal') d.push({ clase: 3, motivo: 'ERC en diálisis' });
    else d.push({ clase: 3, motivo: 'enfermedad renal crónica' });
  }
  if (e.enfermedades.has('cardiopatia_isquemica') || e.enfermedades.has('stent_o_infarto')) {
    const m = r['cardiopatia_isquemica'] ?? {};
    const anginaActiva = m.angina_residual === true && (m.angina_esfuerzo === 'minimos' || m.angina_esfuerzo === 'reposo');
    d.push(anginaActiva
      ? { clase: 4, motivo: 'isquemia activa (angina de mínimos/reposo)' }
      : { clase: 3, motivo: 'cardiopatía isquémica' });
  }
  if (e.enfermedades.has('valvulopatia')) {
    const grav = str((r['valvulopatia'] ?? {}).gravedad);
    if (grav === 'grave') d.push({ clase: 4, motivo: 'valvulopatía grave' });
    else if (grav === 'moderada') d.push({ clase: 3, motivo: 'valvulopatía moderada' });
  }
  if (e.enfermedades.has('enfermedad_hepatica')) d.push({ clase: 3, motivo: 'hepatopatía' });

  return calcularAsa(d, { ...(e.claseManual !== undefined ? { claseManual: e.claseManual } : {}) });
}
