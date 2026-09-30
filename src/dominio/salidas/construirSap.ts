/**
 * Construye el texto de SAP (§10.1) a partir de piezas ya redactadas por la
 * interfaz y lo pasa por el motor generarSap (abreviaturas, solo ASCII, negativos,
 * límite de caracteres). Incluye un resumen de las respuestas de los módulos del
 * paso 7 (§5.16) y los nombres de los anestesiólogos que confirmaron fármacos (§12).
 */
import { generarSap, lineasNegativos, type BloqueSap, type OpcionesSap, type ResultadoSap, type NegativosEntrada } from './sap.ts';

export interface EntradaSap {
  cabecera: string;
  datos: string;
  alergias: string;
  habitos: string;
  /** Resumen de antecedentes patológicos y respuestas de módulos (§5.16). */
  antecedentesPatologicos: string[];
  iqPrevias: string[];
  antecedentesAnestesicos: string;
  negativos: NegativosEntrada;
  capacidadFuncional: string;
  viaAerea: string;
  escalas: string;
  asa: string;
  tratamientoHabitual: string;
  plan: string[];
  pruebas: string;
  consentimiento: string;
  /** Nombres de anestesiólogos que confirmaron puntos pendientes (§12). */
  confirmadoPor: string[];
}

export function construirSap(e: EntradaSap, opciones: OpcionesSap = {}): ResultadoSap {
  const negativos = lineasNegativos(e.negativos);
  const antecedentesLinea = e.antecedentesAnestesicos.trim() !== '' || negativos.length > 0
    ? `Antecedentes anestesicos: ${[e.antecedentesAnestesicos, ...negativos].filter((s) => s.trim() !== '').join('. ')}.`
    : '';
  const pendientes = e.confirmadoPor.length > 0
    ? `Confirmado por anestesiologo: ${e.confirmadoPor.join(', ')}.`
    : 'Pendiente de confirmacion por anestesiologo: ninguno.';

  const bloques: BloqueSap[] = [
    { clave: 'cabecera', lineas: [e.cabecera] },
    { clave: 'datos', lineas: [e.datos] },
    { clave: 'alergias', lineas: [e.alergias] },
    { clave: 'habitos', lineas: [e.habitos] },
    { clave: 'antecedentes_patologicos', lineas: e.antecedentesPatologicos.length > 0 ? [`AP: ${e.antecedentesPatologicos.join('. ')}.`] : [] },
    { clave: 'iq_previas', lineas: e.iqPrevias.length > 0 ? [`IQ previas: ${e.iqPrevias.join('; ')}.`] : [] },
    { clave: 'antecedentes_anestesicos', lineas: [antecedentesLinea] },
    { clave: 'capacidad_funcional', lineas: [e.capacidadFuncional] },
    { clave: 'via_aerea', lineas: [e.viaAerea] },
    { clave: 'escalas', lineas: [e.escalas] },
    { clave: 'asa', lineas: [e.asa] },
    { clave: 'tratamiento_habitual', lineas: [e.tratamientoHabitual] },
    { clave: 'plan', lineas: e.plan.length > 0 ? [`Plan: ${e.plan.join('; ')}.`] : [] },
    { clave: 'pruebas', lineas: [e.pruebas] },
    { clave: 'consentimiento', lineas: [e.consentimiento] },
    { clave: 'pendientes', lineas: [pendientes] },
  ];

  return generarSap(bloques, opciones);
}
