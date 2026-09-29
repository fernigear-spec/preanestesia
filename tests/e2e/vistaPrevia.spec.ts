import { test, expect } from '@playwright/test';

test.describe('Vista previa', () => {
  test('muestra la banda de versión de prueba y arranca en la pantalla de inicio', async ({ page }) => {
    await page.goto('/preanestesia/');
    await expect(page.getByText('VERSIÓN DE PRUEBA · NO USAR CON PACIENTES')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Nueva entrevista/ })).toBeVisible();
  });

  test('permite elegir modalidad y comenzar (lleva al paso 1)', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await expect(page.getByRole('heading', { name: /Paso 1 · Datos de la intervención/ })).toBeVisible();
  });

  test('paso 1: rellenar fecha, buscar procedimiento y continuar al resumen', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    // Fecha a más de 60 días para comprobar el aviso.
    await page.locator('#fecha').fill('2027-01-15');
    await expect(page.getByText(/más de 60 días/)).toBeVisible();
    // Sin hora: aviso de las 08:00.
    await expect(page.getByText(/se asumirán las/)).toBeVisible();

    // Buscar y elegir un procedimiento.
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await expect(page.getByText(/Riesgos del procedimiento/)).toBeVisible();

    // Continuar al resumen.
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /Datos de la intervención guardados/ })).toBeVisible();
    await expect(page.getByText(/Hernioplastia inguinal abierta/)).toBeVisible();
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
