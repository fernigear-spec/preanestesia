/**
 * Paso 1 — Datos de la intervención (R3.2.1–R3.2.6).
 * Campos: fecha y hora prevista (hora opcional → 08:00 con aviso), procedimiento
 * (buscador con autocompletado), lateralidad, régimen, carácter y técnica
 * anestésica (bloqueo periférico y profundo separados). Avisa si la intervención
 * está a más de 60 días. Los riesgos se heredan del procedimiento elegido.
 */
import { useMemo, useState } from 'react';
import type { DatosIntervencion, Regimen, Caracter, TecnicaAnestesica } from '../../dominio/tipos.ts';
import {
  cargarProcedimientos,
  buscarProcedimientos,
  type Procedimiento,
} from '../../datos/procedimientos.ts';

interface Props {
  /** Se llama con los datos validados al pulsar "Continuar". */
  onContinuar: (datos: DatosIntervencion, procedimiento: Procedimiento) => void;
  onVolver: () => void;
}

const REGIMENES: Array<{ valor: Regimen; etiqueta: string }> = [
  { valor: 'cma', etiqueta: 'Cirugía mayor ambulatoria (CMA)' },
  { valor: 'ingreso', etiqueta: 'Con ingreso' },
  { valor: 'uci_prevista', etiqueta: 'UCI prevista' },
];

const CARACTERES: Array<{ valor: Caracter; etiqueta: string }> = [
  { valor: 'programada', etiqueta: 'Programada' },
  { valor: 'urgencia_diferida', etiqueta: 'Urgencia diferida' },
];

const TECNICAS: Array<{ valor: TecnicaAnestesica; etiqueta: string }> = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'sedacion', etiqueta: 'Sedación' },
  { valor: 'neuroaxial', etiqueta: 'Neuroaxial (raquídea/epidural)' },
  { valor: 'bloqueo_periferico', etiqueta: 'Bloqueo periférico' },
  { valor: 'bloqueo_profundo', etiqueta: 'Bloqueo profundo' },
  { valor: 'local', etiqueta: 'Anestesia local' },
  { valor: 'no_se_sabe', etiqueta: 'No se sabe todavía' },
];

const MS_DIA = 86_400_000;

export function PasoIntervencion({ onContinuar, onVolver }: Props) {
  const procedimientos = useMemo(() => cargarProcedimientos(), []);

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [fechaDesconocida, setFechaDesconocida] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [elegido, setElegido] = useState<Procedimiento | null>(null);
  const [lateralidad, setLateralidad] = useState<'no_aplica' | 'derecha' | 'izquierda' | 'bilateral'>('no_aplica');
  const [regimen, setRegimen] = useState<Regimen>('cma');
  const [caracter, setCaracter] = useState<Caracter>('programada');
  const [tecnica, setTecnica] = useState<TecnicaAnestesica>('general');
  const [contrasteYodado, setContrasteYodado] = useState<'si' | 'no' | 'no_se_sabe'>('no');

  const resultados = useMemo(
    () => (elegido ? [] : buscarProcedimientos(procedimientos, consulta)),
    [procedimientos, consulta, elegido],
  );

  // Avisos.
  const horaAsumida = !fechaDesconocida && fecha !== '' && hora === '';
  const diasHasta = useMemo(() => {
    if (fechaDesconocida || fecha === '') return null;
    const f = new Date(`${fecha}T${hora === '' ? '08:00' : hora}`);
    return Math.round((f.getTime() - Date.now()) / MS_DIA);
  }, [fecha, hora, fechaDesconocida]);
  const avisoMas60 = diasHasta !== null && diasHasta > 60;

  // Se puede continuar con fecha, o marcando "fecha aún no conocida".
  const puedeContinuar = elegido !== null && (fechaDesconocida || fecha !== '');

  function continuar() {
    if (!elegido) return;
    if (!fechaDesconocida && fecha === '') return;
    const fechaHora = fechaDesconocida ? null : new Date(`${fecha}T${hora === '' ? '08:00' : hora}`);
    const datos: DatosIntervencion = {
      fechaHora,
      fechaDesconocida,
      horaAsumida,
      procedimientoId: elegido.id,
      riesgoCardiovascular: elegido.riesgoCardiovascular,
      riesgoHemorragico: elegido.riesgoHemorragico,
      grupoOftalmologico: elegido.grupoOftalmologico,
      neuroaxialProbable: elegido.neuroaxialProbable,
      duracionMayor30min: elegido.duracionMayor30min,
      riesgoTromboticoAlto: elegido.riesgoTromboticoAlto,
      espacioCerrado: elegido.espacioCerrado,
      contrasteYodado,
      regimen,
      caracter,
      tecnica,
    };
    onContinuar(datos, elegido);
  }

  return (
    <section className="tarjeta" aria-labelledby="paso1-tit">
      <h2 id="paso1-tit">Paso 1 · Datos de la intervención</h2>

      {/* Fecha y hora */}
      <div className="campo">
        <label className={`radio-tarjeta ${fechaDesconocida ? 'seleccionado' : ''}`}>
          <input type="checkbox" checked={fechaDesconocida} onChange={() => setFechaDesconocida(!fechaDesconocida)} />
          La fecha de la intervención aún no se conoce
        </label>
      </div>
      <div className="campo">
        <label htmlFor="fecha">Fecha prevista de la intervención</label>
        <input id="fecha" type="date" value={fecha} disabled={fechaDesconocida} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="hora">Hora prevista (opcional)</label>
        <input id="hora" type="time" value={hora} disabled={fechaDesconocida} onChange={(e) => setHora(e.target.value)} />
      </div>
      {fechaDesconocida && (
        <p className="aviso aviso-info" role="note">
          Sin fecha, las instrucciones se darán como <strong>margen</strong> (por ejemplo, «como mínimo 72 horas antes de la intervención»)
          y no se adelantarán tomas. Cuando se conozca la fecha, se recalculará todo.
        </p>
      )}
      {horaAsumida && (
        <p className="aviso aviso-info" role="note">
          No ha indicado la hora: se asumirán las <strong>08:00</strong>. La hoja del paciente lo advertirá.
        </p>
      )}
      {avisoMas60 && (
        <p className="aviso aviso-atencion" role="note">
          La intervención está a más de 60 días. <strong>Las suspensiones deben recalcularse si cambia la fecha.</strong>
        </p>
      )}

      {/* Buscador de procedimiento */}
      <div className="campo">
        <label htmlFor="proc">Procedimiento</label>
        {elegido ? (
          <div className="elegido">
            <span>
              <strong>{elegido.nombre}</strong> · {elegido.especialidad.replace(/_/g, ' ')}
            </span>
            <button
              type="button"
              className="boton-enlace"
              onClick={() => {
                setElegido(null);
                setConsulta('');
              }}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <input
              id="proc"
              type="search"
              placeholder="Escriba para buscar (nombre o especialidad)"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              autoComplete="off"
            />
            {resultados.length > 0 && (
              <ul className="lista-resultados" role="listbox" aria-label="Resultados de procedimientos">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="opcion-resultado" onClick={() => setElegido(p)}>
                      <span className="opcion-nombre">{p.nombre}</span>
                      <span className="opcion-especialidad">{p.especialidad.replace(/_/g, ' ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {consulta.trim() !== '' && resultados.length === 0 && (
              <p className="aviso aviso-info" role="note">Sin resultados. Pruebe con otra palabra.</p>
            )}
          </>
        )}
      </div>

      {/* Riesgos heredados del procedimiento */}
      {elegido && (
        <div className="riesgos" aria-live="polite">
          <p className="riesgos-titulo">Riesgos del procedimiento (del catálogo):</p>
          <ul>
            <li>Cardiovascular: <strong>{elegido.riesgoCardiovascular}</strong></li>
            <li>Hemorrágico: <strong>{elegido.riesgoHemorragico}</strong></li>
            {elegido.grupoOftalmologico !== 'no_aplica' && (
              <li>Oftalmológico: <strong>{elegido.grupoOftalmologico.replace(/_/g, ' ')}</strong></li>
            )}
            {elegido.neuroaxialProbable && <li>Técnica neuroaxial o bloqueo profundo probable</li>}
            {elegido.riesgoTromboticoAlto && <li>Riesgo trombótico alto</li>}
          </ul>
        </div>
      )}

      {/* Lateralidad */}
      <div className="campo">
        <label htmlFor="lat">Lateralidad</label>
        <select id="lat" value={lateralidad} onChange={(e) => setLateralidad(e.target.value as typeof lateralidad)}>
          <option value="no_aplica">No aplica</option>
          <option value="derecha">Derecha</option>
          <option value="izquierda">Izquierda</option>
          <option value="bilateral">Bilateral</option>
        </select>
      </div>

      {/* Régimen */}
      <fieldset className="campo">
        <legend>Régimen</legend>
        <div className="grupo-radios">
          {REGIMENES.map((r) => (
            <label key={r.valor} className={`radio-tarjeta ${regimen === r.valor ? 'seleccionado' : ''}`}>
              <input type="radio" name="regimen" value={r.valor} checked={regimen === r.valor} onChange={() => setRegimen(r.valor)} />
              {r.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Carácter */}
      <fieldset className="campo">
        <legend>Carácter</legend>
        <div className="grupo-radios">
          {CARACTERES.map((c) => (
            <label key={c.valor} className={`radio-tarjeta ${caracter === c.valor ? 'seleccionado' : ''}`}>
              <input type="radio" name="caracter" value={c.valor} checked={caracter === c.valor} onChange={() => setCaracter(c.valor)} />
              {c.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Técnica anestésica */}
      <fieldset className="campo">
        <legend>Técnica anestésica prevista</legend>
        <div className="grupo-radios">
          {TECNICAS.map((t) => (
            <label key={t.valor} className={`radio-tarjeta ${tecnica === t.valor ? 'seleccionado' : ''}`}>
              <input type="radio" name="tecnica" value={t.valor} checked={tecnica === t.valor} onChange={() => setTecnica(t.valor)} />
              {t.etiqueta}
            </label>
          ))}
        </div>
        {tecnica === 'no_se_sabe' && elegido?.neuroaxialProbable && (
          <p className="aviso aviso-info" role="note">
            Como el procedimiento suele hacerse con técnica neuroaxial, se usarán los plazos de neuroaxial y se indicará en la hoja.
          </p>
        )}
      </fieldset>

      {/* Contraste yodado (afecta a la metformina, §8.5) */}
      <fieldset className="campo">
        <legend>¿Se prevé administrar contraste yodado?</legend>
        <div className="grupo-radios">
          {([['no', 'No'], ['si', 'Sí'], ['no_se_sabe', 'No se sabe']] as const).map(([v, et]) => (
            <label key={v} className={`radio-tarjeta ${contrasteYodado === v ? 'seleccionado' : ''}`}>
              <input type="radio" name="contraste" value={v} checked={contrasteYodado === v} onChange={() => setContrasteYodado(v)} />
              {et}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" disabled={!puedeContinuar} onClick={continuar}>
          Continuar
        </button>
      </div>
    </section>
  );
}
