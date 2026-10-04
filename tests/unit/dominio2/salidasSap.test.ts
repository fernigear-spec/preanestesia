/**
 * Texto de SAP (§10.1) y ASA sugerido (§6.1).
 */
import { describe, it, expect } from '../../_harness.ts';
import { construirSap, type EntradaSap } from '../../../src/dominio/salidas/construirSap.ts';
import { derivarAsa, type EntradaAsa } from '../../../src/dominio/salidas/asaSugerido.ts';
import { resumenModuloSap } from '../../../src/dominio/salidas/resumenModuloSap.ts';
import type { ModuloPatologia } from '../../../src/datos/modulos.ts';

function entradaSap(p: Partial<EntradaSap> = {}): EntradaSap {
  return {
    cabecera: 'VALORACION PREANESTESICA ENFERMERIA 30/09/2026 (presencial)',
    antecedentesPatologicos: ['Cardiopatia isquemica: IAM 2021, stent farmacoactivo 03/2024', 'diabetes mellitus, HbA1c 7,2%'],
    antecedentesQuirurgicos: ['colecistectomia, 2010, anestesia general, incidencias: nvpo'],
    ...p,
  };
}

describe('§10.1 · texto de SAP (solo antecedentes patológicos y quirúrgicos)', () => {
  it('compone AP y AQ y NO incluye alergias, hábitos, medicación, escalas, ASA ni pruebas', () => {
    const r = construirSap(entradaSap());
    expect(r.texto).toContain('AP: Cardiopatia isquemica');
    expect(r.texto).toContain('AQ: colecistectomia, 2010, anestesia general');
    expect(r.texto).not.toContain('Alergias');
    expect(r.texto).not.toContain('Habitos');
    expect(r.texto).not.toContain('Escalas');
    expect(r.texto).not.toContain('ASA');
    expect(r.texto).not.toContain('Pruebas');
  });

  it('sin antecedentes: indica que no hay patológicos ni quirúrgicos', () => {
    const r = construirSap(entradaSap({ antecedentesPatologicos: [], antecedentesQuirurgicos: [] }));
    expect(r.texto).toContain('sin antecedentes patologicos');
    expect(r.texto).toContain('sin intervenciones previas');
  });

  it('opción solo ASCII quita tildes y símbolos', () => {
    const r = construirSap(entradaSap(), { soloAscii: true });
    expect(/[áéíóúñ«»]/.test(r.texto)).toBeFalse();
  });

  // Consentimiento (§10, paso 10) en el SAP (2026-10-04).
  it('consentimiento entregado con fecha → línea «entregado y explicado (fecha)»', () => {
    const r = construirSap(entradaSap({ consentimiento: { estado: 'entregado', fecha: '30/09/2026' } }));
    expect(r.texto).toContain('Consentimiento: entregado y explicado (30/09/2026)');
  });
  it('consentimiento pendiente → línea «pendiente de entregar»', () => {
    const r = construirSap(entradaSap({ consentimiento: { estado: 'pendiente_entregar' } }));
    expect(r.texto).toContain('Consentimiento: pendiente de entregar');
  });
  it('consentimiento no procede → línea «no procede»', () => {
    const r = construirSap(entradaSap({ consentimiento: { estado: 'no_procede' } }));
    expect(r.texto).toContain('Consentimiento: no procede');
  });
  it('sin consentimiento → no se escribe ninguna línea de consentimiento', () => {
    const r = construirSap(entradaSap());
    expect(r.texto).not.toContain('Consentimiento:');
  });
});

// Módulo de prueba con una booleana (con etiquetaSap), una opción_multiple y un número.
const MODULO_DEMO: ModuloPatologia = {
  id: 'demo',
  titulo: 'Insuficiencia cardiaca',
  fuente: 'test',
  preguntas: [
    { id: 'ortopnea', etiqueta: '¿Ortopnea?', tipo: 'boolean', etiquetaSap: 'ortopnea' },
    { id: 'edemas', etiqueta: '¿Edemas?', tipo: 'boolean', etiquetaSap: 'edemas' },
    { id: 'saos', etiqueta: '¿SAOS?', tipo: 'boolean', etiquetaSap: 'SAOS diagnosticado', etiquetaSapNo: 'SAOS no diagnosticado' },
    { id: 'nyha', etiqueta: 'Clase NYHA', tipo: 'opcion', etiquetaSap: 'NYHA', opciones: [
      { valor: 'III', etiqueta: 'III' }, { valor: 'IV', etiqueta: 'IV' },
    ] },
    { id: 'sintomas', etiqueta: 'Síntomas', tipo: 'opcion_multiple', opciones: [
      { valor: 'disnea', etiqueta: 'disnea' }, { valor: 'sincope', etiqueta: 'síncope' },
    ] },
    { id: 'fevi', etiqueta: 'FEVI', tipo: 'numero', etiquetaSap: 'FEVI' },
  ],
};

describe('§10.1 · resumenModuloSap (solo contestadas; sí/no breve; multi marcadas)', () => {
  it('booleana sí → la palabra; booleana no → "no " + palabra; sin contestar se omite', () => {
    const r = resumenModuloSap(MODULO_DEMO, { ortopnea: true, edemas: false });
    expect(r).toContain('ortopnea');
    expect(r).toContain('no edemas');
  });
  it('una booleana no contestada no aparece', () => {
    const r = resumenModuloSap(MODULO_DEMO, { ortopnea: true });
    expect(r).not.toContain('edemas');
  });
  it('etiquetaSapNo: "no" usa la etiqueta específica en lugar de "no " + etiqueta', () => {
    const r = resumenModuloSap(MODULO_DEMO, { saos: false });
    expect(r).toContain('SAOS no diagnosticado');
    expect(r).not.toContain('no SAOS diagnosticado');
  });
  it('sin etiquetaSapNo, "no" sigue siendo "no " + etiqueta', () => {
    const r = resumenModuloSap(MODULO_DEMO, { ortopnea: false });
    expect(r).toContain('no ortopnea');
  });
  it('opción usa la etiqueta de la opción y la etiquetaSap de la pregunta', () => {
    const r = resumenModuloSap(MODULO_DEMO, { nyha: 'III' });
    expect(r).toContain('NYHA: III');
  });
  it('opción_multiple: solo las opciones marcadas, en forma breve', () => {
    const r = resumenModuloSap(MODULO_DEMO, { sintomas: ['disnea'] });
    expect(r).toContain('disnea');
    expect(r).not.toContain('síncope');
  });
  it('número contestado aparece con su etiquetaSap', () => {
    const r = resumenModuloSap(MODULO_DEMO, { fevi: 30 });
    expect(r).toContain('FEVI: 30');
  });
  it('sin ninguna respuesta → solo el título del módulo', () => {
    expect(resumenModuloSap(MODULO_DEMO, {})).toBe('Insuficiencia cardiaca');
  });
});

function entradaAsa(p: Partial<EntradaAsa> = {}): EntradaAsa {
  return { edadAnios: 50, imc: 24, embarazada: false, tabacoActivo: false, abusoAlcohol: false, enfermedades: new Set(), respuestas: {}, ...p };
}

describe('§6.1 · ASA sugerido', () => {
  it('sano → ASA I', () => {
    expect(derivarAsa(entradaAsa()).clase).toBe(1);
  });
  it('fumador activo → ASA II', () => {
    expect(derivarAsa(entradaAsa({ tabacoActivo: true })).clase).toBe(2);
  });
  it('EPOC → ASA III', () => {
    const r = derivarAsa(entradaAsa({ enfermedades: new Set(['asma_epoc']), respuestas: { asma_epoc: { enfermedad: 'epoc' } } }));
    expect(r.clase).toBe(3);
  });
  it('insuficiencia cardiaca NYHA IV → ASA IV', () => {
    const r = derivarAsa(entradaAsa({ enfermedades: new Set(['insuficiencia_cardiaca']), respuestas: { insuficiencia_cardiaca: { nyha: 'IV' } } }));
    expect(r.clase).toBe(4);
  });
  it('override manual', () => {
    expect(derivarAsa(entradaAsa({ claseManual: 3 })).clase).toBe(3);
  });
});
