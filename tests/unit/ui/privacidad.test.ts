/**
 * Privacidad (§2): fase del temporizador de inactividad.
 */
import { describe, it, expect } from '../../_harness.ts';
import { faseInactividad } from '../../../src/ui/privacidad.ts';

describe('Privacidad · fase de inactividad (§2)', () => {
  const LIMITE = 30 * 60_000; // 30 min
  const AVISO = 60_000; // 1 min antes

  it('sigue activa mientras haya actividad reciente', () => {
    expect(faseInactividad(0, LIMITE, AVISO)).toBe('activo');
    expect(faseInactividad(10 * 60_000, LIMITE, AVISO)).toBe('activo');
  });

  it('entra en aviso durante el último minuto antes del límite', () => {
    expect(faseInactividad(LIMITE - AVISO, LIMITE, AVISO)).toBe('aviso');
    expect(faseInactividad(LIMITE - 1_000, LIMITE, AVISO)).toBe('aviso');
  });

  it('un segundo antes del aviso todavía está activa', () => {
    expect(faseInactividad(LIMITE - AVISO - 1, LIMITE, AVISO)).toBe('activo');
  });

  it('expira justo al alcanzar el límite y después', () => {
    expect(faseInactividad(LIMITE, LIMITE, AVISO)).toBe('expirado');
    expect(faseInactividad(LIMITE + 5_000, LIMITE, AVISO)).toBe('expirado');
  });
});
