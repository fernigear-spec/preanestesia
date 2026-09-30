/**
 * Selector de casos del modo entrenamiento (§14.2). Lista los casos disponibles y,
 * al elegir uno, lo carga en la aplicación (con la banda ENTRENAMIENTO y la
 * comparación con los resultados esperados en el resumen).
 */
import { CASOS_ENTRENAMIENTO, type CasoEntrenamiento } from './casos.ts';

interface Props {
  onCargar: (caso: CasoEntrenamiento) => void;
  onSalir: () => void;
}

export function ModoEntrenamiento({ onCargar, onSalir }: Props) {
  return (
    <div className="app">
      <header className="cabecera">
        <h1>Modo entrenamiento</h1>
        <p className="subtitulo">Casos con la entrevista ya rellenada para practicar y comparar con los resultados esperados. No cuentan en el contador de uso.</p>
        <button type="button" className="boton-secundario" onClick={onSalir}>← Volver</button>
      </header>

      <main className="contenido">
        {CASOS_ENTRENAMIENTO.length === 0 ? (
          <p>No hay casos de entrenamiento disponibles.</p>
        ) : (
          <ul className="lista-casos">
            {CASOS_ENTRENAMIENTO.map((c) => (
              <li key={c.id} className="tarjeta">
                <h2>{c.titulo}</h2>
                <p>{c.descripcion}</p>
                <button type="button" className="boton-primario" onClick={() => onCargar(c)}>Abrir este caso</button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
