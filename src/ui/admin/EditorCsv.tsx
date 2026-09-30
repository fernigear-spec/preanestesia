/**
 * Editor de tablas para los ficheros CSV del panel de administración (§14.1).
 * Muestra el CSV como una tabla editable (una fila por registro), permite añadir y
 * quitar filas y edita cada celda. Emite el CSV serializado para validar, ver el diff
 * y descargar. Evita tener que abrir el CSV en Excel.
 */
import { useState } from 'react';
import { parseCsv, serializarCsv } from '../../datos/csv.ts';

interface Props {
  /** CSV inicial (publicado o editado previamente). */
  texto: string;
  onCambio: (csv: string) => void;
}

export function EditorCsv({ texto, onCambio }: Props) {
  const inicial = parseCsv(texto);
  const [columnas] = useState<string[]>(inicial.columnas);
  const [filas, setFilas] = useState<Array<Record<string, string>>>(
    inicial.filas.map((f) => ({ ...f.valores })),
  );

  function emitir(nuevas: Array<Record<string, string>>) {
    setFilas(nuevas);
    onCambio(serializarCsv(columnas, nuevas));
  }
  function editarCelda(i: number, col: string, valor: string) {
    emitir(filas.map((f, j) => (j === i ? { ...f, [col]: valor } : f)));
  }
  function anadirFila() {
    const vacia: Record<string, string> = {};
    for (const c of columnas) vacia[c] = '';
    emitir([...filas, vacia]);
  }
  function quitarFila(i: number) {
    emitir(filas.filter((_, j) => j !== i));
  }

  return (
    <div className="admin-csv">
      <p className="admin-meta">{filas.length} filas · {columnas.length} columnas</p>
      <div className="admin-tabla-scroll">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th scope="col" aria-label="Acciones"></th>
              {columnas.map((c) => <th key={c} scope="col">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                <td>
                  <button type="button" className="boton-enlace" onClick={() => quitarFila(i)} aria-label={`Quitar fila ${i + 1}`}>✕</button>
                </td>
                {columnas.map((c) => (
                  <td key={c}>
                    <input
                      type="text"
                      value={fila[c] ?? ''}
                      aria-label={`${c} fila ${i + 1}`}
                      onChange={(e) => editarCelda(i, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="boton-secundario" onClick={anadirFila}>Añadir fila</button>
    </div>
  );
}
