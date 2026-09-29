/**
 * Antidiabéticos e insulina — docs/documento_fuente.md §8.5 (Decisiones 5, 6, 8).
 * Cubre: metformina, SGLT2, GLP-1 semanal y diario, bomba de insulina.
 * (Sulfonilureas, glinidas, DPP-4, pioglitazona e insulinas basales se añadirán
 *  como reglas simples análogas; el motor y las pruebas ya validan el patrón.)
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { fechaLarga, startOfDay, endOfDay } from '../fechas/plazos.ts';

const FUENTE = 'docs/documento_fuente.md §8.5 (protocolo de preanestesia en diabéticos; CPOC)';

// ————————————— Metformina —————————————

export interface EntradaMetformina {
  idFarmaco: string;
  nombreComercial: string;
  contrasteYodadoPrevisto?: boolean;
}

export function reglaMetformina(e: EntradaMetformina, ctx: ContextoReglas): ResultadoFarmaco {
  const intervencion = ctx.fechaHoraIntervencion;
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['metformina'],
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
  if (e.contrasteYodadoPrevisto) {
    return {
      ...base,
      accion: 'suspender',
      textoPaciente: 'Deje de tomarla 24-48 h antes por el contraste yodado previsto.',
      reglaAplicada: 'Metformina con contraste yodado: suspender 24-48 h antes',
    };
  }
  // "No tomar el día de la intervención": la última toma permitida es el día previo.
  const ultima = new Date(intervencion);
  ultima.setDate(ultima.getDate() - 1);
  return {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: ultima,
    textoPaciente: 'No la tome el día de la intervención. Los días previos, tómela como siempre.',
    reglaAplicada: 'Metformina: no tomar el día de la intervención',
  };
}

// ————————————— SGLT2 —————————————

export interface EntradaSglt2 {
  idFarmaco: string;
  nombreComercial: string;
  principio: string; // p.ej. empagliflozina, ertugliflozina
}

export function reglaSglt2(e: EntradaSglt2, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = e.principio === 'ertugliflozina' ? 4 : 3;
  const limite = new Date(ctx.fechaHoraIntervencion);
  limite.setDate(limite.getDate() - dias);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: limite,
    textoPaciente: `Deje de tomarlo ${dias} días antes (última toma el ${fechaLarga(limite)}).`,
    reglaAplicada: `SGLT2 (${e.principio}): suspender ${dias} días`,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

// ————————————— GLP-1 semanal (Decisión 8) —————————————

export interface EntradaGlp1Semanal {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Fecha de la próxima dosis semanal programada. */
  proximaDosis: Date;
}

/**
 * Si la dosis semanal cae entre 7 días antes y el día de la intervención (ambos
 * incluidos), no se administra; se indica la fecha exacta de la dosis omitida.
 */
export function reglaGlp1Semanal(e: EntradaGlp1Semanal, ctx: ContextoReglas): ResultadoFarmaco {
  const iv = ctx.fechaHoraIntervencion;
  const inicioVentana = new Date(iv);
  inicioVentana.setDate(inicioVentana.getDate() - 7);

  // Comparación por día (ambos incluidos): inicioVentana (00:00) .. fin del día de la intervención.
  const dosisDia = startOfDay(e.proximaDosis).getTime();
  const desde = startOfDay(inicioVentana).getTime();
  const hasta = endOfDay(iv).getTime();
  const caeEnVentana = dosisDia >= desde && dosisDia <= hasta;

  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
    requiereConfirmacion: false,
  };

  if (caeEnVentana) {
    return {
      ...base,
      accion: 'suspender',
      fechaHoraUltimaToma: e.proximaDosis,
      textoPaciente: `No se ponga la dosis del ${fechaLarga(e.proximaDosis)}. Además, dieta de líquidos claros durante las 24 h previas a la intervención (siga la hoja adjunta).`,
      reglaAplicada: 'GLP-1 semanal: dosis dentro de la ventana de 7 días (ambos incluidos) → omitir; dieta líquida 24 h',
    };
  }

  return {
    ...base,
    accion: 'mantener',
    textoPaciente: 'Puede ponerse su dosis semanal como siempre; no cae en la semana previa a la intervención.',
    reglaAplicada: 'GLP-1 semanal: la dosis no cae en la ventana de 7 días previos',
  };
}

// ————————————— GLP-1 diario (Decisión 8) —————————————

export interface EntradaGlp1Diario {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

export function reglaGlp1Diario(e: EntradaGlp1Diario, ctx: ContextoReglas): ResultadoFarmaco {
  // Omitir los 3 días previos y el día de la intervención → última dosis 4 días antes.
  const limite = new Date(ctx.fechaHoraIntervencion);
  limite.setDate(limite.getDate() - 4);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: limite,
    textoPaciente: `Deje de tomarlo los 3 días previos y el día de la intervención. La última toma será el ${fechaLarga(limite)}.`,
    reglaAplicada: 'GLP-1 diario: omitir 3 días previos + día de la IQ (última dosis 4 días antes)',
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

// ————————————— Bomba de insulina (Decisión 6) —————————————

export interface EntradaBombaInsulina {
  idFarmaco: string;
  nombreComercial: string;
}

export function reglaBombaInsulina(e: EntradaBombaInsulina, ctx: ContextoReglas): ResultadoFarmaco {
  // CMA de riesgo bajo: sin confirmación. Intermedio/alto o ingreso: requiere confirmación.
  const cmaBajoRiesgo = ctx.regimen === 'cma' && ctx.riesgoCardiovascular === 'bajo';
  const requiereConfirmacion = !cmaBajoRiesgo;

  const res: ResultadoFarmaco = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['insulina_bomba'],
    accion: requiereConfirmacion ? 'consultar' : 'ajustar',
    textoPaciente: requiereConfirmacion
      ? 'Sobre su bomba de insulina, el anestesiólogo le indicará qué hacer. No cambie la pauta por su cuenta.'
      : 'Ponga la basal al 70-80 % de lo habitual y no se administre bolos el día de la intervención.',
    reglaAplicada: cmaBajoRiesgo
      ? 'Bomba de insulina, CMA de riesgo bajo: basal 70-80 %, suspender bolos (sin confirmación)'
      : 'Bomba de insulina, riesgo intermedio/alto o ingreso: requiere confirmación',
    fuente: FUENTE,
    requiereConfirmacion,
  };
  return res;
}
