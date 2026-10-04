/**
 * Construye el texto de SAP (§10.1). El texto contiene los antecedentes patológicos
 * y quirúrgicos y el resultado del consentimiento del paso 10 (2026-10-04); el resto
 * de la valoración (alergias, hábitos, medicación, vía aérea, escalas, ASA, plan,
 * pruebas) se rellena con los desplegables del propio SAP. Sin límite de caracteres.
 * Mantiene «Copiar» y «solo ASCII» a través de generarSap.
 */
import { generarSap, type BloqueSap, type OpcionesSap, type ResultadoSap } from './sap.ts';

/** Estado del consentimiento del paso 10 (§10, R3.2.29) para el texto de SAP. */
export type ConsentimientoSap =
  | { estado: 'entregado'; fecha?: string }
  | { estado: 'pendiente_entregar' }
  | { estado: 'no_procede' };

export interface EntradaSap {
  /** Cabecera opcional (título de la valoración). */
  cabecera?: string;
  /** Antecedentes patológicos: cada enfermedad marcada con sus respuestas relevantes (§5.16). */
  antecedentesPatologicos: string[];
  /** Antecedentes quirúrgicos: intervención previa con año, tipo de anestesia e incidencias. */
  antecedentesQuirurgicos: string[];
  /** Consentimiento del paso 10 (§10, 2026-10-04). Si falta, no se escribe la línea. */
  consentimiento?: ConsentimientoSap;
}

/** Línea de consentimiento para el SAP (§10.1), según su estado. */
function lineaConsentimiento(c: ConsentimientoSap): string {
  if (c.estado === 'entregado') return `Consentimiento: entregado y explicado${c.fecha ? ` (${c.fecha})` : ''}`;
  if (c.estado === 'pendiente_entregar') return 'Consentimiento: pendiente de entregar';
  return 'Consentimiento: no procede';
}

export function construirSap(e: EntradaSap, opciones: OpcionesSap = {}): ResultadoSap {
  const bloques: BloqueSap[] = [
    { clave: 'cabecera', lineas: e.cabecera ? [e.cabecera] : [] },
    { clave: 'antecedentes_patologicos', lineas: e.antecedentesPatologicos.length > 0 ? [`AP: ${e.antecedentesPatologicos.join('. ')}.`] : ['AP: sin antecedentes patologicos relevantes.'] },
    { clave: 'antecedentes_quirurgicos', lineas: e.antecedentesQuirurgicos.length > 0 ? [`AQ: ${e.antecedentesQuirurgicos.join('; ')}.`] : ['AQ: sin intervenciones previas.'] },
    { clave: 'consentimiento', lineas: e.consentimiento ? [lineaConsentimiento(e.consentimiento)] : [] },
  ];
  return generarSap(bloques, opciones);
}
