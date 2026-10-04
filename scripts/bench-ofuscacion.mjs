/**
 * Benchmark de rendimiento base vs ofuscado (Bloque III-B). Sirve cada build con
 * un servidor estático mínimo y mide con Playwright:
 *  - tiempo hasta la primera interacción (botón «Presencial» visible),
 *  - tiempo de una operación con el motor de reglas (buscar un procedimiento y
 *    recorrer hasta el resumen, que es lo que la ofuscación podría ralentizar),
 * simulando una tablet (CPU 4x más lenta, viewport de tablet).
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function servir(dir, port) {
  const srv = http.createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
      ruta = ruta.replace(/^\/preanestesia/, '') || '/';
      if (ruta.endsWith('/')) ruta += 'index.html';
      const abs = join(dir, normalize(ruta));
      const data = await readFile(abs);
      res.writeHead(200, { 'content-type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      try {
        const data = await readFile(join(dir, 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html' }); res.end(data);
      } catch { res.writeHead(404); res.end('404'); }
    }
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}

async function medir(dir, port, etiqueta) {
  const srv = await servir(dir, port);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  // Simular una tablet modesta: ralentizar la CPU 4x (como lo haría DevTools).
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const muestras = { carga: [], flujo: [] };
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    await page.goto(`http://localhost:${port}/preanestesia/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Presencial' }).waitFor({ state: 'visible' });
    muestras.carga.push(Date.now() - t0);

    const t1 = Date.now();
    await page.getByRole('button', { name: 'Presencial' }).click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await page.locator('#fecha').fill('2026-11-05');
    await page.locator('#proc').fill('hernioplastia');
    await page.getByRole('button', { name: /Hernioplastia inguinal abierta/ }).first().click();
    muestras.flujo.push(Date.now() - t1);
    await page.reload();
  }
  await browser.close();
  srv.close();
  const media = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length);
  return { etiqueta, carga: media(muestras.carga), flujo: media(muestras.flujo) };
}

const base = await medir('.bench-base', 4201, 'base');
const obf = await medir('.bench-obf', 4202, 'ofuscado');
console.log('\n=== Rendimiento (tablet simulada, CPU 4x más lenta, media de 5 cargas) ===');
console.log(`carga inicial  base ${base.carga.toFixed(0)} ms  →  ofuscado ${obf.carga.toFixed(0)} ms  (${(obf.carga / base.carga).toFixed(2)}x)`);
console.log(`flujo+motor    base ${base.flujo.toFixed(0)} ms  →  ofuscado ${obf.flujo.toFixed(0)} ms  (${(obf.flujo / base.flujo).toFixed(2)}x)`);
