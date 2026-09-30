/**
 * Construye el texto de SAP (§10.1). Por decisión del servicio, el texto contiene
 * SOLO los antecedentes patológicos y quirúrgicos; el resto de la valoración
 * (alergias, hábitos, medicación, vía aérea, escalas, ASA, plan, pruebas y
 * consentimiento) se rellena con los desplegables del propio SAP. Sin límite de
 * caracteres. Mantiene «Copiar» y «solo ASCII» a través de generarSap.
 */
import { generarSap, type BloqueSap, type OpcionesSap, type ResultadoSap } from './sap.ts';

export interface EntradaSap {
  /** Cabecera opcional (título de la valoración). */
  cabecera?: string;
  /** Antecedentes patológicos: cada enfermedad marcada con sus respuestas relevantes (§5.16). */
  antecedentesPatologicos: string[];
  /** Antecedentes quirúrgicos: intervención previa con año, tipo de anestesia e incidencias. */
  antecedentesQuirurgicos: string[];
}

export function construirSap(e: EntradaSap, opciones: OpcionesSap = {}): ResultadoSap {
  const bloques: BloqueSap[] = [
    { clave: 'cabecera', lineas: e.cabecera ? [e.cabecera] : [] },
    { clave: 'antecedentes_patologicos', lineas: e.antecedentesPatologicos.length > 0 ? [`AP: ${e.antecedentesPatologicos.join('. ')}.`] : ['AP: sin antecedentes patologicos relevantes.'] },
    { clave: 'antecedentes_quirurgicos', lineas: e.antecedentesQuirurgicos.length > 0 ? [`AQ: ${e.antecedentesQuirurgicos.join('; ')}.`] : ['AQ: sin intervenciones previas.'] },
  ];
  return generarSap(bloques, opciones);
}
