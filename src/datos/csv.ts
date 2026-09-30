/**
 * Parser CSV — separador ';' , UTF-8 (docs/documento_fuente.md §3).
 * Soporta comillas dobles según RFC 4180: dentro de un campo entrecomillado se
 * admiten el separador ';', saltos de línea y comillas escapadas ("").
 * Conserva el número de fila lógico (1 = cabecera; los datos empiezan en 2) para
 * poder señalar errores (R2.3.1), contando cada REGISTRO (no cada '\n' físico).
 */

export interface FilaCsv {
  /** Número de registro lógico (1 = cabecera, datos desde 2). */
  numeroFila: number;
  valores: Record<string, string>;
}

export interface CsvParseResult {
  columnas: string[];
  filas: FilaCsv[];
}

/**
 * Tokeniza todo el texto en registros (cada registro = array de campos),
 * respetando comillas que contengan el separador o saltos de línea.
 */
function tokenizar(texto: string, sep: string): string[][] {
  const registros: string[][] = [];
  let campos: string[] = [];
  let actual = '';
  let enComillas = false;
  let campoIniciado = false;

  const t = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const cerrarCampo = () => {
    campos.push(actual.trim());
    actual = '';
    campoIniciado = false;
  };
  const cerrarRegistro = () => {
    cerrarCampo();
    registros.push(campos);
    campos = [];
  };

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        actual += c;
      }
      continue;
    }
    if (c === '"' && !campoIniciado) {
      // Comilla de apertura al inicio del campo.
      enComillas = true;
      campoIniciado = true;
      continue;
    }
    if (c === sep) {
      cerrarCampo();
      continue;
    }
    if (c === '\n') {
      cerrarRegistro();
      continue;
    }
    campoIniciado = true;
    actual += c;
  }
  // Último campo/registro si el fichero no acaba en salto de línea.
  if (actual.length > 0 || campos.length > 0 || campoIniciado) {
    cerrarRegistro();
  }
  return registros;
}

/**
 * Serializa columnas + filas de nuevo a CSV (separador ';' por defecto).
 * Entrecomilla un campo si contiene el separador, comillas o saltos de línea, y
 * escapa las comillas dobles («"» → «""»), de forma que parseCsv lo recupere igual.
 * Se usa en el panel de administración (§14.1) para descargar el fichero editado.
 */
export function serializarCsv(
  columnas: string[],
  filas: Array<Record<string, string>>,
  sep = ';',
): string {
  const escapar = (valor: string): string => {
    const v = valor ?? '';
    if (v.includes(sep) || v.includes('"') || v.includes('\n') || v.includes('\r')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lineas = [columnas.map(escapar).join(sep)];
  for (const fila of filas) {
    lineas.push(columnas.map((col) => escapar(fila[col] ?? '')).join(sep));
  }
  return lineas.join('\n') + '\n';
}

export function parseCsv(texto: string, sep = ';'): CsvParseResult {
  const registros = tokenizar(texto, sep).filter(
    (r) => !(r.length === 1 && r[0] === ''),
  ); // descarta líneas totalmente vacías
  if (registros.length === 0) return { columnas: [], filas: [] };

  const columnas = registros[0] as string[];
  const filas: FilaCsv[] = [];
  for (let i = 1; i < registros.length; i++) {
    const campos = registros[i] as string[];
    const valores: Record<string, string> = {};
    columnas.forEach((col, idx) => {
      valores[col] = campos[idx] ?? '';
    });
    filas.push({ numeroFila: i + 1, valores });
  }
  return { columnas, filas };
}
