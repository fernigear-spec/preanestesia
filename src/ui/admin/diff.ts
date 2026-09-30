/**
 * Diff por líneas para el panel de administración (§14.1): compara el contenido
 * editado con la versión publicada y marca las líneas iguales, añadidas y quitadas.
 * Algoritmo LCS clásico (subsecuencia común más larga). Función pura y testeable.
 */
export type TipoLinea = 'igual' | 'anadida' | 'quitada';

export interface LineaDiff {
  tipo: TipoLinea;
  texto: string;
}

export function diffLineas(publicado: string, editado: string): LineaDiff[] {
  const a = publicado.split('\n');
  const b = editado.split('\n');
  const n = a.length;
  const m = b.length;

  // Tabla LCS.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const salida: LineaDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      salida.push({ tipo: 'igual', texto: a[i]! });
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      salida.push({ tipo: 'quitada', texto: a[i]! });
      i++;
    } else {
      salida.push({ tipo: 'anadida', texto: b[j]! });
      j++;
    }
  }
  while (i < n) salida.push({ tipo: 'quitada', texto: a[i++]! });
  while (j < m) salida.push({ tipo: 'anadida', texto: b[j++]! });
  return salida;
}

/** Resumen de cambios (número de líneas añadidas y quitadas). */
export function resumenDiff(lineas: LineaDiff[]): { anadidas: number; quitadas: number } {
  let anadidas = 0;
  let quitadas = 0;
  for (const l of lineas) {
    if (l.tipo === 'anadida') anadidas++;
    else if (l.tipo === 'quitada') quitadas++;
  }
  return { anadidas, quitadas };
}
