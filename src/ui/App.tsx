import { useState } from 'react';
import { BandaPrueba } from './BandaPrueba.tsx';
import type { Modalidad } from '../dominio/tipos.ts';

type Pantalla = 'inicio' | 'entrevista';

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);

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
              onClick={() => setPantalla('entrevista')}
            >
              Comenzar
            </button>
          </section>
        )}

        {pantalla === 'entrevista' && (
          <section className="tarjeta" aria-labelledby="entrevista-tit">
            <h2 id="entrevista-tit">Entrevista {modalidad}</h2>
            <p>
              El flujo de la entrevista se irá construyendo por pasos (datos de la intervención,
              datos básicos, antecedentes, etc.). Esta es la vista previa inicial.
            </p>
            <button type="button" className="boton-secundario" onClick={() => setPantalla('inicio')}>
              Nuevo paciente
            </button>
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
