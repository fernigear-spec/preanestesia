/**
 * Resolución del aclaramiento de creatinina de la entrevista (§8.2/§8.4).
 *
 * El aclaramiento es un valor ÚNICO para toda la entrevista. Puede venir de dos
 * fuentes, con esta prioridad:
 *   1. Un módulo (renal o trasplante) que aporta la creatinina → ya resuelto en
 *      `derivarHechosClinicos` (DatosClinicos.aclaramiento).
 *   2. El dato introducido a mano en el paso 8 cuando no hay módulo: aclaramiento
 *      directo, creatinina (se calcula Cockcroft-Gault con edad/peso/sexo) o
 *      «no disponible» (las reglas renales requieren confirmación, caso A7).
 *
 * Función pura, usada por el paso 8 y por el resumen para que el valor y las reglas
 * sean coherentes.
 */
import type { Sexo } from '../tipos.ts';
import type { AclaramientoManual } from '../../ui/estadoEntrevista.ts';
import { calcularAclaramiento } from '../escalas/cockcroftGault.ts';

export interface DatosParaAclaramiento {
  edadAnios: number;
  pesoKg: number;
  sexo: Sexo;
}

/** Resultado de resolver el aclaramiento efectivo de la entrevista. */
export interface AclaramientoResuelto {
  /** mL/min efectivo, o null si no se conoce (regla → requiere confirmación). */
  valor: number | null;
  /** De dónde sale: módulo renal/trasplante, dato manual, o nada. */
  fuente: 'modulo' | 'manual' | 'ninguno';
}

/**
 * Resuelve el aclaramiento efectivo. `aclaramientoModulo` es el que ya calculó
 * `derivarHechosClinicos` (null si ningún módulo lo aporta). Si el módulo lo tiene,
 * manda; si no, se usa el dato manual del paso 8.
 */
export function resolverAclaramiento(
  aclaramientoModulo: number | null,
  manual: AclaramientoManual | null,
  datos: DatosParaAclaramiento,
): AclaramientoResuelto {
  if (aclaramientoModulo !== null) return { valor: aclaramientoModulo, fuente: 'modulo' };
  if (manual === null) return { valor: null, fuente: 'ninguno' };
  if (manual.tipo === 'no_disponible') return { valor: null, fuente: 'manual' };
  if (manual.tipo === 'aclaramiento') {
    return { valor: manual.valor > 0 ? manual.valor : null, fuente: 'manual' };
  }
  // Creatinina → Cockcroft-Gault.
  const cl = calcularAclaramiento({
    edadAnios: datos.edadAnios,
    pesoKg: datos.pesoKg,
    sexo: datos.sexo,
    creatinina: manual.valor,
    unidad: 'mg_dl',
  });
  return { valor: cl, fuente: 'manual' };
}
