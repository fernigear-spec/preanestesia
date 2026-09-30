/**
 * Configuración de Vite para GitHub Pages (vista previa de la rama desarrollo).
 * La vista previa muestra una banda fija "VERSIÓN DE PRUEBA · NO USAR CON PACIENTES".
 *
 * Service worker (§2): se precachea únicamente el "esqueleto" de la aplicación
 * (JS, CSS, HTML y recursos estáticos) para que funcione sin conexión. Los datos del
 * paciente viajan en el fragmento «#p=…» de la URL (que nunca llega al servidor ni al
 * service worker) y solo existen en memoria, por lo que jamás se guardan en caché.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// El base path depende del repositorio en GitHub Pages: /preanestesia/
export default defineConfig({
  base: '/preanestesia/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'AnesHealth · Entrevista preanestésica',
        short_name: 'AnesHealth',
        description: 'Entrevista preanestésica de enfermería.',
        start_url: '.',
        scope: '/preanestesia/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0b6b5a',
      },
      workbox: {
        // Solo el esqueleto de la app: nunca datos de paciente.
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
