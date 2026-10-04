/**
 * Paso 2 — Alergias (R3.2.14–R3.2.15). Decisión del servicio (2026-10-04): se
 * muestra solo una casilla «Alergias conocidas»; si NO se marca, se registra como
 * «sin alergias conocidas». Al marcarla se despliegan los formularios: medicamentos
 * (con tipo de reacción, campos grandes), látex, contrastes, clorhexidina,
 * adhesivos y alimentos relevantes.
 */
import { useState } from 'react';
import { ALIMENTOS_ALERGIA, type AlergiasUi, type AlergiaMedicamento } from '../estadoEntrevista.ts';

interface Props {
  inicial: AlergiasUi | null;
  onContinuar: (datos: AlergiasUi) => void;
  onVolver: () => void;
}

export function PasoAlergias({ inicial, onContinuar, onVolver }: Props) {
  // Marca única «Alergias conocidas». Si el estado inicial trae alguna alergia o no
  // estaba marcado «ninguna», se considera que hay alergias conocidas.
  const [conocidas, setConocidas] = useState(
    inicial ? !inicial.ningunaConocida : false,
  );
  const [medicamentos, setMedicamentos] = useState<AlergiaMedicamento[]>(inicial?.medicamentos ?? []);
  const [latex, setLatex] = useState(inicial?.latex ?? false);
  const [contrastes, setContrastes] = useState(inicial?.contrastesYodados ?? false);
  const [clorhexidina, setClorhexidina] = useState(inicial?.clorhexidina ?? false);
  const [adhesivos, setAdhesivos] = useState(inicial?.adhesivos ?? false);
  const [alimentos, setAlimentos] = useState<Set<string>>(new Set(inicial?.alimentos ?? []));

  // Formulario para añadir una alergia a medicamento.
  const [farmaco, setFarmaco] = useState('');
  const [reaccion, setReaccion] = useState('');

  function anadirMedicamento() {
    if (farmaco.trim() === '') return;
    setMedicamentos((m) => [...m, { farmaco: farmaco.trim(), reaccion: reaccion.trim() }]);
    setFarmaco('');
    setReaccion('');
  }
  function quitarMedicamento(i: number) {
    setMedicamentos((m) => m.filter((_, j) => j !== i));
  }
  function alternarAlimento(id: string) {
    setAlimentos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function continuar() {
    // Si no se marca «Alergias conocidas», se registra como sin alergias conocidas,
    // ignorando cualquier dato que hubiera quedado de un despliegue previo.
    if (!conocidas) {
      onContinuar({
        ningunaConocida: true,
        medicamentos: [],
        latex: false,
        contrastesYodados: false,
        clorhexidina: false,
        adhesivos: false,
        alimentos: [],
      });
      return;
    }
    onContinuar({
      ningunaConocida: false,
      medicamentos,
      latex,
      contrastesYodados: contrastes,
      clorhexidina,
      adhesivos,
      alimentos: [...alimentos],
    });
  }

  const casilla = (v: boolean, set: (b: boolean) => void, etiqueta: string) => (
    <label className={`radio-tarjeta ${v ? 'seleccionado' : ''}`}>
      <input type="checkbox" checked={v} onChange={() => set(!v)} />
      {etiqueta}
    </label>
  );

  return (
    <section className="tarjeta" aria-labelledby="paso-alergias-tit">
      <h2 id="paso-alergias-tit">Paso 2 · Alergias</h2>

      <label className={`radio-tarjeta ${conocidas ? 'seleccionado' : ''}`}>
        <input type="checkbox" checked={conocidas} onChange={() => setConocidas(!conocidas)} />
        Alergias conocidas
      </label>
      {!conocidas && (
        <p className="aviso aviso-info" role="note">
          Si no marca esta casilla, se registrará como <strong>sin alergias conocidas</strong>.
        </p>
      )}

      {conocidas && (
        <>
          <h3>Medicamentos</h3>
          {medicamentos.length === 0 ? (
            <p>No se ha añadido ninguna alergia a medicamentos.</p>
          ) : (
            <ul className="lista-previas">
              {medicamentos.map((m, i) => (
                <li key={`${m.farmaco}-${i}`} className="previa">
                  <div><strong>{m.farmaco}</strong>{m.reaccion ? ` · ${m.reaccion}` : ''}</div>
                  <button type="button" className="boton-enlace" onClick={() => quitarMedicamento(i)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}
          <fieldset className="campo bloque-anadir">
            <legend>Añadir alergia a medicamento</legend>
            <div className="campo">
              <label htmlFor="al-farmaco">Medicamento</label>
              <input id="al-farmaco" className="campo-grande" type="text" value={farmaco} onChange={(e) => setFarmaco(e.target.value)} placeholder="p. ej. Penicilina" />
            </div>
            <div className="campo">
              <label htmlFor="al-reaccion">Tipo de reacción (opcional)</label>
              <input id="al-reaccion" className="campo-grande" type="text" value={reaccion} onChange={(e) => setReaccion(e.target.value)} placeholder="p. ej. exantema, anafilaxia" />
            </div>
            <button type="button" className="boton-secundario" disabled={farmaco.trim() === ''} onClick={anadirMedicamento}>
              Añadir a la lista
            </button>
          </fieldset>

          <h3>Otras alergias</h3>
          <div className="grupo-checks">
            {casilla(latex, setLatex, 'Látex')}
            {casilla(contrastes, setContrastes, 'Contrastes yodados')}
            {casilla(clorhexidina, setClorhexidina, 'Clorhexidina')}
            {casilla(adhesivos, setAdhesivos, 'Adhesivos')}
          </div>

          <h3>Alimentos relevantes</h3>
          <div className="grupo-checks">
            {ALIMENTOS_ALERGIA.map((a) => (
              <label key={a.id} className={`radio-tarjeta ${alimentos.has(a.id) ? 'seleccionado' : ''}`}>
                <input type="checkbox" checked={alimentos.has(a.id)} onChange={() => alternarAlimento(a.id)} />
                {a.etiqueta}
              </label>
            ))}
          </div>
        </>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={continuar}>Continuar</button>
      </div>
    </section>
  );
}
