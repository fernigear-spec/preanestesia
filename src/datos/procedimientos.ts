/**
 * Carga del catálogo de procedimientos (datos/procedimientos.csv) para la interfaz.
 * El CSV se importa como texto con `?raw` (Vite) y se parsea con parseCsv.
 * Cada procedimiento aporta sus riesgos por defecto (R3.2.1, Anexo B).
 */
import { parseCsv } from './csv.ts';
import type { RiesgoCardiovascular, RiesgoHemorragico, GrupoOftalmologico } from '../dominio/tipos.ts';
// El CSV vive fuera de src/; Vite lo carga como cadena con el sufijo ?raw.
import csvProcedimientos from '../../datos/procedimientos.csv?raw';

/** Zona del procedimiento respecto a un dispositivo cardiaco implantable (§5.1 bis). */
export type ZonaDispositivo =
  | 'supraumbilical'
  | 'infraumbilical'
  | 'cardiaca'
  | 'ocular'
  | 'endoscopia'
  | 'dental'
  | 'litotricia'
  | 'neurocirugia';

export const ZONAS_DISPOSITIVO: ZonaDispositivo[] = [
  'supraumbilical', 'infraumbilical', 'cardiaca', 'ocular', 'endoscopia', 'dental', 'litotricia', 'neurocirugia',
];

export interface Procedimiento {
  id: string;
  nombre: string;
  especialidad: string;
  riesgoCardiovascular: RiesgoCardiovascular;
  riesgoHemorragico: RiesgoHemorragico;
  grupoOftalmologico: GrupoOftalmologico;
  /** Técnica neuroaxial o bloqueo profundo probable (R3.2.3). */
  neuroaxialProbable: boolean;
  duracionMayor30min: boolean;
  riesgoTromboticoAlto: boolean;
  /** Cirugía en espacio cerrado: intracraneal o del canal medular (§8.3). */
  espacioCerrado: boolean;
  /** Cirugía de retina (vitrectomía, desprendimiento, cerclaje escleral): muy alto riesgo de sangrado para el AAS (§8.3). */
  retina: boolean;
  /** Procedimiento del embarazo (cesárea, cerclaje, legrado obstétrico…). */
  obstetrico: boolean;
  /** El bloqueo locorregional es de hombro o brazo (añade el párrafo propio en §8.17). */
  bloqueoMiembroSuperior: boolean;
  /** Zona respecto a un dispositivo cardiaco implantable (§5.1 bis). */
  zonaDispositivo?: ZonaDispositivo;
}

function si(v: string | undefined): boolean {
  return (v ?? '').trim().toLowerCase() === 'si';
}

export function cargarProcedimientos(csvTexto: string = csvProcedimientos): Procedimiento[] {
  const { filas } = parseCsv(csvTexto);
  return filas.map((f) => {
    const v = f.valores;
    return {
      id: v.id ?? '',
      nombre: v.procedimiento ?? '',
      especialidad: v.especialidad ?? '',
      riesgoCardiovascular: (v.riesgo_cardiovascular ?? 'intermedio') as RiesgoCardiovascular,
      riesgoHemorragico: (v.riesgo_hemorragico ?? 'bajo') as RiesgoHemorragico,
      grupoOftalmologico: (v.grupo_oftalmologico ?? 'no_aplica') as GrupoOftalmologico,
      neuroaxialProbable: si(v.neuroaxial_o_bloqueo_profundo_probable),
      duracionMayor30min: si(v.duracion_mayor_30min),
      riesgoTromboticoAlto: si(v.riesgo_trombotico_alto),
      espacioCerrado: si(v.espacio_cerrado),
      retina: si(v.retina),
      obstetrico: si(v.obstetrico),
      bloqueoMiembroSuperior: si(v.bloqueo_miembro_superior),
      ...(v.zona_dispositivo && (ZONAS_DISPOSITIVO as string[]).includes(v.zona_dispositivo.trim())
        ? { zonaDispositivo: v.zona_dispositivo.trim() as ZonaDispositivo }
        : {}),
    };
  });
}

/**
 * Busca procedimientos por texto (sin distinguir mayúsculas ni acentos) sobre
 * el nombre y la especialidad. Devuelve como máximo `limite` resultados.
 */
export function buscarProcedimientos(
  procedimientos: Procedimiento[],
  consulta: string,
  limite = 20,
): Procedimiento[] {
  const q = normalizarBusqueda(consulta);
  if (q === '') return [];
  const out: Procedimiento[] = [];
  for (const p of procedimientos) {
    if (normalizarBusqueda(`${p.nombre} ${p.especialidad}`).includes(q)) {
      out.push(p);
      if (out.length >= limite) break;
    }
  }
  return out;
}

function normalizarBusqueda(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .trim();
}
