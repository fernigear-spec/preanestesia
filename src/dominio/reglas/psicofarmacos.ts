/**
 * Psicofármacos y neurología — docs/documento_fuente.md §8.7.
 * Aquí: litio (suspender según riesgo quirúrgico: bajo 24 h, intermedio 48 h,
 * alto 72 h). IMAO y demás se añadirán con sus notas de anestesia segura.
 */
import type { ContextoReglas, ResultadoFarmaco, RiesgoCardiovascular } from '../tipos.ts';
import { plazoDesdeHoras } from './motor.ts';

const FUENTE = 'docs/documento_fuente.md §8.7 (protocolo del servicio)';

const HORAS_LITIO: Record<RiesgoCardiovascular, number> = {
  bajo: 24,
  intermedio: 48,
  alto: 72,
};

export interface EntradaLitio {
  idFarmaco: string;
  nombreComercial: string;
}

export function reglaLitio(e: EntradaLitio, ctx: ContextoReglas): ResultadoFarmaco {
  const horas = HORAS_LITIO[ctx.riesgoCardiovascular];
  const plazo = plazoDesdeHoras(ctx, horas);
  return {
    idFarmaco: e.idFarmaco,
    nombreComercial: e.nombreComercial,
    principiosActivos: ['litio'],
    accion: 'suspender',
    fechaHoraUltimaToma: plazo.fechaHoraUltimaToma,
    textoPaciente: plazo.textoPaciente,
    reglaAplicada: `Litio: suspender ${horas} h (cirugía de riesgo ${ctx.riesgoCardiovascular})`,
    fuente: FUENTE,
    requiereConfirmacion: false,
    textoAnestesiologo: 'Controlar litemia y función renal; reanudar con precaución.',
  };
}
