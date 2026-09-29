/**
 * Contenido estructurado del QR del PACIENTE y recálculo con fecha —
 * docs/documento_fuente.md §8.16 y §11.
 *
 * El QR lleva, para cada fármaco, todo lo necesario para recalcular las
 * instrucciones cuando el paciente introduzca (o cambie) la fecha, SIN volver al
 * estado clínico: tipo de plazo, duración, horas habituales de toma, si admite
 * adelanto y si es anticoagulante; además del teléfono del servicio, la fecha de
 * la intervención (si se conoce) y la caducidad. La futura vista del paciente solo
 * tiene que llamar a `recalcularHoja` sobre el contenido decodificado.
 */
import type { PautaHoraria } from '../../fechas/ultimaToma.ts';
import {
  ultimaTomaPorHoras,
  ultimaTomaPorDias,
  textoUltimaToma,
  textoUltimaTomaDias,
} from '../../fechas/ultimaToma.ts';
import { plazoNoAlcanzable } from '../../fechas/plazos.ts';

/** Tipo de plazo de un fármaco en el QR (claves cortas para el payload). */
export type TipoPlazo =
  | 'dias' // suspender N días (última toma el día N+1 antes)
  | 'horas' // última toma N horas antes (anticoagulantes: puede adelantar)
  | 'no_dia_iq' // no tomar el día de la intervención (la última toma es el día previo)
  | 'sin_plazo'; // mantener / consultar / sin cálculo de fecha

/** Un fármaco en el QR del paciente, con todo lo necesario para recalcular (§8.16d). */
export interface FarmacoQr {
  /** Nombre comercial. */
  n: string;
  /** Tipo de plazo. */
  pt: TipoPlazo;
  /** Duración del plazo (días para 'dias', horas para 'horas'); ausente si no aplica. */
  pd?: number;
  /** Horas habituales de toma ("HH:MM"). */
  hh: string[];
  /** Admite adelanto de la toma a la hora límite (solo anticoagulantes). */
  ad: boolean;
  /** Es anticoagulante. */
  ac: boolean;
  /** Requiere confirmación del anestesiólogo. */
  rc: boolean;
  /** Texto fijo del paciente para fármacos sin plazo (mantener/consultar). */
  tx?: string;
}

/** Datos del paciente que viajan en el QR (campo `d` del Payload, §8.16d). */
export interface ContenidoQrPaciente {
  /** Teléfono del servicio (para el mensaje de plazo no cumplible). */
  tel: string;
  /** Fecha/hora de la intervención (epoch ms) o null si aún no se conoce. */
  fi: number | null;
  /** Fármacos. */
  far: FarmacoQr[];
}

/** Instrucción recalculada para un fármaco. */
export interface InstruccionPaciente {
  nombre: string;
  /** Texto para el paciente (margen si no hay fecha; fecha + margen si la hay). */
  texto: string;
  /** true si con la fecha dada el plazo ya no se puede cumplir (§8.16e). */
  plazoNoCumplible: boolean;
}

// ————————————————————— textos de margen (sin fecha, §8.16b) —————————————————————

function textoMargenSinFecha(f: FarmacoQr): string {
  switch (f.pt) {
    case 'dias':
      return `No lo tome los ${f.pd} días anteriores a la intervención ni ese mismo día.`;
    case 'horas':
      return `Su última toma debe ser como mínimo ${f.pd} horas antes de la hora de la intervención.`;
    case 'no_dia_iq':
      return 'No lo tome el día de la intervención.';
    case 'sin_plazo':
      return f.tx ?? '';
  }
}

/** Texto del margen entre paréntesis para añadir tras la fecha calculada (§8.16c). */
function coletillaMargen(f: FarmacoQr): string {
  switch (f.pt) {
    case 'dias':
      return ` (como mínimo ${f.pd} días antes de la intervención)`;
    case 'horas':
      return ` (como mínimo ${f.pd} horas antes de la intervención)`;
    default:
      return '';
  }
}

// ————————————————————— caducidad del QR (§8.16f) —————————————————————

const MS_DIA = 86_400_000;

/**
 * Caducidad (epoch ms) del QR del paciente:
 *  - Sin fecha de intervención: creación + diasSinFecha (90 por defecto).
 *  - Con fecha: fecha de intervención + diasConFecha (30 por defecto). Si el
 *    paciente introduce una fecha nueva, se recalcula sobre ella.
 */
export function caducidadQrPaciente(
  creacion: Date,
  fechaIntervencion: Date | null,
  diasConFecha = 30,
  diasSinFecha = 90,
): number {
  if (fechaIntervencion === null) {
    return creacion.getTime() + diasSinFecha * MS_DIA;
  }
  return fechaIntervencion.getTime() + diasConFecha * MS_DIA;
}

// ————————————————————— recálculo (§8.16) —————————————————————

/**
 * Recalcula todas las instrucciones del paciente a partir del contenido del QR.
 * @param contenido contenido decodificado del QR.
 * @param fechaIntervencion fecha/hora de la intervención; si es null, se usa la del
 *        contenido (contenido.fi). Si ambas son null → textos de margen (sin fecha).
 */
export function recalcularHoja(
  contenido: ContenidoQrPaciente,
  fechaIntervencion: Date | null = null,
  ahora: Date = new Date(),
): InstruccionPaciente[] {
  const fiMs = fechaIntervencion ? fechaIntervencion.getTime() : contenido.fi;
  const iv = fiMs !== null ? new Date(fiMs) : null;

  return contenido.far.map((f) => {
    // Sin fecha: instrucción como margen, sin adelantos (§8.16b).
    if (iv === null) {
      return { nombre: f.n, texto: textoMargenSinFecha(f), plazoNoCumplible: false };
    }
    return recalcularFarmaco(f, iv, contenido.tel, ahora);
  });
}

function recalcularFarmaco(f: FarmacoQr, iv: Date, telefono: string, ahora: Date): InstruccionPaciente {
  // Fármacos sin plazo calculable: texto fijo (mantener/consultar).
  if (f.pt === 'sin_plazo') {
    return { nombre: f.n, texto: f.tx ?? '', plazoNoCumplible: false };
  }

  const pauta: PautaHoraria = { horas: f.hh };

  let ultima: Date;
  let texto: string;
  if (f.pt === 'dias') {
    ultima = ultimaTomaPorDias(iv, f.pd ?? 0, pauta);
    texto = textoUltimaTomaDias(ultima);
  } else if (f.pt === 'horas') {
    const r = ultimaTomaPorHoras(iv, f.pd ?? 0, pauta, f.ad);
    ultima = r.ultimaToma;
    texto = textoUltimaToma(r);
  } else {
    // no_dia_iq: última toma el día previo a la hora habitual más tardía.
    ultima = ultimaTomaPorDias(iv, 0, pauta);
    texto = `No lo tome el día de la intervención.`;
  }

  // Plazo ya no cumplible con esta fecha (§8.16e): no se da pauta, se remite al teléfono.
  if (plazoNoAlcanzable(ultima, ahora)) {
    return {
      nombre: f.n,
      texto: `Con esta fecha ya no es posible seguir la pauta de ${f.n}. Llame al ${telefono} lo antes posible.`,
      plazoNoCumplible: true,
    };
  }

  // Con fecha: la instrucción con fecha + el margen entre paréntesis (§8.16c).
  return { nombre: f.n, texto: `${texto}${coletillaMargen(f)}`, plazoNoCumplible: false };
}
