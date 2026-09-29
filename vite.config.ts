/**
 * Configuración de Vite para GitHub Pages (vista previa de la rama desarrollo).
 * La vista previa muestra una banda fija "VERSIÓN DE PRUEBA · NO USAR CON PACIENTES".
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El base path depende del repositorio en GitHub Pages: /preanestesia/
export default defineConfig({
  base: '/preanestesia/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
