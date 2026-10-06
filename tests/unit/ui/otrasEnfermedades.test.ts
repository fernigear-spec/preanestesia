/**
 * Otras enfermedades escritas a mano en el paso 6 (§6), fuera del catálogo:
 * su texto para el SAP y el resumen es «nombre (detalle)» o solo «nombre».
 */
import { describe, it, expect } from '../../_harness.ts';
import { textoOtraEnfermedad } from '../../../src/ui/estadoEntrevista.ts';

describe('§6 · textoOtraEnfermedad', () => {
  it('con detalle: «nombre (detalle)»', () => {
    expect(textoOtraEnfermedad({ nombre: 'Enfermedad de Behçet', detalle: 'brotes frecuentes' }))
      .toBe('Enfermedad de Behçet (brotes frecuentes)');
  });

  it('sin detalle: solo el nombre', () => {
    expect(textoOtraEnfermedad({ nombre: 'Porfiria' })).toBe('Porfiria');
  });

  it('detalle en blanco (solo espacios) se trata como sin detalle', () => {
    expect(textoOtraEnfermedad({ nombre: 'Sarcoidosis', detalle: '   ' })).toBe('Sarcoidosis');
  });

  it('recorta los espacios sobrantes del detalle', () => {
    expect(textoOtraEnfermedad({ nombre: 'Amiloidosis', detalle: '  cardiaca  ' }))
      .toBe('Amiloidosis (cardiaca)');
  });
});
