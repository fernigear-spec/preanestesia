/**
 * Antivitamina K (warfarina, acenocumarol) — docs/documento_fuente.md §8.1.
 * - Oftalmología de riesgo bajo o riesgo hemorrágico mínimo: no suspender (verificar INR).
 * - Resto: suspender warfarina 5 días, acenocumarol 3 días.
 * - Terapia puente (alto riesgo tromboembólico): enoxaparina 1 mg/kg/12 h
 *   (1 mg/kg/24 h si CrCl < 30), última dosis la mañana del día previo.
 *   Siempre requiere confirmación.
 */
import type { ContextoReglas, ResultadoFarmaco } from '../tipos.ts';
import { plazoDesdeDias, faltaHora, resultadoFaltaHora } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.1 (protocolo del servicio; ESC 2022)';

export type Avk = 'warfarina' | 'acenocumarol';
const DIAS_AVK: Record<Avk, number> = { warfarina: 5, acenocumarol: 3 };

export interface EntradaAvk {
  idFarmaco: string;
  nombreComercial: string;
  principio: Avk;
  /** true si el paciente cumple algún criterio de alto riesgo tromboembólico (§8.1). */
  altoRiesgoTromboembolico: boolean;
  /** true si es portador de válvula mecánica o stent: ninguna suspensión sin confirmación (§8.3). */
  portadorValvulaMecanicaOStent?: boolean;
}

export interface ResultadoAvk {
  farmaco: ResultadoFarmaco;
  /** Pauta de puente calculada (solo si aplica), para las notas del anestesiólogo. */
  puente?: {
    dosisMgPorToma: number;
    intervaloHoras: number;
    textoAnestesiologo: string;
  };
}

export function reglaAvk(e: EntradaAvk, ctx: ContextoReglas): ResultadoAvk {
  const base = {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: [e.principio],
    fuente: FUENTE,
  };

  // No suspender en oftalmología de riesgo bajo o riesgo hemorrágico mínimo.
  if (ctx.grupoOftalmologico === 'riesgo_bajo' || ctx.riesgoHemorragico === 'minimo') {
    return {
      farmaco: {
        ...base,
        accion: 'mantener',
        textoPaciente:
          'No suspenda este anticoagulante. Se comprobará que su último control de INR está en rango.',
        reglaAplicada: 'AVK, oftalmología riesgo bajo / hemorrágico mínimo: no suspender (verificar INR)',
        requiereConfirmacion: false,
      },
    };
  }

  const dias = DIAS_AVK[e.principio];
  const plazo = plazoDesdeDias(ctx, dias);
  if (faltaHora(plazo)) return { farmaco: resultadoFaltaHora(base) };

  // Terapia puente con alto riesgo tromboembólico → siempre requiere confirmación.
  if (e.altoRiesgoTromboembolico) {
    const dosisPorToma = Math.round(ctx.pesoKg * 1); // 1 mg/kg
    const intervalo = ctx.aclaramiento !== null && ctx.aclaramiento < 30 ? 24 : 12;
    return {
      farmaco: {
        ...base,
        accion: 'consultar',
        fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
        textoPaciente:
          'Sobre este anticoagulante, el anestesiólogo le llamará para indicarle cómo hacer el cambio. No lo modifique por su cuenta.',
        reglaAplicada: `AVK con alto riesgo tromboembólico: suspender ${dias} días + terapia puente con enoxaparina`,
        requiereConfirmacion: true,
        textoAnestesiologo: `Terapia puente: enoxaparina ${dosisPorToma} mg SC cada ${intervalo} h (1 mg/kg, peso ${ctx.pesoKg} kg${intervalo === 24 ? '; CrCl < 30 → cada 24 h' : ''}); última dosis la mañana del día previo (24 h antes).`,
      },
      puente: {
        dosisMgPorToma: dosisPorToma,
        intervaloHoras: intervalo,
        textoAnestesiologo: `enoxaparina ${dosisPorToma} mg cada ${intervalo} h`,
      },
    };
  }

  // Portador de válvula mecánica o stent: se calcula la suspensión, pero ninguna
  // suspensión sin confirmación (§8.3).
  if (e.portadorValvulaMecanicaOStent) {
    return {
      farmaco: {
        ...base,
        accion: 'consultar',
        fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
        textoPaciente:
          'Sobre este anticoagulante, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta.',
        reglaAplicada: `AVK ${e.principio}: portador de válvula mecánica/stent → suspensión ${dias} días, requiere confirmación (§8.3)`,
        requiereConfirmacion: true,
      },
    };
  }

  // Suspensión estándar.
  return {
    farmaco: {
      ...base,
      accion: 'suspender',
      fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
      textoPaciente: plazo.textoPaciente,
      reglaAplicada: `AVK ${e.principio}: suspender ${dias} días (INR < 1,5 el día de la intervención)`,
      requiereConfirmacion: false,
    },
  };
}
