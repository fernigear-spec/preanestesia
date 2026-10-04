/**
 * Paso 6 — Hábitos, capacidad funcional y fragilidad (R3.2.16–R3.2.20).
 * - Tabaco (activo / exfumador con paquetes-año y fecha / nunca).
 * - Alcohol: AUDIT-C (3 preguntas); positivo → consejo; ≥ 8 → alerta de abstinencia.
 * - Capacidad funcional: ¿sube dos pisos sin parar? Si no o dudoso → DASI completo.
 * - En 65 años o más: Clinical Frailty Scale (1-9) y test 4AT.
 * Muestra en vivo el resultado de las escalas del motor.
 */
import { useState } from 'react';
import type { Sexo } from '../../dominio/tipos.ts';
import { calcularAuditC } from '../../dominio/escalas/auditC.ts';
import { calcularDasi, PESOS_DASI, type ItemDasi } from '../../dominio/escalas/dasi.ts';
import { evaluarCfs } from '../../dominio/escalas/cfs.ts';
import { calcular4AT, type Entrada4AT } from '../../dominio/escalas/cuatroAT.ts';
import type { HabitosUi } from '../estadoEntrevista.ts';

interface Props {
  inicial: HabitosUi | null;
  /** Edad del paciente (para activar CFS y 4AT en >= 65). */
  edadAnios: number;
  /** Sexo (umbral del AUDIT-C). */
  sexo: Sexo;
  onContinuar: (datos: HabitosUi) => void;
  onVolver: () => void;
}

const ITEMS_DASI: Array<{ id: ItemDasi; etiqueta: string }> = [
  { id: 'autocuidado', etiqueta: 'Cuidarse (vestirse, ducharse, ir al baño)' },
  { id: 'caminarDentroCasa', etiqueta: 'Caminar por casa' },
  { id: 'caminar1a2Manzanas', etiqueta: 'Caminar 1-2 manzanas en llano' },
  { id: 'subirUnPisoOCuesta', etiqueta: 'Subir un piso o una cuesta' },
  { id: 'correrDistanciaCorta', etiqueta: 'Correr una distancia corta' },
  { id: 'tareasLigerasCasa', etiqueta: 'Tareas ligeras del hogar (fregar platos)' },
  { id: 'tareasModeradasCasa', etiqueta: 'Tareas moderadas (pasar la aspiradora)' },
  { id: 'tareasPesadasCasa', etiqueta: 'Tareas pesadas (fregar suelos, mover muebles)' },
  { id: 'trabajoJardin', etiqueta: 'Trabajo de jardín' },
  { id: 'relacionesSexuales', etiqueta: 'Relaciones sexuales' },
  { id: 'actividadesRecreativasModeradas', etiqueta: 'Actividades recreativas moderadas (baile, golf)' },
  { id: 'deportesIntensos', etiqueta: 'Deportes intensos (natación, tenis, fútbol)' },
];

const OPCIONES_0_4 = [0, 1, 2, 3, 4];

export function PasoHabitos({ inicial, edadAnios, sexo, onContinuar, onVolver }: Props) {
  const mayor = edadAnios >= 65;

  const [tabaco, setTabaco] = useState<HabitosUi['tabaco']>(inicial?.tabaco ?? 'nunca');
  const [paquetesAnio, setPaquetesAnio] = useState(inicial?.paquetesAnio !== undefined ? String(inicial.paquetesAnio) : '');
  const [fechaAbandono, setFechaAbandono] = useState(inicial?.fechaAbandonoTabaco ?? '');
  const [descripcionTabaco, setDescripcionTabaco] = useState(inicial?.descripcionTabaco ?? '');
  const [cocaina, setCocaina] = useState(inicial?.cocainaUltimaSemana ?? false);

  // AUDIT-C: ninguna pregunta es obligatoria (undefined = sin contestar).
  const [aFrec, setAFrec] = useState<number | undefined>(inicial?.auditFrecuencia);
  const [aCant, setACant] = useState<number | undefined>(inicial?.auditCantidad);
  const [aAtr, setAAtr] = useState<number | undefined>(inicial?.auditAtracon);
  const auditCompleto = aFrec !== undefined && aCant !== undefined && aAtr !== undefined;

  const [dosPisos, setDosPisos] = useState<HabitosUi['subeDosPisos']>(inicial?.subeDosPisos ?? 'si');
  const [itemsDasi, setItemsDasi] = useState<Set<ItemDasi>>(new Set((inicial?.itemsDasi ?? []) as ItemDasi[]));

  const [cfs, setCfs] = useState(inicial?.cfs !== undefined ? String(inicial.cfs) : '');
  const [at4, setAt4] = useState<Entrada4AT>(
    inicial?.cuatroAt ?? { alerta: 'normal', amt4: '0_errores', meses: '7_o_mas', cambioAgudo: 'no' },
  );

  // Resultados en vivo. El AUDIT-C solo se calcula si las tres están contestadas.
  const audit = auditCompleto
    ? calcularAuditC({ frecuenciaConsumo: aFrec, cantidadTipica: aCant, frecuenciaAtracon: aAtr, sexo })
    : null;
  const necesitaDasi = dosPisos !== 'si';
  const dasi = necesitaDasi ? calcularDasi([...itemsDasi]) : null;
  const cfsNum = cfs === '' ? null : Number(cfs);
  const cfsRes = mayor && cfsNum !== null && cfsNum >= 1 && cfsNum <= 9 ? evaluarCfs(cfsNum) : null;
  const at4Res = mayor ? calcular4AT(at4) : null;

  function alternarDasi(id: ItemDasi) {
    setItemsDasi((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const cfsOk = !mayor || (cfs !== '' && cfsNum !== null && cfsNum >= 1 && cfsNum <= 9);
  const puedeContinuar = cfsOk;

  function continuar() {
    const datos: HabitosUi = {
      tabaco,
      subeDosPisos: dosPisos,
      itemsDasi: [...itemsDasi],
    };
    if (aFrec !== undefined) datos.auditFrecuencia = aFrec;
    if (aCant !== undefined) datos.auditCantidad = aCant;
    if (aAtr !== undefined) datos.auditAtracon = aAtr;
    if (tabaco === 'exfumador') {
      if (paquetesAnio !== '') datos.paquetesAnio = Number(paquetesAnio);
      if (fechaAbandono !== '') datos.fechaAbandonoTabaco = fechaAbandono;
    }
    if ((tabaco === 'activo' || tabaco === 'exfumador') && descripcionTabaco.trim() !== '') {
      datos.descripcionTabaco = descripcionTabaco.trim();
    }
    if (cocaina) datos.cocainaUltimaSemana = true;
    if (mayor) {
      if (cfsNum !== null) datos.cfs = cfsNum;
      datos.cuatroAt = at4;
    }
    onContinuar(datos);
  }

  return (
    <section className="tarjeta" aria-labelledby="paso6-tit">
      <h2 id="paso6-tit">Paso 5 · Hábitos, capacidad funcional y fragilidad</h2>

      <h3>Tabaco</h3>
      <div className="grupo-radios">
        {(['nunca', 'activo', 'exfumador'] as const).map((t) => (
          <label key={t} className={`radio-tarjeta ${tabaco === t ? 'seleccionado' : ''}`}>
            <input type="radio" name="tabaco" checked={tabaco === t} onChange={() => setTabaco(t)} />
            {t === 'nunca' ? 'Nunca ha fumado' : t === 'activo' ? 'Fumador activo' : 'Exfumador'}
          </label>
        ))}
      </div>
      {tabaco === 'exfumador' && (
        <>
          <div className="campo">
            <label htmlFor="pa">Paquetes-año</label>
            <input id="pa" type="number" min={0} inputMode="numeric" value={paquetesAnio} onChange={(e) => setPaquetesAnio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="fab">Fecha de abandono</label>
            <input id="fab" type="date" value={fechaAbandono} onChange={(e) => setFechaAbandono(e.target.value)} />
          </div>
        </>
      )}
      {(tabaco === 'activo' || tabaco === 'exfumador') && (
        <div className="campo">
          <label htmlFor="desc-tabaco">Describa el consumo (opcional)</label>
          <input id="desc-tabaco" type="text" value={descripcionTabaco} onChange={(e) => setDescripcionTabaco(e.target.value)}
            placeholder="p. ej. 1 paquete al día desde los 20 años" />
        </div>
      )}

      <h3>Alcohol (AUDIT-C)</h3>
      <p className="aviso aviso-info" role="note">Ninguna pregunta es obligatoria. La puntuación solo se calcula si contesta las tres.</p>
      <AuditPregunta id="a1" etiqueta="¿Con qué frecuencia consume alguna bebida alcohólica?" valor={aFrec} onCambio={setAFrec} />
      <AuditPregunta id="a2" etiqueta="¿Cuántas consumiciones de alcohol suele tomar en un día típico?" valor={aCant} onCambio={setACant} />
      <AuditPregunta id="a3" etiqueta="¿Con qué frecuencia toma 6 o más bebidas en una sola ocasión?" valor={aAtr} onCambio={setAAtr} />
      {audit ? (
        <p className={`aviso ${audit.riesgoAbstinencia ? 'aviso-atencion' : 'aviso-info'}`} role="note" aria-live="polite">
          AUDIT-C: <strong>{audit.puntuacion}</strong> ·{' '}
          {audit.categoria === 'negativo' && 'negativo'}
          {audit.categoria === 'positivo' && 'positivo → consejo breve y hoja de reducción'}
          {audit.categoria === 'riesgo_abstinencia' && '≥ 8 → alerta de riesgo de síndrome de abstinencia perioperatorio'}
        </p>
      ) : (
        <p className="aviso aviso-info" role="note" aria-live="polite">AUDIT-C no completado (no genera alertas ni anexo).</p>
      )}

      <div className="campo">
        <label className="radio-tarjeta">
          <input type="checkbox" checked={cocaina} onChange={(e) => setCocaina(e.target.checked)} />
          Consumo de cocaína en la última semana
        </label>
      </div>

      <h3>Capacidad funcional</h3>
      <p>¿Puede subir dos pisos de escaleras sin pararse?</p>
      <div className="grupo-radios">
        {(['si', 'no', 'dudoso'] as const).map((v) => (
          <label key={v} className={`radio-tarjeta ${dosPisos === v ? 'seleccionado' : ''}`}>
            <input type="radio" name="dospisos" checked={dosPisos === v} onChange={() => setDosPisos(v)} />
            {v === 'si' ? 'Sí, sin problema' : v === 'no' ? 'No' : 'No está claro'}
          </label>
        ))}
      </div>
      {necesitaDasi && (
        <fieldset className="campo">
          <legend>DASI · marque lo que el paciente SÍ puede hacer</legend>
          <div className="grupo-checks">
            {ITEMS_DASI.map((it) => (
              <label key={it.id} className={`radio-tarjeta ${itemsDasi.has(it.id) ? 'seleccionado' : ''}`}>
                <input type="checkbox" checked={itemsDasi.has(it.id)} onChange={() => alternarDasi(it.id)} />
                {it.etiqueta} <span className="peso">(+{PESOS_DASI[it.id]})</span>
              </label>
            ))}
          </div>
          {dasi && (
            <p className={`aviso ${dasi.capacidadReducida ? 'aviso-atencion' : 'aviso-info'}`} role="note" aria-live="polite">
              DASI <strong>{dasi.dasi.toString().replace('.', ',')}</strong> · {dasi.mets.toString().replace('.', ',')} METs ·{' '}
              {dasi.capacidadReducida ? 'capacidad funcional reducida (< 4 METs)' : '≥ 4 METs'}
            </p>
          )}
        </fieldset>
      )}

      {mayor && (
        <>
          <h3>Fragilidad y cognición (65 años o más)</h3>
          <div className="campo">
            <label htmlFor="cfs">Clinical Frailty Scale (1 = en forma … 9 = enfermo terminal)</label>
            <input id="cfs" type="number" min={1} max={9} inputMode="numeric" value={cfs} onChange={(e) => setCfs(e.target.value)} />
            {cfsRes && (
              <p className={`aviso ${cfsRes.fragilidad ? 'aviso-atencion' : 'aviso-info'}`} role="note" aria-live="polite">
                CFS <strong>{cfsRes.puntuacion}</strong> · {cfsRes.fragilidad ? 'fragilidad (alerta)' : 'sin fragilidad'}
              </p>
            )}
          </div>

          <fieldset className="campo">
            <legend>Test 4AT</legend>
            <Radio4AT etiqueta="Nivel de alerta" name="alerta" valor={at4.alerta}
              opciones={[['normal', 'Normal'], ['alterado', 'Alterado']]}
              onCambio={(v) => setAt4({ ...at4, alerta: v as Entrada4AT['alerta'] })} />
            <Radio4AT etiqueta="AMT4 (edad, fecha nacimiento, lugar, año)" name="amt4" valor={at4.amt4}
              opciones={[['0_errores', 'Sin errores'], ['1_error', '1 error'], ['2_o_mas_o_no_valorable', '2 o más / no valorable']]}
              onCambio={(v) => setAt4({ ...at4, amt4: v as Entrada4AT['amt4'] })} />
            <Radio4AT etiqueta="Meses del año al revés" name="meses" valor={at4.meses}
              opciones={[['7_o_mas', '7 o más correctos'], ['menos_de_7', 'Empieza pero < 7'], ['no_valorable', 'No valorable']]}
              onCambio={(v) => setAt4({ ...at4, meses: v as Entrada4AT['meses'] })} />
            <Radio4AT etiqueta="Cambio agudo o curso fluctuante" name="cambio" valor={at4.cambioAgudo}
              opciones={[['no', 'No'], ['si', 'Sí']]}
              onCambio={(v) => setAt4({ ...at4, cambioAgudo: v as Entrada4AT['cambioAgudo'] })} />
            {at4Res && (
              <p className={`aviso ${at4Res.categoria === 'improbable' ? 'aviso-info' : 'aviso-atencion'}`} role="note" aria-live="polite">
                4AT <strong>{at4Res.puntuacion}</strong> ·{' '}
                {at4Res.categoria === 'improbable' && 'deterioro improbable'}
                {at4Res.categoria === 'posible_deterioro_cognitivo' && 'posible deterioro cognitivo'}
                {at4Res.categoria === 'posible_delirium' && 'posible delirium actual (alerta)'}
              </p>
            )}
          </fieldset>
        </>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" disabled={!puedeContinuar} onClick={continuar}>Continuar</button>
      </div>
    </section>
  );
}

function AuditPregunta({ id, etiqueta, valor, onCambio }: { id: string; etiqueta: string; valor: number | undefined; onCambio: (n: number | undefined) => void }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={valor === undefined ? '' : valor} onChange={(e) => onCambio(e.target.value === '' ? undefined : Number(e.target.value))}>
        <option value="">— sin contestar —</option>
        {OPCIONES_0_4.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}

function Radio4AT({
  etiqueta,
  name,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  name: string;
  valor: string;
  opciones: Array<[string, string]>;
  onCambio: (v: string) => void;
}) {
  return (
    <fieldset className="campo">
      <legend>{etiqueta}</legend>
      <div className="grupo-radios">
        {opciones.map(([v, txt]) => (
          <label key={v} className={`radio-tarjeta ${valor === v ? 'seleccionado' : ''}`}>
            <input type="radio" name={name} checked={valor === v} onChange={() => onCambio(v)} />
            {txt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
