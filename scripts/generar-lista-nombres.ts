/**
 * Genera docs/lista_nombres_comerciales.csv (separador «;») con una fila por cada
 * nombre comercial del catálogo (datos/farmacos.csv), para cotejarlo en CIMA (AEMPS).
 * Columnas: principio_activo; nombre_comercial; grupo; via; id_farmaco.
 *
 * Excluye las filas genéricas sin nombre comercial: un «nombre» se descarta cuando,
 * normalizado, coincide con el principio activo o con el id del fármaco (es decir,
 * cuando el catálogo no aporta una marca real, como codeína, metadona o heparina sódica).
 *
 * Ejecutar: node --experimental-strip-types scripts/generar-lista-nombres.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../src/datos/csv.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Normaliza para comparar: minúsculas, sin acentos, sin separadores. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_|]+/g, ' ')
    .trim();
}

interface FilaNombre {
  principioActivo: string;
  nombreComercial: string;
  grupo: string;
  via: string;
  idFarmaco: string;
}

const csv = readFileSync(join(RAIZ, 'datos/farmacos.csv'), 'utf8');
const { filas } = parseCsv(csv);

const salida: FilaNombre[] = [];
for (const fila of filas) {
  const v = fila.valores;
  const id = v.id ?? '';
  const principios = (v.principios_activos ?? '').split('|').map((s) => s.trim()).filter(Boolean);
  const principioActivo = principios.join(' + ');
  const nombres = (v.nombres_comerciales ?? '').split('|').map((s) => s.trim()).filter(Boolean);

  // Conjunto de formas «genéricas» que NO son marca: el id y cada principio activo.
  const genericos = new Set<string>([norm(id), ...principios.map(norm)]);

  for (const nombre of nombres) {
    if (genericos.has(norm(nombre))) continue; // fila genérica sin marca real
    salida.push({
      principioActivo,
      nombreComercial: nombre,
      grupo: v.grupo ?? '',
      via: v.via ?? '',
      idFarmaco: id,
    });
  }
}

// Ordena por grupo y principio para facilitar el cotejo.
salida.sort((a, b) =>
  a.grupo.localeCompare(b.grupo) ||
  a.principioActivo.localeCompare(b.principioActivo) ||
  a.nombreComercial.localeCompare(b.nombreComercial),
);

const lineas = ['principio_activo;nombre_comercial;grupo;via;id_farmaco'];
for (const f of salida) {
  lineas.push([f.principioActivo, f.nombreComercial, f.grupo, f.via, f.idFarmaco].join(';'));
}
writeFileSync(join(RAIZ, 'docs/lista_nombres_comerciales.csv'), lineas.join('\n') + '\n', 'utf8');
console.log(`docs/lista_nombres_comerciales.csv generado: ${salida.length} nombres comerciales (de ${filas.length} filas del catálogo).`);
