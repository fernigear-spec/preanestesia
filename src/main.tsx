/*!
 * © 2026 AnesHealth. Todos los derechos reservados.
 * Uso restringido al Servicio de Anestesiología del Hospital Vithas Barcelona.
 * Véase el fichero LICENSE.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.tsx';
import './ui/estilos.css';

const raiz = document.getElementById('root');
if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
