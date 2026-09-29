/**
 * Paso 2 — Datos básicos (R3.2.7–R3.2.9).
 * Edad, sexo, peso y talla; IMC automático. Menores de la edad pediátrica máxima
 * (config.json): peso obligatorio y aviso de módulo pediátrico. Mujeres de 12 a
 * 55 años: posibilidad de embarazo y fecha de la última regla.
 */
import { useState } from 'react';
import type { Sexo } from '../../dominio/tipos.ts';
import { SEXOS, calcularImc, type DatosBasicosUi } from '../estadoEntrevista.ts';
import config from '../../../datos/config.json';

interface Props {
  inicial: DatosBasicosUi | null;
  onContinuar: (datos: DatosBasicosUi) => void;
  onVolver: () => void;
}

const EDAD_PEDIATRICA_MAX = (config as { edad_pediatrica_maxima: number }).edad_pediatrica_maxima;

export function PasoBasicos({ inicial, onContinuar, onVolver }: Props) {
  const [edad, setEdad] = useState(inicial ? String(inicial.edadAnios) : '');
  const [sexo, setSexo] = useState<Sexo | ''>(inicial?.sexo ?? '');
  const [peso, setPeso] = useState(inicial ? String(inicial.pesoKg) : '');
  const [talla, setTalla] = useState(inicial ? String(inicial.tallaCm) : '');
  const [posibleEmbarazo, setPosibleEmbarazo] = useState<boolean | undefined>(inicial?.posibleEmbarazo);
  const [fechaUltimaRegla, setFechaUltimaRegla] = useState(inicial?.fechaUltimaRegla ?? '');

  const edadNum = Number(edad);
  const pesoNum = Number(peso);
  const tallaNum = Number(talla);
  const imc = calcularImc(pesoNum, tallaNum);

  const esPediatrico = edad !== '' && edadNum <= EDAD_PEDIATRICA_MAX;
  const preguntarEmbarazo = sexo === 'mujer' && edad !== '' && edadNum >= 12 && edadNum <= 55;

  // Validación mínima.
  const edadOk = edad !== '' && edadNum >= 0 && edadNum < 130;
  const pesoOk = pesoNum > 0 && (!esPediatrico || peso !== ''); // en pediátrico el peso es obligatorio
  const tallaOk = tallaNum > 0;
  const puedeContinuar = edadOk && sexo !== '' && pesoOk && tallaOk;

  function continuar() {
    if (sexo === '') return;
    const datos: DatosBasicosUi = {
      edadAnios: edadNum,
      sexo,
      pesoKg: pesoNum,
      tallaCm: tallaNum,
    };
    if (preguntarEmbarazo) {
      if (posibleEmbarazo !== undefined) datos.posibleEmbarazo = posibleEmbarazo;
      if (fechaUltimaRegla !== '') datos.fechaUltimaRegla = fechaUltimaRegla;
    }
    onContinuar(datos);
  }

  return (
    <section className="tarjeta" aria-labelledby="paso2-tit">
      <h2 id="paso2-tit">Paso 2 · Datos básicos</h2>

      <div className="campo">
        <label htmlFor="edad">Edad (años)</label>
        <input id="edad" type="number" min={0} max={129} inputMode="numeric" value={edad} onChange={(e) => setEdad(e.target.value)} />
      </div>

      <fieldset className="campo">
        <legend>Sexo</legend>
        <div className="grupo-radios">
          {SEXOS.map((s) => (
            <label key={s.valor} className={`radio-tarjeta ${sexo === s.valor ? 'seleccionado' : ''}`}>
              <input type="radio" name="sexo" value={s.valor} checked={sexo === s.valor} onChange={() => setSexo(s.valor)} />
              {s.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor="peso">Peso (kg){esPediatrico ? ' · obligatorio' : ''}</label>
        <input id="peso" type="number" min={0} step="0.1" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="talla">Talla (cm)</label>
        <input id="talla" type="number" min={0} step="0.1" inputMode="decimal" value={talla} onChange={(e) => setTalla(e.target.value)} />
      </div>

      {imc !== null && (
        <p className="aviso aviso-info" role="note" aria-live="polite">
          IMC: <strong>{imc.toString().replace('.', ',')}</strong> kg/m²
        </p>
      )}

      {esPediatrico && (
        <p className="aviso aviso-atencion" role="note">
          Paciente pediátrico (≤ {EDAD_PEDIATRICA_MAX} años): se activará el módulo pediátrico. El peso es obligatorio y
          se usarán las escalas pediátricas (STBUR y POVOC) en lugar de STOP-Bang y Apfel.
        </p>
      )}

      {preguntarEmbarazo && (
        <fieldset className="campo">
          <legend>Posibilidad de embarazo</legend>
          <div className="grupo-radios">
            <label className={`radio-tarjeta ${posibleEmbarazo === false ? 'seleccionado' : ''}`}>
              <input type="radio" name="embarazo" checked={posibleEmbarazo === false} onChange={() => setPosibleEmbarazo(false)} />
              No hay posibilidad de embarazo
            </label>
            <label className={`radio-tarjeta ${posibleEmbarazo === true ? 'seleccionado' : ''}`}>
              <input type="radio" name="embarazo" checked={posibleEmbarazo === true} onChange={() => setPosibleEmbarazo(true)} />
              Sí es posible
            </label>
          </div>
          <div className="campo">
            <label htmlFor="fur">Fecha de la última regla (opcional)</label>
            <input id="fur" type="date" value={fechaUltimaRegla} onChange={(e) => setFechaUltimaRegla(e.target.value)} />
          </div>
          {posibleEmbarazo === true && (
            <p className="aviso aviso-atencion" role="note">
              Si finalmente está embarazada, se activará el módulo obstétrico.
            </p>
          )}
        </fieldset>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" disabled={!puedeContinuar} onClick={continuar}>
          Continuar
        </button>
      </div>
    </section>
  );
}
