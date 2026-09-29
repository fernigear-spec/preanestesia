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
