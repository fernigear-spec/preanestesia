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
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const raiz = import.meta.dirname;

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
        // Solo el esqueleto de la app de ENFERMERÍA: nunca datos de paciente ni la
        // vista del paciente (que es una aplicación independiente, ver abajo).
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        // Excluir la vista del paciente del precache de la app de enfermería: ni su
        // HTML (carpeta «paciente/») ni su bundle propio (assets/paciente-*.js).
        globIgnores: ['paciente/**', 'assets/paciente-*.js'],
        navigateFallback: 'index.html',
        // El service worker no debe gobernar la vista del paciente («/paciente/»):
        // así cada app se actualiza y cachea por separado.
        navigateFallbackDenylist: [/\/paciente\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Dos "builds" independientes (§8.16, Bloque III-A):
      //  - la app de enfermería (index.html → src/main.tsx),
      //  - la vista del paciente (paciente.html → src/mainPaciente.tsx), que se
      //    emite como «paciente/index.html» para servirse en la ruta «/paciente/».
      input: {
        enfermeria: resolve(raiz, 'index.html'),
        paciente: resolve(raiz, 'paciente/index.html'),
      },
    },
  },
});
