/**
 * Harness de pruebas portable.
 *
 * En este tramo (sin acceso a npm) las pruebas se ejecutan con el runner nativo
 * `node:test` (Node 22, `--experimental-strip-types`). Este fichero reexporta
 * `describe`/`it` de `node:test` y expone un `expect(...)` con un subconjunto de
 * matchers al estilo de Vitest.
 *
 * PENDIENTE: sustituir por Vitest. Para migrar, basta con reemplazar los imports
 * de las pruebas:
 *     import { describe, it, expect } from './_harness.ts';
 *   por:
 *     import { describe, it, expect } from 'vitest';
 * Los tests están escritos con `describe`/`it`/`expect(...).toBe(...)` para que la
 * migración no requiera reescribir aserciones.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export { describe, it };

type Matchers = {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeCloseTo(expected: number, digits?: number): void;
  toBeTrue(): void;
  toBeFalse(): void;
  toBeUndefined(): void;
  toContain(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toThrow(): void;
  readonly not: Omit<Matchers, 'not'>;
};

function build(actual: unknown, negated: boolean): Omit<Matchers, 'not'> {
  const check = (cond: boolean, message: string): void => {
    assert.ok(negated ? !cond : cond, message);
  };
  return {
    toBe(expected) {
      check(Object.is(actual, expected), `esperado ${negated ? 'no ' : ''}=== ${String(expected)}, recibido ${String(actual)}`);
    },
    toEqual(expected) {
      let equal = true;
      try {
        assert.deepStrictEqual(actual, expected);
      } catch {
        equal = false;
      }
      check(equal, `deepEqual falló: recibido ${JSON.stringify(actual)}`);
    },
    toBeCloseTo(expected, digits = 2) {
      const ok = Math.abs((actual as number) - expected) < Math.pow(10, -digits) / 2;
      check(ok, `esperado ~${expected} (±${digits} dígitos), recibido ${String(actual)}`);
    },
    toBeTrue() {
      check(actual === true, `esperado true, recibido ${String(actual)}`);
    },
    toBeFalse() {
      check(actual === false, `esperado false, recibido ${String(actual)}`);
    },
    toBeUndefined() {
      check(actual === undefined, `esperado undefined, recibido ${String(actual)}`);
    },
    toContain(expected) {
      const ok = Array.isArray(actual)
        ? actual.includes(expected)
        : typeof actual === 'string' && actual.includes(String(expected));
      check(ok, `esperado que contuviera ${String(expected)}`);
    },
    toHaveLength(expected) {
      const len = (actual as { length?: number })?.length;
      check(len === expected, `esperado length ${expected}, recibido ${String(len)}`);
    },
    toBeGreaterThan(expected) {
      check((actual as number) > expected, `esperado > ${expected}, recibido ${String(actual)}`);
    },
    toBeGreaterThanOrEqual(expected) {
      check((actual as number) >= expected, `esperado >= ${expected}, recibido ${String(actual)}`);
    },
    toBeLessThan(expected) {
      check((actual as number) < expected, `esperado < ${expected}, recibido ${String(actual)}`);
    },
    toThrow() {
      let threw = false;
      try {
        (actual as () => unknown)();
      } catch {
        threw = true;
      }
      check(threw, 'esperado que lanzara una excepción');
    },
  };
}

export function expect(actual: unknown): Matchers {
  const positive = build(actual, false);
  const negative = build(actual, true);
  return { ...positive, not: negative };
}
