/**
 * Validador de los ficheros de datos — docs/documento_fuente.md §3 (R2.3).
 * Si algo falla, devuelve errores con fichero, fila y columna, y la aplicación
 * no permite empezar entrevistas (caso 21 §15).
 *
 * PENDIENTE: sustituir por esquemas zod cuando haya acceso a npm. Aquí se hace
 * la validación mínima imprescindible en TypeScript puro (columnas presentes,
 * valores en listas cerradas, referencias de id_regla existentes).
 */
import { parseCsv } from './csv.ts';

export interface ErrorValidacion {
  fichero: string;
  fila?: number;
  columna?: string;
  mensaje: string;
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: ErrorValidacion[];
}

const COLUMNAS_FARMACOS = [
  'id',
  'principios_activos',
  'nombres_comerciales',
  'grupo',
  'subgrupo',
  'pauta_tipica',
  'id_regla',
  'requiere_confirmacion',
  'indicaciones_posibles',
  'fuente',
  'fecha_revision',
  'verificado_cima',
] as const;

const PAUTAS = new Set(['diaria', 'dos_veces_dia', 'semanal', 'mensual', 'ciclica']);
const SI_NO = new Set(['si', 'no']);
const VERIFICADO = new Set(['si', 'pendiente', 'no']);
const VIAS = new Set([
  'oral', 'sublingual', 'subcutanea', 'intramuscular', 'intravenosa', 'transdermica',
  'inhalada', 'colirio', 'intravitrea', 'vaginal', 'intrauterina', 'implante',
]);

const COLUMNAS_PROCEDIMIENTOS = [
  'id',
  'procedimiento',
  'especialidad',
  'riesgo_cardiovascular',
  'riesgo_hemorragico',
  'grupo_oftalmologico',
  'neuroaxial_o_bloqueo_profundo_probable',
  'duracion_mayor_30min',
  'riesgo_trombotico_alto',
] as const;

const RIESGO_CV = new Set(['bajo', 'intermedio', 'alto']);
const RIESGO_HEMO = new Set(['minimo', 'bajo', 'alto']);
const GRUPO_OFTALMO = new Set(['no_aplica', 'riesgo_bajo', 'riesgo_moderado_alto']);
const ZONA_DISPOSITIVO = new Set([
  'supraumbilical', 'infraumbilical', 'cardiaca', 'ocular', 'endoscopia', 'dental', 'litotricia', 'neurocirugia',
]);

/**
 * Valida farmacos.csv contra las reglas conocidas.
 * @param idsReglaConocidas conjunto de ids presentes en reglas_farmacos.json.
 */
export function validarFarmacos(
  csvTexto: string,
  idsReglaConocidas: Set<string>,
): ResultadoValidacion {
  const errores: ErrorValidacion[] = [];
  const fichero = 'datos/farmacos.csv';
  const { columnas, filas } = parseCsv(csvTexto);

  for (const col of COLUMNAS_FARMACOS) {
    if (!columnas.includes(col)) {
      errores.push({ fichero, columna: col, mensaje: `falta la columna obligatoria "${col}"` });
    }
  }
  if (errores.length > 0) return { ok: false, errores };

  for (const fila of filas) {
    const v = fila.valores;
    if (!PAUTAS.has(v.pauta_tipica ?? '')) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'pauta_tipica', mensaje: `valor fuera de lista: "${v.pauta_tipica}"` });
    }
    if (!SI_NO.has(v.requiere_confirmacion ?? '')) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'requiere_confirmacion', mensaje: `valor fuera de lista (si/no): "${v.requiere_confirmacion}"` });
    }
    if (!VERIFICADO.has(v.verificado_cima ?? '')) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'verificado_cima', mensaje: `valor fuera de lista (si/pendiente/no): "${v.verificado_cima}"` });
    }
    // via es opcional (por defecto "oral"); si viene, debe ser una vía concreta conocida.
    if (v.via !== undefined && v.via !== '' && !VIAS.has(v.via)) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'via', mensaje: `vía fuera de lista: "${v.via}"` });
    }
    // id_regla: una por principio activo, separadas por '+'. Todas deben existir.
    const idsRegla = (v.id_regla ?? '').split('+').map((s) => s.trim()).filter(Boolean);
    if (idsRegla.length === 0) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'id_regla', mensaje: 'id_regla vacío' });
    }
    for (const idr of idsRegla) {
      if (!idsReglaConocidas.has(idr)) {
        errores.push({
          fichero,
          fila: fila.numeroFila,
          columna: 'id_regla',
          mensaje: `regla inexistente: "${idr}" (no está en reglas_farmacos.json)`,
        });
      }
    }
  }

  return { ok: errores.length === 0, errores };
}

export function validarProcedimientos(csvTexto: string): ResultadoValidacion {
  const errores: ErrorValidacion[] = [];
  const fichero = 'datos/procedimientos.csv';
  const { columnas, filas } = parseCsv(csvTexto);

  for (const col of COLUMNAS_PROCEDIMIENTOS) {
    if (!columnas.includes(col)) {
      errores.push({ fichero, columna: col, mensaje: `falta la columna obligatoria "${col}"` });
    }
  }
  if (errores.length > 0) return { ok: false, errores };

  for (const fila of filas) {
    const v = fila.valores;
    const chequeos: Array<[string, Set<string>, string]> = [
      ['riesgo_cardiovascular', RIESGO_CV, v.riesgo_cardiovascular ?? ''],
      ['riesgo_hemorragico', RIESGO_HEMO, v.riesgo_hemorragico ?? ''],
      ['grupo_oftalmologico', GRUPO_OFTALMO, v.grupo_oftalmologico ?? ''],
      ['neuroaxial_o_bloqueo_profundo_probable', SI_NO, v.neuroaxial_o_bloqueo_profundo_probable ?? ''],
      ['duracion_mayor_30min', SI_NO, v.duracion_mayor_30min ?? ''],
      ['riesgo_trombotico_alto', SI_NO, v.riesgo_trombotico_alto ?? ''],
    ];
    for (const [col, set, valor] of chequeos) {
      if (!set.has(valor)) {
        errores.push({ fichero, fila: fila.numeroFila, columna: col, mensaje: `valor fuera de lista: "${valor}"` });
      }
    }
    // obstetrico es opcional (por defecto "no"); si viene, debe ser si/no.
    if (v.obstetrico !== undefined && v.obstetrico !== '' && !SI_NO.has(v.obstetrico)) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'obstetrico', mensaje: `valor fuera de lista (si/no): "${v.obstetrico}"` });
    }
    // espacio_cerrado es opcional (por defecto "no"); si viene, debe ser si/no.
    if (v.espacio_cerrado !== undefined && v.espacio_cerrado !== '' && !SI_NO.has(v.espacio_cerrado)) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'espacio_cerrado', mensaje: `valor fuera de lista (si/no): "${v.espacio_cerrado}"` });
    }
    // zona_dispositivo es opcional (§5.1 bis); si viene, debe ser una zona válida.
    if (v.zona_dispositivo !== undefined && v.zona_dispositivo !== '' && !ZONA_DISPOSITIVO.has(v.zona_dispositivo)) {
      errores.push({ fichero, fila: fila.numeroFila, columna: 'zona_dispositivo', mensaje: `valor fuera de lista: "${v.zona_dispositivo}"` });
    }
  }

  return { ok: errores.length === 0, errores };
}
