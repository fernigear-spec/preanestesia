/**
 * Puntos de validación clínica (§13 bis) — carga y validación del catálogo
 * `datos/validaciones.json`.
 *
 * Es un mecanismo DISTINTO de las alertas: cada punto describe una condición que el
 * anestesiólogo debe revisar al principio de su resumen, de dos tipos: «posponer»
 * (rojo, valorar posponer la cirugía programada) y «validar» (amarillo, validar
 * antes de la intervención). Este módulo es PURO: recibe el JSON ya leído, para que
 * funcione igual en el navegador (Vite) y en las pruebas (node + fs).
 *
 * El `origen` enlaza cada punto con la condición que lo dispara, que puede ser:
 *   - «moduloId.preguntaId»: una condición ya codificada en datos/modulos/*.json
 *     (campo `genera`/`si`); el motor comprueba si ese efecto se emite.
 *   - un hecho especial evaluado en código (hoy solo «stent_reciente»).
 */

export type TipoValidacion = 'posponer' | 'validar';

/** Un punto de validación clínica definido en datos/validaciones.json. */
export interface PuntoValidacionDef {
  id: string;
  /** 'posponer' (rojo) | 'validar' (amarillo). */
  tipo: TipoValidacion;
  /** Qué condición lo dispara: «moduloId.preguntaId» o un hecho especial. */
  origen: string;
  /** Motivo mostrado al anestesiólogo (editable). */
  motivo: string;
  /** Sección del documento fuente que lo respalda. */
  fuente?: string;
}

/** Catálogo de puntos de validación ya cargado. */
export interface CatalogoValidaciones {
  posponer: PuntoValidacionDef[];
  validar: PuntoValidacionDef[];
}

export interface ErrorValidaciones {
  campo?: string;
  mensaje: string;
}

/** Valida un objeto `validaciones.json` ya parseado. */
export function validarValidaciones(obj: unknown): ErrorValidaciones[] {
  const errores: ErrorValidaciones[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return [{ mensaje: 'validaciones.json no es un objeto JSON válido' }];
  }
  const o = obj as Record<string, unknown>;
  const idsVistos = new Set<string>();

  for (const grupo of ['posponer', 'validar'] as const) {
    const lista = o[grupo];
    if (lista === undefined) continue; // un grupo ausente se trata como vacío
    if (!Array.isArray(lista)) {
      errores.push({ campo: grupo, mensaje: `"${grupo}" debe ser una lista` });
      continue;
    }
    for (const [i, p] of lista.entries()) {
      const donde = `${grupo}[${i}]`;
      if (typeof p !== 'object' || p === null) {
        errores.push({ campo: donde, mensaje: 'el punto no es un objeto' });
        continue;
      }
      const pp = p as Record<string, unknown>;
      if (typeof pp.id !== 'string' || pp.id.trim() === '') {
        errores.push({ campo: `${donde}.id`, mensaje: 'punto sin id' });
      } else if (idsVistos.has(pp.id)) {
        errores.push({ campo: `${donde}.id`, mensaje: `id de punto duplicado: "${pp.id}"` });
      } else {
        idsVistos.add(pp.id);
      }
      if (typeof pp.origen !== 'string' || pp.origen.trim() === '') {
        errores.push({ campo: `${donde}.origen`, mensaje: 'punto sin origen' });
      }
      if (typeof pp.motivo !== 'string' || pp.motivo.trim() === '') {
        errores.push({ campo: `${donde}.motivo`, mensaje: 'punto sin motivo' });
      }
      if (pp.fuente !== undefined && typeof pp.fuente !== 'string') {
        errores.push({ campo: `${donde}.fuente`, mensaje: 'fuente debe ser texto' });
      }
    }
  }
  return errores;
}

/**
 * Carga y valida el catálogo de validaciones ya leído. Lanza si es inválido
 * (no se permite empezar con datos corruptos, igual que con los módulos).
 */
export function cargarValidaciones(obj: unknown): CatalogoValidaciones {
  const errs = validarValidaciones(obj);
  if (errs.length > 0) {
    const detalle = errs.map((e) => `  - ${e.campo ? `[${e.campo}] ` : ''}${e.mensaje}`).join('\n');
    throw new Error(`validaciones.json con errores; no se puede empezar:\n${detalle}`);
  }
  const o = obj as Record<string, unknown>;
  const mapear = (xs: unknown): PuntoValidacionDef[] =>
    (Array.isArray(xs) ? xs : []).map((p) => {
      const pp = p as Record<string, unknown>;
      const def: PuntoValidacionDef = {
        id: pp.id as string,
        tipo: 'validar',
        origen: pp.origen as string,
        motivo: pp.motivo as string,
      };
      if (typeof pp.fuente === 'string') def.fuente = pp.fuente;
      return def;
    });
  const posponer = mapear(o.posponer).map((p) => ({ ...p, tipo: 'posponer' as const }));
  const validar = mapear(o.validar).map((p) => ({ ...p, tipo: 'validar' as const }));
  return { posponer, validar };
}
