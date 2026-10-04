/**
 * Puntos de validación clínica (§13 bis). Mecanismo distinto de las alertas: cada
 * condición de datos/validaciones.json genera un punto que el anestesiólogo revisa
 * al principio de su resumen, de tipo 'posponer' (rojo) o 'validar' (amarillo).
 *
 * Estas pruebas comprueban:
 *  - Coherencia: cada `origen` del catálogo existe (una condición de módulo que se
 *    emite, o el hecho especial 'stent_reciente'). Protege contra errores de edición.
 *  - Que CADA condición del catálogo dispara su punto con el tipo correcto.
 *  - El stent reciente como punto 'posponer'.
 *  - Orden (posponer antes que validar) y ausencia de puntos sin disparadores.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarModulos, type CondicionEfecto, type ModuloPatologia } from '../../../src/datos/modulos.ts';
import { cargarValidaciones } from '../../../src/datos/validaciones.ts';
import { derivarPuntosValidacion } from '../../../src/dominio/entrevista/puntosValidacion.ts';

const DIR_MODULOS = fileURLToPath(new URL('../../../datos/modulos/', import.meta.url));
const RUTA_VAL = fileURLToPath(new URL('../../../datos/validaciones.json', import.meta.url));
const IV = new Date(2026, 9, 15, 8, 0); // 15/10/2026, "intervención"

function leerModulos(): ModuloPatologia[] {
  const objetos: Record<string, unknown> = {};
  for (const f of readdirSync(DIR_MODULOS).filter((n) => n.endsWith('.json'))) {
    objetos[`datos/modulos/${f}`] = JSON.parse(readFileSync(DIR_MODULOS + f, 'utf8'));
  }
  return cargarModulos(objetos);
}
const MODULOS = leerModulos();
const CATALOGO = cargarValidaciones(JSON.parse(readFileSync(RUTA_VAL, 'utf8')));
const TODOS = [...CATALOGO.posponer, ...CATALOGO.validar];

/** Localiza la condición `si` de la alerta cuyo origen es «moduloId.preguntaId». */
function condicionDe(origen: string): { moduloId: string; preguntaId: string; si: CondicionEfecto } | null {
  const moduloId = origen.split('.')[0] ?? '';
  const preguntaId = origen.split('.')[1] ?? '';
  const m = MODULOS.find((x) => x.id === moduloId);
  const p = m?.preguntas.find((x) => x.id === preguntaId);
  const g = p?.genera?.find((x) => x.tipo === 'alerta' && x.si);
  if (!m || !p || !g?.si) return null;
  return { moduloId, preguntaId, si: g.si };
}

/** Valor de respuesta que satisface la condición. */
function valorQueSatisface(cond: CondicionEfecto): unknown {
  if (cond.igual !== undefined) return cond.igual;
  if (cond.enLista !== undefined) return cond.enLista[0];
  if (cond.contieneAlguno !== undefined) return [cond.contieneAlguno[0]];
  if (cond.mayorQue !== undefined) return cond.mayorQue + 1;
  if (cond.mayorIgualQue !== undefined) return cond.mayorIgualQue;
  if (cond.menorQue !== undefined) return cond.menorQue - 1;
  if (cond.recienteMeses !== undefined) return IV.toISOString().slice(0, 10);
  if (cond.recienteDias !== undefined) return IV.toISOString().slice(0, 10);
  if (cond.sinFechaRecienteMeses !== undefined) {
    const antigua = new Date(IV.getTime());
    antigua.setMonth(antigua.getMonth() - cond.sinFechaRecienteMeses - 2);
    return antigua.toISOString().slice(0, 10);
  }
  return null;
}

describe('§13 bis · puntos de validación clínica', () => {
  it('el catálogo tiene puntos de los dos tipos', () => {
    expect(CATALOGO.posponer.length).toBeGreaterThan(0);
    expect(CATALOGO.validar.length).toBeGreaterThan(0);
    expect(CATALOGO.posponer.every((p) => p.tipo === 'posponer')).toBeTrue();
    expect(CATALOGO.validar.every((p) => p.tipo === 'validar')).toBeTrue();
  });

  const idsModulo = new Set(MODULOS.map((m) => m.id));
  const esOrigenModulo = (origen: string): boolean => {
    const i = origen.indexOf('.');
    return i > 0 && idsModulo.has(origen.slice(0, i));
  };

  it('coherencia: cada origen de módulo existe y emite una alerta con condición', () => {
    const fallos: string[] = [];
    for (const d of TODOS) {
      if (!esOrigenModulo(d.origen)) continue;
      if (condicionDe(d.origen) === null) fallos.push(`${d.id} → origen de módulo inexistente o sin alerta: ${d.origen}`);
    }
    expect(fallos).toEqual([]);
  });

  it('cada punto con origen de módulo se DISPARA cuando su condición se cumple, con el tipo correcto', () => {
    const fallos: string[] = [];
    for (const d of TODOS) {
      if (!esOrigenModulo(d.origen)) continue;
      const c = condicionDe(d.origen)!;
      const respuestas = { [c.moduloId]: { [c.preguntaId]: valorQueSatisface(c.si) as never } };
      const puntos = derivarPuntosValidacion({
        catalogo: CATALOGO, modulos: MODULOS, respuestas, activos: new Set([c.moduloId]), fechaIntervencion: IV,
      });
      const encontrado = puntos.find((p) => p.id === d.id);
      if (!encontrado) fallos.push(`${d.id} no se disparó con ${d.origen}`);
      else if (encontrado.tipo !== d.tipo) fallos.push(`${d.id} tipo ${encontrado.tipo} ≠ ${d.tipo}`);
    }
    expect(fallos).toEqual([]);
  });

  it('cada punto con origen de HECHO se DISPARA cuando su flag es true, con el tipo correcto', () => {
    const fallos: string[] = [];
    for (const d of TODOS) {
      if (esOrigenModulo(d.origen)) continue;
      const puntos = derivarPuntosValidacion({
        catalogo: CATALOGO, modulos: MODULOS, respuestas: {}, activos: new Set(), fechaIntervencion: IV,
        hechos: { [d.origen]: true },
      });
      const encontrado = puntos.find((p) => p.id === d.id);
      if (!encontrado) fallos.push(`${d.id} no se disparó con el hecho ${d.origen}`);
      else if (encontrado.tipo !== d.tipo) fallos.push(`${d.id} tipo ${encontrado.tipo} ≠ ${d.tipo}`);
    }
    expect(fallos).toEqual([]);
  });

  it('un hecho en false no dispara su punto', () => {
    const hechoDef = TODOS.find((d) => !esOrigenModulo(d.origen))!;
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS, respuestas: {}, activos: new Set(), fechaIntervencion: IV,
      hechos: { [hechoDef.origen]: false },
    });
    expect(puntos.some((p) => p.id === hechoDef.id)).toBeFalse();
  });

  it('sin ningún disparador no hay puntos de validación', () => {
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS, respuestas: {}, activos: new Set(), fechaIntervencion: IV,
    });
    expect(puntos).toEqual([]);
  });

  it('stent reciente → punto "posponer" (rojo)', () => {
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS, respuestas: {}, activos: new Set(), fechaIntervencion: IV,
      hechos: { stent_reciente: true },
    });
    const stent = puntos.find((p) => p.id === 'stent_reciente');
    expect(stent?.tipo).toBe('posponer');
    expect(stent?.motivo).toMatch(/diferir la cirugía/);
  });

  it('sin stent reciente, el punto del stent no aparece', () => {
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS, respuestas: {}, activos: new Set(), fechaIntervencion: IV,
      hechos: { stent_reciente: false },
    });
    expect(puntos.some((p) => p.id === 'stent_reciente')).toBeFalse();
  });

  it('ictus/AIT < 3 meses → punto "posponer"; TVP/TEP < 3 meses → punto "validar"', () => {
    const haceUnMes = new Date(2026, 8, 15).toISOString().slice(0, 10);
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS,
      respuestas: { ictus_o_tvp: { ictus_ait: true, ictus_fecha: haceUnMes, tvp_tep: true, tvp_tep_fecha: haceUnMes } },
      activos: new Set(['ictus_o_tvp']), fechaIntervencion: IV,
    });
    expect(puntos.find((p) => p.id === 'ictus_ait_reciente')?.tipo).toBe('posponer');
    expect(puntos.find((p) => p.id === 'tvp_tep_reciente')?.tipo).toBe('validar');
  });

  it('ordena primero los "posponer" (rojo) y luego los "validar" (amarillo)', () => {
    const hace1mes = new Date(2026, 8, 15).toISOString().slice(0, 10);
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS,
      // ictus (posponer) + TVP (validar) + miocardiopatía sintomática (validar).
      respuestas: {
        ictus_o_tvp: { ictus_ait: true, ictus_fecha: hace1mes, tvp_tep: true, tvp_tep_fecha: hace1mes },
        miocardiopatia: { sintomas: true },
      },
      activos: new Set(['ictus_o_tvp', 'miocardiopatia']), fechaIntervencion: IV,
      hechos: { stent_reciente: true },
    });
    const tipos = puntos.map((p) => p.tipo);
    // Todos los 'posponer' van antes que cualquier 'validar'.
    const ultimoPosponer = tipos.lastIndexOf('posponer');
    const primerValidar = tipos.indexOf('validar');
    expect(primerValidar === -1 || ultimoPosponer < primerValidar).toBeTrue();
  });

  it('una condición antigua (ictus hace 6 meses) no genera punto', () => {
    const haceSeis = new Date(2026, 3, 15).toISOString().slice(0, 10);
    const puntos = derivarPuntosValidacion({
      catalogo: CATALOGO, modulos: MODULOS,
      respuestas: { ictus_o_tvp: { ictus_ait: true, ictus_fecha: haceSeis } },
      activos: new Set(['ictus_o_tvp']), fechaIntervencion: IV,
    });
    expect(puntos.some((p) => p.id === 'ictus_ait_reciente')).toBeFalse();
  });
});
