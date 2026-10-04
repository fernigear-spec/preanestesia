/**
 * Puntos de validación clínica (§13 bis). Mecanismo DISTINTO de las alertas: a
 * partir de las condiciones ya codificadas en los módulos (campo `genera`/`si`) y de
 * ciertos hechos clínicos evaluados en código (hoy, el stent reciente), selecciona
 * las que el catálogo `datos/validaciones.json` marca como puntos de validación y
 * las devuelve con su tipo (posponer/validar), motivo y fuente.
 *
 * Es PURO y testeable. La UI (resumen del anestesiólogo) decide el estado de cada
 * punto («Validado por [nombre]» o «Posponer o derivar»); aquí solo se derivan los
 * puntos ACTIVOS. Que haya puntos activos sin validar es lo que hace que la hoja del
 * paciente muestre el aviso de revisión.
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
  /** Origen que lo disparó («moduloId.preguntaId» o un hecho especial). */
  origen: string;
}

export interface EntradaPuntosValidacion {
  catalogo: CatalogoValidaciones;
  modulos: ModuloPatologia[];
  respuestas: RespuestasModulos;
  /** Módulos activos (ids marcados por el paciente). */
  activos?: Set<string>;
  fechaIntervencion?: Date | null;
  fechaReferencia?: Date;
  /**
   * Hechos especiales que no salen de una condición de módulo, ya evaluados en código.
   * Hoy solo el stent reciente (true si `evaluarStent` lo considera reciente).
   */
  hechosEspeciales?: {
    stentReciente?: boolean;
  };
}

/** Orden de presentación: primero los de posponer (rojo), luego los de validar (amarillo). */
const ORDEN_TIPO: Record<TipoValidacion, number> = { posponer: 0, validar: 1 };

/**
 * Deriva los puntos de validación activos. Un punto está activo cuando su `origen`
 * se dispara: para los orígenes «moduloId.preguntaId», cuando el efecto del módulo
 * se emite; para los hechos especiales, cuando el flag correspondiente es true.
 */
export function derivarPuntosValidacion(e: EntradaPuntosValidacion): PuntoValidacion[] {
  const defs: PuntoValidacionDef[] = [...e.catalogo.posponer, ...e.catalogo.validar];

  // Conjunto de orígenes «moduloId.preguntaId» que se disparan en esta entrevista.
  const efectos = emitirEfectosModulos({
    modulos: e.modulos,
    respuestas: e.respuestas,
    ...(e.activos ? { activos: e.activos } : {}),
    fechaIntervencion: e.fechaIntervencion ?? null,
    ...(e.fechaReferencia ? { fechaReferencia: e.fechaReferencia } : {}),
  });
  const origenesModulo = new Set(efectos.alertas.map((a) => a.origen));

  const activo = (origen: string): boolean => {
    if (origen === 'stent_reciente') return e.hechosEspeciales?.stentReciente === true;
    return origenesModulo.has(origen);
  };

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
