/**
 * Paso 7 — Cribado por aparatos y HEMSTOP (R3.2.21–R3.2.23).
 * Casillas agrupadas por aparato (cada una activaría su módulo de patología);
 * opción explícita «Ninguna enfermedad conocida»; y el cuestionario HEMSTOP, que
 * se hace SIEMPRE, con su resultado en vivo (positivo → pedir coagulación + alerta).
 */
import { useState } from 'react';
import { calcularHemstop, type EntradaHemstop } from '../../dominio/escalas/hemstop.ts';
import { APARATOS, PREGUNTAS_HEMSTOP, HEMSTOP_VACIO, moduloDeEnfermedad, type CribadoUi } from '../estadoEntrevista.ts';
import { MODULO_POR_ID } from '../../datos/modulosDatos.ts';
import { RenderizadorModulo } from '../modulos/RenderizadorModulo.tsx';
import type { RespuestasModulos, ValorRespuesta } from '../../datos/modulos.ts';

interface Props {
  inicial: CribadoUi | null;
  onContinuar: (datos: CribadoUi) => void;
  onVolver: () => void;
}

export function PasoCribado({ inicial, onContinuar, onVolver }: Props) {
  const [ninguna, setNinguna] = useState(inicial?.ningunaConocida ?? false);
  const [enfermedades, setEnfermedades] = useState<Set<string>>(new Set(inicial?.enfermedades ?? []));
  const [respuestasModulos, setRespuestasModulos] = useState<RespuestasModulos>(inicial?.respuestasModulos ?? {});
  const [hemstop, setHemstop] = useState<EntradaHemstop>(inicial?.hemstop ?? { ...HEMSTOP_VACIO });

  const resHemstop = calcularHemstop(hemstop);

  // Módulos a desplegar: uno por cada casilla marcada que tenga módulo (sin repetir).
  const modulosActivos = [...new Set([...enfermedades].map(moduloDeEnfermedad))]
    .map((idModulo) => MODULO_POR_ID[idModulo])
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  function cambiarRespuesta(idModulo: string, idPregunta: string, valor: ValorRespuesta) {
    setRespuestasModulos((prev) => ({
      ...prev,
      [idModulo]: { ...(prev[idModulo] ?? {}), [idPregunta]: valor },
    }));
  }

  function alternar(id: string) {
    setEnfermedades((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
    setNinguna(false);
  }
  function marcarNinguna() {
    setNinguna(true);
    setEnfermedades(new Set());
  }
  function alternarHemstop(id: keyof EntradaHemstop) {
    setHemstop((h) => ({ ...h, [id]: !h[id] }));
  }

  // Se puede continuar siempre (el HEMSTOP se recoge aquí y el cribado admite «ninguna»).
  function continuar() {
    // Conserva solo las respuestas de módulos aún activos.
    const idsActivos = new Set(modulosActivos.map((m) => m.id));
    const respuestasFiltradas: RespuestasModulos = {};
    for (const [idModulo, resp] of Object.entries(respuestasModulos)) {
      if (idsActivos.has(idModulo)) respuestasFiltradas[idModulo] = resp;
    }
    onContinuar({
      ningunaConocida: ninguna && enfermedades.size === 0,
      enfermedades: [...enfermedades],
      respuestasModulos: respuestasFiltradas,
      hemstop,
    });
  }

  return (
    <section className="tarjeta" aria-labelledby="paso7-tit">
      <h2 id="paso7-tit">Paso 7 · Enfermedades y hemostasia</h2>

      <p>Marque las enfermedades conocidas. Cada una activará su módulo de preguntas específicas.</p>
      <label className={`radio-tarjeta ${ninguna && enfermedades.size === 0 ? 'seleccionado' : ''}`}>
        <input type="checkbox" checked={ninguna && enfermedades.size === 0} onChange={() => (ninguna ? setNinguna(false) : marcarNinguna())} />
        Ninguna enfermedad conocida
      </label>

      {APARATOS.map((grupo) => (
        <fieldset className="campo" key={grupo.aparato}>
          <legend>{grupo.aparato}</legend>
          <div className="grupo-checks">
            {grupo.enfermedades.map((e) => (
              <label key={e.id} className={`radio-tarjeta ${enfermedades.has(e.id) ? 'seleccionado' : ''}`}>
                <input type="checkbox" checked={enfermedades.has(e.id)} onChange={() => alternar(e.id)} />
                {e.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {modulosActivos.length > 0 && (
        <div className="modulos-desplegados">
          <h3>Preguntas de las enfermedades marcadas</h3>
          {modulosActivos.map((m) => (
            <RenderizadorModulo
              key={m.id}
              modulo={m}
              respuestas={respuestasModulos[m.id] ?? {}}
              onCambio={(idPregunta, valor) => cambiarRespuesta(m.id, idPregunta, valor)}
            />
          ))}
        </div>
      )}

      <h3>Cuestionario de sangrado (HEMSTOP)</h3>
      <p>Se hace a todos los pacientes, marque o no marque enfermedades de la sangre.</p>
      <div className="grupo-checks">
        {PREGUNTAS_HEMSTOP.map((p) => (
          <label key={p.id} className={`radio-tarjeta ${hemstop[p.id] ? 'seleccionado' : ''}`}>
            <input type="checkbox" checked={hemstop[p.id]} onChange={() => alternarHemstop(p.id)} />
            {p.etiqueta}
          </label>
        ))}
      </div>
      <p className={`aviso ${resHemstop.positivo ? 'aviso-atencion' : 'aviso-info'}`} role="note" aria-live="polite">
        HEMSTOP: <strong>{resHemstop.puntuacion}</strong> ·{' '}
        {resHemstop.positivo
          ? 'positivo (≥ 2): se solicitará estudio de coagulación aunque la tabla no lo pida'
          : 'negativo'}
      </p>

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={continuar}>Continuar</button>
      </div>
    </section>
  );
}
