/**
 * Antiagregantes — docs/documento_fuente.md §8.3.
 * Cubre: AAS por dosis; inhibidores P2Y12 (clopidogrel, ticagrelor, prasugrel)
 * con plazos por técnica; stent reciente (alerta de diferir + confirmación);
 * P2Y12 en monoterapia y oftalmología. Los plazos numéricos vienen de
 * reglas_farmacos.json.
 */
import type { ContextoReglas, ResultadoFarmaco, Alerta } from '../tipos.ts';
import { neuroaxialOProfundo, plazoDesdeDias, plazoDesdeHoras, faltaHora, resultadoFaltaHora, TEXTO_MANTENER } from './motor.ts';
import { fechaHoraLimite } from '../fechas/plazos.ts';

const FUENTE = 'docs/documento_fuente.md §8.3 (ESC 2022; protocolo del servicio)';

// ————————————— AAS —————————————

export interface EntradaAas {
  idFarmaco: string;
  nombreComercial: string;
  dosisDiariaMg: number;
  /** Indicación cardiovascular (para la sugerencia de bajar a 100 mg). */
  indicacionCardiovascular?: boolean;
}

/**
 * AAS (§8.3, decisión del servicio):
 *  - Muy alto riesgo de sangrado = espacio cerrado (neurocirugía/canal medular) o retina.
 *  - Dosis ≤ 200 mg: se mantiene; en espacio cerrado requiere confirmación (en retina se
 *    mantiene según el protocolo oftalmológico).
 *  - Dosis > 200 mg: se mantiene por defecto; solo se suspende 5 días antes si hay muy
 *    alto riesgo de sangrado o técnica neuroaxial. Si hay que suspenderlo y la indicación
 *    es cardiovascular, requiere confirmación con la sugerencia de pasar a 100 mg/día.
 */
export function reglaAas(e: EntradaAas, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['acido_acetilsalicilico'],
    fuente: FUENTE,
  };
  const muyAltoSangrado = ctx.espacioCerrado || ctx.retina;
  const debeSuspender = muyAltoSangrado || ctx.neuroaxial;

  if (e.dosisDiariaMg <= 200) {
    if (ctx.espacioCerrado) {
      return {
        ...base,
        accion: 'consultar',
        textoPaciente:
          'Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
        reglaAplicada: 'AAS ≤ 200 mg en cirugía de espacio cerrado: requiere confirmación',
        requiereConfirmacion: true,
      };
    }
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'AAS ≤ 200 mg/día: mantener',
      requiereConfirmacion: false,
    };
  }

  // Dosis > 200 mg.
  if (!debeSuspender) {
    return {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'AAS > 200 mg/día: mantener (sin muy alto riesgo de sangrado ni técnica neuroaxial)',
      requiereConfirmacion: false,
    };
  }
  if (e.indicacionCardiovascular) {
    return {
      ...base,
      accion: 'consultar',
      textoPaciente:
        'Sobre este medicamento, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta.',
      reglaAplicada: 'AAS > 200 mg/día que debe suspenderse con indicación cardiovascular: requiere confirmación',
      requiereConfirmacion: true,
      textoAnestesiologo: 'Valorar pasar a 100 mg/día.',
    };
  }
  const plazo = plazoDesdeDias(ctx, 5);
  if (faltaHora(plazo)) return resultadoFaltaHora(base);
  return {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: 'AAS > 200 mg/día con muy alto riesgo de sangrado o neuroaxial: suspender 5 días',
    requiereConfirmacion: false,
  };
}

// ————————————— P2Y12 —————————————

export type P2y12 = 'clopidogrel' | 'ticagrelor' | 'prasugrel';

const DIAS_P2Y12: Record<P2y12, { estandar: number; neuroaxial: number }> = {
  clopidogrel: { estandar: 5, neuroaxial: 7 },
  ticagrelor: { estandar: 5, neuroaxial: 7 },
  prasugrel: { estandar: 7, neuroaxial: 10 },
};

export interface EntradaP2y12 {
  idFarmaco: string;
  nombreComercial: string;
  principio: P2y12;
  /** true si el paciente NO toma AAS (monoterapia P2Y12). */
  monoterapia: boolean;
  /** true si es portador de stent (aunque no sea reciente): ninguna suspensión sin confirmación (§8.3). */
  portadorStent?: boolean;
}

export function reglaP2y12(e: EntradaP2y12, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = neuroaxialOProfundo(ctx)
    ? DIAS_P2Y12[e.principio].neuroaxial
    : DIAS_P2Y12[e.principio].estandar;
  const plazo = plazoDesdeDias(ctx, dias);
  const baseP2y12 = { idFarmaco: e.idFarmaco, nombreComercial: e.nombreComercial, principiosActivos: [e.principio], fuente: FUENTE };
  if (faltaHora(plazo)) return resultadoFaltaHora(baseP2y12);

  const res: ResultadoFarmaco = {
    ...baseP2y12,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: `${e.principio}: suspender ${dias} días${neuroaxialOProfundo(ctx) ? ' (neuroaxial/bloqueo profundo)' : ''}`,
    requiereConfirmacion: e.monoterapia === true || e.portadorStent === true,
  };
  if (e.monoterapia) {
    res.accion = 'consultar';
    res.textoAnestesiologo = 'Valorar sustituir por AAS 100 mg/día durante la retirada.';
  }
  if (e.portadorStent) {
    res.accion = 'consultar';
    res.reglaAplicada += ' — portador de stent: ninguna suspensión sin confirmación (§8.3)';
  }
  return res;
}

// ————————————— Stent reciente (§8.3 + Decisión 3) —————————————

export interface EntradaStent {
  /** Meses desde el implante. */
  mesesDesdeImplante: number;
  /** true si fue por SCA; false si programado. */
  traSca: boolean;
}

export interface ResultadoStent {
  /** true si el stent es reciente y dispara alerta de diferir + confirmación. */
  recienteRequiereConfirmacion: boolean;
  alertas: Alerta[];
  /** true si debe suprimirse toda pauta de antiagregantes en la hoja del paciente. */
  suprimirPautaAntiagregantesEnHoja: boolean;
}

/**
 * Evalúa el stent reciente. Si además hay neuroaxial, se emiten ambas alertas
 * (la del stent primero y en rojo) y no se muestra pauta de antiagregantes en la
 * hoja del paciente hasta la confirmación (R12.7, Decisión 3).
 */
export function evaluarStent(e: EntradaStent, ctx: ContextoReglas): ResultadoStent {
  const reciente =
    (!e.traSca && e.mesesDesdeImplante < 6) || (e.traSca && e.mesesDesdeImplante < 12);

  if (!reciente) {
    return {
      recienteRequiereConfirmacion: false,
      alertas: [],
      suprimirPautaAntiagregantesEnHoja: false,
    };
  }

  const alertas: Alerta[] = [
    {
      gravedad: 'roja',
      mensaje:
        'Stent reciente: valorar diferir la cirugía programada; no suspender la doble antiagregación sin consultar con cardiología.',
      origen: 'antiagregantes §8.3',
      soloAnestesiologo: false,
    },
  ];

  if (neuroaxialOProfundo(ctx)) {
    alertas.push({
      gravedad: 'amarilla',
      mensaje:
        'Técnica neuroaxial/bloqueo profundo prevista con stent reciente: coordinar plazos de antiagregantes con la técnica.',
      origen: 'antiagregantes §8.3 + técnica neuroaxial',
      soloAnestesiologo: false,
    });
  }

  return {
    recienteRequiereConfirmacion: true,
    alertas,
    suprimirPautaAntiagregantesEnHoja: true,
  };
}

// ————————————— Otros antiagregantes (§8.3) —————————————

/** Triflusal: 7 días; 10 días con neuroaxial o bloqueo profundo. */
export function reglaTriflusal(idFarmaco: string, nombreComercial: string, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = neuroaxialOProfundo(ctx) ? 10 : 7;
  const plazo = plazoDesdeDias(ctx, dias);
  if (faltaHora(plazo)) return resultadoFaltaHora({ idFarmaco, nombreComercial, principiosActivos: ['triflusal'], fuente: FUENTE });
  return {
    idFarmaco, nombreComercial, principiosActivos: ['triflusal'],
    accion: 'suspender', fechaHoraUltimaToma: plazo.fechaHoraUltimaToma, textoPaciente: plazo.textoPaciente,
    reglaAplicada: `Triflusal: suspender ${dias} días${neuroaxialOProfundo(ctx) ? ' (neuroaxial/bloqueo profundo)' : ''}`,
    fuente: FUENTE, requiereConfirmacion: false,
  };
}

/** Dipiridamol: 24 h; 48 h con neuroaxial o bloqueo profundo. */
export function reglaDipiridamol(idFarmaco: string, nombreComercial: string, ctx: ContextoReglas): ResultadoFarmaco {
  const horas = neuroaxialOProfundo(ctx) ? 48 : 24;
  const plazo = plazoDesdeHoras(ctx, horas);
  if (faltaHora(plazo)) return resultadoFaltaHora({ idFarmaco, nombreComercial, principiosActivos: ['dipiridamol'], fuente: FUENTE });
  return {
    idFarmaco, nombreComercial, principiosActivos: ['dipiridamol'],
    accion: 'suspender', fechaHoraUltimaToma: plazo.fechaHoraUltimaToma, textoPaciente: plazo.textoPaciente,
    reglaAplicada: `Dipiridamol: suspender ${horas} h${neuroaxialOProfundo(ctx) ? ' (neuroaxial/bloqueo profundo)' : ''}`,
    fuente: FUENTE, requiereConfirmacion: false,
  };
}

/** Cilostazol: 3 días si riesgo hemorrágico alto o neuroaxial/bloqueo profundo; si no, mantener. */
export function reglaCilostazol(idFarmaco: string, nombreComercial: string, ctx: ContextoReglas): ResultadoFarmaco {
  const suspende = ctx.riesgoHemorragico === 'alto' || neuroaxialOProfundo(ctx);
  if (!suspende) {
    return {
      idFarmaco, nombreComercial, principiosActivos: ['cilostazol'],
      accion: 'mantener', textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'Cilostazol: mantener (riesgo hemorrágico no alto, sin neuroaxial/bloqueo profundo)',
      fuente: FUENTE, requiereConfirmacion: false,
    };
  }
  const plazo = plazoDesdeDias(ctx, 3);
  if (faltaHora(plazo)) return resultadoFaltaHora({ idFarmaco, nombreComercial, principiosActivos: ['cilostazol'], fuente: FUENTE });
  return {
    idFarmaco, nombreComercial, principiosActivos: ['cilostazol'],
    accion: 'suspender', fechaHoraUltimaToma: plazo.fechaHoraUltimaToma, textoPaciente: plazo.textoPaciente,
    reglaAplicada: 'Cilostazol: suspender 3 días (riesgo hemorrágico alto o neuroaxial/bloqueo profundo)',
    fuente: FUENTE, requiereConfirmacion: false,
  };
}

/** Sulodexida: 48 h si riesgo hemorrágico alto o neuroaxial/bloqueo profundo; si no, mantener. (No interviene en pruebas, §7.3). */
export function reglaSulodexida(idFarmaco: string, nombreComercial: string, ctx: ContextoReglas): ResultadoFarmaco {
  const suspende = ctx.riesgoHemorragico === 'alto' || neuroaxialOProfundo(ctx);
  if (!suspende) {
    return {
      idFarmaco, nombreComercial, principiosActivos: ['sulodexida'],
      accion: 'mantener', textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'Sulodexida: mantener (riesgo hemorrágico no alto, sin neuroaxial/bloqueo profundo)',
      fuente: 'docs/documento_fuente.md §8.3', requiereConfirmacion: false,
    };
  }
  const plazo = plazoDesdeHoras(ctx, 48);
  if (faltaHora(plazo)) return resultadoFaltaHora({ idFarmaco, nombreComercial, principiosActivos: ['sulodexida'], fuente: 'docs/documento_fuente.md §8.3' });
  return {
    idFarmaco, nombreComercial, principiosActivos: ['sulodexida'],
    accion: 'suspender', fechaHoraUltimaToma: plazo.fechaHoraUltimaToma, textoPaciente: plazo.textoPaciente,
    reglaAplicada: 'Sulodexida: suspender 48 h (riesgo hemorrágico alto o neuroaxial/bloqueo profundo)',
    fuente: 'docs/documento_fuente.md §8.3', requiereConfirmacion: false,
  };
}

/** Inhibidores GP IIb/IIIa y cangrelor: uso hospitalario, con sus plazos; siempre requieren confirmación. */
export type GpIibIiia = 'eptifibatida' | 'tirofiban' | 'cangrelor' | 'abciximab';

const HORAS_GP: Record<GpIibIiia, { estandar: number; neuroaxial: number }> = {
  eptifibatida: { estandar: 4, neuroaxial: 6 },
  tirofiban: { estandar: 8, neuroaxial: 8 }, // 4-8 h → extremo conservador 8
  cangrelor: { estandar: 1, neuroaxial: 3 },
  abciximab: { estandar: 48, neuroaxial: 48 }, // 24-48 h → extremo conservador 48
};

export function reglaGpIibIiia(idFarmaco: string, nombreComercial: string, principio: GpIibIiia, ctx: ContextoReglas): ResultadoFarmaco {
  const horas = neuroaxialOProfundo(ctx) ? HORAS_GP[principio].neuroaxial : HORAS_GP[principio].estandar;
  // Perfusión IV hospitalaria: la última administración permitida es el propio límite.
  const limite = fechaHoraLimite(ctx.fechaHoraIntervencion, horas);
  return {
    idFarmaco, nombreComercial, principiosActivos: [principio],
    accion: 'consultar', fechaHoraUltimaToma: limite,
    textoPaciente: 'Uso hospitalario: el anestesiólogo indicará la pauta. No lo cambie por su cuenta.',
    reglaAplicada: `${principio} (GP IIb/IIIa o cangrelor): ${horas} h (uso hospitalario); requiere confirmación`,
    fuente: FUENTE, requiereConfirmacion: true,
  };
}

// ————————————— Oftalmología moderada/alta (§8.3) —————————————

/**
 * En oftalmología de riesgo moderado o alto: sustituir antiagregantes por AAS
 * 100 mg/día y suspender el P2Y12 con los plazos del protocolo.
 */
export function reglaP2y12Oftalmo(e: EntradaP2y12, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = DIAS_P2Y12[e.principio].estandar; // plazos del protocolo (no neuroaxial en oftalmo)
  const plazo = plazoDesdeDias(ctx, dias);
  const baseOft = { idFarmaco: e.idFarmaco, nombreComercial: e.nombreComercial, principiosActivos: [e.principio], fuente: FUENTE };
  if (faltaHora(plazo)) return resultadoFaltaHora(baseOft);
  return {
    ...baseOft,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: `${plazo.textoPaciente} Su médico puede sustituirlo por AAS 100 mg/día durante ese tiempo.`,
    reglaAplicada: `Oftalmología moderada/alta: sustituir por AAS 100 mg/día y suspender ${e.principio} ${dias} días`,
    fuente: FUENTE,
    requiereConfirmacion: false,
    textoAnestesiologo: 'Sustituir antiagregante por AAS 100 mg/día; suspender P2Y12 con plazos del protocolo.',
  };
}
