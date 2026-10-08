/**
 * Render de la información de riesgos de la anestesia para el paciente (§8.17).
 *
 * A partir de las CLAVES de sección que viajan en el QR (`ExtrasHojaQr.riesgos`) y del
 * texto literal de `datos/textos/{es,ca}/riesgos_anestesia.json`, compone el anexo
 * «Información sobre su anestesia» en el idioma elegido. El texto NO se redacta aquí:
 * sale del JSON (fuente única `docs/riesgos_anestesia_es.md`).
 */
import riesgosEs from '../../../datos/textos/es/riesgos_anestesia.json';
import riesgosCa from '../../../datos/textos/ca/riesgos_anestesia.json';
import type { Idioma } from './textosPaciente.ts';

export type TextosRiesgos = typeof riesgosEs;

const TEXTOS_RIESGOS: Record<Idioma, TextosRiesgos> = { es: riesgosEs, ca: riesgosCa as TextosRiesgos };

export function textosRiesgos(idioma: Idioma): TextosRiesgos {
  return TEXTOS_RIESGOS[idioma];
}

/** Una tabla de frecuencias (cabeceras + filas). */
export interface TablaRiesgo {
  cabeceras: string[];
  filas: string[][];
}

/** Una sección renderizada del anexo de riesgos. */
export interface SeccionRiesgoRender {
  titulo?: string;
  parrafos: string[];
  tabla?: TablaRiesgo;
}

/** Claves con sección completa (título + tabla) en el JSON. */
type ClaveSeccion = keyof TextosRiesgos['secciones'];
const CLAVES_SECCION: ClaveSeccion[] = ['general', 'raquidea', 'epidural_combinada', 'bloqueo', 'sedacion', 'nino'];

/**
 * Compone las secciones del anexo de riesgos en orden de presentación. Devuelve []
 * si no hay ninguna clave (no se muestra el anexo). Las claves desconocidas se ignoran.
 */
export function renderRiesgosAnestesia(claves: string[], t: TextosRiesgos): SeccionRiesgoRender[] {
  if (claves.length === 0) return [];
  const tieneContenido = CLAVES_SECCION.some((c) => claves.includes(c))
    || claves.includes('local_sola') || claves.includes('bloqueo_ojo');
  if (!tieneContenido) return [];

  const out: SeccionRiesgoRender[] = [];

  // Introducción (tabla de frecuencias), siempre que haya algo que mostrar.
  out.push({ titulo: t.intro.titulo, parrafos: t.intro.parrafos, tabla: t.intro.tabla });

  for (const clave of CLAVES_SECCION) {
    if (!claves.includes(clave)) continue;
    const sec = t.secciones[clave];
    const parrafos = [...sec.parrafos];
    // El párrafo del hombro/brazo va dentro del bloqueo, antes de su cierre.
    const cierre = [...sec.cierre];
    if (clave === 'bloqueo' && claves.includes('bloqueo_hombro_brazo')) {
      cierre.unshift(t.frases.bloqueo_hombro_brazo);
    }
    // La frase de la epidural (neuroaxial sin subtipo) va al final de la raquídea.
    if (clave === 'raquidea' && claves.includes('epidural_no_especificada')) {
      cierre.push(t.frases.epidural_no_especificada);
    }
    out.push({ titulo: sec.titulo, parrafos: [...parrafos, ...cierre], tabla: sec.tabla });
  }

  // Frases sueltas sin sección propia.
  if (claves.includes('bloqueo_ojo')) out.push({ parrafos: [t.frases.bloqueo_ojo] });
  if (claves.includes('local_sola')) out.push({ parrafos: [t.frases.local_sola] });

  // Cierre final del anexo, siempre.
  out.push({ parrafos: t.cierre });

  return out;
}
