import { defineConfig } from '@playwright/test';

/**
 * Playwright levanta la vista previa de Vite y ejecuta los tests E2E.
 * El base path es /preanestesia/ (igual que en GitHub Pages).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173/preanestesia/',
    headless: true,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173/preanestesia/',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
