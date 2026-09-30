/**
 * Genera CONTENIDO_CLINICO.md (docs/documento_fuente.md §16) a partir de los datos
 * de la aplicación: parámetros de configuración, reglas de medicación, catálogo de
 * fármacos, conversión de opioides, procedimientos y módulos de enfermedades.
 *
 * Objetivo: un documento en lenguaje legible, con la fuente de cada regla, para que
 * el Servicio de Anestesiología lo revise y firme. NO inventa nada: todo sale de los
 * ficheros de datos; si un dato falta, se indica explícitamente.
 *
 * Ejecutar: node --experimental-strip-types scripts/generar-contenido-clinico.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../src/datos/csv.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string): string => readFileSync(join(RAIZ, rel), 'utf8');
const leerJson = <T>(rel: string): T => JSON.parse(leer(rel)) as T;

/** Escapa el carácter '|' para no romper las tablas Markdown. */
function esc(s: string | undefined): string {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}
/** Formatea un valor «—» cuando está vacío. */
function ovacio(s: string | undefined): string {
  const t = (s ?? '').trim();
  return t === '' ? '—' : esc(t);
}

// ————————————————————————————————————————————————————————————————
// Etiquetas legibles para los parámetros de las reglas de medicación.
// ————————————————————————————————————————————————————————————————
const DESC_TIPO: Record<string, string> = {
  antivitamina_k: 'Antivitamina K (Sintrom/warfarina)',
  acod: 'Anticoagulante oral de acción directa (ACOD)',
  antiagregante_aas: 'Ácido acetilsalicílico',
  p2y12: 'Antiagregante P2Y12 (clopidogrel, ticagrelor, prasugrel)',
  plazo_simple: 'Suspensión con plazo fijo en días',
  plazo_simple_horas: 'Suspensión con plazo fijo en horas',
  condicional_hemorragico: 'Depende del riesgo hemorrágico / técnica neuroaxial',
  aine: 'Antiinflamatorio no esteroideo (AINE)',
  aine_mantener: 'AINE que se mantiene (coxib)',
  antidiabetico_no_dia_iq: 'Antidiabético: no tomar el día de la intervención',
  antidiabetico_no_manana_iq: 'Antidiabético: no tomar la mañana de la intervención',
  sglt2: 'Inhibidor SGLT2 (glicemia; riesgo de cetoacidosis)',
  glp1_semanal: 'Agonista GLP-1 semanal',
  glp1_diario: 'Agonista GLP-1 diario',
  bomba_insulina: 'Bomba de insulina',
  requiere_confirmacion: 'Requiere confirmación del anestesiólogo',
  litio: 'Litio',
  ieca_ara2: 'IECA / ARA-II',
  mantener: 'Se mantiene',
  no_manana_iq: 'No tomar la mañana de la intervención',
  hbpm: 'Heparina de bajo peso molecular (HBPM)',
  heparina_sodica: 'Heparina sódica',
  fondaparinux: 'Fondaparinux',
  gp_iibiiia: 'Inhibidor de la glicoproteína IIb/IIIa',
  insulina_basal: 'Insulina basal',
  insulina_nph: 'Insulina NPH',
  insulina_rapida: 'Insulina rápida',
  insulina_premezclada: 'Insulina premezclada',
  imao_irreversible: 'IMAO irreversible',
  moclobemida: 'Moclobemida (IMAO reversible)',
  imao_b: 'IMAO-B (selegilina, rasagilina)',
  inmunosupresor_clasico: 'Inmunosupresor clásico',
  metotrexato: 'Metotrexato',
  fame_mantener: 'FAME que se mantiene',
  jak: 'Inhibidor JAK',
  biologico: 'Fármaco biológico',
  tirosina_cinasa: 'Inhibidor de la tirosina-cinasa',
  antiangiogenico: 'Antiangiogénico',
  fitoterapia: 'Fitoterapia / productos de herbolario',
  anticonceptivo_ths: 'Anticonceptivo hormonal / THS',
  mantener_condicional_oftalmo: 'Se mantiene (aviso en cirugía oftalmológica)',
  no_catalogado: 'Fármaco no catalogado',
};

const DESC_PARAM: Record<string, (v: unknown) => string> = {
  dias_suspension: (v) => `Suspender **${v} días** antes.`,
  dias_suspension_dosis_alta: (v) => `Con dosis alta, suspender **${v} días** antes.`,
  dosis_mantener_max_mg: (v) => `Se mantiene si la dosis diaria es ≤ **${v} mg**.`,
  horas_hemorragico_bajo: (v) => `Riesgo hemorrágico bajo: última toma **${v} h** antes.`,
  horas_hemorragico_alto_o_neuroaxial: (v) => `Riesgo hemorrágico alto o técnica neuroaxial: **${v} h** antes.`,
  ajuste_crcl_50_80_h: (v) => `Aclaramiento 50-80 mL/min: **${v} h** antes.`,
  ajuste_crcl_lt50_h: (v) => `Aclaramiento < 50 mL/min: **${v} h** antes.`,
  ajuste_crcl_lt30_h: (v) => `Aclaramiento < 30 mL/min: **${v} h** antes.`,
  neuroaxial_crcl_gt80_h: (v) => `Neuroaxial con aclaramiento > 80 mL/min: **${v} h** antes.`,
  neuroaxial_crcl_50_80_h: (v) => `Neuroaxial con aclaramiento 50-80 mL/min: **${v} h** antes.`,
  neuroaxial_crcl_lt50_h: (v) => `Neuroaxial con aclaramiento < 50 mL/min: **${v} h** antes.`,
  neuroaxial_crcl_lt30_h: (v) => `Neuroaxial con aclaramiento < 30 mL/min: **${v} h** antes.`,
  dias_estandar: (v) => `Plazo estándar: **${v} días** antes.`,
  dias_neuroaxial_o_profundo: (v) => `Con técnica neuroaxial o bloqueo profundo: **${v} días** antes.`,
  horas_estandar: (v) => `Plazo estándar: **${v} h** antes.`,
  horas_neuroaxial_o_profundo: (v) => `Con técnica neuroaxial o bloqueo profundo: **${v} h** antes.`,
  dias_si_alto_o_neuroaxial: (v) => `Si riesgo hemorrágico alto o neuroaxial: **${v} días** antes.`,
  horas_si_alto_o_neuroaxial: (v) => `Si riesgo hemorrágico alto o neuroaxial: **${v} h** antes.`,
  mantener_si_no: () => 'En el resto de los casos, se mantiene.',
  accion_si_no_aplica: (v) => `Si no aplica el plazo, acción: **${v}**.`,
  horas: (v) => `Última toma **${v} h** antes.`,
  dias: (v) => `Suspender **${v} días** antes.`,
  dias_ertugliflozina: (v) => `Ertugliflozina: **${v} días** antes.`,
  ventana_dias: (v) => `Ventana de omisión de la dosis: **${v} días** alrededor de la intervención.`,
  dieta_liquidos_24h: (v) => (v ? 'Dieta líquida las 24 h previas.' : ''),
  dias_ultima_dosis_antes: (v) => `Última dosis **${v} días** antes.`,
  basal_pct_min: (v) => `Insulina basal al **${v}%** (mínimo).`,
  basal_pct_max: (v) => `Insulina basal al **${v}%** (máximo).`,
  pct_noche: (v) => `Dosis de la noche previa al **${v}%**.`,
  pct_manana: (v) => `Dosis de la mañana al **${v}%**.`,
  horas_riesgo_bajo: (v) => `Riesgo cardiovascular bajo: **${v} h** antes.`,
  horas_riesgo_intermedio: (v) => `Riesgo cardiovascular intermedio: **${v} h** antes.`,
  horas_riesgo_alto: (v) => `Riesgo cardiovascular alto: **${v} h** antes.`,
  profilactica_h: (v) => `Dosis profiláctica: **${v} h** antes.`,
  terapeutica_h: (v) => `Dosis terapéutica: **${v} h** antes.`,
  prof_h: (v) => `Dosis profiláctica: **${v} h** antes.`,
  prof_h_neuroaxial: (v) => `Dosis profiláctica con neuroaxial: **${v} h** antes.`,
  terap_h: (v) => `Dosis terapéutica: **${v} h** antes.`,
  terap_h_alarga: (v) => `Dosis terapéutica (alargado): **${v} h** antes.`,
  crcl_contraindicado: (v) => `Contraindicado con aclaramiento < **${v} mL/min**.`,
  umbral_mg_semana: (v) => `Umbral: **${v} mg/semana**.`,
  dias_autoinmune: (v) => `En enfermedad autoinmune: **${v} días** antes.`,
  semanas: (v) => `Suspender **${v} semanas** antes.`,
  semanas_sugerencia: (v) => `Sugerencia: valorar suspender **${v} semanas** antes.`,
  dias_min: (v) => `Mínimo **${v} días**.`,
  dias_max: (v) => `Máximo **${v} días**.`,
  contraste_suspender_h: (v) => `Con contraste yodado, suspender **${v} h**.`,
  no_suspender_oftalmo_bajo: (v) => (v ? 'No se suspende en cirugía oftalmológica de bajo riesgo.' : ''),
  no_suspender_hemorragico_minimo: (v) => (v ? 'No se suspende si el riesgo hemorrágico es mínimo.' : ''),
  no_interviene_en_pruebas: (v) => (v ? 'No interviene en la decisión de pruebas complementarias.' : ''),
  nota_dosis_estres: (v) => (v ? 'Valorar dosis de estrés de corticoide perioperatoria.' : ''),
  requiere_confirmacion: (v) => (v ? 'Requiere confirmación del anestesiólogo.' : ''),
  texto_anestesiologo: (v) => `Nota al anestesiólogo: «${v}».`,
  texto_paciente: (v) => `Texto al paciente: «${v}».`,
  nota_oftalmo: (v) => `Aviso en oftalmología: «${v}».`,
};

const OCULTAR = new Set(['tipo', 'subtipo', 'farmaco', 'fuente']);

function describirRegla(regla: Record<string, unknown>): string[] {
  const lineas: string[] = [];
  for (const [k, v] of Object.entries(regla)) {
    if (OCULTAR.has(k)) continue;
    const fn = DESC_PARAM[k];
    const texto = fn ? fn(v) : `${k.replace(/_/g, ' ')}: ${String(v)}`;
    if (texto.trim() !== '') lineas.push(texto);
  }
  return lineas;
}

// ————————————————————————————————————————————————————————————————
// Construcción del documento.
// ————————————————————————————————————————————————————————————————
interface Config { version_contenido: string; fecha_revision_clinica: string; minutos_inactividad: number; edad_pediatrica_maxima: number; limite_caracteres_sap: number; dias_validez_qr_paciente: number; dias_validez_qr_paciente_sin_fecha: number; dias_validez_qr_anestesiologo: number; [k: string]: unknown; }
interface ReglasFarmacos { _meta: Record<string, string>; bloqueos_profundos: string[]; tablas_seth: Record<string, Record<string, unknown>>; reglas: Record<string, Record<string, unknown>>; }
interface Opioides { _meta: Record<string, string>; factores: Record<string, number>; sin_conversion: string[]; }
interface Pregunta { id: string; etiqueta: string; tipo: string; unidad?: string; porque?: string; opciones?: { valor: string; etiqueta: string }[]; }
interface Modulo { id: string; titulo: string; fuente?: string; preguntas: Pregunta[]; }

const config = leerJson<Config>('datos/config.json');
const rf = leerJson<ReglasFarmacos>('datos/reglas_farmacos.json');
const opioides = leerJson<Opioides>('datos/opioides.json');
const farmacos = parseCsv(leer('datos/farmacos.csv'));
const procedimientos = parseCsv(leer('datos/procedimientos.csv'));
const dirModulos = join(RAIZ, 'datos/modulos');
const modulos: Modulo[] = readdirSync(dirModulos)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dirModulos, f), 'utf8')) as Modulo);

const out: string[] = [];
const p = (s = '') => out.push(s);

p('# Contenido clínico');
p();
p('> **Documento generado automáticamente** a partir de los datos de la aplicación');
p('> (`datos/`). Recoge, en lenguaje legible y con su fuente, todas las reglas que');
p('> aplica la herramienta para que el Servicio de Anestesiología lo revise y lo firme.');
p('>');
p('> No sustituye al juicio clínico: es el reflejo de lo que hace la aplicación.');
p('>');
p(`> **Versión de contenido:** ${config.version_contenido} · **Fecha de revisión clínica:** ${config.fecha_revision_clinica}`);
p('>');
p('> Para regenerarlo: `node --experimental-strip-types scripts/generar-contenido-clinico.ts`.');
p();

// —— 1. Configuración ——
p('## 1. Parámetros de configuración');
p();
p('Valores que gobiernan la aplicación (`datos/config.json`).');
p();
p('| Parámetro | Valor |');
p('| --- | --- |');
p(`| Borrado por inactividad | ${config.minutos_inactividad} minutos |`);
p(`| Edad pediátrica máxima | ${config.edad_pediatrica_maxima} años |`);
p(`| Límite de caracteres del texto SAP | ${config.limite_caracteres_sap} |`);
p(`| Validez del QR del paciente (con fecha) | ${config.dias_validez_qr_paciente} días |`);
p(`| Validez del QR del paciente (sin fecha) | ${config.dias_validez_qr_paciente_sin_fecha} días |`);
p(`| Validez del QR del anestesiólogo | ${config.dias_validez_qr_anestesiologo} días |`);
p();

// —— 2. Reglas de medicación ——
p('## 2. Reglas de medicación');
p();
p('_Fuente general: `datos/reglas_farmacos.json` · ' + esc(rf._meta.descripcion ?? '') + '_');
p();
p('### 2.1. Parámetros generales');
p();
p('**Bloqueos considerados «profundos»** (obligan a plazos de suspensión mayores): ' +
  rf.bloqueos_profundos.map((b) => b.replace(/_/g, ' ')).join(', ') + '.');
p();
p('**Umbrales de dosis para clasificar la HBPM** (tablas SETH). Si la dosis diaria no');
p('encaja en ningún rango, la aplicación pregunta.');
p();
p('| Heparina | Profilaxis (máx.) | Tratamiento (mín.) |');
p('| --- | --- | --- |');
for (const [nombre, t] of Object.entries(rf.tablas_seth)) {
  if (nombre.startsWith('_')) continue;
  const unidad = String(t.unidad ?? '');
  const prof = t.profilaxis_max_mg_dia ?? t.profilaxis_max_ui_dia;
  const trat = t.tratamiento_min_mg_dia ?? t.tratamiento_min_ui_dia;
  p(`| ${nombre} | ${prof} ${unidad}/día | ${trat} ${unidad}/día |`);
}
p();
p('### 2.2. Reglas por fármaco o grupo');
p();
for (const [id, regla] of Object.entries(rf.reglas)) {
  const tipo = String(regla.tipo ?? '');
  const tipoTxt = DESC_TIPO[tipo] ?? tipo.replace(/_/g, ' ');
  p(`#### \`${id}\` — ${tipoTxt}`);
  p();
  const lineas = describirRegla(regla);
  if (lineas.length === 0) p('- (Sin parámetros numéricos; la lógica está en el motor de reglas.)');
  else for (const l of lineas) p(`- ${l}`);
  p();
  p(`_Fuente: ${esc(String(regla.fuente ?? '—'))}_`);
  p();
}

// —— 3. Catálogo de fármacos ——
p('## 3. Catálogo de fármacos');
p();
p('_Fuente: `datos/farmacos.csv`. La columna «Regla» indica qué regla de la sección 2');
p('se aplica a cada fármaco. `verificado_cima = no` significa que el nombre comercial');
p('aún debe revisarse en CIMA (AEMPS) antes del uso clínico._');
p();
const porGrupo = new Map<string, typeof farmacos.filas>();
for (const fila of farmacos.filas) {
  const grupo = fila.valores.grupo || '(sin grupo)';
  if (!porGrupo.has(grupo)) porGrupo.set(grupo, []);
  porGrupo.get(grupo)!.push(fila);
}
for (const grupo of [...porGrupo.keys()].sort()) {
  p(`### 3.${[...porGrupo.keys()].sort().indexOf(grupo) + 1}. ${grupo.replace(/_/g, ' ')}`);
  p();
  p('| Nombres comerciales | Principios activos | Regla | Confirmación | Vía |');
  p('| --- | --- | --- | --- | --- |');
  for (const fila of porGrupo.get(grupo)!) {
    const v = fila.valores;
    const conf = /^(s[íi]|true|1)$/i.test((v.requiere_confirmacion ?? '').trim()) ? 'sí' : 'no';
    p(`| ${ovacio(v.nombres_comerciales)} | ${ovacio(v.principios_activos)} | \`${ovacio(v.id_regla)}\` | ${conf} | ${ovacio(v.via)} |`);
  }
  p();
}

// —— 4. Opioides ——
p('## 4. Conversión de opioides a morfina oral equivalente');
p();
p('_Fuente: `datos/opioides.json` · ' + esc(opioides._meta.descripcion ?? '') + ` (${esc(opioides._meta.fuente ?? '')})_`);
p();
p('| Opioide | Factor a morfina oral |');
p('| --- | --- |');
for (const [nombre, factor] of Object.entries(opioides.factores)) {
  p(`| ${nombre.replace(/_/g, ' ')} | ${factor} |`);
}
p();
p('**Sin conversión directa** (requieren valoración específica): ' +
  opioides.sin_conversion.map((s) => s.replace(/_/g, ' ')).join(', ') + '.');
p();

// —— 5. Procedimientos ——
p('## 5. Procedimientos y su riesgo');
p();
p('_Fuente: `datos/procedimientos.csv`. Cada procedimiento fija el riesgo cardiovascular');
p('y hemorrágico, si la técnica neuroaxial/bloqueo profundo es probable y otros factores');
p('que alimentan las reglas y la decisión de pruebas._');
p();
const porEsp = new Map<string, typeof procedimientos.filas>();
for (const fila of procedimientos.filas) {
  const esp = fila.valores.especialidad || '(sin especialidad)';
  if (!porEsp.has(esp)) porEsp.set(esp, []);
  porEsp.get(esp)!.push(fila);
}
for (const esp of [...porEsp.keys()].sort()) {
  p(`### 5.${[...porEsp.keys()].sort().indexOf(esp) + 1}. ${esp.replace(/_/g, ' ')}`);
  p();
  p('| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Espacio cerrado |');
  p('| --- | --- | --- | --- | --- |');
  for (const fila of porEsp.get(esp)!) {
    const v = fila.valores;
    p(`| ${ovacio(v.procedimiento)} | ${ovacio(v.riesgo_cardiovascular)} | ${ovacio(v.riesgo_hemorragico)} | ${ovacio(v.neuroaxial_o_bloqueo_profundo_probable)} | ${ovacio(v.espacio_cerrado)} |`);
  }
  p();
}

// —— 6. Módulos de enfermedades ——
p('## 6. Módulos de enfermedades (anamnesis dirigida, §5.16)');
p();
p('_Fuente: `datos/modulos/*.json`. Preguntas que la aplicación abre al marcar cada');
p('enfermedad en el cribado. El «porqué» explica su relevancia anestésica._');
p();
for (const m of modulos) {
  p(`### ${m.titulo}`);
  p();
  if (m.fuente) p(`_Fuente: ${esc(m.fuente)}_`);
  p();
  for (const preg of m.preguntas) {
    const unidad = preg.unidad ? ` (${preg.unidad})` : '';
    let linea = `- **${esc(preg.etiqueta)}**${unidad} — _${preg.tipo}_`;
    if (preg.opciones && preg.opciones.length > 0) {
      linea += `: ${preg.opciones.map((o) => o.etiqueta).join(' / ')}`;
    }
    p(linea);
    if (preg.porque) p(`  - Por qué: ${esc(preg.porque)}`);
  }
  p();
}

p('---');
p();
p(`_Documento generado el ${new Date().toISOString().slice(0, 10)} a partir de los datos del repositorio._`);
p();

writeFileSync(join(RAIZ, 'CONTENIDO_CLINICO.md'), out.join('\n'), 'utf8');
console.log(`CONTENIDO_CLINICO.md generado: ${out.length} líneas, ${Object.keys(rf.reglas).length} reglas, ${farmacos.filas.length} fármacos, ${procedimientos.filas.length} procedimientos, ${modulos.length} módulos.`);
