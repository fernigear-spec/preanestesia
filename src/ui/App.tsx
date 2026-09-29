import { useState } from 'react';
import { BandaPrueba } from './BandaPrueba.tsx';
import { PasoIntervencion } from './pasos/PasoIntervencion.tsx';
import { PasoBasicos } from './pasos/PasoBasicos.tsx';
import { PasoAntecedentes } from './pasos/PasoAntecedentes.tsx';
import { PasoMtnd4 } from './pasos/PasoMtnd4.tsx';
import { ESTADO_INICIAL, INCIDENCIAS_ANESTESICAS, type EstadoEntrevista, type IntervencionPrevia } from './estadoEntrevista.ts';
import type { Modalidad } from '../dominio/tipos.ts';

const TIPO_ANESTESIA_ETIQUETA: Record<IntervencionPrevia['tipoAnestesia'], string> = {
  general: 'general',
  neuroaxial: 'neuroaxial',
  sedacion: 'sedación',
  local: 'local',
  no_lo_sabe: 'no lo sabe',
};
function tipoAnestesiaLegible(t: IntervencionPrevia['tipoAnestesia']): string {
  return TIPO_ANESTESIA_ETIQUETA[t];
}
function incidenciaLegible(id: string): string {
  return INCIDENCIAS_ANESTESICAS.find((x) => x.id === id)?.etiqueta ?? id;
}

type Pantalla = 'inicio' | 'paso1' | 'paso2' | 'paso3' | 'paso4' | 'resumen';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [entrevista, setEntrevista] = useState<EstadoEntrevista>(ESTADO_INICIAL);

  function nuevoPaciente() {
    setModalidad(null);
    setEntrevista(ESTADO_INICIAL);
    setPantalla('inicio');
  }

  const { intervencion, procedimiento, basicos, antecedentes, mtnd4 } = entrevista;

  return (
    <div className="app">
      <BandaPrueba />
      <header className="cabecera">
        <h1>AnesHealth · Entrevista preanestésica</h1>
        <p className="subtitulo">Servicio de Anestesiología · Hospital Vithas Barcelona</p>
      </header>

      <main className="contenido">
        {pantalla === 'inicio' && (
          <section className="tarjeta" aria-labelledby="inicio-tit">
            <h2 id="inicio-tit">Nueva entrevista</h2>
            <p>Elija la modalidad de la entrevista para comenzar.</p>
            <div className="grupo-botones">
              <button
                type="button"
                className={`boton-grande ${modalidad === 'presencial' ? 'seleccionado' : ''}`}
                onClick={() => setModalidad('presencial')}
                aria-pressed={modalidad === 'presencial'}
              >
                Presencial
              </button>
              <button
                type="button"
                className={`boton-grande ${modalidad === 'telefonica' ? 'seleccionado' : ''}`}
                onClick={() => setModalidad('telefonica')}
                aria-pressed={modalidad === 'telefonica'}
              >
                Telefónica
              </button>
            </div>
            <button
              type="button"
              className="boton-primario"
              disabled={modalidad === null}
              onClick={() => setPantalla('paso1')}
            >
              Comenzar
            </button>
          </section>
        )}

        {pantalla === 'paso1' && (
          <PasoIntervencion
            onVolver={() => setPantalla('inicio')}
            onContinuar={(datos, proc) => {
              setEntrevista((e) => ({ ...e, intervencion: datos, procedimiento: proc }));
              setPantalla('paso2');
            }}
          />
        )}

        {pantalla === 'paso2' && (
          <PasoBasicos
            inicial={basicos}
            obstetrico={procedimiento?.obstetrico ?? false}
            onVolver={() => setPantalla('paso1')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, basicos: datos }));
              setPantalla('paso3');
            }}
          />
        )}

        {pantalla === 'paso3' && (
          <PasoAntecedentes
            inicial={antecedentes}
            onVolver={() => setPantalla('paso2')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, antecedentes: datos }));
              setPantalla('paso4');
            }}
          />
        )}

        {pantalla === 'paso4' && (
          <PasoMtnd4
            inicial={mtnd4}
            onVolver={() => setPantalla('paso3')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, mtnd4: datos }));
              setPantalla('resumen');
            }}
          />
        )}

        {pantalla === 'resumen' && intervencion && procedimiento && basicos && (
          <section className="tarjeta" aria-labelledby="resumen-tit">
            <h2 id="resumen-tit">Resumen de la entrevista (pasos 1 a 4)</h2>
            <p>
              Entrevista <strong>{modalidad}</strong>. Estos son los datos recogidos hasta ahora; los
              siguientes pasos (alergias, hábitos, cribado por aparatos, medicación…) se irán añadiendo.
            </p>

            <h3>Intervención</h3>
            <ul className="resumen-lista">
              <li><strong>Procedimiento:</strong> {procedimiento.nombre} ({procedimiento.especialidad.replace(/_/g, ' ')})</li>
              <li><strong>Fecha y hora:</strong> {intervencion.fechaHora ? `${fechaLegible(intervencion.fechaHora)}${intervencion.horaAsumida ? ' (hora asumida)' : ''}` : 'aún no conocida (las instrucciones se darán como margen)'}</li>
              <li><strong>Régimen:</strong> {intervencion.regimen} · <strong>Carácter:</strong> {intervencion.caracter.replace(/_/g, ' ')} · <strong>Técnica:</strong> {intervencion.tecnica.replace(/_/g, ' ')}</li>
              <li><strong>Riesgos:</strong> cardiovascular {intervencion.riesgoCardiovascular}, hemorrágico {intervencion.riesgoHemorragico}</li>
            </ul>

            <h3>Datos básicos</h3>
            <ul className="resumen-lista">
              <li><strong>Edad:</strong> {basicos.edadAnios} años · <strong>Sexo:</strong> {basicos.sexo}</li>
              <li><strong>Peso:</strong> {basicos.pesoKg} kg · <strong>Talla:</strong> {basicos.tallaCm} cm</li>
              {basicos.posibleEmbarazo !== undefined && (
                <li><strong>Posibilidad de embarazo:</strong> {basicos.posibleEmbarazo ? 'sí' : 'no'}</li>
              )}
            </ul>

            <h3>Antecedentes</h3>
            <p><strong>Intervenciones previas:</strong></p>
            {antecedentes && antecedentes.intervencionesPrevias.length > 0 ? (
              <ul className="resumen-lista">
                {antecedentes.intervencionesPrevias.map((p, i) => (
                  <li key={`${p.procedimiento}-${i}`}>
                    {p.procedimiento}{p.anio ? ` (${p.anio})` : ''} · {tipoAnestesiaLegible(p.tipoAnestesia)}
                    {p.incidencias.length > 0 && (
                      <> · incidencias: {p.incidencias.map(incidenciaLegible).join(', ')}</>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ninguna.</p>
            )}
            <ul className="resumen-lista">
              <li>
                <strong>Antecedentes familiares:</strong>{' '}
                {antecedentes && (antecedentes.familiaresHipertermiaMaligna || antecedentes.familiaresDeficitPseudocolinesterasa || antecedentes.familiaresComplicacionesGraves)
                  ? [
                      antecedentes.familiaresHipertermiaMaligna ? 'hipertermia maligna' : null,
                      antecedentes.familiaresDeficitPseudocolinesterasa ? 'déficit de pseudocolinesterasa' : null,
                      antecedentes.familiaresComplicacionesGraves ? 'complicaciones graves' : null,
                    ].filter(Boolean).join(', ')
                  : 'sin antecedentes reseñables'}
              </li>
            </ul>

            <h3>Cribado mtND4</h3>
            <ul className="resumen-lista">
              <li>
                {mtnd4 ? describirMtnd4(mtnd4) : 'no recogido'}
              </li>
            </ul>

            <div className="acciones">
              <button type="button" className="boton-secundario" onClick={() => setPantalla('paso1')}>Editar desde el paso 1</button>
              <button type="button" className="boton-secundario" onClick={nuevoPaciente}>Nuevo paciente</button>
            </div>
          </section>
        )}
      </main>

      <footer className="pie">
        <p>
          Recomendaciones generadas según los protocolos del Servicio de Anestesiología. Validación
          final por el anestesiólogo.
        </p>
      </footer>
    </div>
  );
}

function describirMtnd4(m: import('../dominio/mtnd4/mtnd4.ts').EntradaMtnd4): string {
  const factores: string[] = [];
  if (m.ascendenciaVenezolanaMaterna) factores.push('ascendencia venezolana materna');
  if (m.origenMaternoDesconocidoUOvodonacion) factores.push('origen materno desconocido/ovodonación');
  if (m.antecedentesFamiliaresCompatibles) factores.push('antecedentes familiares');
  const test = m.testGenetico === 'no_hecho' ? 'sin test' : `test ${m.testGenetico}`;
  return factores.length > 0 ? `${factores.join(', ')}; ${test}` : `sin factores de línea materna; ${test}`;
}
