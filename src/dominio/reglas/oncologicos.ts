/**
 * Oncológicos — docs/documento_fuente.md §8.9.
 * - Inhibidores de tirosina cinasa y anticuerpos anti-receptores de crecimiento
 *   (imatinib, dasatinib, nilotinib, erlotinib, sorafenib, sunitinib, cetuximab):
 *   continuar hasta la cirugía.
 * - Antiangiogénicos sistémicos (bevacizumab, aflibercept oncológico,
 *   ramucirumab): última dosis hace < 6-8 semanas → alerta de diferir, requiere
 *   confirmación. El aflibercept intravítreo NO activa esta regla.
 */
import type { ResultadoFarmaco, Alerta } from '../tipos.ts';
import { TEXTO_MANTENER } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.9';

export interface EntradaOncologicoSimple {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
}

/** Inhibidores de tirosina cinasa / anti-receptores: continuar hasta la cirugía. */
export function reglaTirosinaCinasa(e: EntradaOncologicoSimple): ResultadoFarmaco {
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    accion: 'mantener',
    textoPaciente: TEXTO_MANTENER,
    reglaAplicada: `${e.principio}: continuar hasta la cirugía`,
    fuente: FUENTE,
    requiereConfirmacion: false,
  };
}

export interface EntradaAntiangiogenico {
  idFarmaco: string;
  nombreComercial: string;
  principio: string;
  /** Semanas desde la última dosis, si se conoce. */
  semanasDesdeUltimaDosis?: number;
  /** true si es aflibercept intravítreo (no activa la regla). */
  intravitreo?: boolean;
}

export interface ResultadoAntiangiogenico {
  farmaco: ResultadoFarmaco;
  alerta?: Alerta;
}

export function reglaAntiangiogenico(e: EntradaAntiangiogenico): ResultadoAntiangiogenico {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
  };

  if (e.intravitreo) {
    return {
      farmaco: {
        ...base,
        accion: 'mantener',
        textoPaciente: TEXTO_MANTENER,
        reglaAplicada: 'Aflibercept intravítreo: mantener (no activa la regla de antiangiogénicos sistémicos)',
        requiereConfirmacion: false,
      },
    };
  }

  const reciente = e.semanasDesdeUltimaDosis === undefined || e.semanasDesdeUltimaDosis < 8;
  if (reciente) {
    return {
      farmaco: {
        ...base,
        accion: 'consultar',
        textoPaciente:
          'Sobre este tratamiento, el anestesiólogo le indicará qué hacer. No lo cambie por su cuenta.',
        reglaAplicada: 'Antiangiogénico sistémico: última dosis < 6-8 semanas → diferir, requiere confirmación',
        requiereConfirmacion: true,
        ...(e.semanasDesdeUltimaDosis === undefined
          ? { datoQueFalta: 'fecha de la última dosis del antiangiogénico' }
          : {}),
      },
      alerta: {
        gravedad: 'amarilla',
        mensaje: 'Antiangiogénico sistémico reciente: retrasar la cirugía programada al menos 6-8 semanas desde la última dosis.',
        origen: 'oncológicos §8.9',
        soloAnestesiologo: false,
      },
    };
  }

  return {
    farmaco: {
      ...base,
      accion: 'mantener',
      textoPaciente: TEXTO_MANTENER,
      reglaAplicada: 'Antiangiogénico sistémico: ≥ 8 semanas desde la última dosis',
      requiereConfirmacion: false,
    },
  };
}
