/**
 * El JSON de riesgos de anestesia en castellano (datos/textos/es/riesgos_anestesia.json)
 * debe coincidir PALABRA POR PALABRA con la fuente única docs/riesgos_anestesia_es.md
 * (§8.17). Este test parsea el .md y compara cada texto con el JSON; si alguien cambia
 * una cifra o una palabra en el JSON sin tocar el .md (o al revés), falla.
 *
 * El .md es la fuente de verdad: no se cambia ni una palabra ni una cifra sin
 * aprobación del servicio.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, it, expect } from '../../_harness.ts';
import riesgosEs from '../../../datos/textos/es/riesgos_anestesia.json' with { type: 'json' };

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../../..');
const MD = readFileSync(resolve(RAIZ, 'docs/riesgos_anestesia_es.md'), 'utf8');

/** Extrae el texto de un «bullet» cuyo prefijo entre comillas aparece en el .md. */
function fraseEntreComillas(etiqueta: string): string {
  // Línea del tipo: - <etiqueta ...>: "la frase".
  const re = new RegExp(`${etiqueta}[^\\n]*?: "([^"]+)"`);
  const m = MD.match(re);
  if (!m || m[1] === undefined) throw new Error(`No se encontró la frase para «${etiqueta}» en el .md`);
  return m[1];
}

/** Escapa los metacaracteres de una cadena para usarla literal en un RegExp. */
function escaparRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extrae el bloque de una sección «## Título» hasta la siguiente «## ». */
function bloqueSeccion(titulo: string): string {
  const re = new RegExp(`\\n## ${escaparRegExp(titulo)}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const m = MD.match(re);
  if (!m || m[1] === undefined) throw new Error(`No se encontró la sección «${titulo}» en el .md`);
  return m[1];
}

/** Párrafos de texto de un bloque (líneas no vacías que no son tabla ni corchete). */
function parrafosDe(bloque: string): string[] {
  return bloque
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('|') && !l.startsWith('[') && !l.startsWith('- '));
}

/** Filas de la (única) tabla markdown de un bloque, sin la cabecera ni el separador. */
function tablaDe(bloque: string): { cabeceras: string[]; filas: string[][] } {
  const lineas = bloque.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (lineas.length < 2) throw new Error('No se encontró una tabla en el bloque');
  const celdas = (l: string) => l.slice(1, l.lastIndexOf('|')).split('|').map((c) => c.trim());
  const cabeceras = celdas(lineas[0]!);
  // lineas[1] es el separador «| --- | ... |».
  const filas = lineas.slice(2).map(celdas);
  return { cabeceras, filas };
}

describe('§8.17 · el JSON de riesgos en castellano coincide con el .md fuente', () => {
  it('frases sueltas', () => {
    expect(riesgosEs.frases.epidural_no_especificada).toBe(
      fraseEntreComillas('Neuroaxial sin especificar'),
    );
    expect(riesgosEs.frases.bloqueo_ojo).toBe(
      fraseEntreComillas('Oftalmología con bloqueo'),
    );
    expect(riesgosEs.frases.local_sola).toBe(
      fraseEntreComillas('Local sin sedación'),
    );
  });

  it('párrafo del hombro y el brazo (solo si hombro/brazo)', () => {
    // Línea «[Solo si ...] <texto literal>» dentro del bloque de bloqueo de nervios.
    const bloque = bloqueSeccion('Bloqueo de nervios (anestesia locorregional)');
    const m = bloque.match(/\[Solo si[^\]]*\]\s*([\s\S]*?)(?=\n\n|\nEn los bloqueos del tronco)/);
    if (!m || m[1] === undefined) throw new Error('No se encontró el párrafo de hombro/brazo en el .md');
    expect(riesgosEs.frases.bloqueo_hombro_brazo).toBe(m[1].trim());
  });

  it('introducción (párrafos + tabla de frecuencias)', () => {
    const bloque = bloqueSeccion('Antes de leer');
    expect(riesgosEs.intro.parrafos).toEqual(parrafosDe(bloque));
    expect(riesgosEs.intro.tabla).toEqual(tablaDe(bloque));
  });

  const SECCIONES: Array<{ clave: keyof typeof riesgosEs.secciones; titulo: string }> = [
    { clave: 'general', titulo: 'Anestesia general' },
    { clave: 'raquidea', titulo: 'Anestesia raquídea (intradural)' },
    { clave: 'epidural_combinada', titulo: 'Anestesia epidural y combinada' },
    { clave: 'bloqueo', titulo: 'Bloqueo de nervios (anestesia locorregional)' },
    { clave: 'sedacion', titulo: 'Sedación' },
    { clave: 'nino', titulo: 'Si el paciente es un niño' },
  ];

  for (const { clave, titulo } of SECCIONES) {
    it(`sección «${clave}»: título, tabla y textos`, () => {
      const sec = riesgosEs.secciones[clave];
      const bloque = bloqueSeccion(titulo);
      expect(sec.titulo).toBe(titulo);
      // La tabla debe coincidir celda a celda.
      expect(sec.tabla).toEqual(tablaDe(bloque));
      // Los párrafos de texto (intro + cierre) del .md deben estar todos en el JSON,
      // en el mismo orden (intro antes de la tabla, cierre después).
      const parrafosMd = parrafosDe(bloque).filter((p) => !p.startsWith('['));
      const parrafosJson = [...sec.parrafos, ...sec.cierre];
      expect(parrafosJson).toEqual(parrafosMd);
    });
  }

  it('cierre final', () => {
    const bloque = bloqueSeccion('Cierre (al final del anexo, siempre)');
    expect(riesgosEs.cierre).toEqual(parrafosDe(bloque));
  });
});
