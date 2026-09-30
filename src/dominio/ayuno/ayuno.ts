/**
 * Ayuno — docs/documento_fuente.md §8.14 (protocolo de Vithas Barcelona).
 * Las horas se calculan desde la hora prevista de inducción y se muestran como
 * horas de reloj. Cubre adultos, pediatría y situaciones especiales.
 */
import { horaReloj } from '../fechas/plazos.ts';
import type { Alerta } from '../tipos.ts';

/** Código de la línea de ayuno (idioma-independiente; la etiqueta se localiza). */
export type CodigoAyuno =
  | 'comida_copiosa'
  | 'comida_ligera'
  | 'liquidos_claros_libres'
  | 'liquidos_claros_max'
  | 'bebida_carbohidratos'
  | 'diabetes_liquidos'
  | 'solidos_8h'
  | 'suspender_enteral'
  | 'ped_liquidos'
  | 'ped_materna'
  | 'ped_formula'
  | 'ped_formula_menor6';

export interface LineaAyuno {
  /** Código estable (para el QR y la localización). */
  codigo: CodigoAyuno;
  concepto: string;
  /** Hora de reloj límite ("HH:MM") o rango ("HH:MM–HH:MM"); "—" si no aplica. */
  hora: string;
  /** Horas antes de la inducción. */
  horasAntes: number;
  /** Para rangos (bebida de carbohidratos): la otra cota en horas antes. */
  rangoHorasAntes?: number;
}

export interface PlanAyuno {
  lineas: LineaAyuno[];
  alertas: Alerta[];
  /** Notas solo para el anestesiólogo (profilaxis de aspiración, etc.). */
  notasAnestesiologo: string[];
}

export type SituacionEspecial =
  | 'ninguna'
  | 'diabetes'
  | 'diabetes_gastroparesia'
  | 'glp1_semanal_no_suspendido'
  | 'reflujo_sintomatico'
  | 'bariatrica_sintomatica'
  | 'embarazo_20sem'
  | 'contraste_oral_4h'
  | 'nutricion_enteral_gastrica';

export interface EntradaAyuno {
  induccion: Date;
  pediatrico: boolean;
  /** Para pediatría: edad en meses (para la regla de fórmula < 6 meses). */
  edadMeses?: number;
  situacion: SituacionEspecial;
}

function linea(induccion: Date, horasAntes: number, codigo: CodigoAyuno, concepto: string): LineaAyuno {
  const hora = new Date(induccion.getTime() - horasAntes * 3_600_000);
  return { codigo, concepto, hora: horaReloj(hora), horasAntes };
}

export function calcularAyuno(e: EntradaAyuno): PlanAyuno {
  const alertas: Alerta[] = [];
  const notasAnestesiologo: string[] = [];

  if (e.pediatrico) {
    const lineas: LineaAyuno[] = [
      linea(e.induccion, 1, 'ped_liquidos', 'Líquidos claros'),
      linea(e.induccion, 3, 'ped_materna', 'Leche materna'),
      linea(e.induccion, 6, 'ped_formula', 'Leche de fórmula y sólidos'),
    ];
    if (e.edadMeses !== undefined && e.edadMeses < 6) {
      lineas[2] = linea(e.induccion, 4, 'ped_formula_menor6', 'Leche de fórmula (menor de 6 meses)');
    }
    return {
      lineas,
      alertas: [
        {
          gravedad: 'informativa',
          mensaje: 'Riesgo de hipoglucemia en recién nacidos y lactantes pequeños si el ayuno se alarga.',
          origen: 'ayuno §8.14 (pediatría)',
          soloAnestesiologo: false,
        },
      ],
      notasAnestesiologo,
    };
  }

  // Adultos: líneas base.
  const lineas: LineaAyuno[] = [
    linea(e.induccion, 8, 'comida_copiosa', 'Comida copiosa/grasa/proteica'),
    linea(e.induccion, 6, 'comida_ligera', 'Comida ligera baja en grasa'),
    linea(e.induccion, 4, 'liquidos_claros_libres', 'Líquidos claros libres (hasta aquí)'),
    linea(e.induccion, 2, 'liquidos_claros_max', 'Líquidos claros (máx. 400 mL entre 4 y 2 h; nada después salvo medicación con un sorbo)'),
  ];

  let permiteCarbohidratos = true;

  switch (e.situacion) {
    case 'diabetes':
      lineas.push({ codigo: 'diabetes_liquidos', concepto: 'Líquidos claros sin alto contenido de azúcar', hora: '—', horasAntes: 0 });
      break;
    case 'diabetes_gastroparesia':
      lineas[0] = linea(e.induccion, 8, 'solidos_8h', 'Sólidos (ayuno de sólidos de 8 h por gastroparesia)');
      permiteCarbohidratos = false;
      alertas.push(alerta('Diabetes con gastroparesia: ayuno de sólidos de 8 h; premedicación con metoclopramida.', 'ayuno §8.14'));
      break;
    case 'glp1_semanal_no_suspendido':
      permiteCarbohidratos = false;
      alertas.push(alerta('GLP-1 semanal no suspendido: riesgo de estómago lleno.', 'ayuno §8.14'));
      break;
    case 'reflujo_sintomatico':
      permiteCarbohidratos = false;
      alertas.push(alerta('Reflujo grave sintomático el día de la intervención: riesgo de estómago lleno.', 'ayuno §8.14'));
      break;
    case 'bariatrica_sintomatica':
      lineas[0] = linea(e.induccion, 8, 'solidos_8h', 'Sólidos (ayuno de sólidos de 8 h por cirugía bariátrica sintomática)');
      permiteCarbohidratos = false;
      alertas.push(alerta('Cirugía bariátrica previa sintomática: ayuno de sólidos de 8 h; metoclopramida e inducción de secuencia rápida.', 'ayuno §8.14'));
      break;
    case 'embarazo_20sem':
      permiteCarbohidratos = false;
      alertas.push(alerta('Embarazo ≥ 20 semanas: ayuno individualizado y profilaxis de aspiración.', 'ayuno §8.14'));
      break;
    case 'contraste_oral_4h':
      permiteCarbohidratos = false;
      alertas.push(alerta('Contraste oral en las 4 h previas: riesgo de estómago lleno.', 'ayuno §8.14'));
      break;
    case 'nutricion_enteral_gastrica':
      lineas.push(linea(e.induccion, 8, 'suspender_enteral', 'Suspender nutrición enteral gástrica'));
      break;
    case 'ninguna':
      break;
  }

  if (permiteCarbohidratos) {
    lineas.push({
      codigo: 'bebida_carbohidratos',
      concepto: 'Bebida de carbohidratos (entre 2 y 3 h antes)',
      hora: `${horaReloj(new Date(e.induccion.getTime() - 3 * 3_600_000))}–${horaReloj(new Date(e.induccion.getTime() - 2 * 3_600_000))}`,
      horasAntes: 2,
      rangoHorasAntes: 3,
    });
  }

  // Profilaxis de aspiración (solo notas del anestesiólogo).
  if (
    e.situacion === 'reflujo_sintomatico' ||
    e.situacion === 'bariatrica_sintomatica' ||
    e.situacion === 'embarazo_20sem' ||
    e.situacion === 'diabetes_gastroparesia' ||
    e.situacion === 'glp1_semanal_no_suspendido' ||
    e.situacion === 'contraste_oral_4h'
  ) {
    notasAnestesiologo.push(
      'Valorar profilaxis de aspiración (citrato sódico, famotidina/omeprazol/pantoprazol, ' +
        'metoclopramida, eritromicina) y ecografía gástrica si el contenido es incierto.',
    );
  }

  return { lineas, alertas, notasAnestesiologo };
}

function alerta(mensaje: string, origen: string): Alerta {
  return { gravedad: 'amarilla', mensaje, origen, soloAnestesiologo: false };
}
