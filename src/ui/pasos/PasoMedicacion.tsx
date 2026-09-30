/**
 * Paso 8 — Medicación habitual (R3.2.24–R3.2.27).
 * Buscador sobre farmacos.csv (tolerante a tildes/mayúsculas/erratas). Por cada
 * fármaco se recogen, de forma cómoda en tablet: las horas de toma (botones + hora
 * libre), el día de la semana (semanales), la fecha de la última dosis y la
 * periodicidad (biológicos/antiangiogénicos), las unidades y la hora (insulinas) y
 * la dosis cuando la regla depende de ella. Se muestra en vivo el resultado del
 * motor (qué hacer y última toma) y las tarjetas del asistente de coherencia (§5b).
 */
import { useMemo, useState } from 'react';
import type { DatosIntervencion } from '../../dominio/tipos.ts';
import { construirContexto } from '../../dominio/reglas/motor.ts';
import { evaluarFarmacoUi, metadatosPlazo, type DatosFarmacoUi } from '../../dominio/reglas/despachador.ts';
import { recalcularHoja, type FarmacoQr } from '../../dominio/salidas/qr/hojaPaciente.ts';
import { textoHojaPaciente } from '../../dominio/salidas/hojaFarmaco.ts';
import {
  tarjetaFarmacoAEnfermedad,
  tarjetasEnfermedadAFarmaco,
  type Tarjeta,
} from '../../dominio/coherencia/coherencia.ts';
import { cargarFarmacos, buscarFarmacos, type FarmacoCatalogoUi } from '../../datos/farmacos.ts';
import { HORAS_FRECUENTES, reglaNecesitaHoras, type FarmacoTomadoUi } from '../estadoEntrevista.ts';

interface Props {
  inicial: FarmacoTomadoUi[] | null;
  intervencion: DatosIntervencion;
  /** Enfermedades marcadas en el paso 7 (para la coherencia enfermedad→fármaco). */
  enfermedades: string[];
  onContinuar: (medicacion: FarmacoTomadoUi[]) => void;
  onVolver: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function PasoMedicacion({ inicial, intervencion, enfermedades, onContinuar, onVolver }: Props) {
  const catalogo = useMemo(() => cargarFarmacos(), []);
  const [medicacion, setMedicacion] = useState<FarmacoTomadoUi[]>(inicial ?? []);
  const [consulta, setConsulta] = useState('');

  const resultados = useMemo(() => buscarFarmacos(catalogo, consulta), [catalogo, consulta]);

  function anadir(f: FarmacoCatalogoUi) {
    const nuevo: FarmacoTomadoUi = {
      idFarmaco: f.id,
      nombreComercial: f.nombresComerciales[0] ?? f.id,
      principiosActivos: f.principiosActivos,
      idRegla: f.idRegla[0] ?? 'mantener_generico',
      grupo: f.grupo,
      subgrupo: f.subgrupo,
      pautaTipica: f.pautaTipica,
      via: f.via,
      requiereConfirmacionCatalogo: f.requiereConfirmacion,
      indicacionesPosibles: f.indicacionesPosibles,
      horas: [],
      ...(f.textoPaciente ? { textoPaciente: f.textoPaciente } : {}),
      ...(f.textoAnestesiologo ? { textoAnestesiologo: f.textoAnestesiologo } : {}),
    };
    setMedicacion((m) => [...m, nuevo]);
    setConsulta('');
  }
  function actualizar(i: number, cambios: Partial<FarmacoTomadoUi>) {
    setMedicacion((m) => m.map((f, j) => (j === i ? { ...f, ...cambios } : f)));
  }
  function quitar(i: number) {
    setMedicacion((m) => m.filter((_, j) => j !== i));
  }

  // Coherencia (§5b):
  //  - enfermedad→fármaco (§5b.2): enfermedades marcadas sin su tratamiento habitual.
  //  - fármaco→enfermedad (§5b.1): fármaco añadido cuya indicación no está entre las
  //    enfermedades recogidas (pregunta por qué lo toma).
  const enfermedadesSet = new Set(enfermedades);
  const gruposPresentes = new Set(medicacion.map((f) => grupoCoherencia(f)).filter(Boolean) as string[]);
  const tarjetasEnfermedad = tarjetasEnfermedadAFarmaco(enfermedadesSet, gruposPresentes);
  const tarjetasFarmaco = medicacion
    .map((f) => tarjetaFarmacoAEnfermedad({ nombre: f.nombreComercial, indicacionesPosibles: f.indicacionesPosibles }, enfermedadesSet))
    .filter((t): t is Tarjeta => t !== null);
  const tarjetas = [...tarjetasEnfermedad, ...tarjetasFarmaco];

  return (
    <section className="tarjeta" aria-labelledby="paso8-tit">
      <h2 id="paso8-tit">Paso 8 · Medicación habitual</h2>

      <div className="campo">
        <label htmlFor="med">Añadir medicamento (nombre comercial o principio activo)</label>
        <input id="med" type="search" autoComplete="off" placeholder="p. ej. Eliquis, apixabán, Adiro…" value={consulta} onChange={(e) => setConsulta(e.target.value)} />
        {resultados.length > 0 && (
          <ul className="lista-resultados" role="listbox">
            {resultados.map((f) => (
              <li key={f.id}>
                <button type="button" className="opcion-resultado" onClick={() => anadir(f)}>
                  <span className="opcion-nombre">{f.nombresComerciales[0] ?? f.id}</span>
                  <span className="opcion-especialidad">{f.principiosActivos.join(', ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {medicacion.length === 0 ? (
        <p>No se ha añadido ningún medicamento.</p>
      ) : (
        medicacion.map((f, i) => (
          <FichaFarmaco
            key={`${f.idFarmaco}-${i}`}
            f={f}
            intervencion={intervencion}
            onCambio={(c) => actualizar(i, c)}
            onQuitar={() => quitar(i)}
          />
        ))
      )}

      {tarjetas.length > 0 && (
        <div className="coherencia">
          <h3>Avisos de coherencia</h3>
          {tarjetas.map((t, i) => (
            <TarjetaCoherencia key={i} t={t} />
          ))}
        </div>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={() => onContinuar(medicacion)}>Continuar</button>
      </div>
    </section>
  );
}

function FichaFarmaco({
  f,
  intervencion,
  onCambio,
  onQuitar,
}: {
  f: FarmacoTomadoUi;
  intervencion: DatosIntervencion;
  onCambio: (c: Partial<FarmacoTomadoUi>) => void;
  onQuitar: () => void;
}) {
  const [horaLibre, setHoraLibre] = useState('');
  const necesitaHoras = reglaNecesitaHoras(f.idRegla);
  const esSemanal = f.pautaTipica === 'semanal' || f.idRegla === 'glp1_semanal';
  const esBiologico = f.idRegla === 'biologico' || f.idRegla.startsWith('antiangiogenico');
  const esInsulinaBasal = f.idRegla === 'insulina_basal';
  const esInsulinaNph = f.idRegla === 'insulina_nph';
  const esInsulinaPremezclada = f.idRegla === 'insulina_premezclada';
  const esHbpm = f.idRegla === 'hbpm' || f.idRegla === 'fondaparinux';
  const necesitaDosis = f.idRegla === 'aas' || f.idRegla === 'metotrexato';

  function alternarHora(h: string) {
    const horas = f.horas.includes(h) ? f.horas.filter((x) => x !== h) : [...f.horas, h].sort();
    onCambio({ horas });
  }
  function anadirHoraLibre() {
    if (!/^\d{1,2}:\d{2}$/.test(horaLibre) || f.horas.includes(horaLibre)) return;
    onCambio({ horas: [...f.horas, horaLibre].sort() });
    setHoraLibre('');
  }

  const resultado = evaluarFicha(f, intervencion);

  return (
    <div className="ficha-farmaco">
      <div className="ficha-cabecera">
        <strong>{f.nombreComercial}</strong> <span className="opcion-especialidad">{f.principiosActivos.join(', ')}</span>
        <button type="button" className="boton-enlace" onClick={onQuitar}>Quitar</button>
      </div>

      {necesitaHoras && (
        <div className="campo">
          <label>Horas de toma</label>
          <div className="grupo-botones-hora">
            {HORAS_FRECUENTES.map((h) => (
              <button key={h} type="button" className={`chip-hora ${f.horas.includes(h) ? 'seleccionado' : ''}`} onClick={() => alternarHora(h)}>
                {h}
              </button>
            ))}
          </div>
          <div className="hora-libre">
            <input type="time" value={horaLibre} onChange={(e) => setHoraLibre(e.target.value)} aria-label="Hora libre" />
            <button type="button" className="boton-secundario" onClick={anadirHoraLibre}>Añadir hora</button>
          </div>
          {f.horas.length > 0 && <p className="horas-elegidas">Horas: {f.horas.join(', ')}</p>}
        </div>
      )}

      {esSemanal && (
        <div className="campo">
          <label htmlFor={`dia-${f.idFarmaco}`}>Día de la semana</label>
          <select id={`dia-${f.idFarmaco}`} value={f.diaSemana ?? ''} onChange={(e) => onCambio({ diaSemana: Number(e.target.value) })}>
            <option value="" disabled>Elija un día</option>
            {DIAS_SEMANA.map((d, idx) => (
              <option key={idx} value={idx}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {esBiologico && (
        <>
          <div className="campo">
            <label htmlFor={`fud-${f.idFarmaco}`}>Fecha de la última dosis</label>
            <input id={`fud-${f.idFarmaco}`} type="date" value={f.fechaUltimaDosis ?? ''} onChange={(e) => onCambio({ fechaUltimaDosis: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor={`per-${f.idFarmaco}`}>Periodicidad (días entre dosis)</label>
            <input id={`per-${f.idFarmaco}`} type="number" min={1} inputMode="numeric" value={f.periodicidadDias ?? ''} onChange={(e) => onCambio({ periodicidadDias: Number(e.target.value) })} />
          </div>
        </>
      )}

      {esInsulinaBasal && (
        <div className="campo">
          <label htmlFor={`ub-${f.idFarmaco}`}>Unidades de la dosis basal</label>
          <input id={`ub-${f.idFarmaco}`} type="number" min={0} inputMode="numeric" value={f.insulinaBasalUi ?? ''} onChange={(e) => onCambio({ insulinaBasalUi: Number(e.target.value) })} />
        </div>
      )}
      {(esInsulinaNph || esInsulinaPremezclada) && (
        <>
          {esInsulinaNph && (
            <div className="campo">
              <label htmlFor={`un-${f.idFarmaco}`}>Unidades de la noche</label>
              <input id={`un-${f.idFarmaco}`} type="number" min={0} inputMode="numeric" value={f.insulinaNocheUi ?? ''} onChange={(e) => onCambio({ insulinaNocheUi: Number(e.target.value) })} />
            </div>
          )}
          <div className="campo">
            <label htmlFor={`um-${f.idFarmaco}`}>Unidades de la mañana</label>
            <input id={`um-${f.idFarmaco}`} type="number" min={0} inputMode="numeric" value={f.insulinaMananaUi ?? ''} onChange={(e) => onCambio({ insulinaMananaUi: Number(e.target.value) })} />
          </div>
        </>
      )}

      {esHbpm && (
        <div className="campo">
          <label>Dosis de la heparina</label>
          <div className="grupo-radios">
            {(['profilactica', 'terapeutica'] as const).map((t) => (
              <label key={t} className={`radio-tarjeta ${f.tipoHbpm === t ? 'seleccionado' : ''}`}>
                <input type="radio" name={`hbpm-${f.idFarmaco}`} checked={f.tipoHbpm === t} onChange={() => onCambio({ tipoHbpm: t })} />
                {t === 'profilactica' ? 'Profiláctica (preventiva)' : 'Terapéutica (tratamiento)'}
              </label>
            ))}
          </div>
        </div>
      )}

      {necesitaDosis && (
        <div className="campo">
          <label htmlFor={`dosis-${f.idFarmaco}`}>Dosis {f.idRegla === 'metotrexato' ? '(mg/semana)' : '(mg/día)'}</label>
          <input id={`dosis-${f.idFarmaco}`} type="number" min={0} inputMode="numeric" value={f.dosisMg ?? ''} onChange={(e) => onCambio({ dosisMg: Number(e.target.value) })} />
        </div>
      )}

      {/* Resultado del motor en vivo */}
      <div className={`resultado-motor ${resultado.claseAviso}`} aria-live="polite">
        {resultado.texto}
      </div>
    </div>
  );
}

interface ResultadoFicha {
  texto: string;
  claseAviso: string;
}

/** Calcula el resultado en vivo de un fármaco. Con fecha usa el despachador; sin
 *  fecha usa el modo margen del QR (garantía §8.16: nunca llama a construirContexto). */
function evaluarFicha(f: FarmacoTomadoUi, intervencion: DatosIntervencion): ResultadoFicha {
  const necesitaHoras = reglaNecesitaHoras(f.idRegla);
  if (necesitaHoras && f.horas.length === 0) {
    return { texto: 'Requiere dato: hora de la toma.', claseAviso: 'aviso-atencion' };
  }

  const meta = metadatosPlazo(f.idRegla, f.dosisMg, f.tipoHbpm);

  // Sin fecha (§8.16): modo margen, sin construirContexto.
  if (intervencion.fechaDesconocida || intervencion.fechaHora === null) {
    const item: FarmacoQr = {
      n: f.nombreComercial,
      pt: meta.pt,
      hh: f.horas,
      ad: meta.ad,
      ac: meta.ac,
      rc: f.requiereConfirmacionCatalogo,
      ...(meta.pd !== undefined ? { pd: meta.pd } : {}),
    };
    const inst = recalcularHoja({ tel: '', fi: null, far: [item] }, null);
    return { texto: inst[0]?.texto ?? '', claseAviso: 'aviso-info' };
  }

  // Con fecha: despachador del motor.
  const ctx = construirContexto(intervencion, 70, null);
  const datos: DatosFarmacoUi = {
    idFarmaco: f.idFarmaco,
    nombreComercial: f.nombreComercial,
    principiosActivos: f.principiosActivos,
    idRegla: f.idRegla,
    via: f.via,
    horas: f.horas,
    ...(f.dosisMg !== undefined ? { dosisMg: f.dosisMg } : {}),
    ...(f.diaSemana !== undefined ? { proximaDosisSemanal: proximaDosisSemanal(f.diaSemana, intervencion.fechaHora) } : {}),
    ...(f.fechaUltimaDosis ? { fechaUltimaDosis: new Date(`${f.fechaUltimaDosis}T00:00`) } : {}),
    ...(f.periodicidadDias !== undefined ? { periodicidadDias: f.periodicidadDias } : {}),
    ...(f.insulinaBasalUi !== undefined ? { insulinaBasalUi: f.insulinaBasalUi } : {}),
    ...(f.insulinaNocheUi !== undefined ? { insulinaNocheUi: f.insulinaNocheUi } : {}),
    ...(f.insulinaMananaUi !== undefined ? { insulinaMananaUi: f.insulinaMananaUi } : {}),
    ...(f.tipoHbpm ? { tipoHbpm: f.tipoHbpm } : {}),
    ...(f.requiereConfirmacionCatalogo ? { requiereConfirmacionCatalogo: true } : {}),
    ...(f.textoPaciente ? { textoPacienteOverride: f.textoPaciente } : {}),
    ...(f.textoAnestesiologo ? { textoAnestesiologoOverride: f.textoAnestesiologo } : {}),
  };
  const r = evaluarFarmacoUi(datos, ctx);
  const texto = textoHojaPaciente(r);
  const clase = r.requiereConfirmacion ? 'aviso-atencion' : 'aviso-info';
  return { texto: `${accionLegible(r.accion)}: ${texto}`, claseAviso: clase };
}

function accionLegible(a: string): string {
  switch (a) {
    case 'mantener': return 'Mantener';
    case 'suspender': return 'Suspender';
    case 'ajustar': return 'Ajustar';
    case 'consultar': return 'Consultar con el anestesiólogo';
    default: return a;
  }
}

/** Próxima dosis semanal: el próximo día de la semana indicado ≤ intervención. */
function proximaDosisSemanal(diaSemana: number, intervencion: Date): Date {
  const d = new Date(intervencion);
  // Retrocede hasta el día de la semana pedido dentro de la semana previa a la IQ.
  for (let i = 0; i < 8; i++) {
    if (d.getDay() === diaSemana) break;
    d.setDate(d.getDate() - 1);
  }
  d.setHours(9, 0, 0, 0);
  return d;
}

/** Grupo de fármaco para la coherencia enfermedad→fármaco (§5b.2). */
function grupoCoherencia(f: FarmacoTomadoUi): string | null {
  const mapa: Record<string, string> = {
    anticoagulantes: 'anticoagulante',
    antiagregantes: 'antiagregante',
    antidiabeticos: 'antidiabetico',
    insulinas: 'insulina',
    cardiovascular: 'antihipertensivo',
    inmunosupresores: 'inmunosupresor',
    respiratorio: 'inhalador',
  };
  return mapa[f.grupo] ?? null;
}

function TarjetaCoherencia({ t }: { t: Tarjeta }) {
  return (
    <div className="aviso aviso-info" role="note">
      {t.mensaje}
    </div>
  );
}

