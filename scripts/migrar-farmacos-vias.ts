/**
 * Migración única de datos/farmacos.csv (cotejo CIMA 2026-09-30):
 *  - Sustituye la columna via (oral/no_oral) por vías concretas.
 *  - verificado_cima pasa a "si"/"pendiente"/"no"; añade fecha_verificacion y
 *    fuente_verificacion.
 *  - Quita marcas no comercializadas (Droal, Eupressin, Levothroid).
 *  - Separa ketorolaco (Toradol inyectable) y buprenorfina (Suboxone sublingual).
 *  - Elimina la fila genérica de anticonceptivos y añade filas de grupo por vía.
 *
 * Ejecutar una sola vez: node --experimental-strip-types scripts/migrar-farmacos-vias.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv, serializarCsv } from '../src/datos/csv.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUTA = join(RAIZ, 'datos/farmacos.csv');

type Fila = Record<string, string>;

const VIA_POR_GRUPO: Record<string, string> = {
  insulinas: 'subcutanea',
  glp1: 'subcutanea',
  respiratorio: 'inhalada',
  oftalmologia: 'colirio',
};

const VIA_POR_ID: Record<string, string> = {
  // Anticoagulantes inyectables.
  enoxaparina: 'subcutanea', bemiparina: 'subcutanea', tinzaparina: 'subcutanea',
  dalteparina: 'subcutanea', nadroparina: 'subcutanea', fondaparinux: 'subcutanea',
  heparina_sodica: 'intravenosa',
  // Antiagregantes intravenosos (uso hospitalario).
  cangrelor: 'intravenosa', eptifibatida: 'intravenosa', tirofiban: 'intravenosa',
  // Hierro intravenoso.
  hierro_carboximaltosa: 'intravenosa', hierro_sacarosa: 'intravenosa',
  // Biológicos y metotrexato inyectable.
  adalimumab: 'subcutanea', etanercept: 'subcutanea', certolizumab: 'subcutanea',
  golimumab: 'subcutanea', secukinumab: 'subcutanea', ustekinumab: 'subcutanea',
  tocilizumab: 'subcutanea', abatacept: 'subcutanea', metotrexato: 'subcutanea',
  infliximab: 'intravenosa', rituximab: 'intravenosa',
  // Oncológicos.
  bevacizumab: 'intravenosa', ramucirumab: 'intravenosa', aflibercept_oncologico: 'intravenosa',
  cetuximab: 'intravenosa', aflibercept_intravitreo: 'intravitrea',
  // Psicofármaco inyectable.
  paliperidona_inyectable: 'intramuscular',
  // Opioides.
  fentanilo_transdermico: 'transdermica',
  // Excepciones orales dentro de grupos no orales.
  semaglutida_oral: 'oral', montelukast: 'oral', acetazolamida: 'oral',
};

/** Marcas revisadas a mano en CIMA (comercializadas): su fila usa "CIMA manual". */
const MARCAS_MANUAL = new Set([
  'Naprosyn', 'Pletal', 'Persantin', 'Minodiab', 'Tenormin', 'Prinivil',
  'Beloken', 'Bydureon', 'Lyxumia', 'Sandimmun Neoral', 'Zaltrap',
]);
/** Marcas no comercializadas: se quitan de nombres_comerciales. */
const MARCAS_RETIRADAS = new Set(['Droal', 'Eupressin', 'Levothroid']);

const { columnas, filas } = parseCsv(readFileSync(RUTA, 'utf8'));
const cols = [...columnas];
if (!cols.includes('fecha_verificacion')) cols.push('fecha_verificacion');
if (!cols.includes('fuente_verificacion')) cols.push('fuente_verificacion');

const marcas = (s: string) => s.split('|').map((x) => x.trim()).filter(Boolean);
const via = (f: Fila) => VIA_POR_ID[f.id ?? ''] ?? VIA_POR_GRUPO[f.grupo ?? ''] ?? 'oral';

const salida: Fila[] = [];
const reporte: string[] = [];

for (const fila of filas) {
  const f: Fila = { ...fila.valores };
  if (f.id === 'anticonceptivos_combinados') continue; // se sustituye por filas de grupo

  // Quitar marcas no comercializadas.
  const nombres = marcas(f.nombres_comerciales ?? '').filter((n) => !MARCAS_RETIRADAS.has(n));

  // Casos con separación de vías.
  if (f.id === 'ketorolaco') {
    // Toradol (inyectable) se separa; ketorolaco oral queda como genérico.
    salida.push(marcarVerif({ ...f, nombres_comerciales: 'ketorolaco', via: 'oral' }, ['ketorolaco']));
    salida.push(marcarVerif({ ...f, id: 'ketorolaco_iny', nombres_comerciales: 'Toradol', via: 'intravenosa' }, ['Toradol']));
    reporte.push('ketorolaco → oral (genérico); nueva fila ketorolaco_iny (Toradol) → intravenosa; Droal retirado');
    continue;
  }
  if (f.id === 'buprenorfina') {
    salida.push(marcarVerif({ ...f, nombres_comerciales: 'Feliben|Transtec', via: 'transdermica' }, ['Feliben', 'Transtec']));
    salida.push(marcarVerif({ ...f, id: 'buprenorfina_suboxone', principios_activos: 'buprenorfina|naloxona', nombres_comerciales: 'Suboxone', via: 'sublingual' }, ['Suboxone']));
    reporte.push('buprenorfina → transdermica (Feliben, Transtec); nueva fila buprenorfina_suboxone (buprenorfina+naloxona) → sublingual');
    continue;
  }

  const nuevaVia = via(f);
  if ((f.via ?? '') !== nuevaVia) reporte.push(`${f.id}: via ${f.via || '(vacía)'} → ${nuevaVia}`);
  f.nombres_comerciales = nombres.join('|');
  salida.push(marcarVerif({ ...f, via: nuevaVia }, nombres));
}

/** Marca verificado_cima=si, fecha y fuente de verificación según las marcas de la fila. */
function marcarVerif(f: Fila, nombres: string[]): Fila {
  const manual = nombres.some((n) => MARCAS_MANUAL.has(n));
  return {
    ...f,
    verificado_cima: 'si',
    fecha_verificacion: '2026-09-30',
    fuente_verificacion: manual ? 'CIMA manual' : 'cotejo CIMA asistido',
  };
}

// —— Filas de grupo de anticonceptivos y THS (§8.11), verificado_cima = no ——
function anticon(id: string, principios: string, nombres: string, viaV: string, pauta = 'diaria'): Fila {
  const f: Fila = {};
  for (const c of cols) f[c] = '';
  f.id = id;
  f.principios_activos = principios;
  f.nombres_comerciales = nombres;
  f.grupo = 'hormonas';
  f.subgrupo = 'anticonceptivo_ths';
  f.pauta_tipica = pauta;
  f.id_regla = 'anticonceptivo_ths';
  f.requiere_confirmacion = 'no';
  f.indicaciones_posibles = 'anticoncepcion';
  f.fuente = 'docs/documento_fuente.md §8.11';
  f.fecha_revision = '2026-09-30';
  f.verificado_cima = 'no';
  f.via = viaV;
  f.fecha_verificacion = '';
  f.fuente_verificacion = '';
  return f;
}

salida.push(
  anticon('anticonceptivo_oral_combinado', 'etinilestradiol', 'anticonceptivo oral combinado', 'oral'),
  anticon('anticonceptivo_oral_gestageno', 'desogestrel', 'anticonceptivo oral solo gestágeno', 'oral'),
  anticon('anticonceptivo_implante', 'etonogestrel', 'implante anticonceptivo|Implanon NXT', 'implante'),
  anticon('anticonceptivo_diu_hormonal', 'levonorgestrel', 'DIU hormonal|Mirena|Kyleena|Jaydess', 'intrauterina'),
  anticon('anticonceptivo_anillo_vaginal', 'etonogestrel|etinilestradiol', 'anillo vaginal|NuvaRing|Circlet', 'vaginal'),
  anticon('anticonceptivo_parche', 'norelgestromina|etinilestradiol', 'parche anticonceptivo|Evra', 'transdermica'),
  anticon('anticonceptivo_inyectable', 'medroxiprogesterona', 'anticonceptivo inyectable|Depo-Progevera', 'intramuscular'),
  anticon('ths_oral', 'estradiol', 'terapia hormonal sustitutiva oral|THS oral', 'oral'),
  anticon('ths_transdermica', 'estradiol', 'terapia hormonal sustitutiva parche|THS parche', 'transdermica'),
  anticon('ths_vaginal', 'estradiol', 'terapia hormonal sustitutiva vaginal|THS vaginal', 'vaginal'),
);

writeFileSync(RUTA, serializarCsv(cols, salida), 'utf8');
console.log(`farmacos.csv migrado: ${salida.length} filas.`);
console.log(reporte.join('\n'));
