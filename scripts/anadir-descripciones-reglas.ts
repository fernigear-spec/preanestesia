/**
 * Añade el campo "descripcion" (lenguaje llano) a cada regla de reglas_farmacos.json
 * (§16, para que CONTENIDO_CLINICO.md describa lo que hace el programa, no solo los
 * parámetros). Ejecutar una vez: node --experimental-strip-types scripts/anadir-descripciones-reglas.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RUTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'datos/reglas_farmacos.json');

const DESCRIPCIONES: Record<string, string> = {
  avk_warfarina: 'Antivitamina K (warfarina): suspender 5 días antes. No se suspende en cirugía oftalmológica de bajo riesgo ni si el riesgo hemorrágico es mínimo. Con alto riesgo tromboembólico (válvula mecánica, etc.) se valora terapia puente con HBPM y requiere confirmación del anestesiólogo.',
  avk_acenocumarol: 'Antivitamina K (acenocumarol/Sintrom): suspender 3 días antes. No se suspende en cirugía oftalmológica de bajo riesgo ni si el riesgo hemorrágico es mínimo. Con alto riesgo tromboembólico se valora terapia puente con HBPM y requiere confirmación.',
  acod_dabigatran: 'ACOD dabigatrán: la última toma se fija en HORAS antes, no en plazos absolutos, ajustadas por función renal. Riesgo hemorrágico bajo: 48 h; alto o técnica neuroaxial: 72 h. Con neuroaxial se alarga por aclaramiento (72 h si >80, 96 h si 50-80, 120 h si <50 mL/min). No se suspende en oftalmología de bajo riesgo.',
  acod_antixa: 'ACOD anti-Xa (apixabán, rivaroxabán, edoxabán): última toma 48 h antes con riesgo hemorrágico bajo; 72 h con riesgo alto o técnica neuroaxial. Con aclaramiento < 30 mL/min se añaden horas (24 h más; 96 h con neuroaxial). Si falta el aclaramiento, requiere confirmación. No se suspende en oftalmología de bajo riesgo.',
  aas: 'Ácido acetilsalicílico: se mantiene si la dosis diaria es ≤ 200 mg. Con dosis alta se suspende 7 días antes. En neurocirugía intracraneal o medular y en cirugía de espacio cerrado requiere confirmación aunque la indicación sea cardiovascular.',
  p2y12_clopidogrel: 'Clopidogrel: suspender 5 días antes (7 días con técnica neuroaxial o bloqueo profundo). En portador de stent o en monoterapia sin AAS, requiere confirmación del anestesiólogo. Stent reciente: alerta de diferir la cirugía.',
  p2y12_ticagrelor: 'Ticagrelor: suspender 5 días antes (7 días con neuroaxial o bloqueo profundo). En portador de stent o monoterapia sin AAS, requiere confirmación.',
  p2y12_prasugrel: 'Prasugrel: suspender 7 días antes (10 días con neuroaxial o bloqueo profundo). En portador de stent o monoterapia sin AAS, requiere confirmación.',
  triflusal: 'Triflusal: suspender 7 días antes (10 días con neuroaxial o bloqueo profundo).',
  dipiridamol: 'Dipiridamol: última toma 24 h antes (48 h con neuroaxial o bloqueo profundo).',
  cilostazol: 'Cilostazol: se mantiene salvo riesgo hemorrágico alto o técnica neuroaxial, en cuyo caso se suspende 3 días antes.',
  sulodexida: 'Sulodexida: se mantiene salvo riesgo hemorrágico alto o neuroaxial (última dosis 48 h antes). No interviene en la decisión de pruebas complementarias.',
  aine_ibuprofeno: 'Ibuprofeno (AINE): suspender 24 h antes.',
  aine_naproxeno: 'Naproxeno (AINE): suspender 72 h antes (vida media larga).',
  aine_diclofenaco: 'Diclofenaco (AINE): suspender 24 h antes.',
  aine_dexketoprofeno: 'Dexketoprofeno (AINE): suspender 24 h antes.',
  aine_ketorolaco: 'Ketorolaco (AINE): suspender 24 h antes.',
  aine_celecoxib: 'Celecoxib (COX-2): se mantiene (no afecta a la agregación plaquetaria).',
  aine_etoricoxib: 'Etoricoxib (COX-2): se mantiene (no afecta a la agregación plaquetaria).',
  metformina: 'Metformina: no tomar el día de la intervención. Con contraste yodado, suspender 48 h. En combinaciones fijas que la retiran antes de su plazo, nota de vigilar la glucemia.',
  sulfonilurea: 'Sulfonilurea: no tomar el día de la intervención (riesgo de hipoglucemia en ayunas).',
  glinida: 'Glinida: no tomar el día de la intervención.',
  dpp4: 'Inhibidor DPP-4: no tomar la mañana de la intervención.',
  pioglitazona: 'Pioglitazona: no tomar el día de la intervención.',
  sglt2: 'Inhibidor SGLT2: suspender 3 días antes (4 días la ertugliflozina) por el riesgo de cetoacidosis euglucémica.',
  glp1_semanal: 'Agonista GLP-1 semanal: la última dosis debe ser al menos 7 días antes de la intervención; si la siguiente cae dentro de esos 7 días, se omite. Dieta líquida las 24 h previas.',
  glp1_diario: 'Agonista GLP-1 diario: la última dosis 4 días antes de la intervención.',
  bomba_insulina: 'Bomba de insulina: mantener la basal al 80 %. En régimen con ingreso o riesgo cardiovascular intermedio o alto, requiere confirmación del anestesiólogo.',
  insulina_glp1_fija: 'Combinación fija insulina basal + GLP-1: requiere confirmación (omitir el GLP-1 dejaría sin insulina basal).',
  litio: 'Litio: última toma 24 h antes con riesgo cardiovascular bajo; 48 h con intermedio; 72 h con alto.',
  ieca_ara2: 'IECA / ARA-II: no tomar el día de la intervención. Excepción: si el motivo es insuficiencia cardiaca con disfunción sistólica, infarto reciente o proteinuria/nefropatía, se mantiene.',
  sacubitrilo_valsartan: 'Sacubitrilo/valsartán (Entresto): requiere confirmación del anestesiólogo.',
  corticoide_sistemico: 'Corticoide sistémico: se mantiene; valorar dosis de estrés perioperatoria si equivale a ≥ 5 mg/día de prednisona más de 3 semanas.',
  diuretico: 'Diurético: no tomar la mañana de la intervención.',
  hbpm: 'HBPM: profiláctica → última dosis 12 h antes; terapéutica → 24 h antes. La clasificación (profiláctica/terapéutica) usa dosis, pauta, peso y aclaramiento (tablas SETH); si no encaja, se pregunta. En dosis terapéutica, nota de valorar anti-Xa si hay dudas.',
  heparina_sodica: 'Heparina sódica intravenosa: uso hospitalario; se suspende 4-6 h antes.',
  fondaparinux: 'Fondaparinux: profiláctico 36 h antes (48 h con neuroaxial, bloqueo profundo o alto riesgo hemorrágico; contraindicado con aclaramiento < 20, alerta). Terapéutico 48 h antes (72 h con neuroaxial, bloqueo profundo, alto riesgo hemorrágico o aclaramiento < 50).',
  gp_iibiiia: 'Inhibidor de la glicoproteína IIb/IIIa: requiere confirmación (uso hospitalario).',
  insulina_basal: 'Insulina basal (glargina, degludec, detemir): la dosis de la noche previa y la de la mañana de la intervención, al 80 %.',
  insulina_nph: 'Insulina NPH: dosis de la noche previa completa; la de la mañana de la intervención, al 50 %.',
  insulina_rapida: 'Insulina rápida: no ponerse la dosis del desayuno el día de la intervención; solo pauta correctora según la glucemia.',
  insulina_premezclada: 'Insulina premezclada: la dosis de la mañana de la intervención, al 50 %.',
  imao_irreversible: 'IMAO irreversible: suspender 10-14 días antes; requiere confirmación. Nota: evitar meperidina y azul de metileno (riesgo de síndrome serotoninérgico).',
  moclobemida: 'Moclobemida (IMAO reversible): última toma 24 h antes. Nota: precaución con fármacos serotoninérgicos y meperidina.',
  imao_b: 'IMAO-B (selegilina, rasagilina): se mantiene, con nota al anestesiólogo.',
  inmunosupresor_clasico: 'Inmunosupresor clásico: la conducta depende de la indicación. En enfermedad autoinmune, suspender 2 días antes; en trasplante, mantener. Requiere confirmación según la indicación.',
  metotrexato: 'Metotrexato: se mantiene si la dosis semanal es < 20 mg; con ≥ 20 mg/semana, valorar según la función renal.',
  fame_mantener: 'FAME que se mantiene (hidroxicloroquina, sulfasalazina, etc.).',
  jak: 'Inhibidor JAK (tofacitinib, baricitinib, etc.): suspender 3 días antes.',
  biologico: 'Fármaco biológico: requiere confirmación; se procura programar la cirugía a mitad del intervalo entre dosis.',
  tirosina_cinasa: 'Inhibidor de la tirosina-cinasa: valorar la suspensión perioperatoria según el fármaco; consultar con el anestesiólogo.',
  antiangiogenico: 'Antiangiogénico (bevacizumab y similares): retrasar la cirugía 6-8 semanas desde la última dosis; requiere confirmación (alerta).',
  antiangiogenico_intravitreo: 'Antiangiogénico intravítreo: se mantiene (no afecta a la cirugía).',
  fitoterapia: 'Fitoterapia y suplementos con efecto sobre la coagulación: suspender 14 días antes si es posible (mínimo 7).',
  anticonceptivo_ths: 'Anticonceptivo hormonal / THS: en cirugía de riesgo trombótico alto, valorar suspender 4-6 semanas antes; requiere confirmación. Si no, se mantiene. En ambos casos, advertencia del sugammadex según la vía (oral: instrucciones de «dosis olvidada»; no oral: método de barrera 7 días).',
  mantener_generico: 'Se mantiene según su vía de administración; sin plazo de suspensión.',
  alfabloqueante_flacido: 'Alfabloqueante urológico (tamsulosina, silodosina): se mantiene; en cirugía oftalmológica, aviso del riesgo de síndrome de iris flácido intraoperatorio.',
  no_catalogado: 'Fármaco no catalogado: mantener y consultar con el anestesiólogo.',
};

const json = JSON.parse(readFileSync(RUTA, 'utf8')) as { reglas: Record<string, Record<string, unknown>> };
const faltan: string[] = [];
for (const [id, regla] of Object.entries(json.reglas)) {
  const desc = DESCRIPCIONES[id];
  if (!desc) { faltan.push(id); continue; }
  // Coloca "descripcion" al principio del objeto de la regla.
  json.reglas[id] = { descripcion: desc, ...regla };
}
if (faltan.length > 0) {
  console.error(`Faltan descripciones para: ${faltan.join(', ')}`);
  process.exit(1);
}
writeFileSync(RUTA, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(`reglas_farmacos.json: descripción añadida a ${Object.keys(json.reglas).length} reglas.`);
