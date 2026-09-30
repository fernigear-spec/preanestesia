/**
 * Texto de SAP (§10.1) y ASA sugerido (§6.1).
 */
import { describe, it, expect } from '../../_harness.ts';
import { construirSap, type EntradaSap } from '../../../src/dominio/salidas/construirSap.ts';
import { derivarAsa, type EntradaAsa } from '../../../src/dominio/salidas/asaSugerido.ts';

function entradaSap(p: Partial<EntradaSap> = {}): EntradaSap {
  return {
    cabecera: 'VALORACION PREANESTESICA ENFERMERIA 30/09/2026 (presencial)',
    datos: 'Edad 67 a. Peso 82 kg. Talla 170 cm. IMC 28,4.',
    alergias: 'Alergias: penicilina (exantema).',
    habitos: 'Habitos: exfumador.',
    antecedentesPatologicos: ['hipertensión arterial en tratamiento', 'diabetes mellitus, HbA1c 7,2%'],
    iqPrevias: ['colecistectomia 2010 (AG)'],
    antecedentesAnestesicos: 'sin incidencias',
    negativos: { alergiasConocidas: true, hipertermiaMalignaFamiliar: false, antecedentesFamiliaresAnestesicos: false, mtnd4Positivo: false, hemstopPositivo: false },
    capacidadFuncional: 'Capacidad funcional: >4 METs.',
    viaAerea: 'Via aerea: MP II.',
    escalas: 'STOP-Bang 4 (intermedio).',
    asa: 'ASA sugerido III.',
    tratamientoHabitual: 'Tto habitual: enalapril, apixaban.',
    plan: ['apixaban ultima toma 12/10 20:00'],
    pruebas: 'Pruebas: hemograma, coagulacion.',
    consentimiento: 'Consentimiento: entregado 30/09/2026.',
    confirmadoPor: [],
    ...p,
  };
}

describe('§10.1 · texto de SAP', () => {
  it('compone el texto con negativos y omite bloques vacíos', () => {
    const r = construirSap(entradaSap());
    expect(r.texto).toContain('VALORACION PREANESTESICA');
    expect(r.texto).toContain('niega HM');
    expect(r.texto).toContain('cribado mtND4 negativo');
    expect(r.texto).toContain('Pendiente de confirmacion por anestesiologo: ninguno');
  });

  it('incluye los nombres de los anestesiólogos que confirmaron', () => {
    const r = construirSap(entradaSap({ confirmadoPor: ['Dra. García'] }));
    expect(r.texto).toContain('Confirmado por anestesiologo: Dra. García');
  });

  it('opción solo ASCII quita tildes y símbolos', () => {
    const r = construirSap(entradaSap(), { soloAscii: true });
    expect(/[áéíóúñ«»]/.test(r.texto)).toBeFalse();
  });

  it('avisa si supera el límite de caracteres', () => {
    const r = construirSap(entradaSap(), { limiteCaracteres: 50 });
    expect(r.excedeLimite).toBeTrue();
  });
});

function entradaAsa(p: Partial<EntradaAsa> = {}): EntradaAsa {
  return { edadAnios: 50, imc: 24, embarazada: false, tabacoActivo: false, abusoAlcohol: false, enfermedades: new Set(), respuestas: {}, urgencia: false, ...p };
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
  it('insuficiencia cardiaca NYHA IV → ASA IV; urgencia añade sufijo E', () => {
    const r = derivarAsa(entradaAsa({ enfermedades: new Set(['insuficiencia_cardiaca']), respuestas: { insuficiencia_cardiaca: { nyha: 'IV' } }, urgencia: true }));
    expect(r.clase).toBe(4);
    expect(r.sufijoE).toBeTrue();
  });
  it('override manual', () => {
    expect(derivarAsa(entradaAsa({ claseManual: 3 })).clase).toBe(3);
  });
});
