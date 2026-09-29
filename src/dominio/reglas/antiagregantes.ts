/**
 * Antiagregantes — docs/documento_fuente.md §8.3.
 * Cubre: AAS por dosis; inhibidores P2Y12 (clopidogrel, ticagrelor, prasugrel)
 * con plazos por técnica; stent reciente (alerta de diferir + confirmación);
 * P2Y12 en monoterapia y oftalmología. Los plazos numéricos vienen de
 * reglas_farmacos.json.
 */
import type { ContextoReglas, ResultadoFarmaco, Alerta } from '../tipos.ts';
import { neuroaxialOProfundo, plazoDesdeDias, TEXTO_MANTENER } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.3 (ESC 2022; protocolo del servicio)';

// ————————————— AAS —————————————

export interface EntradaAas {
  idFarmaco: string;
  nombreComercial: string;
  dosisDiariaMg: number;
  /** Indicación cardiovascular (para la sugerencia de bajar a 100 mg). */
  indicacionCardiovascular?: boolean;
  /** neurocirugía intracraneal o cirugía del canal medular. */
  neurocirugiaIntracranealOMedular?: boolean;
}

export function reglaAas(e: EntradaAas, ctx: ContextoReglas): ResultadoFarmaco {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['acido_acetilsalicilico'],
    fuente: FUENTE,
  };

  if (e.dosisDiariaMg <= 200) {
    if (e.neurocirugiaIntracranealOMedular) {
      return {
        ...base,
        accion: 'consultar',
        textoPaciente:
          'Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta.',
        reglaAplicada: 'AAS ≤ 200 mg en neurocirugía intracraneal/canal medular: requiere confirmación',
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

  // AAS > 200 mg: suspender 7 días; indicación cardiovascular → confirmación.
  const plazo = plazoDesdeDias(ctx, 7);
  const res: ResultadoFarmaco = {
    ...base,
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: 'AAS > 200 mg/día: suspender 7 días',
    requiereConfirmacion: e.indicacionCardiovascular === true,
  };
  if (e.indicacionCardiovascular) {
    res.textoAnestesiologo = 'Valorar pasar a 100 mg/día.';
    res.accion = 'consultar';
  }
  return res;
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
}

export function reglaP2y12(e: EntradaP2y12, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = neuroaxialOProfundo(ctx)
    ? DIAS_P2Y12[e.principio].neuroaxial
    : DIAS_P2Y12[e.principio].estandar;
  const plazo = plazoDesdeDias(ctx, dias);

  const res: ResultadoFarmaco = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: `${e.principio}: suspender ${dias} días${neuroaxialOProfundo(ctx) ? ' (neuroaxial/bloqueo profundo)' : ''}`,
    fuente: FUENTE,
    requiereConfirmacion: e.monoterapia,
  };
  if (e.monoterapia) {
    res.accion = 'consultar';
    res.textoAnestesiologo = 'Valorar sustituir por AAS 100 mg/día durante la retirada.';
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

// ————————————— Oftalmología moderada/alta (§8.3) —————————————

/**
 * En oftalmología de riesgo moderado o alto: sustituir antiagregantes por AAS
 * 100 mg/día y suspender el P2Y12 con los plazos del protocolo.
 */
export function reglaP2y12Oftalmo(e: EntradaP2y12, ctx: ContextoReglas): ResultadoFarmaco {
  const dias = DIAS_P2Y12[e.principio].estandar; // plazos del protocolo (no neuroaxial en oftalmo)
  const plazo = plazoDesdeDias(ctx, dias);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: `${plazo.textoPaciente} Su médico puede sustituirlo por AAS 100 mg/día durante ese tiempo.`,
    reglaAplicada: `Oftalmología moderada/alta: sustituir por AAS 100 mg/día y suspender ${e.principio} ${dias} días`,
    fuente: FUENTE,
    requiereConfirmacion: false,
    textoAnestesiologo: 'Sustituir antiagregante por AAS 100 mg/día; suspender P2Y12 con plazos del protocolo.',
  };
}
