/**
 * Paso 10 — Consentimiento informado de anestesia (§10, R3.2.28). Tres estados:
 * entregado y explicado (con fecha), pendiente de entregar (habitual en telefónica)
 * o no procede. Consta en el texto de SAP y en la hoja del paciente.
 */
import { useState } from 'react';
import type { ConsentimientoUi } from '../estadoEntrevista.ts';

interface Props {
  inicial: ConsentimientoUi | null;
  telefonica: boolean;
  onContinuar: (datos: ConsentimientoUi) => void;
  onVolver: () => void;
}

const ESTADOS: Array<{ v: ConsentimientoUi['estado']; et: string }> = [
  { v: 'entregado', et: 'Entregado y explicado' },
  { v: 'pendiente_entregar', et: 'Pendiente de entregar (se entregará el día de la intervención)' },
  { v: 'no_procede', et: 'No procede' },
];

export function PasoConsentimiento({ inicial, telefonica, onContinuar, onVolver }: Props) {
  const [estado, setEstado] = useState<ConsentimientoUi['estado']>(inicial?.estado ?? (telefonica ? 'pendiente_entregar' : 'entregado'));
  const [fecha, setFecha] = useState(inicial?.fecha ?? '');

  return (
    <section className="tarjeta" aria-labelledby="paso10-tit">
      <h2 id="paso10-tit">Paso 10 · Consentimiento informado de anestesia</h2>

      <fieldset className="campo">
        <legend>Estado del consentimiento</legend>
        <div className="grupo-radios">
          {ESTADOS.map((e) => (
            <label key={e.v} className={`radio-tarjeta ${estado === e.v ? 'seleccionado' : ''}`}>
              <input type="radio" name="consentimiento" checked={estado === e.v} onChange={() => setEstado(e.v)} />
              {e.et}
            </label>
          ))}
        </div>
      </fieldset>

      {estado === 'entregado' && (
        <div className="campo">
          <label htmlFor="fecha-cons">Fecha de entrega y explicación</label>
          <input id="fecha-cons" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={() => onContinuar({ estado, ...(estado === 'entregado' && fecha ? { fecha } : {}) })}>Continuar</button>
      </div>
    </section>
  );
}
