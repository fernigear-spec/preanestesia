/**
 * Panel de administración de contenido (§14.1).
 * Permite ver y editar los ficheros de datos (CSV en tablas, JSON y textos en un
 * editor con validación), comprobar los errores en tiempo real, ver el diff con la
 * versión publicada y descargar el fichero corregido para subirlo a GitHub a mano.
 * El panel NO escribe en GitHub ni persiste nada del paciente.
 */
import { useMemo, useState } from 'react';
import { FICHEROS, type FicheroContenido } from './contenido.ts';
import { EditorCsv } from './EditorCsv.tsx';
import { validarContenido } from './validar.ts';
import { diffLineas, resumenDiff } from './diff.ts';

interface Props {
  onSalir: () => void;
}

/** Descarga un texto como fichero con el nombre indicado. */
function descargar(nombre: string, texto: string) {
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function PanelAdmin({ onSalir }: Props) {
  const [seleccionId, setSeleccionId] = useState<string>(FICHEROS[0]?.id ?? '');
  const [editado, setEditado] = useState<Record<string, string>>({});
  const [verDiff, setVerDiff] = useState(false);
  const [verAyuda, setVerAyuda] = useState(false);

  // Conjunto de id_regla válidos (de reglas_farmacos.json) para validar farmacos.csv.
  const idsRegla = useMemo(() => {
    const f = FICHEROS.find((x) => x.ruta.endsWith('reglas_farmacos.json'));
    const set = new Set<string>();
    if (f) {
      try {
        const obj = JSON.parse(editado[f.id] ?? f.publicado) as { reglas?: Record<string, unknown> };
        for (const k of Object.keys(obj.reglas ?? {})) set.add(k);
      } catch { /* si el JSON está a medias, no validamos cruzado */ }
    }
    return set;
  }, [editado]);

  const fichero = FICHEROS.find((f) => f.id === seleccionId);
  if (!fichero) return null;

  const textoActual = editado[fichero.id] ?? fichero.publicado;
  const modificado = textoActual !== fichero.publicado;
  const validacion = validarContenido(fichero.tipo, textoActual, { idsRegla, ruta: fichero.ruta });
  const diff = diffLineas(fichero.publicado, textoActual);
  const resumen = resumenDiff(diff);

  function actualizar(id: string, texto: string) {
    setEditado((prev) => ({ ...prev, [id]: texto }));
  }
  function revertir() {
    setEditado((prev) => {
      const copia = { ...prev };
      delete copia[fichero!.id];
      return copia;
    });
  }

  const porTipo = (t: FicheroContenido['tipo']) => FICHEROS.filter((f) => f.tipo === t);

  return (
    <div className="app admin">
      <header className="cabecera">
        <h1>Administración de contenido</h1>
        <p className="subtitulo">Edite los datos, revise el diff y descargue el fichero para subirlo a GitHub. Este panel no escribe en el repositorio.</p>
        <button type="button" className="boton-secundario" onClick={onSalir}>← Volver a la entrevista</button>
      </header>

      <main className="contenido admin-contenido">
        <nav className="admin-lista" aria-label="Ficheros">
          {([
            ['Catálogos (CSV)', 'csv'],
            ['Reglas y plantillas (JSON)', 'json'],
            ['Módulos de enfermedad', 'modulo'],
            ['Textos del paciente', 'texto'],
          ] as const).map(([titulo, tipo]) => (
            <div key={tipo} className="admin-grupo">
              <h2>{titulo}</h2>
              <ul>
                {porTipo(tipo).map((f) => {
                  const cambiado = (editado[f.id] ?? f.publicado) !== f.publicado;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={`admin-item ${f.id === seleccionId ? 'seleccionado' : ''}`}
                        onClick={() => { setSeleccionId(f.id); setVerDiff(false); }}
                        aria-current={f.id === seleccionId}
                      >
                        {f.ruta}{cambiado ? ' ●' : ''}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <section className="admin-editor" aria-labelledby="admin-editor-tit">
          <h2 id="admin-editor-tit">{fichero.ruta}</h2>

          <p className={`aviso ${validacion.ok ? 'aviso-info' : 'aviso-atencion'}`} role="status" aria-live="polite">
            {validacion.ok ? '✓ ' : '⚠ '}
            {validacion.mensajes.slice(0, 6).join(' ')}
            {validacion.mensajes.length > 6 ? ` (+${validacion.mensajes.length - 6} más)` : ''}
          </p>

          {fichero.tipo === 'csv' ? (
            <EditorCsv key={fichero.id} texto={textoActual} onCambio={(t) => actualizar(fichero.id, t)} />
          ) : (
            <textarea
              className="admin-textarea"
              aria-label={`Contenido de ${fichero.ruta}`}
              spellCheck={false}
              value={textoActual}
              onChange={(e) => actualizar(fichero.id, e.target.value)}
              rows={24}
            />
          )}

          <div className="acciones">
            <button type="button" className="boton-primario" onClick={() => descargar(fichero.nombre, textoActual)}>
              Descargar {fichero.nombre}
            </button>
            <button type="button" className="boton-secundario" onClick={() => setVerDiff((v) => !v)} aria-expanded={verDiff}>
              {verDiff ? 'Ocultar' : 'Ver'} cambios ({resumen.anadidas} +, {resumen.quitadas} −)
            </button>
            {modificado && (
              <button type="button" className="boton-secundario" onClick={revertir}>Descartar cambios</button>
            )}
          </div>

          {verDiff && (
            <div className="admin-diff" aria-label="Diferencias con la versión publicada">
              {resumen.anadidas === 0 && resumen.quitadas === 0 ? (
                <p>Sin cambios respecto a la versión publicada.</p>
              ) : (
                <pre>
                  {diff
                    .filter((l) => l.tipo !== 'igual')
                    .map((l, i) => (
                      <div key={i} className={`diff-${l.tipo}`}>
                        {l.tipo === 'anadida' ? '+ ' : '− '}{l.texto}
                      </div>
                    ))}
                </pre>
              )}
            </div>
          )}

          <div className="admin-ayuda">
            <button type="button" className="boton-enlace" onClick={() => setVerAyuda((v) => !v)} aria-expanded={verAyuda}>
              ¿Cómo subo el fichero a GitHub?
            </button>
            {verAyuda && (
              <ol>
                <li>Descargue el fichero con el botón de arriba.</li>
                <li>En GitHub, abra el repositorio <code>fernigear-spec/preanestesia</code> y vaya a la rama <code>desarrollo</code>.</li>
                <li>Navegue hasta <code>{fichero.ruta}</code> y pulse el icono del lápiz («Edit this file»); o use «Add file → Upload files» para sustituirlo por el descargado.</li>
                <li>Abajo, en «Commit changes», escriba un mensaje corto y confirme.</li>
                <li>Si ha cambiado alguna regla o texto clínico, actualice también <code>version_contenido</code> y <code>fecha_revision_clinica</code> en <code>datos/config.json</code> del mismo modo.</li>
                <li>Al confirmar, GitHub Actions publicará la vista previa automáticamente.</li>
              </ol>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
