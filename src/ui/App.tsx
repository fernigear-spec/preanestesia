import { useState } from 'react';
import { BandaPrueba } from './BandaPrueba.tsx';
import { PasoIntervencion } from './pasos/PasoIntervencion.tsx';
import type { Modalidad, DatosIntervencion } from '../dominio/tipos.ts';
import type { Procedimiento } from '../datos/procedimientos.ts';

type Pantalla = 'inicio' | 'paso1' | 'resumen';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [intervencion, setIntervencion] = useState<DatosIntervencion | null>(null);
  const [procedimiento, setProcedimiento] = useState<Procedimiento | null>(null);

  function nuevoPaciente() {
    setModalidad(null);
    setIntervencion(null);
    setProcedimiento(null);
    setPantalla('inicio');
  }

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
              setIntervencion(datos);
              setProcedimiento(proc);
              setPantalla('resumen');
            }}
          />
        )}

        {pantalla === 'resumen' && intervencion && procedimiento && (
          <section className="tarjeta" aria-labelledby="resumen-tit">
            <h2 id="resumen-tit">Datos de la intervención guardados</h2>
            <p>
              Entrevista <strong>{modalidad}</strong>. Estos son los datos del paso 1; los siguientes
              pasos (datos básicos, antecedentes, medicación…) se irán añadiendo.
            </p>
            <ul className="resumen-lista">
              <li><strong>Procedimiento:</strong> {procedimiento.nombre} ({procedimiento.especialidad.replace(/_/g, ' ')})</li>
              <li><strong>Fecha y hora:</strong> {fechaLegible(intervencion.fechaHora)}{intervencion.horaAsumida ? ' (hora asumida)' : ''}</li>
              <li><strong>Régimen:</strong> {intervencion.regimen}</li>
              <li><strong>Carácter:</strong> {intervencion.caracter.replace(/_/g, ' ')}</li>
              <li><strong>Técnica:</strong> {intervencion.tecnica.replace(/_/g, ' ')}</li>
              <li><strong>Riesgo cardiovascular:</strong> {intervencion.riesgoCardiovascular}</li>
              <li><strong>Riesgo hemorrágico:</strong> {intervencion.riesgoHemorragico}</li>
            </ul>
            <div className="acciones">
              <button type="button" className="boton-secundario" onClick={() => setPantalla('paso1')}>
                Editar paso 1
              </button>
              <button type="button" className="boton-secundario" onClick={nuevoPaciente}>
                Nuevo paciente
              </button>
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
