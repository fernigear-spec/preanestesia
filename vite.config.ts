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
import obfuscator from 'vite-plugin-javascript-obfuscator';

const raiz = import.meta.dirname;

// Ofuscación activable por variable de entorno (Bloque III-B, protección del código).
// Se desactiva por defecto para que la vista previa (rama desarrollo) y el E2E sean
// rápidos y legibles; en el build de PRODUCCIÓN se activa con OFUSCAR=1.
const ofuscar = process.env.OFUSCAR === '1';

/**
 * Ofuscación LIGERA (Bloque III-B, 2026-10-04). Se evitan a propósito las opciones
 * que más penalizan el rendimiento en una tablet —`controlFlowFlattening`,
 * `deadCodeInjection`, `selfDefending`, `debugProtection`—, de modo que la app siga
 * siendo fluida. El objetivo es dificultar la lectura/copia del código, no blindarlo.
 */
const opcionesOfuscacion = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  selfDefending: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal' as const,
  renameGlobals: false,
  // `stringArray` sin codificación: agrupa las cadenas (dificulta leerlas) pero NO
  // las codifica en base64, que es lo que más ralentizaba el ARRANQUE en tablet
  // (había que decodificar todas las cadenas al cargar). Umbral moderado.
  stringArray: true,
  stringArrayEncoding: ['none' as const],
  stringArrayThreshold: 0.5,
  splitStrings: false,
  numbersToExpressions: false,
  simplify: true,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

// El base path depende del repositorio en GitHub Pages: /preanestesia/
export default defineConfig({
  base: '/preanestesia/',
  plugins: [
    react(),
    // La ofuscación se aplica al bundle final (solo en producción con OFUSCAR=1).
    ...(ofuscar
      ? [obfuscator({ apply: 'build', options: opcionesOfuscacion })]
      : []),
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
      // Aviso de copyright en el código compilado (se conserva en producción).
      output: {
        banner: '/*! © 2026 AnesHealth. Todos los derechos reservados. Uso restringido al Servicio de Anestesiología del Hospital Vithas Barcelona. */',
      },
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
