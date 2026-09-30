/**
 * Derivación de la clase de riesgo del paciente (§7.2) y de las pruebas
 * complementarias (§7.3) a partir de los módulos de la entrevista. Alimenta el
 * resumen: así al marcar, por ejemplo, EPOC cambian las pruebas propuestas.
 *
 * Las asignaciones concretas por respuesta salen de los módulos; esta función las
 * agrega. No inventa datos: lo que no consta, no suma.
 */
import type { RiesgoCardiovascular, RiesgoHemorragico, TecnicaAnestesica } from '../tipos.ts';
import {
  calcularClaseRiesgoPaciente,
  type AsignacionRiesgo,
  type ResultadoClaseRiesgo,
} from '../riesgo/claseRiesgoPaciente.ts';
import { decidirPruebas, type FactoresPruebas, type PruebaSolicitada } from '../pruebas/tablaPruebas.ts';

type Resp = Record<string, Record<string, unknown>>;

export interface EntradaRiesgoPruebas {
  respuestas: Resp;
  enfermedades: Set<string>;
  edadAnios: number;
  imc: number | null;
  hemstopPositivo: boolean;
  /** Grupos de fármaco presentes: 'anticoagulante', 'antiagregante'. */
  medicacionGrupos: Set<string>;
  riesgoCardiovascular: RiesgoCardiovascular;
  riesgoHemorragico: RiesgoHemorragico;
  neuroaxialProbable: boolean;
  tecnica: TecnicaAnestesica;
}

export interface ResultadoRiesgoPruebas {
  clase: ResultadoClaseRiesgo;
  factores: FactoresPruebas;
  pruebas: PruebaSolicitada[];
}

/** Clase de riesgo del paciente (§7.2) a partir de los módulos, la edad y el IMC. */
export function derivarClaseRiesgo(e: EntradaRiesgoPruebas): ResultadoClaseRiesgo {
  const r = e.respuestas;
  const a: AsignacionRiesgo[] = [];

  if (e.edadAnios >= 65) a.push({ clase: 'bajo-moderado', motivo: '≥ 65 años' });
  if (e.imc !== null && e.imc >= 40) a.push({ clase: 'moderado', motivo: 'IMC ≥ 40' });
  else if (e.imc !== null && e.imc >= 30) a.push({ clase: 'bajo-moderado', motivo: 'IMC 30-40' });

  if (e.enfermedades.has('hta')) a.push({ clase: 'bajo-moderado', motivo: 'HTA' });

  if (e.enfermedades.has('diabetes')) {
    const hba1c = num((r['diabetes'] ?? {}).hba1c);
    if (hba1c !== null && hba1c > 8.5) a.push({ clase: 'moderado', motivo: 'diabetes mal controlada (HbA1c > 8,5 %)' });
    else a.push({ clase: 'bajo-moderado', motivo: 'diabetes' });
  }

  if (e.enfermedades.has('asma_epoc')) {
    const m = r['asma_epoc'] ?? {};
    if (m.oxigeno_domiciliario === true) a.push({ clase: 'alto', motivo: 'oxigenoterapia domiciliaria' });
    else if (m.enfermedad === 'epoc' || m.enfermedad === 'ambas') a.push({ clase: 'moderado', motivo: 'EPOC' });
    else a.push({ clase: 'bajo-moderado', motivo: 'asma' });
  }

  if (e.enfermedades.has('saos')) a.push({ clase: 'bajo-moderado', motivo: 'SAOS' });

  if (e.enfermedades.has('insuficiencia_cardiaca')) {
    const nyha = str((r['insuficiencia_cardiaca'] ?? {}).nyha);
    if (nyha === 'III' || nyha === 'IV') a.push({ clase: 'alto', motivo: `insuficiencia cardiaca NYHA ${nyha}` });
    else a.push({ clase: 'moderado', motivo: 'insuficiencia cardiaca' });
  }

  if (e.enfermedades.has('enfermedad_renal')) {
    const estadio = str((r['enfermedad_renal'] ?? {}).estadio);
    if (estadio === 'terminal') a.push({ clase: 'alto', motivo: 'ERC terminal (filtrado < 15)' });
    else if (estadio === 'grave' || estadio === 'moderada') a.push({ clase: 'moderado', motivo: 'ERC (filtrado 15-45)' });
    else a.push({ clase: 'bajo-moderado', motivo: 'enfermedad renal crónica' });
  }

  if (e.enfermedades.has('valvulopatia') || e.enfermedades.has('protesis_mecanica')) {
    const grav = str((r['valvulopatia'] ?? {}).gravedad);
    if (grav === 'moderada' || grav === 'grave') a.push({ clase: 'alto', motivo: 'valvulopatía moderada-grave' });
    else a.push({ clase: 'bajo-moderado', motivo: 'valvulopatía' });
  }

  if (e.enfermedades.has('cardiopatia_isquemica') || e.enfermedades.has('stent_o_infarto')) {
    const m = r['cardiopatia_isquemica'] ?? {};
    const esf = str(m.angina_esfuerzo);
    if (m.angina_residual === true && (esf === 'minimos' || esf === 'reposo')) a.push({ clase: 'alto', motivo: 'angina de mínimos esfuerzos/reposo' });
    else a.push({ clase: 'moderado', motivo: 'cardiopatía isquémica' });
  }

  if (e.enfermedades.has('enfermedad_hepatica')) a.push({ clase: 'moderado', motivo: 'hepatopatía crónica' });

  return calcularClaseRiesgoPaciente(a);
}

/** Factores para las excepciones de la tabla de pruebas (§7.3). */
export function derivarFactoresPruebas(e: EntradaRiesgoPruebas): FactoresPruebas {
  const r = e.respuestas;
  const hbAnemia = num((r['anemia'] ?? {}).hemoglobina);
  const anemiaOHbBaja = e.enfermedades.has('anemia') || (hbAnemia !== null && hbAnemia < 13);

  const trastornoCoagulacionOAnticoagulante =
    e.enfermedades.has('trastorno_coagulacion') ||
    e.enfermedades.has('anticoagulacion') ||
    e.medicacionGrupos.has('anticoagulante') ||
    e.medicacionGrupos.has('antiagregante');

  const anestesiaRegionalPosible =
    e.neuroaxialProbable ||
    e.tecnica === 'neuroaxial' ||
    e.tecnica === 'bloqueo_periferico' ||
    e.tecnica === 'bloqueo_profundo';

  const asma = r['asma_epoc'] ?? {};
  const supuestoRxTorax = asma.sintomas_respiratorios_nuevos === true;

  const valv = r['valvulopatia'] ?? {};
  const tieneValvulopatia = e.enfermedades.has('valvulopatia') || e.enfermedades.has('protesis_mecanica');
  const ecoReciente = str(valv.ecocardiograma_fecha) !== null; // simplificación: si consta fecha, se asume vigente
  const supuestoEcocardiograma = valv.sintomas_nuevos === true || (tieneValvulopatia && !ecoReciente);

  return {
    anemiaOHbBaja,
    trastornoCoagulacionOAnticoagulante,
    anestesiaRegionalPosible,
    sangradoPrevisible: e.riesgoHemorragico === 'alto',
    hemstopPositivo: e.hemstopPositivo,
    supuestoRxTorax,
    supuestoEcocardiograma,
  };
}

/** Clase de riesgo + factores + pruebas propuestas (§7). */
export function derivarRiesgoYPruebas(e: EntradaRiesgoPruebas): ResultadoRiesgoPruebas {
  const clase = derivarClaseRiesgo(e);
  const factores = derivarFactoresPruebas(e);
  const pruebas = decidirPruebas(e.riesgoCardiovascular, clase.clase, factores);
  return { clase, factores, pruebas };
}

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null;
}
