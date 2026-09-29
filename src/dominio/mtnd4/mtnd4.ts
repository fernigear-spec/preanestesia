/**
 * Cribado de riesgo mitocondrial mtND4 — docs/documento_fuente.md §9 (SEDAR 2026).
 * Lógica de alerta (Decisión 10):
 *  - Test genético positivo → alerta roja + vigilancia postoperatoria estrecha.
 *  - Test genético negativo (variante ausente) → alerta informativa.
 *  - Ascendencia venezolana materna directa, origen materno desconocido,
 *    ovodonación o antecedentes familiares compatibles SIN test → alerta roja.
 * En la hoja del paciente solo aparece un texto neutro (§9).
 */
import type { Alerta } from '../tipos.ts';

export type ResultadoTest = 'positivo' | 'negativo' | 'no_hecho';

export interface EntradaMtnd4 {
  ascendenciaVenezolanaMaterna: boolean;
  origenMaternoDesconocidoUOvodonacion: boolean;
  antecedentesFamiliaresCompatibles: boolean;
  testGenetico: ResultadoTest;
}

export interface ResultadoMtnd4 {
  alerta: Alerta;
  /** Texto neutro para la hoja del paciente (§9.5). */
  textoPaciente: string;
  /** Medidas para las notas del anestesiólogo (§9.4). */
  notasAnestesiologo: string[];
}

const TEXTO_PACIENTE = 'El anestesiólogo hablará con usted sobre este punto antes de la intervención.';

const MEDIDAS_ROJA = [
  'Procedimiento diferible y test disponible: test genético (búsqueda específica de la variante, ' +
    'informe explícito de presencia/ausencia, consentimiento específico) y diferir la cirugía hasta el resultado.',
  'No diferible o sin test: evitar halogenados (TIVA), purgado de máquina y circuito, priorizar ' +
    'anestesia regional/local con sedación, EEG procesado, normoxia, normocapnia, normotermia, ' +
    'estabilidad hemodinámica, control de glucemia y equilibrio ácido-base; test genético diferido.',
];

export function evaluarMtnd4(e: EntradaMtnd4): ResultadoMtnd4 {
  const origen = 'mtND4 §9 (SEDAR 2026)';

  if (e.testGenetico === 'positivo') {
    return {
      alerta: {
        gravedad: 'roja',
        mensaje: 'mtND4: test genético positivo (variante m.11232T>C presente).',
        origen,
        soloAnestesiologo: false,
      },
      textoPaciente: TEXTO_PACIENTE,
      notasAnestesiologo: ['Vigilancia postoperatoria estrecha.', ...MEDIDAS_ROJA],
    };
  }

  if (e.testGenetico === 'negativo') {
    return {
      alerta: {
        gravedad: 'informativa',
        mensaje: 'variante m.11232T>C ausente; decisión del anestesiólogo.',
        origen,
        soloAnestesiologo: false,
      },
      textoPaciente: TEXTO_PACIENTE,
      notasAnestesiologo: [],
    };
  }

  // Sin test: factores de riesgo → alerta roja.
  const hayFactor =
    e.ascendenciaVenezolanaMaterna ||
    e.origenMaternoDesconocidoUOvodonacion ||
    e.antecedentesFamiliaresCompatibles;

  if (hayFactor) {
    return {
      alerta: {
        gravedad: 'roja',
        mensaje:
          'mtND4: ascendencia materna venezolana, origen materno desconocido/ovodonación o antecedentes familiares compatibles, sin test.',
        origen,
        soloAnestesiologo: false,
      },
      textoPaciente: TEXTO_PACIENTE,
      notasAnestesiologo: MEDIDAS_ROJA,
    };
  }

  // Sin factores y sin test: cribado negativo, informativa neutra.
  return {
    alerta: {
      gravedad: 'informativa',
      mensaje: 'cribado mtND4 sin factores de riesgo.',
      origen,
      soloAnestesiologo: true,
    },
    textoPaciente: TEXTO_PACIENTE,
    notasAnestesiologo: [],
  };
}
