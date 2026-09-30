import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { faseInactividad } from '../../../src/ui/privacidad.ts';

describe('Privacidad · fase de inactividad (§2)', () => {
  const LIMITE = 30 * 60_000; // 30 min
  const AVISO = 60_000; // 1 min antes

  it('sigue activa mientras haya actividad reciente', () => {
    assert.equal(faseInactividad(0, LIMITE, AVISO), 'activo');
    assert.equal(faseInactividad(10 * 60_000, LIMITE, AVISO), 'activo');
  });

  it('entra en aviso durante el último minuto antes del límite', () => {
    assert.equal(faseInactividad(LIMITE - AVISO, LIMITE, AVISO), 'aviso');
    assert.equal(faseInactividad(LIMITE - 1_000, LIMITE, AVISO), 'aviso');
  });

  it('un segundo antes del aviso todavía está activa', () => {
    assert.equal(faseInactividad(LIMITE - AVISO - 1, LIMITE, AVISO), 'activo');
  });

  it('expira justo al alcanzar el límite y después', () => {
    assert.equal(faseInactividad(LIMITE, LIMITE, AVISO), 'expirado');
    assert.equal(faseInactividad(LIMITE + 5_000, LIMITE, AVISO), 'expirado');
  });
});
