/**
 * Dispositivos cardiacos implantables (§5.1 bis) — British Heart Rhythm Society
 * (Thomas et al., Anaesthesia 2022;77:808-17). A partir del tipo de dispositivo,
 * su dependencia, la zona del procedimiento y el fabricante, produce:
 *   - notas técnicas para el anestesiólogo (recomendaciones de la tabla 1 + imán),
 *   - puntos de validación (§13 bis, amarillos) cuando procede coordinar con la
 *     unidad de arritmias / consulta de dispositivos.
 *
 * Función PURA y testeable. La UI (Salidas) la invoca y vuelca las notas en «Notas
 * técnicas» y los puntos en la sección de validación clínica.
 */

export type TipoDispositivo =
  | 'marcapasos'
  | 'marcapasos_sin_cables'
  | 'dai'
  | 'dai_subcutaneo'
  | 'trc_p'
  | 'trc_d'
  | 'holter'
  | 'no_lo_sabe';

export type Dependencia = 'si' | 'no' | 'no_lo_sabe';
export type ZonaDispositivo =
  | 'supraumbilical' | 'infraumbilical' | 'cardiaca' | 'ocular' | 'endoscopia' | 'dental' | 'litotricia' | 'neurocirugia';
export type Fabricante = 'medtronic' | 'boston' | 'biotronik' | 'abbott' | 'microport' | 'otro' | 'no_lo_sabe';
export type Bateria = 'no' | 'si' | 'no_lo_sabe';

export interface EntradaDispositivo {
  tipo?: TipoDispositivo;
  dependiente?: Dependencia;
  zona?: ZonaDispositivo;
  fabricante?: Fabricante;
  /** Fecha de la última revisión (ISO) o null si no consta. */
  ultimaRevision?: string | null;
  bateriaAgotandose?: Bateria;
  ensayoClinico?: boolean;
}

export interface PuntoDispositivo {
  id: string;
  motivo: string;
  fuente: string;
}

export interface ResultadoDispositivo {
  notas: string[];
  puntos: PuntoDispositivo[];
}

const FUENTE = '§5.1 bis (BHRS 2022)';
const COORDINAR = ' Coordinar con la unidad de arritmias o la consulta de dispositivos.';

function esDai(t?: TipoDispositivo): boolean {
  return t === 'dai' || t === 'dai_subcutaneo' || t === 'trc_d';
}
function tieneMarcapasos(t?: TipoDispositivo): boolean {
  // Todos tienen función de marcapasos salvo el Holter y el DAI subcutáneo (que no estimula).
  return t !== undefined && t !== 'holter' && t !== 'dai_subcutaneo';
}
function meses(desde: string | null | undefined, hoy: Date): number | null {
  if (!desde) return null;
  const d = new Date(`${desde}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return (hoy.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

/** Texto de colocación del imán según el fabricante. */
function notaImanFabricante(f?: Fabricante): string | null {
  switch (f) {
    case 'medtronic':
    case 'boston':
      return 'Imán centrado sobre el generador.';
    case 'biotronik':
      return 'Imán centrado sobre el generador; su efecto se pierde a las 8 h: retirarlo y volver a colocarlo.';
    case 'abbott':
      return 'Abbott (St. Jude): imán desplazado, con el borde del anillo sobre el extremo superior o inferior del generador.';
    case 'microport':
      return 'MicroPort (LivaNova/Sorin): imán descentrado, evitando la cabeza del dispositivo.';
    default:
      return null;
  }
}

/**
 * Recomendación por tipo de dispositivo, dependencia y zona (tabla 1 de la guía).
 * Devuelve las notas específicas de la combinación.
 */
function notasPorTabla(e: EntradaDispositivo): string[] {
  const notas: string[] = [];
  const t = e.tipo;
  const zona = e.zona;
  const dep = e.dependiente === 'si' || e.dependiente === 'no_lo_sabe';

  if (t === 'holter') {
    notas.push('Holter implantable o registrador: sin precauciones especiales. Opcional: revisar el dispositivo antes y borrar la memoria después (las interferencias pueden registrarse como taquicardias).');
    return notas;
  }

  if (zona === 'cardiaca') {
    notas.push('Cirugía cardiaca: reprogramación probable del marcapasos; en el DAI, desactivación con reprogramación durante la cirugía.');
  } else if (zona === 'dental') {
    notas.push('Odontología: ninguna medida especial salvo que se use bisturí eléctrico.');
  } else if (zona === 'litotricia') {
    if (esDai(t)) notas.push('Litotricia con DAI: desactivar las terapias o colocar el imán durante la sesión; no enfocar la onda cerca del generador.');
    else notas.push('Litotricia con marcapasos: revisar el dispositivo en el mes siguiente; no enfocar la onda cerca del generador.');
  } else if (zona === 'neurocirugia' && esDai(t)) {
    notas.push('Neurocirugía con DAI: preferir la DESACTIVACIÓN con programador al imán (un movimiento por una descarga sería peligroso).');
  } else if (esDai(t)) {
    // DAI / TRC-D por zona (supraumbilical/ocular/endoscopia = interferencia probable; infraumbilical = baja).
    if (zona === 'supraumbilical' || zona === 'ocular' || zona === 'endoscopia') {
      notas.push('DAI/TRC-D en zona de interferencia probable: desactivar las terapias del DAI con programador o con imán.' +
        (dep ? ' Si es dependiente de la estimulación: desactivar y considerar reprogramar a frecuencia fija; el imán solo es alternativa si no se prevé bisturí eléctrico prolongado.' : ''));
    } else {
      notas.push('DAI/TRC-D en cirugía de baja interferencia (infraumbilical): monitorizar para detectar inhibición o terapias inapropiadas; es razonable no desactivar el DAI; tener un imán disponible.');
    }
  } else if (tieneMarcapasos(t)) {
    // Marcapasos / TRC-P por zona.
    if (zona === 'supraumbilical' || zona === 'ocular' || zona === 'endoscopia') {
      notas.push('Marcapasos en zona de interferencia probable: si NO es dependiente, monitorizar para detectar inhibición, sin reprogramar.' +
        (dep ? ' Si es dependiente, considerar reprogramar a modo asíncrono (frecuencia fija) si se prevé bisturí eléctrico prolongado.' : ''));
    } else {
      notas.push('Marcapasos en cirugía infraumbilical: monitorizar, sin reprogramar.' + (dep ? ' Si es dependiente, tener un imán clínico disponible.' : ''));
    }
  }

  // Peculiaridades del tipo.
  if (t === 'marcapasos_sin_cables') notas.push('Marcapasos sin cables (tipo Micra): NO responde al imán; cualquier cambio requiere su programador específico.');
  if (t === 'dai_subcutaneo') notas.push('DAI subcutáneo (S-ICD): no proporciona estimulación; el generador está en la axila y el imán se coloca ahí.');

  return notas;
}

/** Precauciones generales (siempre que haya función de marcapasos o DAI). */
function notasGenerales(e: EntradaDispositivo): string[] {
  if (e.tipo === 'holter') return [];
  const notas = [
    'ECG desde el inicio (comprobar también pulso u oximetría: algunos monitores cuentan mal los latidos estimulados).',
    'Desfibrilador externo y marcapasos transcutáneo disponibles.',
    'Parches de desfibrilación lo más lejos posible del generador, preferiblemente anteroposteriores, nunca encima.',
    'Preferir bisturí bipolar; si es monopolar, en ráfagas cortas y a la menor energía posible.',
    'Placa de retorno colocada de modo que el trayecto de la corriente quede lejos del generador y los cables; no usar placas bajo el cuerpo.',
    'Evitar paños quirúrgicos magnéticos sobre el tórax; si se usa imán, fijarlo con esparadrapo.',
  ];
  if (esDai(e.tipo)) {
    notas.push('Si se desactiva el DAI o se reprograma: monitorización ECG continua y desfibrilador externo con parches hasta la reactivación; reactivar en la unidad de recuperación cuanto antes; nunca dar el alta sin reactivarlo. La responsabilidad de reactivarlo es del equipo quirúrgico.');
  }
  const iman = notaImanFabricante(e.fabricante);
  if (iman) notas.push(`Colocación del imán: ${iman}`);
  return notas;
}

/** Puntos de validación (§6.4): amarillos, «validar antes de la intervención». */
function puntosValidacion(e: EntradaDispositivo, hoy: Date): PuntoDispositivo[] {
  const puntos: PuntoDispositivo[] = [];
  const t = e.tipo;
  const zona = e.zona;
  if (t === 'holter' || t === undefined) return puntos;

  const zonaInterferenciaDai = zona === 'supraumbilical' || zona === 'cardiaca' || zona === 'ocular' || zona === 'endoscopia' || zona === 'litotricia';
  if (esDai(t) && zonaInterferenciaDai) {
    puntos.push({ id: 'dispositivo_dai_interferencia', motivo: 'DAI o TRC-D en cirugía con interferencia electromagnética probable: coordinar la desactivación/reprogramación.' + COORDINAR, fuente: FUENTE });
  }

  const dep = e.dependiente === 'si' || e.dependiente === 'no_lo_sabe';
  const zonaMarcapasos = zona === 'supraumbilical' || zona === 'cardiaca' || zona === 'endoscopia';
  if (!esDai(t) && tieneMarcapasos(t) && dep && zonaMarcapasos) {
    puntos.push({ id: 'dispositivo_marcapasos_dependiente', motivo: 'Marcapasos con dependencia «sí» o «no lo sabe» en cirugía con interferencia probable: planificar modo asíncrono/imán.' + COORDINAR, fuente: FUENTE });
  }

  // Revisión atrasada: marcapasos > 12 meses; DAI/TRC > 6 meses; o fecha desconocida.
  const m = meses(e.ultimaRevision ?? null, hoy);
  const limite = esDai(t) || t === 'trc_p' ? 6 : 12;
  if (m === null || m > limite) {
    puntos.push({ id: 'dispositivo_revision_atrasada', motivo: `Última revisión del dispositivo ${m === null ? 'desconocida' : `hace más de ${limite} meses`}: revisarlo antes de la cirugía.` + COORDINAR, fuente: FUENTE });
  }

  if (e.bateriaAgotandose === 'si' || e.bateriaAgotandose === 'no_lo_sabe') {
    puntos.push({ id: 'dispositivo_bateria', motivo: 'Batería del dispositivo que se está agotando o «no lo sabe»: comprobar el estado antes de la cirugía.' + COORDINAR, fuente: FUENTE });
  }
  if (e.ensayoClinico === true) {
    puntos.push({ id: 'dispositivo_ensayo', motivo: 'Dispositivo en ensayo clínico: puede comportarse de forma no estándar.' + COORDINAR, fuente: FUENTE });
  }
  return puntos;
}

/** Evalúa el dispositivo cardiaco implantable y devuelve notas y puntos (§5.1 bis). */
export function evaluarDispositivoCardiaco(e: EntradaDispositivo, hoy: Date = new Date()): ResultadoDispositivo {
  if (!e.tipo) return { notas: [], puntos: [] };
  return {
    notas: [...notasPorTabla(e), ...notasGenerales(e)],
    puntos: puntosValidacion(e, hoy),
  };
}
