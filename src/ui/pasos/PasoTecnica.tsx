/**
 * Paso 7 — Técnica anestésica prevista. Si se cambia más tarde, todas las reglas y
 * salidas se recalculan (el estado de la intervención se actualiza).
 * En procedimientos oftalmológicos ofrece "tópica", "retrobulbar o peribulbar",
 * "general" y "sedación". En la catarata, la técnica decide el grupo oftalmológico
 * (tópica = riesgo bajo; retrobulbar o peribulbar = moderado-alto); sin técnica
 * elegida, la catarata se trata como moderado-alto y se indica (§8.1-8.3).
 */
import { useState } from 'react';
import type { TecnicaAnestesica, GrupoOftalmologico } from '../../dominio/tipos.ts';
import type { Procedimiento } from '../../datos/procedimientos.ts';

interface Props {
  inicial: TecnicaAnestesica;
  procedimiento: Procedimiento | null;
  /** Devuelve la técnica y, en la catarata, el grupo oftalmológico derivado. */
  onContinuar: (tecnica: TecnicaAnestesica, grupoOftalmologico?: GrupoOftalmologico) => void;
  onVolver: () => void;
}

const TECNICAS_GENERAL: Array<{ valor: TecnicaAnestesica; etiqueta: string }> = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'sedacion', etiqueta: 'Sedación' },
  { valor: 'neuroaxial', etiqueta: 'Neuroaxial (raquídea/epidural)' },
  { valor: 'bloqueo_periferico', etiqueta: 'Bloqueo periférico' },
  { valor: 'bloqueo_profundo', etiqueta: 'Bloqueo profundo' },
  { valor: 'local', etiqueta: 'Anestesia local' },
  { valor: 'no_se_sabe', etiqueta: 'No se sabe todavía' },
];

const TECNICAS_OFTALMO: Array<{ valor: TecnicaAnestesica; etiqueta: string }> = [
  { valor: 'topica', etiqueta: 'Tópica' },
  { valor: 'retrobulbar_peribulbar', etiqueta: 'Retrobulbar o peribulbar' },
  { valor: 'general', etiqueta: 'General' },
  { valor: 'sedacion', etiqueta: 'Sedación' },
];

/** Grupo oftalmológico de la catarata según la técnica (undefined = aún sin elegir). */
export function grupoCatarataPorTecnica(tecnica: TecnicaAnestesica | null): GrupoOftalmologico {
  if (tecnica === 'topica') return 'riesgo_bajo';
  if (tecnica === 'retrobulbar_peribulbar') return 'riesgo_moderado_alto';
  return 'riesgo_moderado_alto'; // sin técnica elegida: se trata como moderado-alto
}

export function PasoTecnica({ inicial, procedimiento, onContinuar, onVolver }: Props) {
  const esOftalmo = procedimiento?.especialidad === 'oftalmologia';
  const esCatarata = /catarata/i.test(procedimiento?.id ?? '') || /catarata/i.test(procedimiento?.nombre ?? '');
  const opciones = esOftalmo ? TECNICAS_OFTALMO : TECNICAS_GENERAL;
  // Valor inicial válido para el tipo de procedimiento.
  const inicialValido = opciones.some((o) => o.valor === inicial) ? inicial : null;
  const [tecnica, setTecnica] = useState<TecnicaAnestesica | null>(inicialValido);

  function continuar() {
    const t = tecnica ?? 'no_se_sabe';
    if (esCatarata) onContinuar(t, grupoCatarataPorTecnica(tecnica));
    else onContinuar(t);
  }

  return (
    <section className="tarjeta" aria-labelledby="paso7-tec-tit">
      <h2 id="paso7-tec-tit">Paso 7 · Técnica anestésica prevista</h2>
      <p>Si se cambia más tarde, las reglas de medicación y las salidas se recalculan.</p>

      <fieldset className="campo">
        <legend>Técnica</legend>
        <div className="grupo-radios">
          {opciones.map((t) => (
            <label key={t.valor} className={`radio-tarjeta ${tecnica === t.valor ? 'seleccionado' : ''}`}>
              <input type="radio" name="tecnica" value={t.valor} checked={tecnica === t.valor} onChange={() => setTecnica(t.valor)} />
              {t.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {esCatarata && tecnica === null && (
        <p className="aviso aviso-atencion" role="note">
          Sin técnica elegida, la catarata se trata como oftalmología de riesgo moderado-alto (anticoagulantes como riesgo hemorrágico alto).
        </p>
      )}
      {esCatarata && tecnica === 'topica' && (
        <p className="aviso aviso-info" role="note">Catarata tópica: oftalmología de riesgo bajo; no se suspenden antiagregantes ni anticoagulantes.</p>
      )}
      {esCatarata && tecnica === 'retrobulbar_peribulbar' && (
        <p className="aviso aviso-info" role="note">Catarata con bloqueo retrobulbar o peribulbar: riesgo moderado-alto (anticoagulantes como riesgo hemorrágico alto).</p>
      )}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={continuar}>Continuar</button>
      </div>
    </section>
  );
}
