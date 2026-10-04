/**
 * Módulos de patología — docs/documento_fuente.md §3 y §5.
 * Un fichero JSON por módulo en datos/modulos/. Cada módulo define sus preguntas
 * (tipo de respuesta, opciones, visibilidad condicional y texto de modo guiado).
 * El motor de la entrevista (paso 7) se construye leyendo estos ficheros con un
 * renderizador genérico; el cargador valida su estructura al arrancar (§3, R2.3).
 *
 * Este módulo es PURO (no importa los JSON): recibe los objetos ya leídos, para
 * que funcione igual en el navegador (Vite) y en las pruebas (node + fs).
 */

export type TipoPregunta = 'boolean' | 'opcion' | 'opcion_multiple' | 'numero' | 'fecha' | 'texto';

export interface OpcionPregunta {
  valor: string;
  etiqueta: string;
}

/** Tipo de efecto que una respuesta puede generar (§5, §5.16). */
export type TipoEfecto = 'alerta' | 'nota' | 'prueba' | 'clase_riesgo' | 'asa' | 'regla' | 'hecho';
/** Gravedad de una alerta (coincide con Alerta.gravedad del dominio). */
export type GravedadEfecto = 'roja' | 'amarilla' | 'informativa';

/**
 * Codificación del efecto clínico de una respuesta (decisión del servicio, §5.16):
 * deja explícito, junto a la pregunta, qué alerta / nota / prueba / clase de riesgo /
 * ASA / regla genera cada respuesta. Es documentación trazable (se muestra en
 * CONTENIDO_CLINICO.md) y la comprueba un test de cobertura; el motor sigue
 * calculando el efecto en su capa correspondiente.
 */
/**
 * Condición estructurada y evaluable de un efecto (§5.16). El texto `cuando` sigue
 * siendo la traza legible (CONTENIDO_CLINICO.md); `si` es la forma que el motor
 * ejecuta para decidir si el efecto se dispara. Se evalúa sobre la respuesta de la
 * pregunta a la que pertenece el efecto. Un solo operador por condición.
 */
export interface CondicionEfecto {
  /** La respuesta (opción/boolean) es igual a este valor. */
  igual?: string | number | boolean;
  /** La respuesta (opción) está en esta lista. */
  enLista?: Array<string | number | boolean>;
  /** La respuesta (opción_multiple) contiene alguna de estas opciones. */
  contieneAlguno?: string[];
  /** La respuesta (número) es estrictamente mayor que este umbral. */
  mayorQue?: number;
  /** La respuesta (número) es mayor o igual que este umbral. */
  mayorIgualQue?: number;
  /** La respuesta (fecha ISO) está dentro de los últimos N meses respecto a la intervención (o "hoy"). */
  recienteMeses?: number;
}

export interface EfectoRespuesta {
  /** Respuesta que dispara el efecto, en lenguaje llano (p. ej. "= mal", "> 8,5 %", "= sí", "AINE/aspirina"). */
  cuando: string;
  tipo: TipoEfecto;
  /** Gravedad, solo para tipo 'alerta'. */
  gravedad?: GravedadEfecto;
  /** Descripción llana del efecto (mensaje de la alerta/nota, prueba solicitada, clase, ASA mínimo…). */
  efecto: string;
  /** Sección del documento fuente que lo respalda (p. ej. "§5.16.1", "§7.3"). */
  fuente?: string;
  /**
   * Condición estructurada evaluable (§5.16). Si está presente en un efecto de tipo
   * 'alerta' o 'nota', el motor emite el efecto cuando se cumple. Si falta, el efecto
   * es solo descriptivo (lo calcula otra capa). El texto `cuando` es siempre la traza.
   */
  si?: CondicionEfecto;
}

/** Condición de visibilidad de una pregunta según la respuesta a otra. */
export interface CondicionVisible {
  /** id de la pregunta de la que depende. */
  pregunta: string;
  /** Visible si la respuesta es igual a este valor (boolean/opcion). */
  igual?: string | number | boolean;
  /** Visible si la respuesta (opción) está en esta lista. */
  enLista?: string[];
}

export interface PreguntaModulo {
  id: string;
  etiqueta: string;
  tipo: TipoPregunta;
  /** Opciones para 'opcion' y 'opcion_multiple'. */
  opciones?: OpcionPregunta[];
  /** Unidad para 'numero' (p. ej. "mg/dL", "%"). */
  unidad?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Texto del modo guiado (§5b.4): "¿Por qué preguntamos esto?". */
  porque?: string;
  /** Visibilidad condicional (se muestra solo si se cumple). */
  visibleSi?: CondicionVisible;
  /** Efectos clínicos que generan las respuestas de esta pregunta (§5.16). */
  genera?: EfectoRespuesta[];
}

export interface ModuloPatologia {
  /** id del módulo; coincide con la casilla del paso 7 que lo activa. */
  id: string;
  titulo: string;
  fuente: string;
  preguntas: PreguntaModulo[];
}

// —————————————————— Validación (§3, R2.3.1) ——————————————————

export interface ErrorModulo {
  fichero: string;
  campo?: string;
  mensaje: string;
}

const TIPOS = new Set<TipoPregunta>(['boolean', 'opcion', 'opcion_multiple', 'numero', 'fecha', 'texto']);
const TIPOS_EFECTO = new Set<TipoEfecto>(['alerta', 'nota', 'prueba', 'clase_riesgo', 'asa', 'regla', 'hecho']);
const GRAVEDADES_EFECTO = new Set<GravedadEfecto>(['roja', 'amarilla', 'informativa']);

/** Valida un objeto de módulo ya parseado. `fichero` se usa para localizar el error. */
export function validarModulo(obj: unknown, fichero: string): ErrorModulo[] {
  const errores: ErrorModulo[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return [{ fichero, mensaje: 'el módulo no es un objeto JSON válido' }];
  }
  const m = obj as Record<string, unknown>;
  if (typeof m.id !== 'string' || m.id.trim() === '') errores.push({ fichero, campo: 'id', mensaje: 'id de módulo ausente o vacío' });
  if (typeof m.titulo !== 'string' || m.titulo.trim() === '') errores.push({ fichero, campo: 'titulo', mensaje: 'titulo ausente' });
  if (!Array.isArray(m.preguntas)) {
    errores.push({ fichero, campo: 'preguntas', mensaje: 'preguntas debe ser una lista' });
    return errores;
  }

  const idsPregunta = new Set<string>();
  for (const [i, p] of (m.preguntas as unknown[]).entries()) {
    const donde = `preguntas[${i}]`;
    if (typeof p !== 'object' || p === null) {
      errores.push({ fichero, campo: donde, mensaje: 'la pregunta no es un objeto' });
      continue;
    }
    const q = p as Record<string, unknown>;
    if (typeof q.id !== 'string' || q.id.trim() === '') {
      errores.push({ fichero, campo: donde, mensaje: 'pregunta sin id' });
    } else if (idsPregunta.has(q.id)) {
      errores.push({ fichero, campo: `${donde}.id`, mensaje: `id de pregunta duplicado: "${q.id}"` });
    } else {
      idsPregunta.add(q.id);
    }
    if (typeof q.etiqueta !== 'string' || q.etiqueta.trim() === '') {
      errores.push({ fichero, campo: `${donde}.etiqueta`, mensaje: 'pregunta sin etiqueta' });
    }
    if (typeof q.tipo !== 'string' || !TIPOS.has(q.tipo as TipoPregunta)) {
      errores.push({ fichero, campo: `${donde}.tipo`, mensaje: `tipo inválido: "${String(q.tipo)}"` });
    }
    if ((q.tipo === 'opcion' || q.tipo === 'opcion_multiple')) {
      if (!Array.isArray(q.opciones) || q.opciones.length === 0) {
        errores.push({ fichero, campo: `${donde}.opciones`, mensaje: `el tipo "${String(q.tipo)}" requiere opciones` });
      } else {
        for (const [j, o] of (q.opciones as unknown[]).entries()) {
          const oo = o as Record<string, unknown>;
          if (typeof oo?.valor !== 'string' || typeof oo?.etiqueta !== 'string') {
            errores.push({ fichero, campo: `${donde}.opciones[${j}]`, mensaje: 'opción sin valor/etiqueta' });
          }
        }
      }
    }
    if (q.visibleSi !== undefined) {
      const vs = q.visibleSi as Record<string, unknown>;
      if (typeof vs?.pregunta !== 'string') {
        errores.push({ fichero, campo: `${donde}.visibleSi`, mensaje: 'visibleSi requiere "pregunta"' });
      }
    }
    if (q.genera !== undefined) {
      if (!Array.isArray(q.genera)) {
        errores.push({ fichero, campo: `${donde}.genera`, mensaje: 'genera debe ser una lista' });
      } else {
        for (const [j, g] of (q.genera as unknown[]).entries()) {
          const gg = g as Record<string, unknown>;
          const dondeG = `${donde}.genera[${j}]`;
          if (typeof gg?.cuando !== 'string' || gg.cuando.trim() === '') {
            errores.push({ fichero, campo: dondeG, mensaje: 'efecto sin "cuando"' });
          }
          if (typeof gg?.efecto !== 'string' || gg.efecto.trim() === '') {
            errores.push({ fichero, campo: dondeG, mensaje: 'efecto sin "efecto"' });
          }
          if (typeof gg?.tipo !== 'string' || !TIPOS_EFECTO.has(gg.tipo as TipoEfecto)) {
            errores.push({ fichero, campo: `${dondeG}.tipo`, mensaje: `tipo de efecto inválido: "${String(gg?.tipo)}"` });
          }
          if (gg?.tipo === 'alerta' && (typeof gg?.gravedad !== 'string' || !GRAVEDADES_EFECTO.has(gg.gravedad as GravedadEfecto))) {
            errores.push({ fichero, campo: `${dondeG}.gravedad`, mensaje: 'una alerta requiere gravedad (roja/amarilla/informativa)' });
          }
          // Condición estructurada opcional (`si`): exactamente un operador (§5.16).
          if (gg?.si !== undefined) {
            if (typeof gg.si !== 'object' || gg.si === null) {
              errores.push({ fichero, campo: `${dondeG}.si`, mensaje: 'si debe ser un objeto de condición' });
            } else {
              const ops = ['igual', 'enLista', 'contieneAlguno', 'mayorQue', 'mayorIgualQue', 'recienteMeses'];
              const presentes = ops.filter((k) => (gg.si as Record<string, unknown>)[k] !== undefined);
              if (presentes.length !== 1) {
                errores.push({ fichero, campo: `${dondeG}.si`, mensaje: `una condición requiere exactamente un operador (tiene ${presentes.length})` });
              }
            }
          }
        }
      }
    }
  }
  return errores;
}

/**
 * Carga y valida un conjunto de módulos ya leídos (mapa fichero → objeto JSON).
 * Lanza si alguno es inválido (no se permite empezar con datos corruptos, §3).
 */
export function cargarModulos(objetosPorFichero: Record<string, unknown>): ModuloPatologia[] {
  const errores: ErrorModulo[] = [];
  const modulos: ModuloPatologia[] = [];
  const idsVistos = new Set<string>();
  for (const [fichero, obj] of Object.entries(objetosPorFichero)) {
    const errs = validarModulo(obj, fichero);
    if (errs.length > 0) {
      errores.push(...errs);
      continue;
    }
    const m = obj as ModuloPatologia;
    if (idsVistos.has(m.id)) {
      errores.push({ fichero, campo: 'id', mensaje: `id de módulo duplicado entre ficheros: "${m.id}"` });
    }
    idsVistos.add(m.id);
    modulos.push(m);
  }
  if (errores.length > 0) {
    const detalle = errores.map((e) => `  - ${e.fichero}${e.campo ? ` [${e.campo}]` : ''}: ${e.mensaje}`).join('\n');
    throw new Error(`Módulos de patología con errores; no se puede empezar:\n${detalle}`);
  }
  return modulos;
}

// —————————————————— Respuestas de la entrevista ——————————————————

export type ValorRespuesta = boolean | string | string[] | number | null;
/** Respuestas de un módulo: preguntaId → valor. */
export type RespuestasModulo = Record<string, ValorRespuesta>;
/** Respuestas de todos los módulos activos: moduloId → respuestas. */
export type RespuestasModulos = Record<string, RespuestasModulo>;

/** ¿Debe mostrarse la pregunta según sus condiciones de visibilidad? */
export function preguntaVisible(p: PreguntaModulo, respuestas: RespuestasModulo): boolean {
  if (!p.visibleSi) return true;
  const valor = respuestas[p.visibleSi.pregunta];
  if (p.visibleSi.enLista !== undefined) {
    return typeof valor === 'string' && p.visibleSi.enLista.includes(valor);
  }
  if (p.visibleSi.igual !== undefined) {
    return valor === p.visibleSi.igual;
  }
  // Sin igual/enLista: visible si hay cualquier respuesta "verdadera".
  return valor === true || (typeof valor === 'string' && valor !== '');
}
