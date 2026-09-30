import { useState } from 'react';
import { BandaPrueba } from './BandaPrueba.tsx';
import { PasoIntervencion } from './pasos/PasoIntervencion.tsx';
import { PasoBasicos } from './pasos/PasoBasicos.tsx';
import { PasoAntecedentes } from './pasos/PasoAntecedentes.tsx';
import { PasoMtnd4 } from './pasos/PasoMtnd4.tsx';
import { PasoAlergias } from './pasos/PasoAlergias.tsx';
import { PasoHabitos } from './pasos/PasoHabitos.tsx';
import { PasoCribado } from './pasos/PasoCribado.tsx';
import { PasoMedicacion } from './pasos/PasoMedicacion.tsx';
import { PasoViaAerea } from './pasos/PasoViaAerea.tsx';
import { PasoConsentimiento } from './pasos/PasoConsentimiento.tsx';
import { ESTADO_INICIAL, INCIDENCIAS_ANESTESICAS, type EstadoEntrevista, type IntervencionPrevia } from './estadoEntrevista.ts';
import type { Modalidad } from '../dominio/tipos.ts';
import { VistaPaciente } from './paciente/VistaPaciente.tsx';
import { BloqueHojaPaciente } from './paciente/BloqueHojaPaciente.tsx';
import { Salidas } from './pasos/Salidas.tsx';

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

type Pantalla = 'inicio' | 'paso1' | 'paso2' | 'paso3' | 'paso4' | 'paso5' | 'paso6' | 'paso7' | 'paso8' | 'paso9' | 'paso10' | 'resumen';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [entrevista, setEntrevista] = useState<EstadoEntrevista>(ESTADO_INICIAL);
  // Si la URL trae «#p=…», es un QR/enlace de paciente: se abre la vista interactiva.
  const [pacientePayload] = useState<string | null>(() => {
    const h = typeof window !== 'undefined' ? window.location.hash : '';
    return h.startsWith('#p=') ? h.slice(3) : null;
  });

  if (pacientePayload) {
    return (
      <div className="app">
        <BandaPrueba />
        <VistaPaciente cadena={pacientePayload} />
      </div>
    );
  }

  function nuevoPaciente() {
    setModalidad(null);
    setEntrevista(ESTADO_INICIAL);
    setPantalla('inicio');
  }

  const { intervencion, procedimiento, basicos, antecedentes, mtnd4, alergias, habitos, cribado, medicacion, viaAerea, consentimiento } = entrevista;

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
              setPantalla('paso5');
            }}
          />
        )}

        {pantalla === 'paso5' && (
          <PasoAlergias
            inicial={alergias}
            onVolver={() => setPantalla('paso4')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, alergias: datos }));
              setPantalla('paso6');
            }}
          />
        )}

        {pantalla === 'paso6' && basicos && (
          <PasoHabitos
            inicial={habitos}
            edadAnios={basicos.edadAnios}
            sexo={basicos.sexo}
            onVolver={() => setPantalla('paso5')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, habitos: datos }));
              setPantalla('paso7');
            }}
          />
        )}

        {pantalla === 'paso7' && (
          <PasoCribado
            inicial={cribado}
            onVolver={() => setPantalla('paso6')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, cribado: datos }));
              setPantalla('paso8');
            }}
          />
        )}

        {pantalla === 'paso8' && intervencion && basicos && (
          <PasoMedicacion
            inicial={medicacion}
            intervencion={intervencion}
            enfermedades={cribado?.enfermedades ?? []}
            respuestasModulos={cribado?.respuestasModulos ?? {}}
            basicos={{ edadAnios: basicos.edadAnios, pesoKg: basicos.pesoKg, sexo: basicos.sexo }}
            onVolver={() => setPantalla('paso7')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, medicacion: datos }));
              setPantalla('paso9');
            }}
          />
        )}

        {pantalla === 'paso9' && basicos && (
          <PasoViaAerea
            inicial={viaAerea}
            telefonica={modalidad === 'telefonica'}
            basicos={{ edadAnios: basicos.edadAnios, pesoKg: basicos.pesoKg, tallaCm: basicos.tallaCm, sexo: basicos.sexo }}
            onVolver={() => setPantalla('paso8')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, viaAerea: datos }));
              setPantalla('paso10');
            }}
          />
        )}

        {pantalla === 'paso10' && (
          <PasoConsentimiento
            inicial={consentimiento}
            telefonica={modalidad === 'telefonica'}
            onVolver={() => setPantalla('paso9')}
            onContinuar={(datos) => {
              setEntrevista((e) => ({ ...e, consentimiento: datos }));
              setPantalla('resumen');
            }}
          />
        )}

        {pantalla === 'resumen' && intervencion && procedimiento && basicos && (
          <section className="tarjeta" aria-labelledby="resumen-tit">
            <h2 id="resumen-tit">Resumen de la entrevista · Resultados</h2>
            <p>Entrevista <strong>{modalidad}</strong>. Resultados de la valoración y hoja del paciente.</p>

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

            {alergias && (
              <>
                <h3>Alergias</h3>
                <ul className="resumen-lista">
                  {alergias.ningunaConocida ? (
                    <li>No alergias conocidas</li>
                  ) : (
                    <>
                      {alergias.medicamentos.length > 0 && (
                        <li><strong>Medicamentos:</strong> {alergias.medicamentos.map((m) => m.reaccion ? `${m.farmaco} (${m.reaccion})` : m.farmaco).join(', ')}</li>
                      )}
                      {(alergias.latex || alergias.contrastesYodados || alergias.clorhexidina || alergias.adhesivos) && (
                        <li><strong>Otras:</strong> {[
                          alergias.latex ? 'látex' : null,
                          alergias.contrastesYodados ? 'contrastes yodados' : null,
                          alergias.clorhexidina ? 'clorhexidina' : null,
                          alergias.adhesivos ? 'adhesivos' : null,
                        ].filter(Boolean).join(', ')}</li>
                      )}
                      {alergias.alimentos.length > 0 && (
                        <li><strong>Alimentos:</strong> {alergias.alimentos.join(', ')}</li>
                      )}
                    </>
                  )}
                </ul>
              </>
            )}

            {habitos && (
              <>
                <h3>Hábitos y capacidad funcional</h3>
                <ul className="resumen-lista">
                  <li><strong>Tabaco:</strong> {habitos.tabaco === 'nunca' ? 'nunca ha fumado' : habitos.tabaco === 'activo' ? 'fumador activo' : `exfumador${habitos.paquetesAnio !== undefined ? ` (${habitos.paquetesAnio} paquetes-año)` : ''}`}</li>
                  <li><strong>AUDIT-C:</strong> {habitos.auditFrecuencia + habitos.auditCantidad + habitos.auditAtracon} puntos</li>
                  <li><strong>Capacidad funcional:</strong> {habitos.subeDosPisos === 'si' ? 'sube dos pisos sin parar' : 'DASI evaluado'}</li>
                  {habitos.cfs !== undefined && <li><strong>CFS:</strong> {habitos.cfs}</li>}
                </ul>
              </>
            )}

            {cribado && (
              <>
                <h3>Enfermedades y hemostasia</h3>
                <ul className="resumen-lista">
                  <li><strong>Enfermedades:</strong> {cribado.ningunaConocida ? 'ninguna conocida' : (cribado.enfermedades.length > 0 ? cribado.enfermedades.join(', ') : '—')}</li>
                  <li><strong>HEMSTOP:</strong> {Object.values(cribado.hemstop).filter(Boolean).length} respuestas positivas</li>
                </ul>
              </>
            )}

            {medicacion && (
              <>
                <h3>Medicación</h3>
                {medicacion.length === 0 ? (
                  <p>Sin medicación habitual.</p>
                ) : (
                  <ul className="resumen-lista">
                    {medicacion.map((f, i) => (
                      <li key={`${f.idFarmaco}-${i}`}>{f.nombreComercial}{f.horas.length > 0 ? ` (${f.horas.join(', ')})` : ''}</li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <h3>Vía aérea</h3>
            <ul className="resumen-lista">
              <li>{viaAerea ? describirViaAerea(viaAerea, modalidad === 'telefonica') : 'no recogida'}</li>
            </ul>

            <h3>Consentimiento</h3>
            <ul className="resumen-lista">
              <li>{describirConsentimiento(consentimiento)}</li>
            </ul>

            <h3>Hoja del paciente</h3>
            {cribado && (
              <BloqueHojaPaciente
                medicacion={medicacion ?? []}
                intervencion={intervencion}
                basicos={basicos}
                cribado={cribado}
                habitos={habitos}
                consentimiento={consentimiento}
                onActualizar={(i, cambios) =>
                  setEntrevista((e) => ({
                    ...e,
                    medicacion: (e.medicacion ?? []).map((f, j) => (j === i ? { ...f, ...cambios } : f)),
                  }))
                }
              />
            )}

            <Salidas entrevista={entrevista} modalidad={modalidad ?? 'presencial'} />

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

function describirViaAerea(v: import('./estadoEntrevista.ts').DatosViaAereaUi, telefonica: boolean): string {
  const partes: string[] = [];
  if (v.mallampati) partes.push(`Mallampati ${'I'.repeat(v.mallampati)}`);
  if (v.intubacionDificilPrevia && v.intubacionDificilPrevia !== 'no') partes.push(`intubación difícil previa ${v.intubacionDificilPrevia}`);
  if (v.radioterapiaCervical) partes.push('radioterapia cervical');
  if (v.tumorCabezaCuello) partes.push('tumor de cabeza y cuello');
  if (v.limitacionCervicalReumatologica) partes.push('limitación cervical');
  const base = partes.length > 0 ? partes.join(', ') : 'sin hallazgos reseñables';
  return telefonica ? `${base} · exploración pendiente (telefónica)` : base;
}

function describirConsentimiento(c: import('./estadoEntrevista.ts').ConsentimientoUi | null): string {
  if (!c) return 'no recogido';
  if (c.estado === 'entregado') return `entregado y explicado${c.fecha ? ` (${c.fecha})` : ''}`;
  if (c.estado === 'pendiente_entregar') return 'pendiente de entregar (se entregará el día de la intervención)';
  return 'no procede';
}

function describirMtnd4(m: import('../dominio/mtnd4/mtnd4.ts').EntradaMtnd4): string {
  const factores: string[] = [];
  if (m.ascendenciaVenezolanaMaterna) factores.push('ascendencia venezolana materna');
  if (m.origenMaternoDesconocidoUOvodonacion) factores.push('origen materno desconocido/ovodonación');
  if (m.antecedentesFamiliaresCompatibles) factores.push('antecedentes familiares');
  const test = m.testGenetico === 'no_hecho' ? 'sin test' : `test ${m.testGenetico}`;
  return factores.length > 0 ? `${factores.join(', ')}; ${test}` : `sin factores de línea materna; ${test}`;
}
