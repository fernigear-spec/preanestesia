/**
 * Parser CSV mínimo — separador ';' , UTF-8 (docs/documento_fuente.md §3).
 * Soporta comillas dobles para escapar el separador. Devuelve filas como
 * objetos indexados por la cabecera, conservando el número de fila (1-based,
 * incluyendo la cabecera) para poder señalar errores (R2.3.1).
 *
 * PENDIENTE: valorar sustituir por PapaParse cuando haya acceso a npm; este
 * parser cubre lo imprescindible (separador ';', comillas, saltos de línea).
 */

export interface FilaCsv {
  /** Número de fila en el fichero (1 = cabecera, los datos empiezan en 2). */
  numeroFila: number;
  valores: Record<string, string>;
}

export interface CsvParseResult {
  columnas: string[];
  filas: FilaCsv[];
}

function parseLineaCsv(linea: string, sep: string): string[] {
  const campos: string[] = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      campos.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos.map((v) => v.trim());
}

export function parseCsv(texto: string, sep = ';'): CsvParseResult {
  const lineas = texto
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l, i) => !(i > 0 && l.trim() === '')); // ignora líneas vacías salvo cabecera

  if (lineas.length === 0) return { columnas: [], filas: [] };

  const columnas = parseLineaCsv(lineas[0] as string, sep);
  const filas: FilaCsv[] = [];
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i] as string;
    if (linea.trim() === '') continue;
    const campos = parseLineaCsv(linea, sep);
    const valores: Record<string, string> = {};
    columnas.forEach((col, idx) => {
      valores[col] = campos[idx] ?? '';
    });
    filas.push({ numeroFila: i + 1, valores });
  }
  return { columnas, filas };
}
