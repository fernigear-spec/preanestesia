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

    // Continuar al paso 2.
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /Paso 2 · Datos básicos/ })).toBeVisible();
  });

  test('paso 1: fecha desconocida permite continuar y avisa de márgenes (§8.16)', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    await page.getByRole('checkbox', { name: /La fecha de la intervención aún no se conoce/ }).check();
    await expect(page.getByText(/las instrucciones se darán como/)).toBeVisible();

    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /Paso 2 · Datos básicos/ })).toBeVisible();
  });

  test('entrevista completa SIN fecha: márgenes en horas, días y "no tomar el día" sin fallar (§8.16)', async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(String(e)));

    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    // Paso 1 sin fecha.
    await page.getByRole('checkbox', { name: /La fecha de la intervención aún no se conoce/ }).check();
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2.
    await page.locator('#edad').fill('60');
    await page.getByRole('radio', { name: 'Hombre' }).check();
    await page.locator('#peso').fill('80');
    await page.locator('#talla').fill('175');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Pasos 3-7 sin datos extra.
    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    // Paso 8: añadir fármacos con distintos tipos de plazo.
    await expect(page.getByRole('heading', { name: /Paso 8 · Medicación/ })).toBeVisible();

    // Eliquis (plazo en horas) → margen "como mínimo N horas antes".
    await page.locator('#med').fill('Eliquis');
    await page.getByRole('button', { name: /Eliquis/ }).first().click();
    await page.getByRole('button', { name: '09:00', exact: true }).first().click();
    await expect(page.getByText(/como mínimo 48 horas antes/)).toBeVisible();

    // Plavix (plazo en días) → margen "los N días anteriores". Necesita hora de toma.
    await page.locator('#med').fill('Plavix');
    await page.getByRole('button', { name: /Plavix/ }).first().click();
    await page.getByRole('button', { name: '09:00', exact: true }).nth(1).click();
    await expect(page.getByText(/días anteriores a la intervención/)).toBeVisible();

    // Renitec (IECA) → "No lo tome el día de la intervención". Necesita hora de toma.
    await page.locator('#med').fill('Renitec');
    await page.getByRole('button', { name: /Renitec/ }).first().click();
    await page.getByRole('button', { name: '09:00', exact: true }).nth(2).click();
    await expect(page.getByText(/No lo tome el día de la intervención/)).toBeVisible();

    // No debe haberse producido ningún error de página (construirContexto no se llama sin fecha).
    expect(errores).toHaveLength(0);
  });

  test('recorre pasos 2-4 hasta el resumen', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    // Paso 1.
    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2 — datos básicos. Edad de mujer 12-55 → aparece la pregunta de embarazo.
    await expect(page.getByRole('heading', { name: /Paso 2 · Datos básicos/ })).toBeVisible();
    await page.locator('#edad').fill('40');
    await page.getByRole('radio', { name: 'Mujer' }).check();
    await page.locator('#peso').fill('65');
    await page.locator('#talla').fill('165');
    await expect(page.getByText(/IMC:/)).toBeVisible();
    await expect(page.getByText(/Posibilidad de embarazo/)).toBeVisible();
    await page.getByRole('radio', { name: /No hay posibilidad/ }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 3 — antecedentes.
    await expect(page.getByRole('heading', { name: /Paso 3 · Antecedentes/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 4 — mtND4. Marcar factor materno y ver la alerta roja.
    await expect(page.getByRole('heading', { name: /Paso 4 · Origen materno/ })).toBeVisible();
    await expect(page.getByText(/Guion para explicar la pregunta/)).toBeVisible();
    await page.getByRole('checkbox', { name: /Ascendencia venezolana por línea materna/ }).check();
    await expect(page.getByText(/Alerta roja/)).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 5 — alergias. Marcar "No alergias conocidas".
    await expect(page.getByRole('heading', { name: /Paso 5 · Alergias/ })).toBeVisible();
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 6 — hábitos. AUDIT-C alto para ver la alerta de abstinencia.
    await expect(page.getByRole('heading', { name: /Paso 6 · Hábitos/ })).toBeVisible();
    await page.locator('#a1').selectOption('4');
    await page.locator('#a2').selectOption('4');
    await page.locator('#a3').selectOption('4');
    await expect(page.getByText(/síndrome de abstinencia/)).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 7 — cribado. Ninguna enfermedad conocida.
    await expect(page.getByRole('heading', { name: /Paso 7 · Enfermedades/ })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 8 — medicación. Sin fármacos, continuar.
    await expect(page.getByRole('heading', { name: /Paso 8 · Medicación/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 9 (vía aérea) y 10 (consentimiento).
    await expect(page.getByRole('heading', { name: /Paso 9 · Vía aérea/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /Paso 10 · Consentimiento/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Resumen.
    await expect(page.getByRole('heading', { name: /Resumen de la entrevista/ })).toBeVisible();
    await expect(page.getByText(/Hernioplastia inguinal abierta/)).toBeVisible();
    await expect(page.getByText(/No alergias conocidas/)).toBeVisible();

    // Salidas del paso 11: resumen del anestesiólogo, ASA sugerido y texto para SAP.
    await expect(page.getByRole('heading', { name: /Resumen del anestesiólogo/ })).toBeVisible();
    await expect(page.getByText(/ASA sugerido/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Escalas/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Texto para SAP/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Texto para SAP' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copiar', exact: true })).toBeVisible();
  });

  test('§12: no se genera la hoja/QR con Plavix y stent sin confirmar; sí tras confirmar', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.locator('#edad').fill('60');
    await page.getByRole('radio', { name: 'Hombre' }).check();
    await page.locator('#peso').fill('80');
    await page.locator('#talla').fill('175');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6

    // Paso 7: marcar cardiopatía isquémica (stent).
    await page.getByRole('checkbox', { name: 'Cardiopatía isquémica / infarto' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 8: Plavix sin Adiro (monoterapia → requiere confirmación).
    await page.locator('#med').fill('Plavix');
    await page.getByRole('button', { name: /Plavix/ }).first().click();
    await page.getByRole('button', { name: '09:00', exact: true }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Pasos 9 y 10.
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 vía aérea
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 consentimiento

    // Resumen: hay pendiente → no se puede generar.
    await expect(page.getByText(/pendientes de confirmar/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generar hoja y QR del paciente/ })).toHaveCount(0);

    // Confirmar con el nombre del anestesiólogo.
    await page.getByLabel(/Nombre del anestesiólogo para Plavix/).fill('Dra. García');
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();

    // Ahora sí se puede generar.
    await expect(page.getByRole('button', { name: /Generar hoja y QR del paciente/ })).toBeVisible();
  });

  test('genera la hoja del paciente con su QR desde el resumen', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    // Paso 1.
    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2.
    await page.locator('#edad').fill('60');
    await page.getByRole('radio', { name: 'Hombre' }).check();
    await page.locator('#peso').fill('80');
    await page.locator('#talla').fill('175');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Pasos 3-7.
    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    // Paso 8: añadir Adiro y continuar.
    await page.locator('#med').fill('Adiro');
    await page.getByRole('button', { name: /Adiro/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Pasos 9 y 10.
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 vía aérea
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 consentimiento

    // Resumen: generar la hoja del paciente y ver el QR.
    await expect(page.getByRole('heading', { name: /Resumen de la entrevista/ })).toBeVisible();
    await page.getByRole('button', { name: /Generar hoja y QR del paciente/ }).click();
    await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copiar enlace para el paciente/ })).toBeVisible();
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
