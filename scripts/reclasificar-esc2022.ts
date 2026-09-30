/**
 * Reclasifica el riesgo cardiovascular de procedimientos según la clasificación
 * ESC 2022 (decisión del servicio), añade la columna "retina", separa la
 * endarterectomía carotídea (sintomática/asintomática) y renombra la catarata con
 * bloqueo. El riesgo hemorrágico no cambia.
 * Ejecutar una vez: node --experimental-strip-types scripts/reclasificar-esc2022.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv, serializarCsv } from '../src/datos/csv.ts';

const RUTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'datos/procedimientos.csv');

// Cambios de riesgo cardiovascular (id → nuevo valor) respecto al actual.
const CV: Record<string, string> = {
  cgd_tiroidectomia: 'bajo', cgd_paratiroidectomia: 'bajo', orl_tiroidectomia: 'bajo',
  uro_cistectomia: 'alto',
  gin_ooforectomia_onco: 'intermedio',
  tor_lobectomia: 'intermedio', tor_segmentectomia: 'intermedio', tor_timectomia: 'intermedio',
  tor_videotoracoscopia: 'bajo',
  vas_aneurisma_evar: 'intermedio',
  rad_quimioembolizacion: 'intermedio',
  tra_amputacion_miembro: 'intermedio',
  oft_descompresion_orbitaria: 'bajo', oft_tumoral: 'bajo',
};
// Grupo oftalmológico (id → valor).
const OFTALMO: Record<string, string> = {
  oft_catarata_topica: 'riesgo_bajo',
  oft_catarata_retrobulbar: 'riesgo_moderado_alto',
  oft_vitrectomia: 'riesgo_moderado_alto',
  oft_desprendimiento_retina: 'riesgo_moderado_alto',
  oft_cerclaje_escleral: 'riesgo_moderado_alto',
};
const RETINA = new Set(['oft_vitrectomia', 'oft_desprendimiento_retina', 'oft_cerclaje_escleral']);
const RENOMBRAR: Record<string, string> = {
  oft_catarata_retrobulbar: 'Cirugia de catarata con bloqueo retrobulbar o peribulbar',
  tra_amputacion_miembro: 'Amputacion de miembro inferior (traumatica)',
};

const { columnas, filas } = parseCsv(readFileSync(RUTA, 'utf8'));
const cols = [...columnas];
if (!cols.includes('retina')) cols.push('retina');

const cambios: string[] = [];
const salida: Array<Record<string, string>> = [];
for (const f of filas) {
  const v: Record<string, string> = { ...f.valores };
  v.retina = RETINA.has(v.id ?? '') ? 'si' : 'no';
  if (CV[v.id ?? ''] && v.riesgo_cardiovascular !== CV[v.id ?? '']) {
    cambios.push(`${v.id} (${v.procedimiento}): CV ${v.riesgo_cardiovascular} → ${CV[v.id ?? '']}`);
    v.riesgo_cardiovascular = CV[v.id ?? '']!;
  }
  if (OFTALMO[v.id ?? '']) v.grupo_oftalmologico = OFTALMO[v.id ?? '']!;
  if (RENOMBRAR[v.id ?? '']) { cambios.push(`${v.id}: renombrado a "${RENOMBRAR[v.id ?? '']}"`); v.procedimiento = RENOMBRAR[v.id ?? '']!; }

  // Separar la endarterectomía carotídea en sintomática (alto) y asintomática (intermedio).
  if (v.id === 'vas_endarterectomia_carotidea') {
    salida.push({ ...v, id: 'vas_endarterectomia_carotidea_sintomatica', procedimiento: 'Endarterectomia carotidea sintomatica', riesgo_cardiovascular: 'alto' });
    salida.push({ ...v, id: 'vas_endarterectomia_carotidea_asintomatica', procedimiento: 'Endarterectomia carotidea asintomatica', riesgo_cardiovascular: 'intermedio' });
    cambios.push('vas_endarterectomia_carotidea: separado en sintomatica (alto) y asintomatica (intermedio)');
    continue;
  }
  salida.push(v);
}
writeFileSync(RUTA, serializarCsv(cols, salida), 'utf8');
console.log(`procedimientos.csv: ${salida.length} filas, ${cambios.length} cambios.`);
console.log(cambios.join('\n'));
