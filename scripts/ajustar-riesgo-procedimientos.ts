/**
 * Ajuste único del riesgo cardiovascular de procedimientos a la clasificación de
 * docs/documento_fuente.md §7.1 (el alto se reserva para vascular mayor, cardiaca,
 * neumonectomía, torácica mayor, hepatopancreática y oncológica multivisceral).
 * Ejecutar una vez: node --experimental-strip-types scripts/ajustar-riesgo-procedimientos.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv, serializarCsv } from '../src/datos/csv.ts';

const RUTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'datos/procedimientos.csv');

// id → nuevo riesgo cardiovascular (§7.1).
const CV: Record<string, string> = {
  // Neurocirugía: intermedio.
  nrc_craneotomia_tumor: 'intermedio', nrc_craneotomia_aneurisma: 'intermedio',
  nrc_hematoma_subdural: 'intermedio', nrc_cirugia_hipofisis: 'intermedio', nrc_canal_medular: 'intermedio',
  // Intraperitoneal / general no multivisceral: intermedio.
  cgd_colectomia_onco: 'intermedio', cgd_hemicolectomia: 'intermedio', cgd_reseccion_rectal: 'intermedio',
  cgd_amputacion_abdominoperineal: 'intermedio', cgd_gastrectomia: 'intermedio',
  cgd_bariatrica_bypass: 'intermedio', cgd_esplenectomia: 'intermedio',
  // Urológica mayor: intermedio.
  uro_nefrectomia: 'intermedio', uro_nefrectomia_parcial: 'intermedio', uro_cistectomia: 'intermedio',
  // Ortopédica: intermedio.
  tra_cirugia_columna_lumbar: 'intermedio',
  // Intraperitoneales antes clasificados bajo: intermedio.
  cgd_apendicectomia: 'intermedio', cgd_hernioplastia_inguinal_lap: 'intermedio', ped_apendicectomia: 'intermedio',
};

const { columnas, filas } = parseCsv(readFileSync(RUTA, 'utf8'));
const cambios: string[] = [];
const salida = filas.map((f) => {
  const v = { ...f.valores };
  const nuevo = CV[v.id ?? ''];
  if (nuevo && v.riesgo_cardiovascular !== nuevo) {
    cambios.push(`${v.id} (${v.procedimiento}): ${v.riesgo_cardiovascular} → ${nuevo}`);
    v.riesgo_cardiovascular = nuevo;
  }
  return v;
});
writeFileSync(RUTA, serializarCsv(columnas, salida), 'utf8');
console.log(`procedimientos.csv: ${cambios.length} cambios de riesgo cardiovascular.`);
console.log(cambios.join('\n'));
