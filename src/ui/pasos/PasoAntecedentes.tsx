/**
 * Paso 4 — Antecedentes anestésicos y quirúrgicos (R3.2.10–R3.2.12).
 * Lista añadible de intervenciones previas (procedimiento, año, tipo de anestesia,
 * incidencias) e incidencias explícitas por intervención.
 * La hipertermia maligna y el déficit de pseudocolinesterasa (personales o
 * familiares) se recogen ahora como «condiciones especiales» en el paso de
 * enfermedades (§5.15), no aquí.
 */
import { useState } from 'react';
import {
  INCIDENCIAS_ANESTESICAS,
  type AntecedentesUi,
  type IntervencionPrevia,
} from '../estadoEntrevista.ts';

interface Props {
  inicial: AntecedentesUi | null;
  onContinuar: (datos: AntecedentesUi) => void;
  onVolver: () => void;
}

const TIPOS_ANESTESIA: Array<{ valor: IntervencionPrevia['tipoAnestesia']; etiqueta: string }> = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'neuroaxial', etiqueta: 'Neuroaxial' },
  { valor: 'sedacion', etiqueta: 'Sedación' },
  { valor: 'local', etiqueta: 'Local' },
  { valor: 'no_lo_sabe', etiqueta: 'No lo sabe' },
];

export function PasoAntecedentes({ inicial, onContinuar, onVolver }: Props) {
  const [previas, setPrevias] = useState<IntervencionPrevia[]>(inicial?.intervencionesPrevias ?? []);

  // Formulario para añadir una intervención previa.
  const [proc, setProc] = useState('');
  const [anio, setAnio] = useState('');
  // El año, el tipo de anestesia y las incidencias son opcionales; solo el
  // procedimiento es obligatorio (decisión del servicio, 2026-10-04). El tipo
  // arranca en «no lo sabe» para no dar por supuesto un valor.
  const [tipo, setTipo] = useState<IntervencionPrevia['tipoAnestesia']>('no_lo_sabe');
  const [incid, setIncid] = useState<Set<string>>(new Set());

  function alternarIncidencia(id: string) {
    setIncid((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function anadirPrevia() {
    if (proc.trim() === '') return;
    const nueva: IntervencionPrevia = {
      procedimiento: proc.trim(),
      anio: anio.trim(),
      tipoAnestesia: tipo,
      incidencias: [...incid],
    };
    setPrevias((p) => [...p, nueva]);
    setProc('');
    setAnio('');
    setTipo('no_lo_sabe');
    setIncid(new Set());
  }

  function quitarPrevia(indice: number) {
    setPrevias((p) => p.filter((_, i) => i !== indice));
  }

  function continuar() {
    onContinuar({
      intervencionesPrevias: previas,
    });
  }

  const etiquetaIncidencia = (id: string) => INCIDENCIAS_ANESTESICAS.find((x) => x.id === id)?.etiqueta ?? id;

  return (
    <section className="tarjeta" aria-labelledby="paso3-tit">
      <h2 id="paso3-tit">Paso 4 · Antecedentes anestésicos y quirúrgicos</h2>

      <h3>Intervenciones previas</h3>
      {previas.length === 0 ? (
        <p>No se ha añadido ninguna intervención previa.</p>
      ) : (
        <ul className="lista-previas">
          {previas.map((p, i) => (
            <li key={`${p.procedimiento}-${i}`} className="previa">
              <div>
                <strong>{p.procedimiento}</strong>{p.anio ? ` (${p.anio})` : ''} · {TIPOS_ANESTESIA.find((t) => t.valor === p.tipoAnestesia)?.etiqueta}
                {p.incidencias.length > 0 && (
                  <div className="previa-incid">Incidencias: {p.incidencias.map(etiquetaIncidencia).join(', ')}</div>
                )}
              </div>
              <button type="button" className="boton-enlace" onClick={() => quitarPrevia(i)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="campo bloque-anadir">
        <legend>Añadir intervención previa</legend>
        <div className="campo">
          <label htmlFor="ap-proc">Procedimiento</label>
          <input id="ap-proc" type="text" value={proc} onChange={(e) => setProc(e.target.value)} placeholder="p. ej. Apendicectomía" />
        </div>
        <div className="campo">
          <label htmlFor="ap-anio">Año (opcional)</label>
          <input id="ap-anio" type="number" min={1920} max={2100} inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)} />
        </div>
        <fieldset className="campo">
          <legend>Tipo de anestesia</legend>
          <div className="grupo-radios">
            {TIPOS_ANESTESIA.map((t) => (
              <label key={t.valor} className={`radio-tarjeta ${tipo === t.valor ? 'seleccionado' : ''}`}>
                <input type="radio" name="ap-tipo" checked={tipo === t.valor} onChange={() => setTipo(t.valor)} />
                {t.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="campo">
          <legend>Incidencias</legend>
          <div className="grupo-checks">
            {INCIDENCIAS_ANESTESICAS.map((x) => (
              <label key={x.id} className={`radio-tarjeta ${incid.has(x.id) ? 'seleccionado' : ''}`}>
                <input type="checkbox" checked={incid.has(x.id)} onChange={() => alternarIncidencia(x.id)} />
                {x.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" className="boton-secundario" disabled={proc.trim() === ''} onClick={anadirPrevia}>
          Añadir a la lista
        </button>
      </fieldset>

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={continuar}>Continuar</button>
      </div>
    </section>
  );
}
