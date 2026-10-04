/**
 * Validación en tiempo real de los ficheros del panel de administración (§14.1).
 * Funciones puras (testeables sin navegador). Cada tipo se valida de forma distinta:
 *  - csv: debe parsearse; en farmacos.csv cada id_regla debe existir (caso 21).
 *  - json / texto: debe ser JSON válido.
 *  - modulo: JSON válido y estructura de módulo correcta (validarModulo).
 */
import { parseCsv } from '../../datos/csv.ts';
import { validarModulo } from '../../datos/modulos.ts';
import { validarValidaciones } from '../../datos/validaciones.ts';
import type { TipoFichero } from './contenido.ts';

export interface ResultadoValidacion {
  ok: boolean;
  mensajes: string[];
}

export interface OpcionesValidacion {
  /** Conjunto de id_regla válidos (claves de reglas_farmacos.json). */
  idsRegla?: Set<string>;
  /** Ruta del fichero, para validaciones estructuradas específicas (p. ej. validaciones.json). */
  ruta?: string;
}

export function validarContenido(
  tipo: TipoFichero,
  texto: string,
  opciones: OpcionesValidacion = {},
): ResultadoValidacion {
  if (tipo === 'csv') return validarCsv(texto, opciones.idsRegla);
  if (tipo === 'modulo') return validarModuloTexto(texto);
  if (opciones.ruta && opciones.ruta.endsWith('validaciones.json')) return validarValidacionesTexto(texto);
  return validarJson(texto);
}

function validarValidacionesTexto(texto: string): ResultadoValidacion {
  let obj: unknown;
  try {
    obj = JSON.parse(texto);
  } catch (e) {
    return { ok: false, mensajes: [`JSON no válido: ${(e as Error).message}`] };
  }
  const errores = validarValidaciones(obj);
  if (errores.length === 0) return { ok: true, mensajes: ['Puntos de validación válidos.'] };
  return { ok: false, mensajes: errores.map((e) => `${e.campo ? `[${e.campo}] ` : ''}${e.mensaje}`) };
}

function validarJson(texto: string): ResultadoValidacion {
  try {
    JSON.parse(texto);
    return { ok: true, mensajes: ['JSON válido.'] };
  } catch (e) {
    return { ok: false, mensajes: [`JSON no válido: ${(e as Error).message}`] };
  }
}

function validarModuloTexto(texto: string): ResultadoValidacion {
  let obj: unknown;
  try {
    obj = JSON.parse(texto);
  } catch (e) {
    return { ok: false, mensajes: [`JSON no válido: ${(e as Error).message}`] };
  }
  const errores = validarModulo(obj, 'módulo');
  if (errores.length === 0) return { ok: true, mensajes: ['Módulo válido.'] };
  return { ok: false, mensajes: errores.map((e) => `${e.campo ? `[${e.campo}] ` : ''}${e.mensaje}`) };
}

function validarCsv(texto: string, idsRegla?: Set<string>): ResultadoValidacion {
  const { columnas, filas } = parseCsv(texto);
  if (columnas.length === 0) return { ok: false, mensajes: ['El CSV está vacío o no tiene cabecera.'] };

  const mensajes: string[] = [];
  // Comprobación específica de farmacos.csv: cada id_regla debe existir (caso 21).
  if (columnas.includes('id_regla') && idsRegla && idsRegla.size > 0) {
    for (const fila of filas) {
      const reglas = (fila.valores.id_regla ?? '').split('+').map((s) => s.trim()).filter(Boolean);
      for (const r of reglas) {
        if (!idsRegla.has(r)) {
          mensajes.push(`Fila ${fila.numeroFila}: la regla "${r}" no existe en reglas_farmacos.json.`);
        }
      }
    }
  }
  if (mensajes.length > 0) return { ok: false, mensajes };
  return { ok: true, mensajes: [`CSV válido: ${filas.length} filas.`] };
}
