/**
 * Cuadro de mando de uso (§14.3). Guarda en el localStorage del dispositivo un
 * contador de entrevistas SIN ningún dato clínico ni identificador: fecha, hora de
 * inicio, duración, modalidad, tipo de paciente y riesgo quirúrgico. Las entrevistas
 * del modo entrenamiento NO se cuentan.
 */
export type TipoPaciente = 'adulto' | 'pediatrico' | 'obstetrica';

export interface EntradaUso {
  /** Fecha de inicio (ISO yyyy-mm-dd). */
  fecha: string;
  /** Hora de inicio (HH:MM). */
  horaInicio: string;
  /** Duración de la entrevista en segundos. */
  duracionSeg: number;
  modalidad: 'presencial' | 'telefonica';
  tipoPaciente: TipoPaciente;
  riesgoQuirurgico: 'bajo' | 'intermedio' | 'alto';
}

const CLAVE = 'aneshealth_uso';

function disponible(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function leerUso(): EntradaUso[] {
  if (!disponible()) return [];
  try {
    const crudo = localStorage.getItem(CLAVE);
    const arr = crudo ? (JSON.parse(crudo) as unknown) : [];
    return Array.isArray(arr) ? (arr as EntradaUso[]) : [];
  } catch {
    return [];
  }
}

export function registrarUso(e: EntradaUso): void {
  if (!disponible()) return;
  try {
    const arr = leerUso();
    arr.push(e);
    localStorage.setItem(CLAVE, JSON.stringify(arr));
  } catch {
    /* almacenamiento no disponible: se ignora (el contador es best-effort) */
  }
}

export function borrarUso(): void {
  if (!disponible()) return;
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* ignorar */
  }
}

/** Exporta las entradas a CSV (separador ';'). */
export function usoACsv(entradas: EntradaUso[]): string {
  const cab = 'fecha;hora_inicio;duracion_seg;modalidad;tipo_paciente;riesgo_quirurgico';
  const filas = entradas.map((e) =>
    [e.fecha, e.horaInicio, e.duracionSeg, e.modalidad, e.tipoPaciente, e.riesgoQuirurgico].join(';'),
  );
  return [cab, ...filas].join('\n') + '\n';
}

/** Clave ISO de la semana (año-Www) para agrupar. */
export function claveSemana(fechaIso: string): string {
  const d = new Date(`${fechaIso}T00:00`);
  const jueves = new Date(d);
  jueves.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const primero = new Date(jueves.getFullYear(), 0, 1);
  const semana = 1 + Math.round(((jueves.getTime() - primero.getTime()) / 86_400_000 - 3 + ((primero.getDay() + 6) % 7)) / 7);
  return `${jueves.getFullYear()}-S${String(semana).padStart(2, '0')}`;
}

/** Agrupa por una clave derivada de la fecha y devuelve pares [clave, conteo] ordenados. */
export function agrupar(entradas: EntradaUso[], clave: (e: EntradaUso) => string): Array<[string, number]> {
  const mapa = new Map<string, number>();
  for (const e of entradas) mapa.set(clave(e), (mapa.get(clave(e)) ?? 0) + 1);
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
