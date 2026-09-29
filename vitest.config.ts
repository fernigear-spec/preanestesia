import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      // Redirige el harness de node:test al harness de Vitest en CI.
      {
        find: /_harness\.ts$/,
        replacement: fileURLToPath(new URL('./tests/_harness.vitest.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
