/**
 * Puntos de validación clínica (§13 bis). Mecanismo DISTINTO de las alertas: a
 * partir de condiciones ya evaluadas por el programa, selecciona las que el catálogo
 * `datos/validaciones.json` marca como puntos de validación y las devuelve con su
 * tipo (posponer/validar), motivo y fuente.
 *
 * Un punto se dispara según su `origen`, que puede ser de dos clases:
 *   - «moduloId.preguntaId»: una condición codificada en datos/modulos/*.json
 *     (campo `genera`/`si`); el punto se activa si ese efecto se emite.
 *   - un HECHO con nombre (p. ej. `stent_reciente`, `cuatro_at_alto`, `egri_alto`,
 *     `riesgo_quirurgico_alto`, `alergia_latex`, `intubacion_dificil_previa`…): el
 *     punto se activa si el flag correspondiente (ya calculado por la UI a partir de
 *     escalas, hechos clínicos, paso 1, alergias, antecedentes o vía aérea) es true.
 *
 * Es PURO y testeable. La UI (resumen del anestesiólogo) decide el estado de cada
 * punto («Validado por [nombre]» o «Posponer o derivar»); aquí solo se derivan los
 * puntos ACTIVOS.
 */
import type { CatalogoValidaciones, PuntoValidacionDef, TipoValidacion } from '../../datos/validaciones.ts';
import type { ModuloPatologia, RespuestasModulos } from '../../datos/modulos.ts';
import { emitirEfectosModulos } from './efectosModulos.ts';

/** Un punto de validación ACTIVO para esta entrevista. */
export interface PuntoValidacion {
  id: string;
  tipo: TipoValidacion;
  motivo: string;
  fuente?: string;
  /** Origen que lo disparó («moduloId.preguntaId» o un nombre de hecho). */
  origen: string;
}

/** Flags de hechos (escalas, hechos clínicos, paso 1, alergias, antecedentes, vía aérea). */
export type HechosValidacion = Record<string, boolean>;

export interface EntradaPuntosValidacion {
  catalogo: CatalogoValidaciones;
  modulos: ModuloPatologia[];
  respuestas: RespuestasModulos;
  /** Módulos activos (ids marcados por el paciente). */
  activos?: Set<string>;
  fechaIntervencion?: Date | null;
  fechaReferencia?: Date;
  /**
   * Hechos ya evaluados en código (ids → true/false). Un `origen` del catálogo que
   * no sea «moduloId.preguntaId» de un módulo activo se busca aquí.
   */
  hechos?: HechosValidacion;
}

/** Orden de presentación: primero los de posponer (rojo), luego los de validar (amarillo). */
const ORDEN_TIPO: Record<TipoValidacion, number> = { posponer: 0, validar: 1 };

/**
 * Deriva los puntos de validación activos. Para los orígenes «moduloId.preguntaId»
 * se consulta si el efecto del módulo se emite; para el resto (hechos con nombre),
 * si su flag es true.
 */
export function derivarPuntosValidacion(e: EntradaPuntosValidacion): PuntoValidacion[] {
  const defs: PuntoValidacionDef[] = [...e.catalogo.posponer, ...e.catalogo.validar];
  const hechos = e.hechos ?? {};

  // Orígenes «moduloId.preguntaId» que se disparan en esta entrevista.
  const efectos = emitirEfectosModulos({
    modulos: e.modulos,
    respuestas: e.respuestas,
    ...(e.activos ? { activos: e.activos } : {}),
    fechaIntervencion: e.fechaIntervencion ?? null,
    ...(e.fechaReferencia ? { fechaReferencia: e.fechaReferencia } : {}),
  });
  const origenesModulo = new Set(efectos.alertas.map((a) => a.origen));

  // Ids de módulo conocidos, para distinguir «origen de módulo» de «hecho con nombre».
  const idsModulo = new Set(e.modulos.map((m) => m.id));
  const esOrigenDeModulo = (origen: string): boolean => {
    const i = origen.indexOf('.');
    return i > 0 && idsModulo.has(origen.slice(0, i));
  };

  const activo = (origen: string): boolean =>
    esOrigenDeModulo(origen) ? origenesModulo.has(origen) : hechos[origen] === true;

  const puntos: PuntoValidacion[] = [];
  const vistos = new Set<string>();
  for (const d of defs) {
    if (!activo(d.origen)) continue;
    if (vistos.has(d.id)) continue;
    vistos.add(d.id);
    puntos.push({ id: d.id, tipo: d.tipo, motivo: d.motivo, origen: d.origen, ...(d.fuente ? { fuente: d.fuente } : {}) });
  }

  puntos.sort((a, b) => ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo]);
  return puntos;
}
