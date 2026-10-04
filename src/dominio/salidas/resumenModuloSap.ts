/**
 * Resumen de un módulo de patología para el texto de SAP (§10.1, 2026-10-04).
 *
 * Reglas (decisión del servicio):
 * - Solo constan las preguntas CONTESTADAS (marcadas o con texto). Las no
 *   contestadas no aparecen.
 * - Preguntas booleanas: etiqueta breve (`etiquetaSap`); sí = la palabra; no =
 *   "no " + la palabra.
 * - Preguntas de casillas múltiples: solo las opciones marcadas, en forma breve
 *   (su etiqueta de opción).
 * - El resto (opción, número, fecha, texto): "<etiqueta breve>: <valor>".
 *
 * Función pura: recibe el módulo (ya cargado) y sus respuestas; no toca la UI.
 */
import type { ModuloPatologia, RespuestasModulo, ValorRespuesta } from '../../datos/modulos.ts';

export function resumenModuloSap(modulo: ModuloPatologia, respuestas: RespuestasModulo): string {
  const partes: string[] = [];
  for (const p of modulo.preguntas) {
    const v: ValorRespuesta | undefined = respuestas[p.id];
    if (p.tipo === 'boolean') {
      if (v !== true && v !== false) continue; // sin contestar
      const etq = p.etiquetaSap ?? p.etiqueta;
      partes.push(v === true ? etq : `no ${etq}`);
    } else if (p.tipo === 'opcion_multiple') {
      if (!Array.isArray(v) || v.length === 0) continue;
      const etiquetas = v.map((val) => p.opciones?.find((o) => o.valor === val)?.etiqueta ?? String(val));
      partes.push(etiquetas.join(', '));
    } else if (p.tipo === 'opcion') {
      if (typeof v !== 'string' || v === '') continue;
      const etq = p.opciones?.find((o) => o.valor === v)?.etiqueta ?? v;
      partes.push(`${p.etiquetaSap ?? p.etiqueta}: ${etq}`);
    } else {
      if (v === undefined || v === null || v === '') continue;
      partes.push(`${p.etiquetaSap ?? p.etiqueta}: ${String(v)}`);
    }
  }
  return partes.length > 0 ? `${modulo.titulo} (${partes.join('; ')})` : modulo.titulo;
}
