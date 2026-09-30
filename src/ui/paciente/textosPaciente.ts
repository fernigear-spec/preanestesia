/**
 * Textos de la hoja del paciente en castellano y catalán (§10.2, §16.3).
 * El catalán está marcado como pendiente de revisión en el propio JSON.
 */
import es from '../../../datos/textos/es/paciente.json';
import ca from '../../../datos/textos/ca/paciente.json';

export type Idioma = 'es' | 'ca';
export type TextosPaciente = typeof es;

const TEXTOS: Record<Idioma, TextosPaciente> = { es, ca: ca as TextosPaciente };

export function textosPaciente(idioma: Idioma): TextosPaciente {
  return TEXTOS[idioma];
}
