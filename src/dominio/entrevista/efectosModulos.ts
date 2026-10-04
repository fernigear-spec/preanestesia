/**
 * Ejecución de los efectos codificados por respuesta (§5.16).
 *
 * Cada pregunta de un módulo (`datos/modulos/*.json`) puede declarar en su campo
 * `genera` los efectos clínicos de sus respuestas: alerta, nota, prueba, clase de
 * riesgo, ASA, regla o dato. Hasta ahora esa codificación era SOLO descriptiva
 * (se mostraba en CONTENIDO_CLINICO.md y la vigilaba un test de cobertura), pero
 * nadie la ejecutaba: las alertas del resumen estaban escritas a mano.
 *
 * Esta función lee los `genera` de tipo `alerta` y `nota` que llevan una condición
 * estructurada `si` y, evaluándola contra las respuestas de la entrevista, emite
 * las alertas y notas correspondientes. Es PURA y testeable, y la reutiliza el
 * resumen del anestesiólogo (y los puntos de validación de la Fase 4).
 *
 * El texto `cuando` sigue siendo la traza legible; `si` es la forma ejecutable.
 */
import type {
  ModuloPatologia,
  RespuestasModulos,
  RespuestasModulo,
  CondicionEfecto,
  EfectoRespuesta,
  GravedadEfecto,
  ValorRespuesta,
} from '../../datos/modulos.ts';

export interface AlertaModulo {
  gravedad: GravedadEfecto;
  mensaje: string;
  /** Origen: "<moduloId>.<preguntaId>". */
  origen: string;
  /** Sección del documento fuente, si consta. */
  fuente?: string;
}

export interface NotaModulo {
  texto: string;
  origen: string;
  fuente?: string;
}

export interface EfectosModulos {
  alertas: AlertaModulo[];
  notas: NotaModulo[];
}

export interface EntradaEfectosModulos {
  /** Módulos activos (ya cargados y validados). */
  modulos: ModuloPatologia[];
  /** Respuestas de la entrevista: moduloId → preguntaId → valor. */
  respuestas: RespuestasModulos;
  /** Solo evalúa estos módulos (ids marcados por el paciente). Si falta, evalúa todos los de `modulos`. */
  activos?: Set<string>;
  /** Fecha de la intervención para las condiciones por recencia; sin ella, "hoy" (§8.16). */
  fechaIntervencion?: Date | null;
}

/**
 * Evalúa una condición estructurada contra el valor de una respuesta.
 * Devuelve false ante datos ausentes o de tipo inesperado (no inventa efectos).
 */
export function evaluarCondicion(
  cond: CondicionEfecto,
  valor: ValorRespuesta | undefined,
  fechaReferencia: Date,
): boolean {
  if (cond.igual !== undefined) {
    return valor === cond.igual;
  }
  if (cond.enLista !== undefined) {
    return cond.enLista.some((v) => v === valor);
  }
  if (cond.contieneAlguno !== undefined) {
    if (!Array.isArray(valor)) return false;
    return cond.contieneAlguno.some((o) => valor.includes(o));
  }
  if (cond.mayorQue !== undefined) {
    return typeof valor === 'number' && !Number.isNaN(valor) && valor > cond.mayorQue;
  }
  if (cond.mayorIgualQue !== undefined) {
    return typeof valor === 'number' && !Number.isNaN(valor) && valor >= cond.mayorIgualQue;
  }
  if (cond.recienteMeses !== undefined) {
    const f = fechaDesde(valor);
    if (f === null) return false;
    const limite = new Date(fechaReferencia.getTime());
    limite.setMonth(limite.getMonth() - cond.recienteMeses);
    // Reciente = la fecha del evento es posterior al límite (está dentro de la ventana).
    return f.getTime() >= limite.getTime();
  }
  return false;
}

/** Convierte un valor de respuesta de tipo fecha (ISO yyyy-mm-dd) en Date, o null. */
function fechaDesde(valor: ValorRespuesta | undefined): Date | null {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const d = new Date(`${valor}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ¿Este efecto se puede ejecutar (es alerta o nota y lleva condición `si`)? */
export function efectoEjecutable(g: EfectoRespuesta): boolean {
  return (g.tipo === 'alerta' || g.tipo === 'nota') && g.si !== undefined;
}

/**
 * Emite las alertas y notas de los módulos activos cuyas condiciones `si` se cumplen
 * con las respuestas dadas. No duplica: una misma pareja mensaje+gravedad aparece una vez.
 */
export function emitirEfectosModulos(e: EntradaEfectosModulos): EfectosModulos {
  const referencia = e.fechaIntervencion ?? new Date();
  const alertas: AlertaModulo[] = [];
  const notas: NotaModulo[] = [];
  const vistasAlertas = new Set<string>();
  const vistasNotas = new Set<string>();

  for (const modulo of e.modulos) {
    if (e.activos && !e.activos.has(modulo.id)) continue;
    const resp: RespuestasModulo = e.respuestas[modulo.id] ?? {};
    for (const pregunta of modulo.preguntas) {
      for (const g of pregunta.genera ?? []) {
        if (!efectoEjecutable(g) || !g.si) continue;
        if (!evaluarCondicion(g.si, resp[pregunta.id], referencia)) continue;
        const origen = `${modulo.id}.${pregunta.id}`;
        if (g.tipo === 'alerta') {
          const grav = g.gravedad ?? 'amarilla';
          const clave = `${grav}|${g.efecto}`;
          if (vistasAlertas.has(clave)) continue;
          vistasAlertas.add(clave);
          alertas.push({ gravedad: grav, mensaje: g.efecto, origen, ...(g.fuente ? { fuente: g.fuente } : {}) });
        } else {
          const clave = g.efecto;
          if (vistasNotas.has(clave)) continue;
          vistasNotas.add(clave);
          notas.push({ texto: g.efecto, origen, ...(g.fuente ? { fuente: g.fuente } : {}) });
        }
      }
    }
  }
  return { alertas, notas };
}
