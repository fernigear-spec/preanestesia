/**
 * Punto de entrada de la VISTA DEL PACIENTE como aplicación independiente (§8.16,
 * Bloque III-A). Es un segundo "build" de Vite (ver paciente.html + vite.config.ts)
 * que se publica en la ruta «/paciente/» y SOLO contiene la hoja del paciente:
 * su hoja, el cambio de idioma, el PDF, los anexos y el recálculo de fechas.
 *
 * No incluye el motor de reglas, los catálogos de fármacos, los módulos, el panel
 * de administración ni la entrevista: es la aplicación que abren los pacientes al
 * escanear el QR, y debe ser mínima y sin ningún dato clínico embebido.
 *
 * Los datos del paciente viajan en el fragmento «#p=…» de la URL (nunca llegan al
 * servidor) y solo existen en memoria.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { VistaPaciente } from './ui/paciente/VistaPaciente.tsx';
import './ui/estilos.css';

const raiz = document.getElementById('root');

/** Lee el payload del QR del fragmento «#p=…» de la URL. */
function leerPayload(): string | null {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  return h.startsWith('#p=') ? h.slice(3) : null;
}

function Raiz() {
  const payload = leerPayload();
  if (payload === null) {
    return (
      <main className="contenido">
        <section className="tarjeta">
          <p>Para ver sus recomendaciones, escanee el código QR que le han entregado en la consulta.</p>
        </section>
      </main>
    );
  }
  return <VistaPaciente cadena={payload} />;
}

if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <div className="app">
        <Raiz />
      </div>
    </StrictMode>,
  );
}
