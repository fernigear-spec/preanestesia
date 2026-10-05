/**
 * Genera CONTENIDO_CLINICO.md (docs/documento_fuente.md §16): un documento en
 * lenguaje llano que describe LO QUE HACE el programa (plazos, condiciones,
 * excepciones, confirmaciones, alertas, textos del paciente), para que el Servicio
 * de Anestesiología lo revise y lo firme. Todo sale de los datos y del código; si
 * un dato falta, se indica. Ejecutar: node --experimental-strip-types scripts/generar-contenido-clinico.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../src/datos/csv.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string): string => readFileSync(join(RAIZ, rel), 'utf8');
const leerJson = <T>(rel: string): T => JSON.parse(leer(rel)) as T;

function esc(s: string | undefined): string {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}
function ovacio(s: string | undefined): string {
  const t = (s ?? '').trim();
  return t === '' ? '—' : esc(t);
}
function verificacionTexto(v: Record<string, string>): string {
  const estado = (v.verificado_cima ?? '').trim().toLowerCase();
  const icono = estado === 'si' ? '✓ verificado' : estado === 'pendiente' ? '… pendiente' : '✗ sin verificar';
  const extra = [(v.fecha_verificacion ?? '').trim(), (v.fuente_verificacion ?? '').trim()].filter(Boolean).join(', ');
  return extra ? `${icono} (${esc(extra)})` : icono;
}

const DESC_TIPO: Record<string, string> = {
  antivitamina_k: 'Antivitamina K', acod: 'ACOD', antiagregante_aas: 'AAS', p2y12: 'Antiagregante P2Y12',
  plazo_simple: 'Plazo fijo en días', plazo_simple_horas: 'Plazo fijo en horas', condicional_hemorragico: 'Según riesgo hemorrágico',
  aine: 'AINE', aine_mantener: 'AINE (coxib): mantener', antidiabetico_no_dia_iq: 'Antidiabético: no el día', antidiabetico_no_manana_iq: 'Antidiabético: no la mañana',
  sglt2: 'SGLT2', glp1_semanal: 'GLP-1 semanal', glp1_diario: 'GLP-1 diario', bomba_insulina: 'Bomba de insulina',
  requiere_confirmacion: 'Requiere confirmación', litio: 'Litio', ieca_ara2: 'IECA/ARA-II', mantener: 'Mantener',
  no_manana_iq: 'No la mañana', hbpm: 'HBPM', heparina_sodica: 'Heparina sódica', fondaparinux: 'Fondaparinux', gp_iibiiia: 'GP IIb/IIIa',
  insulina_basal: 'Insulina basal', insulina_nph: 'Insulina NPH', insulina_rapida: 'Insulina rápida', insulina_premezclada: 'Insulina premezclada',
  imao_irreversible: 'IMAO irreversible', moclobemida: 'Moclobemida', imao_b: 'IMAO-B', inmunosupresor_clasico: 'Inmunosupresor clásico',
  metotrexato: 'Metotrexato', fame_mantener: 'FAME (mantener)', jak: 'Inhibidor JAK', biologico: 'Biológico', tirosina_cinasa: 'Tirosina-cinasa',
  antiangiogenico: 'Antiangiogénico', mantener_condicional_oftalmo: 'Mantener (aviso oftálmico)', no_catalogado: 'No catalogado',
};

interface Config { version_contenido: string; fecha_revision_clinica: string; minutos_inactividad: number; edad_pediatrica_maxima: number; dias_validez_qr_paciente: number; dias_validez_qr_paciente_sin_fecha: number; dias_validez_qr_anestesiologo: number; [k: string]: unknown; }
interface Regla { descripcion?: string; tipo?: string; fuente?: string; [k: string]: unknown; }
interface ReglasFarmacos { _meta: Record<string, string>; bloqueos_profundos: string[]; tablas_seth: Record<string, Record<string, unknown>>; reglas: Record<string, Regla>; }
interface Opioides { _meta: Record<string, string>; factores: Record<string, number>; sin_conversion: string[]; }
interface EfectoRespuesta { cuando: string; tipo: string; gravedad?: string; efecto: string; fuente?: string; si?: unknown; }
interface Pregunta { id: string; etiqueta: string; tipo: string; unidad?: string; porque?: string; opciones?: { valor: string; etiqueta: string }[]; genera?: EfectoRespuesta[]; }
interface Modulo { id: string; titulo: string; fuente?: string; preguntas: Pregunta[]; }
interface TextosPaciente { med: Record<string, string> & { insulina: Record<string, string> }; }

interface PuntoValidacionJson { id: string; origen: string; motivo: string; fuente?: string; }
interface ValidacionesJson { _meta?: Record<string, unknown>; posponer?: PuntoValidacionJson[]; validar?: PuntoValidacionJson[]; }

const config = leerJson<Config>('datos/config.json');
const rf = leerJson<ReglasFarmacos>('datos/reglas_farmacos.json');
const opioides = leerJson<Opioides>('datos/opioides.json');
const validaciones = leerJson<ValidacionesJson>('datos/validaciones.json');
const textos = leerJson<TextosPaciente>('datos/textos/es/paciente.json');
const farmacos = parseCsv(leer('datos/farmacos.csv'));
const procedimientos = parseCsv(leer('datos/procedimientos.csv'));
const dirModulos = join(RAIZ, 'datos/modulos');
const modulos: Modulo[] = readdirSync(dirModulos).filter((f) => f.endsWith('.json')).sort()
  .map((f) => JSON.parse(readFileSync(join(dirModulos, f), 'utf8')) as Modulo);

const out: string[] = [];
const p = (s = '') => out.push(s);
const rellenar = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `[${k}]`);
const EJ: Record<string, string> = { fecha: 'martes 4 de noviembre de 2026', hora: '08:00', horaOriginal: '09:00', n: '3', tel: String(config.telefono_contacto ?? '000 000 000') };

// —————————————————————————————— Cabecera e índice ——————————————————————————————
p('# Contenido clínico');
p();
p('> **Documento generado automáticamente** a partir de los datos (`datos/`) y de la lógica del programa.');
p('> Describe **lo que hace la aplicación** —plazos, condiciones, excepciones, confirmaciones, alertas y los textos que ve el paciente— para que el Servicio de Anestesiología lo revise y lo firme. No sustituye al juicio clínico.');
p('>');
p(`> **Versión de contenido:** ${config.version_contenido} · **Fecha de revisión clínica:** ${config.fecha_revision_clinica}`);
p('>');
p('> Regenerar: `npm run contenido:clinico`.');
p();
p('## Índice');
p();
[
  '1. Parámetros de configuración', '2. Convenciones del motor (fechas y adelanto de anticoagulantes)',
  '3. Reglas de medicación', '4. Textos que ve el paciente (muestras)', '5. Fecha desconocida y recálculo',
  '6. Mecanismo de confirmación del anestesiólogo', '7. Ayuno y hojas anexas', '8. Sugammadex y anticoncepción',
  '9. Cribado mitocondrial mtND4', '10. ASA sugerido', '11. Escalas y cálculos',
  '12. Clase de riesgo del paciente y pruebas complementarias', '13. Catálogo de fármacos',
  '14. Conversión de opioides', '15. Procedimientos', '16. Módulos de enfermedad',
  '16 ter. Dispositivos cardiacos implantables', '16 bis. Puntos de validación clínica',
  '17. Pendiente de revisión por el servicio',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— Decisiones del servicio ——————————————————————————————
p('## Decisiones del servicio (30/09/2026)');
p();
p('_Cambios acordados por el servicio en esta revisión, ya aplicados en el contenido y el comportamiento._');
p();
[
  '**Orden de la entrevista (12 pasos):** intervención, datos básicos, alergias, antecedentes, hábitos, enfermedades y hemostasia, técnica anestésica prevista, medicación, vía aérea, consentimiento, origen materno (mtND4) y resultados.',
  '**Técnica anestésica en un paso propio (paso 7):** si se cambia, las reglas de medicación y las salidas se recalculan; la medicación introducida se conserva al volver.',
  '**Oftalmología:** la técnica decide el grupo de la catarata (tópica = riesgo bajo; retrobulbar o peribulbar = moderado-alto; sin técnica, moderado-alto y se indica). La oftalmología de riesgo moderado-alto se trata como riesgo hemorrágico alto para los anticoagulantes (§8.1-8.3).',
  '**Se retira el «carácter» de la intervención y el sufijo «E» del ASA** (ya no se recoge la urgencia).',
  '**Condiciones especiales (§5.15):** la hipertermia maligna y el déficit de pseudocolinesterasa (personales y familiares) se recogen en el paso de enfermedades, no en antecedentes.',
  '**Riesgo quirúrgico según la ESC 2022** (sustituye a la clasificación previa de §7.1).',
  '**AAS (§8.2):** se mantiene salvo espacio cerrado, cirugía de retina o técnica neuroaxial (suspender 5 días); en prevención cardiovascular se confirma y se mantienen 100 mg.',
  '**HBPM (§8.4):** clasificación profiláctica/terapéutica con dosis, pauta, peso y aclaramiento (tablas SETH por heparina; márgenes ±20 %).',
  '**Texto para SAP (§10.1):** solo antecedentes patológicos y quirúrgicos, sin límite de caracteres; el resto se rellena con los desplegables del SAP.',
  '**Codificación del efecto por respuesta (§5.16):** cada respuesta que genera un efecto lo declara en el campo `genera` de su pregunta (véase §16), validado y protegido por un test de cobertura.',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 1. Configuración ——————————————————————————————
p('## 1. Parámetros de configuración');
p();
p('| Parámetro | Valor |');
p('| --- | --- |');
p(`| Borrado por inactividad | ${config.minutos_inactividad} min |`);
p(`| Edad pediátrica máxima | ${config.edad_pediatrica_maxima} años |`);
p(`| Validez del QR del paciente (con/sin fecha) | ${config.dias_validez_qr_paciente} / ${config.dias_validez_qr_paciente_sin_fecha} días |`);
p();

// —————————————————————————————— 2. Convenciones ——————————————————————————————
p('## 2. Convenciones del motor (fechas y adelanto de anticoagulantes) — §8.0');
p();
[
  'Los **plazos en horas** (ACOD, heparinas, fondaparinux, litio, moclobemida, AINE, dipiridamol, sulodexida, GP IIb/IIIa) se cuentan desde la última toma hasta la hora prevista de la intervención. Una toma que cae exactamente en el límite está permitida.',
  'Los **plazos en días** (antivitamina K, AAS, P2Y12, triflusal, cilostazol, SGLT2, JAK, fitoterapia, IMAO irreversibles): «suspender N días» significa no tomarlo los N días previos ni el día de la intervención.',
  '**Adelanto de anticoagulantes** (plazo en horas): si la primera toma posterior al límite cae como máximo 10 h después, la hoja indica **adelantarla** a la hora límite («el lunes, tome la dosis a las 08:00 en lugar de a las 09:00; será la última»), siempre que quede al menos la mitad del intervalo desde la toma anterior (6 h en pautas cada 12 h; 12 h en pautas cada 24 h). Si no, la última toma es la anterior permitida. Nunca se atrasa una toma; en el resto de fármacos no se adelantan tomas.',
  'La fecha/hora límite se traduce a lenguaje del paciente con el **día de la semana**.',
  '**Combinaciones fijas** (una sola pastilla): una instrucción por medicamento con el plazo más restrictivo de sus componentes. Si la combinación retira la metformina antes de su plazo, nota de vigilar la glucemia.',
  'Cada regla guarda su **fuente** (protocolo del servicio o guía: ESC 2022/2024, CPOC, ACR 2022, CDC 2022, ASRA 2018, EHRA 2021).',
].forEach((s) => p(`- ${s}`));
p();
p('**Bloqueos considerados profundos:** ' + rf.bloqueos_profundos.map((b) => b.replace(/_/g, ' ')).join(', ') + '.');
p();

// —————————————————————————————— 3. Reglas de medicación ——————————————————————————————
p('## 3. Reglas de medicación');
p();
p('_Cada regla, en lenguaje llano, con su fuente. Los números salen de `datos/reglas_farmacos.json`._');
p();
p('### 3.1. Umbrales de la HBPM (tablas SETH, §8.4)');
p();
p('La HBPM se clasifica en profiláctica o terapéutica con **dosis, pauta, peso y aclaramiento** (no solo la dosis). Si no encaja en ninguna tabla, la aplicación pregunta. Ejemplos: enoxaparina 60 mg/24 h en 90 kg es profilaxis; 40 mg/12 h en 110 kg es profilaxis; 1 mg/kg/12 h es tratamiento; 1 mg/kg/24 h con aclaramiento < 30 es tratamiento.');
p();
p('| Heparina | Profilaxis | Tratamiento |');
p('| --- | --- | --- |');
function profilaxisSeth(t: Record<string, unknown>): string {
  const u = String(t.unidad ?? '');
  if (t.profilaxis_max_por_kg_dia !== undefined) return `≤ ${t.profilaxis_max_por_kg_dia} ${u}/kg/día`;
  if (t.profilaxis_dia_bandas !== undefined) {
    const b = t.profilaxis_dia_bandas as { umbral_kg: number; hasta: number; desde: number };
    return `≤ ${b.hasta} ${u}/día (< ${b.umbral_kg} kg) · ≤ ${b.desde} ${u}/día (≥ ${b.umbral_kg} kg)`;
  }
  if (t.profilaxis_dia !== undefined) {
    const base = `≤ ${t.profilaxis_dia} ${u}/día`;
    return t.profilaxis_crcl_lt30_dia !== undefined ? `${base} (≤ ${t.profilaxis_crcl_lt30_dia} con aclaramiento < 30)` : base;
  }
  return '—';
}
function tratamientoSeth(t: Record<string, unknown>): string {
  const u = String(t.unidad ?? '');
  if (t.tratamiento_min_por_kg_dia !== undefined) {
    return `≥ ${t.tratamiento_min_por_kg_dia} ${u}/kg/día (≥ ${t.tratamiento_min_por_kg_dia_crcl_lt30} con aclaramiento < 30)`;
  }
  if (t.tratamiento_por_kg_dia !== undefined) {
    let s = `${t.tratamiento_por_kg_dia} ${u}/kg/día`;
    if (t.tratamiento_por_kg_dia_crcl_lt30 !== undefined) s += ` (${t.tratamiento_por_kg_dia_crcl_lt30} con aclaramiento < 30)`;
    if (t.tratamiento_crcl_lt30_contraindicado) s += ' · contraindicado con aclaramiento < 30';
    if (t.tratamiento_crcl_lt30_confirmar) s += ' · confirmar con aclaramiento < 30';
    return s;
  }
  return '—';
}
for (const [nombre, t] of Object.entries(rf.tablas_seth)) {
  if (nombre.startsWith('_')) continue;
  p(`| ${nombre} | ${profilaxisSeth(t)} | ${tratamientoSeth(t)} |`);
}
p();
p('### 3.2. Reglas por fármaco o grupo');
p();
for (const [id, regla] of Object.entries(rf.reglas)) {
  const tipoTxt = DESC_TIPO[String(regla.tipo ?? '')] ?? String(regla.tipo ?? '').replace(/_/g, ' ');
  p(`#### \`${id}\` — ${tipoTxt}`);
  p();
  p(esc(regla.descripcion) || '_(sin descripción)_');
  p();
  p(`_Fuente: ${esc(String(regla.fuente ?? '—'))}_`);
  p();
}

// —————————————————————————————— 4. Textos del paciente ——————————————————————————————
p('## 4. Textos que ve el paciente (muestras)');
p();
p(`_Muestras con fecha de ejemplo: **${EJ.fecha} a las ${EJ.hora}**. Los textos salen de \`datos/textos/es/paciente.json\` (y su traducción al catalán)._`);
p();
const m = textos.med;
const muestras: Array<[string, string]> = [
  ['Mantener (oral)', m.mantener_oral ?? ''],
  ['Mantener (parche/transdérmica)', m.mantener_transdermica ?? ''],
  ['Mantener (subcutánea)', m.mantener_subcutanea ?? ''],
  ['No tomar el día de la intervención', m.no_dia_iq ?? ''],
  ['Suspensión por días', rellenar(m.suspender_normal ?? '', EJ) + rellenar(m.coletilla_dias ?? '', EJ)],
  ['Suspensión con adelanto', rellenar(m.suspender_adelantada ?? '', EJ) + rellenar(m.coletilla_horas ?? '', EJ)],
  ['Margen sin fecha (días)', rellenar(m.margen_dias ?? '', EJ)],
  ['Margen sin fecha (horas)', rellenar(m.margen_horas ?? '', { ...EJ, n: '48' })],
  ['Requiere confirmación', rellenar(m.confirmacion ?? '', { n: 'Sintrom' })],
];
p('| Situación | Texto para el paciente |');
p('| --- | --- |');
for (const [k, v] of muestras) p(`| ${k} | ${esc(v)} |`);
p();

// —————————————————————————————— 5. Fecha desconocida ——————————————————————————————
p('## 5. Fecha desconocida y recálculo — §8.16');
p();
[
  'Si aún no se conoce la fecha, las instrucciones se dan como **margen** («como mínimo 72 horas antes de la intervención») y **no se adelantan tomas**.',
  'El QR guarda el tipo de plazo (días/horas), la duración, el adelanto y si es anticoagulante, pero **no** fechas ni datos clínicos.',
  'Cuando el paciente recibe la fecha, abre de nuevo el enlace, la introduce y **se recalcula todo** con fechas concretas.',
  'Sin hora, se asume las **08:00** y la hoja avisa de que si cambia la fecha o la hora debe llamar.',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 6. Confirmación ——————————————————————————————
p('## 6. Mecanismo de confirmación del anestesiólogo — §12');
p();
[
  'Cualquier fármaco con `requiere_confirmacion = sí`, o cualquier regla que devuelva ese estado, queda **pendiente de confirmar**.',
  'Mientras no se confirme, **no se genera la hoja/QR del paciente**; la pantalla lo señala.',
  'El anestesiólogo confirma con su **nombre** (queda registrado) o marca «le llamaremos» (la hoja muestra la frase de que le llamarán).',
  'Casos típicos: AAS en neurocirugía/espacio cerrado, P2Y12 con stent o monoterapia, antivitamina K con puente, sacubitrilo/valsartán, biológicos, antiangiogénicos, bomba de insulina con ingreso o riesgo alto, HBPM que no encaja en las tablas.',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 7. Ayuno ——————————————————————————————
p('## 7. Ayuno y hojas anexas — §8.14 y §8.14 bis');
p();
p('Las horas se calculan desde la hora prevista de inducción y se muestran como horas de reloj.');
p();
p('**Adulto sin factores de riesgo:** líquidos claros libres hasta 4 h antes (entre 4 y 2 h, máx. 400 mL; nada en las 2 h previas salvo medicación con un sorbo); comida ligera hasta 6 h; comida copiosa/grasa/proteica hasta 8 h; bebida de carbohidratos entre 2 y 3 h antes (salvo vaciamiento gástrico lento).');
p();
p('**Situaciones especiales:** diabetes (mismo ayuno; con gastroparesia, sólidos 8 h y premedicación con metoclopramida); GLP-1 semanal (líquidos claros 24 h, hoja anexa; si no se ha suspendido, alerta de estómago lleno); reflujo grave sintomático; bariátrica sintomática (sólidos 8 h + secuencia rápida); embarazo ≥ 20 semanas (ayuno individualizado); nutrición enteral; pediatría (líquidos 1 h, leche materna 3 h, fórmula/sólidos 6 h; fórmula 4 h en < 6 meses).');
p();
p('**Hojas anexas** (§8.14 bis): 1) líquidos claros 24 h (GLP-1 semanal sin diabetes); 2) líquidos claros 24 h en diabético (GLP-1 semanal con diabetes); 3) ayuno del diabético (diabetes sin GLP-1 semanal); 4) tabaco (si fuma); 5) alcohol (si el AUDIT-C es positivo). Ninguna menciona dosis; para la medicación remiten a la hoja de medicación.');
p();

// —————————————————————————————— 8. Sugammadex ——————————————————————————————
p('## 8. Sugammadex y anticoncepción hormonal — §8.15');
p();
[
  'En toda mujer con **anticonceptivo hormonal** (NO la terapia hormonal sustitutiva, que no es anticonceptiva) y posible anestesia general, la **hoja del paciente** incluye un aviso condicional (y las notas del anestesiólogo recuerdan informar a la paciente al alta si se usó sugammadex).',
  '**Anticonceptivo oral:** si se usa sugammadex, equivale a olvidar una toma → seguir las instrucciones de «dosis olvidada» del prospecto y usar además preservativo 7 días.',
  '**No oral** (implante, DIU hormonal, anillo, parche, inyectable): si se usa sugammadex, usar además preservativo durante **7 días**.',
  'El texto va en condicional («si durante la anestesia le administran…») e indica que el equipo de anestesia lo confirmará después de la intervención.',
].forEach((s) => p(`- ${s}`));
p();
p('**Texto para el paciente (hoja), castellano:**');
p();
p(`- Oral: ${esc((textos as unknown as { sugammadex_oral?: string }).sugammadex_oral ?? '')}`);
p(`- No oral: ${esc((textos as unknown as { sugammadex_no_oral?: string }).sugammadex_no_oral ?? '')}`);
p(`- Confirmación: ${esc((textos as unknown as { sugammadex_confirmacion?: string }).sugammadex_confirmacion ?? '')}`);
p();

// —————————————————————————————— 9. mtND4 ——————————————————————————————
p('## 9. Cribado mitocondrial mtND4 (SEDAR 2026) — §9');
p();
[
  'Pregunta obligatoria a todos los pacientes, con guion respetuoso para la enfermera.',
  '**Alerta roja** si: test positivo; ascendencia venezolana materna directa; origen materno desconocido u ovodonación; o antecedentes familiares compatibles sin test.',
  '**Alerta informativa** si el test es negativo (variante ausente): decisión del anestesiólogo.',
  'Medidas (notas del anestesiólogo): si es diferible y hay test, hacer el estudio genético y diferir; si no, evitar halogenados (TIVA), purgar la máquina, priorizar regional, monitorizar profundidad y mantener normoxia/normocapnia/normotermia.',
  'En la hoja del paciente solo: «El anestesiólogo hablará con usted sobre este punto antes de la intervención».',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 10. ASA ——————————————————————————————
p('## 10. ASA sugerido — §6.1');
p();
p('Cada respuesta de los módulos lleva una clase ASA mínima (ejemplos ASA 2020). El ASA sugerido es el máximo y se muestran las respuestas que lo determinan. Se puede modificar a mano; las salidas indican el valor final y si se ha modificado. El sufijo **E** de urgencia se ha retirado (decisión del servicio, 30/09/2026).');
p();
[
  'ASA I: sano, no fumador, alcohol mínimo o nulo.',
  'ASA II: fumador activo, bebedor social, embarazo, IMC 30 a < 40, diabetes o HTA bien controladas, enfermedad pulmonar leve.',
  'ASA III: diabetes/HTA mal controladas, EPOC, IMC ≥ 40, dependencia de alcohol, marcapasos, FE moderadamente reducida, ERC en diálisis, infarto/ictus/stent de más de 3 meses.',
  'ASA IV: infarto/ictus/stent de menos de 3 meses, isquemia activa, disfunción valvular grave, FE gravemente reducida, ERC sin diálisis.',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 11. Escalas ——————————————————————————————
p('## 11. Escalas y cálculos — §6');
p();
p('Cada escala muestra la puntuación, la categoría y los componentes que suman.');
p();
[
  '**EGRI (El-Ganzouri)** vía aérea: apertura bucal, distancia tiromentoniana, Mallampati, movilidad cervical, protrusión, peso e intubación difícil previa. **≥ 4: riesgo elevado** de laringoscopia difícil. En telefónica, EGRI parcial con aviso «exploración pendiente».',
  '**Langeron** (ventilación difícil con mascarilla): barba, IMC > 26, edéntulo, edad > 55, ronquido. **≥ 2: riesgo.**',
  '**STOP-Bang** (adultos sin SAOS diagnosticado): ronquido, cansancio, apneas, HTA, IMC > 35, edad > 50, cuello > 40 cm, varón. 0-2 bajo; 3-4 intermedio; **5-8 alto (alerta)**; también alto con ≥ 2 de los cuatro primeros más varón/IMC/cuello.',
  '**STBUR** (niños): 5 ítems de sueño. **≥ 3: riesgo (alerta); 5: alerta alta.**',
  '**Apfel** (NVPO adultos): mujer, no fumador, NVPO/cinetosis previas, opioides postoperatorios. 0=10 %, 1=20 %, 2=40 %, 3=60 %, 4=80 %.',
  '**POVOC** (NVPO niños): cirugía ≥ 30 min, edad ≥ 3, estrabismo, NVPO del niño o familiares. 0=9 %, 1=10 %, 2=30 %, 3=55 %, 4=70 %.',
  '**CHA₂DS₂-VA** (FA/flúter): IC 1, HTA 1, edad ≥ 75 = 2, diabetes 1, ictus/AIT/tromboembolismo 2, enfermedad vascular 1, edad 65-74 = 1. Informativo.',
  '**Capacidad funcional**: dos pisos y DASI; METs = (0,43 × DASI + 9,6) / 3,5. **Reducida: < 4 METs o DASI ≤ 34.**',
  '**Aclaramiento** (Cockcroft-Gault) con peso real; sin dato, las reglas dependientes del riñón lo indican y requieren confirmación.',
  '**AUDIT-C**: positivo ≥ 4 (hombres) o ≥ 3 (mujeres) → consejo y hoja de alcohol; **≥ 8: alerta de abstinencia**.',
  '**Fragilidad/delirium (≥ 65)**: CFS 1-9 (**≥ 5: fragilidad, alerta**); 4AT (0 improbable; **1-3 posible deterioro, alerta**; **≥ 4 posible delirium, alerta roja**).',
  '**Morfina equivalente** (§6.8): suma de dosis × factor (opioides.json). **≥ 50 mg/día: alerta; ≥ 90 mg/día: alerta alta.** Buprenorfina y metadona sin conversión.',
  '**HEMSTOP**: **≥ 2 positivo** → se pide coagulación aunque la tabla no lo pida, y alerta.',
].forEach((s) => p(`- ${s}`));
p();

// —————————————————————————————— 12. Clase de riesgo y pruebas ——————————————————————————————
p('## 12. Clase de riesgo del paciente y pruebas complementarias — §7');
p();
p('**Clase de riesgo** (la más alta que asignen los módulos): bajo, bajo-moderado, moderado, alto.');
p();
p('**Tabla de decisión de pruebas** (§7.3):');
p();
p('| Cirugía | Prueba | Bajo | Bajo-moderado | Moderado | Alto |');
p('| --- | --- | --- | --- | --- | --- |');
[
  ['Bajo riesgo', 'Hemograma y coagulación', 'No*', 'Sí', 'Sí', 'Sí'],
  ['Bajo riesgo', 'Bioquímica', 'No', 'Sí', 'Sí', 'Sí'],
  ['Bajo riesgo', 'ECG', 'No', 'Sí', 'Sí', 'Sí'],
  ['Bajo riesgo', 'Rx tórax', 'No***', 'No***', 'No***', 'No***'],
  ['Intermedio', 'Hemograma y coagulación', 'Sí', 'Sí', 'Sí', 'Sí'],
  ['Intermedio', 'Bioquímica', 'No', 'Sí', 'Sí', 'Sí'],
  ['Intermedio', 'ECG', 'No', 'Sí', 'Sí', 'Sí'],
  ['Intermedio', 'Rx tórax', 'No***', 'No***', 'No***', 'Sí'],
  ['Alto', 'Hemograma y coagulación', 'Sí', 'Sí', 'Sí', 'Sí'],
  ['Alto', 'Bioquímica', 'No', 'Sí', 'Sí', 'Sí'],
  ['Alto', 'ECG', 'Sí', 'Sí', 'Sí', 'Sí'],
  ['Alto', 'Rx tórax', 'No***', 'Sí', 'Sí', 'Sí'],
].forEach((f) => p(`| ${f.join(' | ')} |`));
p();
p('\\* Bajo/bajo: hemograma y coagulación solo si sospecha de anemia, trastorno de coagulación/anticoagulante, anestesia regional posible, sangrado previsible o HEMSTOP positivo. \\*** Rx de tórax solo ante sospecha o cambio de enfermedad cardiopulmonar (la aplicación pregunta).');
p();
p('**BNP o NT-proBNP (nota \\*\\*):** solo en cirugía de riesgo intermedio o alto y si hay comorbilidad cardiovascular significativa, fragilidad (CFS ≥ 5) o capacidad funcional reducida (< 4 METs). Cuenta como comorbilidad cardiovascular significativa: cardiopatía isquémica, insuficiencia cardiaca, valvulopatía moderada o grave, fibrilación auricular u otra arritmia, arteriopatía periférica o aneurisma de aorta, ictus o AIT previo, miocardiopatía e hipertensión pulmonar. La hipertensión arterial aislada **no** cuenta (decisión del servicio, 2026-10-04).');
p();
p('**Validez:** hemograma 30 días, bioquímica 30 días, coagulación 14 días, ECG 3 meses, Rx tórax 3 meses, ecocardiograma 12 meses (18 si la función ventricular es conocida y estable). El apartado «Pruebas recientes» del paso de enfermedades recoge la fecha de cada prueba; la aplicación la compara con la de la intervención (o con hoy si aún no hay fecha, indicándolo) y **descuenta** las que sigan vigentes ese día. El BNP/NT-proBNP se pide por indicación y no se descuenta por fecha.');
p();

// —————————————————————————————— 13. Catálogo ——————————————————————————————
p('## 13. Catálogo de fármacos');
p();
p('_`datos/farmacos.csv`. `verificado_cima` indica si el nombre comercial se ha comprobado en CIMA (AEMPS)._');
p();
const porGrupo = new Map<string, typeof farmacos.filas>();
for (const fila of farmacos.filas) {
  const g = fila.valores.grupo || '(sin grupo)';
  if (!porGrupo.has(g)) porGrupo.set(g, []);
  porGrupo.get(g)!.push(fila);
}
for (const g of [...porGrupo.keys()].sort()) {
  p(`### ${g.replace(/_/g, ' ')}`);
  p();
  p('| Nombres comerciales | Principios | Regla | Confirmación | Vía | Verificación |');
  p('| --- | --- | --- | --- | --- | --- |');
  for (const fila of porGrupo.get(g)!) {
    const v = fila.valores;
    const conf = /^(s[íi]|true|1)$/i.test((v.requiere_confirmacion ?? '').trim()) ? 'sí' : 'no';
    p(`| ${ovacio(v.nombres_comerciales)} | ${ovacio(v.principios_activos)} | \`${ovacio(v.id_regla)}\` | ${conf} | ${ovacio(v.via)} | ${verificacionTexto(v)} |`);
  }
  p();
}

// —————————————————————————————— 14. Opioides ——————————————————————————————
p('## 14. Conversión de opioides a morfina oral equivalente');
p();
p('| Opioide | Factor |');
p('| --- | --- |');
for (const [n, f] of Object.entries(opioides.factores)) p(`| ${n.replace(/_/g, ' ')} | ${f} |`);
p();
p('**Sin conversión** (valoración específica): ' + opioides.sin_conversion.map((s) => s.replace(/_/g, ' ')).join(', ') + '.');
p();

// —————————————————————————————— 15. Procedimientos ——————————————————————————————
p('## 15. Procedimientos');
p();
p('_`datos/procedimientos.csv`. Riesgo cardiovascular según §7.1 (el alto se reserva para vascular mayor, cardiaca, neumonectomía, torácica mayor, hepatopancreática y oncológica multivisceral)._');
p();
const porEsp = new Map<string, typeof procedimientos.filas>();
for (const fila of procedimientos.filas) {
  const e = fila.valores.especialidad || '(sin especialidad)';
  if (!porEsp.has(e)) porEsp.set(e, []);
  porEsp.get(e)!.push(fila);
}
for (const e of [...porEsp.keys()].sort()) {
  p(`### ${e.replace(/_/g, ' ')}`);
  p();
  p('| Procedimiento | R. cardiovascular | R. hemorrágico | Neuroaxial/bloqueo | Oftalmológico | Obstétrico | R. trombótico alto | Espacio cerrado | Retina |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const fila of porEsp.get(e)!) {
    const v = fila.valores;
    p(`| ${ovacio(v.procedimiento)} | ${ovacio(v.riesgo_cardiovascular)} | ${ovacio(v.riesgo_hemorragico)} | ${ovacio(v.neuroaxial_o_bloqueo_profundo_probable)} | ${ovacio(v.grupo_oftalmologico)} | ${ovacio(v.obstetrico)} | ${ovacio(v.riesgo_trombotico_alto)} | ${ovacio(v.espacio_cerrado)} | ${ovacio(v.retina)} |`);
  }
  p();
}

// —————————————————————————————— 16. Módulos ——————————————————————————————
p('## 16. Módulos de enfermedad (anamnesis dirigida, §5.16)');
p();
p('_Preguntas que se abren al marcar cada enfermedad. Junto a cada pregunta se indica, cuando procede, qué genera cada respuesta (alerta, nota, prueba, clase de riesgo, ASA, regla o dato clínico), codificado en el propio módulo (§5.16, decisión del servicio). El motor sigue calculando el efecto en su capa; esto es la traza legible._');
p();
const ICONO_EFECTO: Record<string, string> = {
  alerta: '🔔 alerta', nota: '📝 nota', prueba: '🧪 prueba',
  clase_riesgo: '📊 clase de riesgo', asa: '🅰 ASA', regla: '💊 regla', hecho: 'ℹ dato',
};
for (const mod of modulos) {
  p(`### ${mod.titulo}`);
  p();
  if (mod.fuente) p(`_Fuente: ${esc(mod.fuente)}_`);
  p();
  for (const preg of mod.preguntas) {
    const u = preg.unidad ? ` (${preg.unidad})` : '';
    let l = `- **${esc(preg.etiqueta)}**${u} — _${preg.tipo}_`;
    if (preg.opciones && preg.opciones.length > 0) l += `: ${preg.opciones.map((o) => o.etiqueta).join(' / ')}`;
    p(l);
    if (preg.porque) p(`  - Por qué: ${esc(preg.porque)}`);
    for (const g of preg.genera ?? []) {
      const tipo = ICONO_EFECTO[g.tipo] ?? g.tipo;
      const grav = g.gravedad ? ` ${g.gravedad}` : '';
      const fuente = g.fuente ? ` _(${esc(g.fuente)})_` : '';
      const ejecutable = g.si !== undefined ? ' **[se emite]**' : '';
      p(`  - Genera → ${tipo}${grav}: si ${esc(g.cuando)} → ${esc(g.efecto)}.${fuente}${ejecutable}`);
    }
  }
  p();
}

// —————————————————————————————— 16 ter. Dispositivos cardiacos ——————————————————————————————
p('## 16 ter. Dispositivos cardiacos implantables (§5.1 bis)');
p();
p('_Recomendaciones según el tipo de dispositivo, la dependencia y la zona del procedimiento (British Heart Rhythm Society, Thomas et al., Anaesthesia 2022;77:808-17). La zona sale de la columna `zona_dispositivo` de `procedimientos.csv`. Las notas y los puntos de validación los calcula `src/dominio/reglas/dispositivosCardiacos.ts`._');
p();
p('| Dispositivo | Zona | Recomendación |');
p('| --- | --- | --- |');
[
  ['Holter / registrador', 'cualquiera', 'Sin precauciones (opcional: revisar antes y borrar memoria después).'],
  ['Marcapasos (no dependiente)', 'supraumbilical', 'Monitorizar sin reprogramar.'],
  ['Marcapasos (dependiente)', 'supraumbilical', 'Considerar modo asíncrono (frecuencia fija) con bisturí prolongado.'],
  ['Marcapasos', 'infraumbilical', 'Monitorizar sin reprogramar; si dependiente, imán disponible.'],
  ['DAI / TRC-D', 'supraumbilical / ocular / endoscopia', 'Desactivar terapias (programador o imán); si dependiente, frecuencia fija.'],
  ['DAI / TRC-D', 'infraumbilical', 'Monitorizar; razonable no desactivar; imán disponible.'],
  ['Marcapasos / DAI', 'cardiaca', 'Reprogramación (marcapasos) / desactivación del DAI.'],
  ['Marcapasos / DAI', 'dental', 'Nada salvo bisturí eléctrico.'],
  ['Marcapasos', 'litotricia', 'Revisar en el mes siguiente; no enfocar la onda cerca del generador.'],
  ['DAI', 'litotricia', 'Desactivar o imán durante la sesión.'],
  ['DAI', 'neurocirugia', 'Preferir desactivación con programador al imán.'],
  ['Marcapasos sin cables', 'cualquiera', 'No responde al imán; requiere su programador.'],
  ['DAI subcutáneo (S-ICD)', 'cualquiera', 'No estimula; imán en la axila.'],
].forEach((f) => p(`| ${f.join(' | ')} |`));
p();
p('**Colocación del imán por fabricante:** Medtronic, Boston Scientific y Biotronik, centrado sobre el generador (Biotronik pierde efecto a las 8 h: retirar y recolocar); Abbott (St. Jude), desplazado con el borde del anillo sobre el extremo del generador; MicroPort (LivaNova/Sorin), descentrado evitando la cabeza del dispositivo.');
p();
p('**Precauciones generales** (función de marcapasos o DAI): ECG desde el inicio (comprobar pulso/oximetría); desfibrilador externo y marcapasos transcutáneo disponibles; parches anteroposteriores lejos del generador; bisturí bipolar en ráfagas cortas; placa de retorno con el trayecto lejos del generador; evitar paños magnéticos sobre el tórax. DAI desactivado: monitorización continua, desfibrilador con parches, reactivar en recuperación (responsabilidad del equipo quirúrgico).');
p();
p('**Puntos de validación (§13 bis, amarillos):** DAI/TRC-D en supraumbilical, cardiaca, ocular, endoscopia o litotricia; marcapasos dependiente («sí»/«no lo sabe») en supraumbilical, cardiaca o endoscopia; revisión > 12 meses (marcapasos) / > 6 meses (DAI/TRC) o desconocida; batería agotándose o «no lo sabe»; dispositivo en ensayo clínico. Coordinar con la unidad de arritmias o la consulta de dispositivos.');
p();

// —————————————————————————————— 16 bis. Puntos de validación ——————————————————————————————
p('## 16 bis. Puntos de validación clínica (§13 bis)');
p();
p('_Mecanismo distinto de las alertas: condiciones que el anestesiólogo revisa al principio de su resumen, de dos tipos. No bloquean nada; cada una se resuelve con «Validado por [nombre]» o «Posponer o derivar». Mientras quede alguna sin validar, la hoja del paciente indica que el anestesiólogo revisará su caso. Se definen en `datos/validaciones.json` (editable desde el panel de administración). Los dispositivos cardiacos implantables añaden además puntos propios según tipo/zona/dependencia (§16 ter)._');
p();
p('**🔴 Valorar posponer la cirugía programada**');
p();
if ((validaciones.posponer ?? []).length === 0) p('_(ninguno)_');
else {
  p('| Motivo | Origen | Fuente |');
  p('| --- | --- | --- |');
  for (const pv of validaciones.posponer ?? []) p(`| ${esc(pv.motivo)} | \`${esc(pv.origen)}\` | ${ovacio(pv.fuente)} |`);
}
p();
p('**🟡 Validar antes de la intervención**');
p();
if ((validaciones.validar ?? []).length === 0) p('_(ninguno)_');
else {
  p('| Motivo | Origen | Fuente |');
  p('| --- | --- | --- |');
  for (const pv of validaciones.validar ?? []) p(`| ${esc(pv.motivo)} | \`${esc(pv.origen)}\` | ${ovacio(pv.fuente)} |`);
}
p();

// —————————————————————————————— 17. Pendiente de revisión ——————————————————————————————
p('## 17. Pendiente de revisión por el servicio');
p();
p('- **Traducciones al catalán:** los textos de la hoja del paciente en catalán (`datos/textos/ca/paciente.json`) están marcados como pendientes de revisión clínica.');
const sinVerificar = farmacos.filas.filter((f) => (f.valores.verificado_cima ?? '').trim().toLowerCase() !== 'si');
p(`- **Filas del catálogo sin verificar en CIMA (verificado_cima ≠ sí): ${sinVerificar.length}.**`);
for (const f of sinVerificar) p(`  - \`${f.valores.id}\` — ${ovacio(f.valores.nombres_comerciales)} (${(f.valores.verificado_cima || 'no').trim()})`);
p();
p('---');
p(`_Generado el ${new Date().toISOString().slice(0, 10)}._`);
p();

writeFileSync(join(RAIZ, 'CONTENIDO_CLINICO.md'), out.join('\n'), 'utf8');
console.log(`CONTENIDO_CLINICO.md: ${out.length} líneas, ${Object.keys(rf.reglas).length} reglas, ${farmacos.filas.length} fármacos, ${procedimientos.filas.length} procedimientos, ${modulos.length} módulos, ${sinVerificar.length} filas sin verificar.`);
