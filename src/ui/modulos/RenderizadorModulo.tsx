/**
 * Renderizador genérico de un módulo de patología (§5) desde su JSON.
 * Pinta cada pregunta según su tipo (boolean, opción, opción múltiple, número,
 * fecha, texto), respeta la visibilidad condicional y ofrece el enlace del modo
 * guiado «¿Por qué preguntamos esto?». No conoce ninguna patología concreta: todo
 * sale de datos/modulos/*.json.
 */
import { useState } from 'react';
import {
  preguntaVisible,
  type ModuloPatologia,
  type PreguntaModulo,
  type RespuestasModulo,
  type ValorRespuesta,
} from '../../datos/modulos.ts';

interface Props {
  modulo: ModuloPatologia;
  respuestas: RespuestasModulo;
  onCambio: (preguntaId: string, valor: ValorRespuesta) => void;
}

export function RenderizadorModulo({ modulo, respuestas, onCambio }: Props) {
  return (
    <fieldset className="modulo-patologia">
      <legend>{modulo.titulo}</legend>
      {modulo.preguntas.map((p) =>
        preguntaVisible(p, respuestas) ? (
          <CampoPregunta key={p.id} moduloId={modulo.id} p={p} valor={respuestas[p.id]} onCambio={onCambio} />
        ) : null,
      )}
    </fieldset>
  );
}

function CampoPregunta({
  moduloId,
  p,
  valor,
  onCambio,
}: {
  moduloId: string;
  p: PreguntaModulo;
  valor: ValorRespuesta | undefined;
  onCambio: (preguntaId: string, valor: ValorRespuesta) => void;
}) {
  const [porqueVisible, setPorqueVisible] = useState(false);
  const idCampo = `${moduloId}-${p.id}`;

  return (
    <div className="campo campo-modulo">
      <label htmlFor={idCampo}>{p.etiqueta}{p.unidad ? ` (${p.unidad})` : ''}</label>

      {p.tipo === 'boolean' && (
        <div className="grupo-si-no" role="group" aria-label={p.etiqueta}>
          <button type="button" className={`chip-hora ${valor === true ? 'seleccionado' : ''}`} onClick={() => onCambio(p.id, valor === true ? null : true)} aria-pressed={valor === true}>Sí</button>
          <button type="button" className={`chip-hora ${valor === false ? 'seleccionado' : ''}`} onClick={() => onCambio(p.id, valor === false ? null : false)} aria-pressed={valor === false}>No</button>
        </div>
      )}

      {p.tipo === 'opcion' && (
        <select id={idCampo} value={typeof valor === 'string' ? valor : ''} onChange={(e) => onCambio(p.id, e.target.value || null)}>
          <option value="">— elija —</option>
          {(p.opciones ?? []).map((o) => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
      )}

      {p.tipo === 'opcion_multiple' && (
        <div className="grupo-checks">
          {(p.opciones ?? []).map((o) => {
            const sel = Array.isArray(valor) && valor.includes(o.valor);
            return (
              <label key={o.valor} className={`radio-tarjeta ${sel ? 'seleccionado' : ''}`}>
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => {
                    const actual = Array.isArray(valor) ? [...valor] : [];
                    const nuevo = sel ? actual.filter((x) => x !== o.valor) : [...actual, o.valor];
                    onCambio(p.id, nuevo);
                  }}
                />
                {o.etiqueta}
              </label>
            );
          })}
        </div>
      )}

      {p.tipo === 'numero' && (
        <input
          id={idCampo}
          type="number"
          inputMode="decimal"
          {...(p.min !== undefined ? { min: p.min } : {})}
          {...(p.max !== undefined ? { max: p.max } : {})}
          value={typeof valor === 'number' ? valor : ''}
          placeholder={p.placeholder ?? ''}
          onChange={(e) => onCambio(p.id, e.target.value === '' ? null : Number(e.target.value))}
        />
      )}

      {p.tipo === 'fecha' && (
        <input id={idCampo} type="date" value={typeof valor === 'string' ? valor : ''} onChange={(e) => onCambio(p.id, e.target.value || null)} />
      )}

      {p.tipo === 'texto' && (
        <input id={idCampo} type="text" value={typeof valor === 'string' ? valor : ''} placeholder={p.placeholder ?? ''} onChange={(e) => onCambio(p.id, e.target.value || null)} />
      )}

      {p.porque && (
        <div className="modo-guiado">
          <button type="button" className="boton-enlace" onClick={() => setPorqueVisible((v) => !v)} aria-expanded={porqueVisible}>
            ¿Por qué preguntamos esto?
          </button>
          {porqueVisible && <p className="porque-texto">{p.porque}</p>}
        </div>
      )}
    </div>
  );
}
