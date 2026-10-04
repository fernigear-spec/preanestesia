/**
 * Paso 4 — Origen materno (cribado mtND4, R3.2.13 · §9). Sección obligatoria en
 * todos los pacientes. Recoge los factores de la línea materna y el resultado del
 * test genético si lo hay, y muestra en vivo la alerta que genera el motor y el
 * texto neutro que verá el paciente.
 */
import { useState } from 'react';
import { evaluarMtnd4, type EntradaMtnd4, type ResultadoTest } from '../../dominio/mtnd4/mtnd4.ts';

interface Props {
  inicial: EntradaMtnd4 | null;
  onContinuar: (datos: EntradaMtnd4) => void;
  onVolver: () => void;
}

const TESTS: Array<{ valor: ResultadoTest; etiqueta: string }> = [
  { valor: 'no_hecho', etiqueta: 'No se ha hecho' },
  { valor: 'positivo', etiqueta: 'Positivo (variante presente)' },
  { valor: 'negativo', etiqueta: 'Negativo (variante ausente)' },
];

const GRAVEDAD_ETIQUETA: Record<string, string> = {
  roja: 'Alerta roja',
  amarilla: 'Alerta',
  informativa: 'Informativa',
};

/** Entrada mtND4 "sin factores": no genera alerta ni línea en la hoja del paciente. */
const MTND4_VACIO: EntradaMtnd4 = {
  ascendenciaVenezolanaMaterna: false,
  origenMaternoDesconocidoUOvodonacion: false,
  antecedentesFamiliaresCompatibles: false,
  testGenetico: 'no_hecho',
};

export function PasoMtnd4({ inicial, onContinuar, onVolver }: Props) {
  // Pregunta puerta (§9, decisión del servicio 2026-10-04): si la respuesta es «no»,
  // se pasa directamente al paso siguiente, sin alerta y sin línea en la hoja.
  // El guion y el resto de campos solo aparecen si la respuesta es «sí».
  const teniaFactores = inicial
    ? inicial.ascendenciaVenezolanaMaterna || inicial.origenMaternoDesconocidoUOvodonacion || inicial.antecedentesFamiliaresCompatibles || inicial.testGenetico !== 'no_hecho'
    : undefined;
  const [posibleVenezolana, setPosibleVenezolana] = useState<boolean | undefined>(teniaFactores === true ? true : undefined);

  const [venezolanaMaterna, setVenezolanaMaterna] = useState(inicial?.ascendenciaVenezolanaMaterna ?? false);
  const [origenDesconocido, setOrigenDesconocido] = useState(inicial?.origenMaternoDesconocidoUOvodonacion ?? false);
  const [antecedentes, setAntecedentes] = useState(inicial?.antecedentesFamiliaresCompatibles ?? false);
  const [test, setTest] = useState<ResultadoTest>(inicial?.testGenetico ?? 'no_hecho');

  const entrada: EntradaMtnd4 = {
    ascendenciaVenezolanaMaterna: venezolanaMaterna,
    origenMaternoDesconocidoUOvodonacion: origenDesconocido,
    antecedentesFamiliaresCompatibles: antecedentes,
    testGenetico: test,
  };
  const resultado = evaluarMtnd4(entrada);

  return (
    <section className="tarjeta" aria-labelledby="paso-mtnd4-tit">
      <h2 id="paso-mtnd4-tit">Paso 11 · Origen materno (cribado mtND4)</h2>
      <p>
        Este cribado es obligatorio en todos los pacientes. Pregunte por la línea <strong>materna</strong>
        (la línea paterna no cuenta para este cribado).
      </p>

      {/* Pregunta puerta */}
      <fieldset className="campo">
        <legend>¿Es posible que su ascendencia materna sea de origen venezolano?</legend>
        <div className="grupo-radios">
          <label className={`radio-tarjeta ${posibleVenezolana === false ? 'seleccionado' : ''}`}>
            <input type="radio" name="puerta" checked={posibleVenezolana === false} onChange={() => setPosibleVenezolana(false)} />
            No
          </label>
          <label className={`radio-tarjeta ${posibleVenezolana === true ? 'seleccionado' : ''}`}>
            <input type="radio" name="puerta" checked={posibleVenezolana === true} onChange={() => setPosibleVenezolana(true)} />
            Sí, es posible
          </label>
        </div>
        {posibleVenezolana === false && (
          <p className="aviso aviso-info" role="note">
            Sin ascendencia materna venezolana: no se genera ninguna alerta ni línea en la hoja del paciente.
            Pulse «Continuar» para pasar al siguiente paso.
          </p>
        )}
      </fieldset>

      {posibleVenezolana === true && (
        <>
          {/* Guion para la enfermera (§9): cómo explicar la pregunta al paciente. */}
          <div className="guion" role="note">
            <p className="guion-titulo">Guion para explicar la pregunta al paciente:</p>
            <p className="guion-texto">
              «Hacemos esta pregunta a todos los pacientes porque se ha descrito una variante genética
              heredada por vía materna, más frecuente en familias de origen venezolano, que puede influir
              en cómo se elige la anestesia».
            </p>
          </div>

          <div className="grupo-checks">
            <label className={`radio-tarjeta ${venezolanaMaterna ? 'seleccionado' : ''}`}>
              <input type="checkbox" checked={venezolanaMaterna} onChange={() => setVenezolanaMaterna(!venezolanaMaterna)} />
              Ascendencia venezolana por línea materna directa
            </label>
            <label className={`radio-tarjeta ${origenDesconocido ? 'seleccionado' : ''}`}>
              <input type="checkbox" checked={origenDesconocido} onChange={() => setOrigenDesconocido(!origenDesconocido)} />
              Origen materno desconocido u ovodonación
            </label>
            <label className={`radio-tarjeta ${antecedentes ? 'seleccionado' : ''}`}>
              <input type="checkbox" checked={antecedentes} onChange={() => setAntecedentes(!antecedentes)} />
              Antecedentes familiares compatibles (línea materna)
            </label>
          </div>

          <fieldset className="campo">
            <legend>Test genético de la variante mtND4</legend>
            <div className="grupo-radios">
              {TESTS.map((t) => (
                <label key={t.valor} className={`radio-tarjeta ${test === t.valor ? 'seleccionado' : ''}`}>
                  <input type="radio" name="test" checked={test === t.valor} onChange={() => setTest(t.valor)} />
                  {t.etiqueta}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Resultado en vivo del motor */}
          <div className="riesgos" aria-live="polite">
            <p className="riesgos-titulo">Resultado del cribado (motor):</p>
            {resultado.alerta === null ? (
              <p>Sin alerta: no hay factores de línea materna ni test que la generen.</p>
            ) : (
              <p>
                <strong>{GRAVEDAD_ETIQUETA[resultado.alerta.gravedad] ?? resultado.alerta.gravedad}:</strong>{' '}
                {resultado.alerta.mensaje}
              </p>
            )}
            <p>
              <em>Texto para el paciente:</em>{' '}
              {resultado.textoPaciente === '' ? '(ninguna línea en la hoja del paciente)' : resultado.textoPaciente}
            </p>
          </div>
        </>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button
          type="button"
          className="boton-primario"
          disabled={posibleVenezolana === undefined}
          onClick={() => onContinuar(posibleVenezolana === true ? entrada : MTND4_VACIO)}
        >
          Continuar
        </button>
      </div>
    </section>
  );
}
