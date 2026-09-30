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
    await expect(page.locator('label[for="asa-manual"]')).toContainText('ASA sugerido');
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

  test('privacidad (§2): el service worker solo cachea el esqueleto, nunca datos del paciente', async ({ page }) => {
    // Generar una hoja de paciente para tener un enlace con datos en «#p=…».
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
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8
    await page.getByRole('button', { name: 'Continuar' }).click(); // 8 -> 9
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 -> 10
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 -> resumen
    await page.getByRole('button', { name: /Generar hoja y QR del paciente/ }).click();
    await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible();

    // Esperar a que el service worker esté listo y revisar el contenido de la caché.
    const claveCache = await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      const nombres = await caches.keys();
      let volcado = '';
      for (const n of nombres) {
        const c = await caches.open(n);
        const reqs = await c.keys();
        volcado += reqs.map((r) => r.url).join('\n') + '\n';
      }
      return volcado;
    });

    // La caché solo guarda el esqueleto (js/css/html/manifest), nunca la URL con «#p=»
    // (el fragmento no llega al service worker) ni ningún dato del paciente.
    expect(claveCache).not.toContain('#p=');
    expect(claveCache).not.toContain('paciente');
  });

  test('F1: STOP-Bang alto (varón 56, ronca, HTA, IMC 36, cuello 42) → 6, riesgo alto y alerta', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2: varón 56, IMC ≈ 36 (113 kg, 177 cm).
    await page.locator('#edad').fill('56');
    await page.getByRole('radio', { name: 'Hombre' }).check();
    await page.locator('#peso').fill('113');
    await page.locator('#talla').fill('177');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6

    // Paso 7: HTA + apnea del sueño (sin diagnóstico), con las preguntas del STOP-Bang.
    await page.getByRole('checkbox', { name: 'Hipertensión' }).check();
    await page.getByRole('checkbox', { name: 'Apnea del sueño (SAOS)' }).check();
    await page.getByRole('group', { name: /diagnóstico confirmado de apnea/ }).getByRole('button', { name: 'No' }).click();
    await page.getByRole('group', { name: /Ronca fuerte/ }).getByRole('button', { name: 'Sí' }).click();
    await page.locator('#saos-perimetro_cuello').fill('42');
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    await page.getByRole('button', { name: 'Continuar' }).click(); // 8 -> 9
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 -> 10
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 -> resumen

    const stopBang = page.getByRole('listitem').filter({ hasText: 'STOP-Bang' });
    await expect(stopBang).toContainText('6');
    await expect(stopBang).toContainText('riesgo alto');
    await expect(page.getByText(/STOP-Bang 6 \(riesgo alto\)/)).toBeVisible();
  });

  test('F2: STOP-Bang bajo (mujer 45, ronca y cansancio, IMC 30, cuello 36, sin HTA) → 2, riesgo bajo', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2: mujer 45, IMC ≈ 30 (82 kg, 165 cm).
    await page.locator('#edad').fill('45');
    await page.getByRole('radio', { name: 'Mujer' }).check();
    await page.locator('#peso').fill('82');
    await page.locator('#talla').fill('165');
    await page.getByRole('radio', { name: /No hay posibilidad/ }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6

    // Paso 7: apnea del sueño (sin diagnóstico); ronca y cansancio, sin apneas; cuello 36.
    await page.getByRole('checkbox', { name: 'Apnea del sueño (SAOS)' }).check();
    await page.getByRole('group', { name: /diagnóstico confirmado de apnea/ }).getByRole('button', { name: 'No' }).click();
    await page.getByRole('group', { name: /Ronca fuerte/ }).getByRole('button', { name: 'Sí' }).click();
    await page.getByRole('group', { name: /cansado o somnoliento durante el día/ }).getByRole('button', { name: 'Sí' }).click();
    await page.locator('#saos-perimetro_cuello').fill('36');
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    await page.getByRole('button', { name: 'Continuar' }).click(); // 8 -> 9
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 -> 10
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 -> resumen

    const stopBang = page.getByRole('listitem').filter({ hasText: 'STOP-Bang' });
    await expect(stopBang).toContainText('2');
    await expect(stopBang).toContainText('riesgo bajo');
  });

  test('F11: morfina equivalente (fentanilo 25 µg/h + tapentadol 100 mg/12 h) → 140 mg/día, alerta alta y dolor transicional', async ({ page }) => {
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
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    // Paso 8: fentanilo transdérmico (parche, µg/h) y tapentadol (mg × tomas/día).
    await page.locator('#med').fill('Durogesic');
    await page.getByRole('button', { name: /Durogesic/ }).first().click();
    await page.locator('#opdosis-fentanilo_transdermico').fill('25');

    await page.locator('#med').fill('Palexia');
    await page.getByRole('button', { name: /Palexia/ }).first().click();
    await page.locator('#opdosis-tapentadol').fill('100');
    await page.locator('#optomas-tapentadol').fill('2');

    await page.getByRole('button', { name: 'Continuar' }).click(); // 8 -> 9
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 -> 10
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 -> resumen

    const morfina = page.getByRole('listitem').filter({ hasText: 'Morfina equivalente' });
    await expect(morfina).toContainText('140');
    await expect(page.getByText(/Dosis alta de opioides/)).toBeVisible();
    await expect(page.getByText(/dolor transicional/)).toBeVisible();
  });

  test('E17: implante anticonceptivo → nota de sugammadex (barrera 7 días) en el resumen', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();

    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Mujer 40 (para que la anticoncepción tenga sentido); sin posibilidad de embarazo.
    await page.locator('#edad').fill('40');
    await page.getByRole('radio', { name: 'Mujer' }).check();
    await page.locator('#peso').fill('65');
    await page.locator('#talla').fill('165');
    await page.getByRole('radio', { name: /No hay posibilidad/ }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Continuar' }).click(); // 3
    await page.getByRole('button', { name: 'Continuar' }).click(); // 4
    await page.getByRole('checkbox', { name: 'No alergias conocidas' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 5
    await page.getByRole('button', { name: 'Continuar' }).click(); // 6
    await page.getByRole('checkbox', { name: 'Ninguna enfermedad conocida' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 7 -> 8

    // Paso 8: buscar y añadir el implante anticonceptivo (no pide hora de toma).
    await page.locator('#med').fill('implante');
    await page.getByRole('button', { name: /implante anticonceptivo/i }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click(); // 8 -> 9
    await page.getByRole('button', { name: 'Continuar' }).click(); // 9 -> 10
    await page.getByRole('button', { name: 'Continuar' }).click(); // 10 -> resumen

    // La nota del sugammadex (§8.15) para vía no oral: método de barrera 7 días.
    await page.getByRole('button', { name: /Notas técnicas/ }).click();
    await expect(page.getByText(/método de barrera/)).toBeVisible();
    await expect(page.getByText(/7 días/)).toBeVisible();
  });

  test('paso 1: "otro procedimiento" exige marcar los riesgos a mano (§7.1)', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await page.locator('#fecha').fill('2026-11-05');
    await page.getByRole('button', { name: /no está en la lista/ }).click();
    await expect(page.getByText(/no hay valores por defecto/)).toBeVisible();
    // Sin riesgos marcados, no se puede continuar.
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await page.locator('#otro-cv').selectOption('intermedio');
    await page.locator('#otro-hemo').selectOption('bajo');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /Paso 2 · Datos básicos/ })).toBeVisible();
  });

  test('§14.2 modo entrenamiento: carga un caso y muestra la comparación con lo esperado', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Modo entrenamiento' }).click();
    await expect(page.getByRole('heading', { name: 'Modo entrenamiento' })).toBeVisible();
    await page.getByRole('button', { name: 'Abrir este caso' }).first().click();
    await expect(page.getByText(/MODO ENTRENAMIENTO/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Resultado esperado/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Resumen del anestesiólogo/ })).toBeVisible();
  });

  test('§14.4 guía imprimible: se genera desde los módulos con casillas en blanco', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Guía imprimible' }).click();
    await expect(page.getByRole('heading', { name: 'Guía imprimible en blanco' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Diabetes', exact: true })).toBeVisible();
    await expect(page.getByText(/Cuestionario de sangrado \(HEMSTOP\)/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Guardar como PDF/ })).toBeVisible();
  });

  test('§14.3 cuadro de mando: sin entrevistas registradas en un dispositivo nuevo', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Cuadro de mando de uso' }).click();
    await expect(page.getByRole('heading', { name: 'Cuadro de mando de uso' })).toBeVisible();
    await expect(page.getByText(/Todavía no hay entrevistas registradas/)).toBeVisible();
  });

  test('panel de administración (§14.1): editar tabla, validar en vivo y descargar', async ({ page }) => {
    await page.goto('/preanestesia/');
    await page.getByRole('button', { name: 'Administración de contenido' }).click();
    await expect(page.getByRole('heading', { name: 'Administración de contenido' })).toBeVisible();

    // Seleccionar farmacos.csv y comprobar la tabla editable.
    await page.getByRole('button', { name: 'datos/farmacos.csv', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Poner un id_regla inexistente en la primera fila → aviso de validación (caso 21).
    await page.getByRole('textbox', { name: 'id_regla fila 1', exact: true }).fill('regla_inventada');
    await expect(page.getByText(/no existe en reglas_farmacos\.json/)).toBeVisible();

    // Descargar el fichero editado.
    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Descargar farmacos\.csv/ }).click(),
    ]);
    expect(descarga.suggestedFilename()).toBe('farmacos.csv');

    // Un fichero JSON se edita como texto y se valida.
    await page.getByRole('button', { name: 'datos/opioides.json', exact: true }).click();
    await expect(page.getByRole('textbox', { name: /Contenido de datos\/opioides\.json/ })).toBeVisible();
    await expect(page.getByText(/JSON válido/)).toBeVisible();
  });
});
