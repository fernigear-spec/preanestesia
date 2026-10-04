/**
 * Ejecución de los efectos codificados por respuesta (§5.16).
 *
 * No basta con que el `genera` esté documentado (eso lo vigila coberturaAlertas):
 * aquí comprobamos que el motor LOS EMITE. Para cada efecto de tipo alerta/nota con
 * condición ejecutable `si`, se construye una respuesta que la satisface y se verifica
 * que `emitirEfectosModulos` devuelve esa alerta/nota. Así, si una alerta declarada
 * dejara de emitirse, la prueba falla.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarModulos, type CondicionEfecto, type ModuloPatologia } from '../../../src/datos/modulos.ts';
import { emitirEfectosModulos } from '../../../src/dominio/entrevista/efectosModulos.ts';

const DIR = fileURLToPath(new URL('../../../datos/modulos/', import.meta.url));
const IV = new Date(2026, 9, 15, 8, 0);

function leerModulos(): ModuloPatologia[] {
  const objetos: Record<string, unknown> = {};
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    objetos[`datos/modulos/${f}`] = JSON.parse(readFileSync(DIR + f, 'utf8'));
  }
  return cargarModulos(objetos);
}

/** Construye un valor de respuesta que satisface la condición `si`. */
function valorQueSatisface(cond: CondicionEfecto): unknown {
  if (cond.igual !== undefined) return cond.igual;
  if (cond.enLista !== undefined) return cond.enLista[0];
  if (cond.contieneAlguno !== undefined) return [cond.contieneAlguno[0]];
  if (cond.mayorQue !== undefined) return cond.mayorQue + 1;
  if (cond.mayorIgualQue !== undefined) return cond.mayorIgualQue;
  if (cond.menorQue !== undefined) return cond.menorQue - 1;
  if (cond.recienteMeses !== undefined) {
    // Una fecha dentro de la ventana: hoy (siempre reciente respecto a la IQ).
    return IV.toISOString().slice(0, 10);
  }
  if (cond.recienteDias !== undefined) {
    return IV.toISOString().slice(0, 10);
  }
  if (cond.sinFechaRecienteMeses !== undefined) {
    // Se cumple si NO hay fecha reciente: devolvemos una fecha claramente antigua.
    const antigua = new Date(IV.getTime());
    antigua.setMonth(antigua.getMonth() - cond.sinFechaRecienteMeses - 2);
    return antigua.toISOString().slice(0, 10);
  }
  return null;
}

describe('Ejecución de efectos de módulos (§5.16)', () => {
  const modulos = leerModulos();

  it('cada efecto alerta/nota con condición `si` se EMITE cuando la condición se cumple', () => {
    const fallos: string[] = [];
    let ejecutables = 0;
    for (const m of modulos) {
      for (const p of m.preguntas) {
        for (const g of p.genera ?? []) {
          if ((g.tipo !== 'alerta' && g.tipo !== 'nota') || !g.si) continue;
          ejecutables++;
          const respuestas = { [m.id]: { [p.id]: valorQueSatisface(g.si) as never } };
          const out = emitirEfectosModulos({ modulos, respuestas, activos: new Set([m.id]), fechaIntervencion: IV });
          const emitido =
            g.tipo === 'alerta'
              ? out.alertas.some((a) => a.mensaje === g.efecto && a.gravedad === g.gravedad)
              : out.notas.some((n) => n.texto === g.efecto);
          if (!emitido) fallos.push(`${m.id}.${p.id} [${g.tipo}] "${g.efecto}" no se emitió`);
        }
      }
    }
    expect(fallos).toEqual([]);
    // Debe haber un número razonable de efectos ejecutables (guardia de regresión).
    expect(ejecutables).toBeGreaterThan(30);
  });

  it('no emite nada cuando el módulo no está activo', () => {
    // asma no controlada: crisis en el último mes = sí, pero asma_epoc no activo.
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { asma_epoc: { crisis_ultimo_mes: true } },
      activos: new Set(), // ninguno activo
      fechaIntervencion: IV,
    });
    expect(out.alertas).toEqual([]);
    expect(out.notas).toEqual([]);
  });

  it('no emite la alerta cuando la condición no se cumple', () => {
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { asma_epoc: { crisis_ultimo_mes: false } },
      activos: new Set(['asma_epoc']),
      fechaIntervencion: IV,
    });
    expect(out.alertas.some((a) => a.mensaje === 'asma no controlada')).toBeFalse();
  });

  it('ictus/AIT de menos de 3 meses → alerta roja (A8 vía módulo de FA)', () => {
    const haceDosMeses = new Date(2026, 7, 15).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { fibrilacion_auricular: { ictus_ait_previo: true, ictus_ait_fecha: haceDosMeses } },
      activos: new Set(['fibrilacion_auricular']),
      fechaIntervencion: IV,
    });
    const alerta = out.alertas.find((a) => a.mensaje.includes('ictus o AIT de menos de 3 meses'));
    expect(alerta?.gravedad).toBe('roja');
  });

  it('ictus/AIT antiguo (hace 6 meses) → sin alerta', () => {
    const haceSeisMeses = new Date(2026, 3, 15).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { ictus_o_tvp: { ictus_ait: true, ictus_fecha: haceSeisMeses } },
      activos: new Set(['ictus_o_tvp']),
      fechaIntervencion: IV,
    });
    expect(out.alertas.some((a) => a.mensaje.includes('ictus o AIT de menos de 3 meses'))).toBeFalse();
  });

  it('TVP/TEP de menos de 3 meses → alerta amarilla', () => {
    const haceUnMes = new Date(2026, 8, 15).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { ictus_o_tvp: { tvp_tep: true, tvp_tep_fecha: haceUnMes } },
      activos: new Set(['ictus_o_tvp']),
      fechaIntervencion: IV,
    });
    const alerta = out.alertas.find((a) => a.mensaje.includes('TVP o TEP de menos de 3 meses'));
    expect(alerta?.gravedad).toBe('amarilla');
  });

  it('sinFechaRecienteMeses: distrofia activa sin fecha de ecocardiograma → nota "valorar ecocardiograma"', () => {
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { distrofia_muscular: {} }, // sin ecocardiograma_fecha
      activos: new Set(['distrofia_muscular']),
      fechaIntervencion: IV,
    });
    expect(out.notas.some((n) => n.texto === 'valorar ecocardiograma')).toBeTrue();
  });

  it('sinFechaRecienteMeses: ecocardiograma reciente (hace 2 meses) → NO emite la nota', () => {
    const hace2meses = new Date(2026, 7, 15).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { distrofia_muscular: { ecocardiograma_fecha: hace2meses } },
      activos: new Set(['distrofia_muscular']),
      fechaIntervencion: IV,
    });
    expect(out.notas.some((n) => n.texto === 'valorar ecocardiograma')).toBeFalse();
  });

  it('sinFechaRecienteMeses: ecocardiograma antiguo (hace 14 meses) → emite la nota', () => {
    const hace14meses = new Date(2025, 7, 15).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { distrofia_muscular: { ecocardiograma_fecha: hace14meses } },
      activos: new Set(['distrofia_muscular']),
      fechaIntervencion: IV,
    });
    expect(out.notas.some((n) => n.texto === 'valorar ecocardiograma')).toBeTrue();
  });

  it('sin fecha de intervención, la recencia se mide respecto a hoy', () => {
    const hace1mes = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const out = emitirEfectosModulos({
      modulos,
      respuestas: { ictus_o_tvp: { ictus_ait: true, ictus_fecha: hace1mes } },
      activos: new Set(['ictus_o_tvp']),
      fechaIntervencion: null,
    });
    expect(out.alertas.some((a) => a.gravedad === 'roja')).toBeTrue();
  });
});
