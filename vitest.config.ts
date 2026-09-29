import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      // Redirige el harness de node:test al harness de Vitest en CI.
      // El regex captura la cadena COMPLETA del import (…/_harness.ts) para
      // reemplazarla entera por la ruta absoluta del harness de Vitest.
      {
        find: /^.*\/_harness\.ts$/,
        replacement: fileURLToPath(new URL('./tests/_harness.vitest.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
