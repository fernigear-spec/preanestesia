/**
 * Configuración de Vite para GitHub Pages.
 *
 * PENDIENTE (fase de interfaz, requiere acceso a npm):
 *   - importar `@vitejs/plugin-react` y añadirlo a `plugins`.
 *   - importar `vite-plugin-pwa` (VitePWA) para el service worker (R1.4, R15.15).
 *   - configurar Vitest (`test`) para reemplazar el runner temporal `node:test`.
 *
 * En este tramo (motor de dominio) el proyecto no se construye con Vite todavía;
 * este fichero deja la base del despliegue en `base: '/preanestesia/'` (R16 / §16).
 */
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/preanestesia/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // plugins: [react(), VitePWA({ /* ... */ })],  // PENDIENTE: habilitar con npm
});
