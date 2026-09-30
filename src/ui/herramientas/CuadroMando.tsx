/**
 * Cuadro de mando de uso (§14.3): muestra el contador de entrevistas guardado en el
 * navegador (sin datos clínicos), con conteos por día/semana/mes, tiempo medio,
 * exportación a CSV y botón de borrado.
 */
import { useState } from 'react';
import { leerUso, borrarUso, usoACsv, agrupar, claveSemana, type EntradaUso } from './registroUso.ts';

interface Props {
  onSalir: () => void;
}

function descargarCsv(texto: string) {
  const blob = new Blob([texto], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'uso_aneshealth.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Barras({ datos }: { datos: Array<[string, number]> }) {
  const max = Math.max(1, ...datos.map(([, n]) => n));
  return (
    <ul className="mando-barras">
      {datos.map(([k, n]) => (
        <li key={k}>
          <span className="mando-barra-etq">{k}</span>
          <span className="mando-barra" style={{ width: `${(n / max) * 100}%` }} />
          <span className="mando-barra-num">{n}</span>
        </li>
      ))}
    </ul>
  );
}

export function CuadroMando({ onSalir }: Props) {
  const [entradas, setEntradas] = useState<EntradaUso[]>(() => leerUso());

  const total = entradas.length;
  const mediaSeg = total > 0 ? Math.round(entradas.reduce((s, e) => s + e.duracionSeg, 0) / total) : 0;
  const mediaMin = Math.floor(mediaSeg / 60);
  const mediaResto = mediaSeg % 60;

  const porDia = agrupar(entradas, (e) => e.fecha);
  const porSemana = agrupar(entradas, (e) => claveSemana(e.fecha));
  const porMes = agrupar(entradas, (e) => e.fecha.slice(0, 7));
  const porModalidad = agrupar(entradas, (e) => e.modalidad);
  const porTipo = agrupar(entradas, (e) => e.tipoPaciente);

  function borrar() {
    borrarUso();
    setEntradas([]);
  }

  return (
    <div className="app">
      <header className="cabecera">
        <h1>Cuadro de mando de uso</h1>
        <p className="subtitulo">Contador local del dispositivo, sin datos clínicos. No cuenta el modo entrenamiento.</p>
        <button type="button" className="boton-secundario" onClick={onSalir}>← Volver</button>
      </header>

      <main className="contenido">
        {total === 0 ? (
          <p>Todavía no hay entrevistas registradas en este dispositivo.</p>
        ) : (
          <>
            <div className="mando-resumen">
              <p><strong>{total}</strong> entrevistas · tiempo medio <strong>{mediaMin} min {mediaResto} s</strong></p>
            </div>

            <h2>Por día</h2>
            <Barras datos={porDia} />
            <h2>Por semana</h2>
            <Barras datos={porSemana} />
            <h2>Por mes</h2>
            <Barras datos={porMes} />

            <h2>Por modalidad</h2>
            <Barras datos={porModalidad} />
            <h2>Por tipo de paciente</h2>
            <Barras datos={porTipo} />

            <div className="acciones">
              <button type="button" className="boton-primario" onClick={() => descargarCsv(usoACsv(entradas))}>Exportar a CSV</button>
              <button type="button" className="boton-secundario" onClick={borrar}>Borrar el contador</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
