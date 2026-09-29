/**
 * Cálculo de la última toma permitida según la pauta horaria del paciente —
 * docs/documento_fuente.md §8.0 (v4).
 *
 * Dos tipos de plazo:
 *  - HORAS (ACOD, heparinas, fondaparinux, litio, moclobemida, AINE, dipiridamol,
 *    sulodexida, GP IIb/IIIa): se cuentan hasta la hora de la intervención; una
 *    toma en el límite exacto está permitida.
 *  - DÍAS (AVK, AAS, P2Y12, triflusal, cilostazol, SGLT2, JAK, fitoterapia, IMAO
 *    irreversibles): "suspender N días" = no tomarlo los N días previos ni el día
 *    de la intervención → última toma el día (N+1) previo, a su hora habitual.
 *
 * Regla de adelanto (solo anticoagulantes con plazo en horas): si la primera toma
 * habitual POSTERIOR al límite cae ≤ 10 h después, se adelanta a la hora límite,
 * siempre que quede ≥ la mitad del intervalo habitual desde la toma anterior
 * (6 h en pautas /12 h; 12 h en pautas /24 h). Si no, la última es la anterior
 * permitida. Nunca se atrasa una toma.
 */

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

/** Pauta horaria del paciente: horas "HH:MM" a las que toma el fármaco cada día. */
export interface PautaHoraria {
  /** Horas de toma en un día, p. ej. ['09:00','21:00']. Ordenadas ascendentes. */
  horas: string[];
}

export function fechaLarga(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function horaReloj(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseHora(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return { h: h ?? 0, m: m ?? 0 };
}

/** Todas las tomas (Date) dentro de [desde, hasta] según la pauta, ordenadas. */
function tomasEntre(pauta: PautaHoraria, desde: Date, hasta: Date): Date[] {
  const out: Date[] = [];
  const dia = new Date(desde);
  dia.setHours(0, 0, 0, 0);
  const fin = new Date(hasta);
  while (dia.getTime() <= fin.getTime()) {
    for (const hhmm of pauta.horas) {
      const { h, m } = parseHora(hhmm);
      const t = new Date(dia);
      t.setHours(h, m, 0, 0);
      if (t.getTime() >= desde.getTime() && t.getTime() <= hasta.getTime()) {
        out.push(new Date(t));
      }
    }
    dia.setDate(dia.getDate() + 1);
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Intervalo habitual entre tomas (h), estimado desde la pauta. 24 si una sola toma. */
export function intervaloHabitualHoras(pauta: PautaHoraria): number {
  if (pauta.horas.length <= 1) return 24;
  // Diferencia mínima entre tomas consecutivas del día (aprox. de la pauta).
  const mins = pauta.horas.map((x) => { const { h, m } = parseHora(x); return h * 60 + m; }).sort((a, b) => a - b);
  let min = 24 * 60;
  for (let i = 1; i < mins.length; i++) min = Math.min(min, (mins[i] as number) - (mins[i - 1] as number));
  // También el salto nocturno (última→primera del día siguiente).
  const salto = 24 * 60 - ((mins[mins.length - 1] as number) - (mins[0] as number));
  min = Math.min(min, salto);
  return Math.round(min / 60);
}

export type TipoAdelanto = 'exacta' | 'adelantada' | 'anterior';

export interface ResultadoUltimaToma {
  /** Fecha/hora de la última toma permitida. */
  ultimaToma: Date;
  /** Tipo: exacta (justo en el límite/antes), adelantada, o anterior (no se adelantó). */
  tipo: TipoAdelanto;
  /** Solo si tipo==='adelantada': la hora habitual original que se adelanta. */
  horaOriginal?: Date;
}

/**
 * Última toma permitida para un plazo en HORAS.
 * @param intervencion fecha/hora de la intervención.
 * @param horasPlazo plazo en horas.
 * @param pauta pauta horaria del paciente.
 * @param permitirAdelanto true solo para anticoagulantes (ACOD/heparinas/fondaparinux).
 */
export function ultimaTomaPorHoras(
  intervencion: Date,
  horasPlazo: number,
  pauta: PautaHoraria,
  permitirAdelanto: boolean,
): ResultadoUltimaToma {
  const limite = new Date(intervencion.getTime() - horasPlazo * 3_600_000);

  // Ventana amplia hacia atrás para localizar tomas (30 días).
  const desde = new Date(limite.getTime() - 30 * 86_400_000);

  // Última toma habitual que respeta el límite (<= límite).
  const tomasHastaLimite = tomasEntre(pauta, desde, limite);
  const ultimaPermitida = tomasHastaLimite[tomasHastaLimite.length - 1];

  if (!permitirAdelanto) {
    // No se adelantan tomas: la última permitida es la que cae <= límite.
    return { ultimaToma: ultimaPermitida ?? limite, tipo: 'exacta' };
  }

  // Anticoagulantes: mirar la primera toma POSTERIOR al límite.
  const posteriores = tomasEntre(pauta, new Date(limite.getTime() + 1), new Date(limite.getTime() + 11 * 3_600_000));
  const primeraPosterior = posteriores[0];

  if (primeraPosterior) {
    const horasDespues = (primeraPosterior.getTime() - limite.getTime()) / 3_600_000;
    if (horasDespues <= 10) {
      const intervalo = intervaloHabitualHoras(pauta);
      const margenMin = intervalo / 2; // 6 h en /12 h, 12 h en /24 h
      const desdeAnterior = ultimaPermitida
        ? (limite.getTime() - ultimaPermitida.getTime()) / 3_600_000
        : Infinity;
      if (desdeAnterior >= margenMin) {
        // Se adelanta la toma posterior a la hora límite.
        return { ultimaToma: new Date(limite), tipo: 'adelantada', horaOriginal: primeraPosterior };
      }
    }
  }
  // No se adelanta: la última es la anterior permitida.
  return { ultimaToma: ultimaPermitida ?? limite, tipo: 'anterior' };
}

/**
 * Última toma permitida para un plazo en DÍAS: no tomar los N días previos ni el
 * día de la intervención → última toma el día (N+1) antes de la intervención, a
 * la hora habitual más tardía de la pauta.
 */
export function ultimaTomaPorDias(
  intervencion: Date,
  dias: number,
  pauta: PautaHoraria,
): Date {
  const dia = new Date(intervencion);
  dia.setDate(dia.getDate() - (dias + 1));
  // Hora habitual más tardía.
  const horas = [...pauta.horas].sort();
  const ultima = horas[horas.length - 1] ?? '09:00';
  const { h, m } = parseHora(ultima);
  dia.setHours(h, m, 0, 0);
  return dia;
}

/** Texto para el paciente de una última toma (con día y hora exactos). */
export function textoUltimaToma(r: ResultadoUltimaToma): string {
  if (r.tipo === 'adelantada' && r.horaOriginal) {
    return `El ${fechaLarga(r.ultimaToma)}, tome la dosis a las ${horaReloj(r.ultimaToma)} en lugar de a las ${horaReloj(r.horaOriginal)}. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen.`;
  }
  return `Tome la última dosis el ${fechaLarga(r.ultimaToma)} a las ${horaReloj(r.ultimaToma)}. Después no vuelva a tomarlo hasta que se lo indiquen.`;
}

/** Texto para plazo en días. */
export function textoUltimaTomaDias(ultima: Date): string {
  return `Tome la última dosis el ${fechaLarga(ultima)} a las ${horaReloj(ultima)}. Después no vuelva a tomarlo hasta que se lo indiquen.`;
}
