import { test, expect } from '@playwright/test';

test.describe('Vista previa', () => {
  test('muestra la banda de versión de prueba y arranca en la pantalla de inicio', async ({ page }) => {
    await page.goto('/preanestesia/');
    await expect(page.getByText('VERSIÓN DE PRUEBA · NO USAR CON PACIENTES')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Nueva entrevista/ })).toBeVisible();
  });

  test('permite elegir modalidad y comenzar', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await expect(page.getByRole('heading', { name: /Entrevista presencial/ })).toBeVisible();
  });

  test('privacidad (caso 23): sin datos clínicos en localStorage/sessionStorage/cookies', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    const ss = await page.evaluate(() => JSON.stringify(sessionStorage));
    const cookies = await page.context().cookies();
    // En esta versión inicial no debe persistirse ningún dato clínico.
    expect(ls).not.toContain('paciente');
    expect(ss).not.toContain('paciente');
    expect(cookies.filter((c) => /paciente|clinic/i.test(c.name))).toHaveLength(0);
  });
});
