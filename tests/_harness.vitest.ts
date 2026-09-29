/**
 * Harness sobre Vitest (usado en CI vía alias de vitest.config.ts).
 * Reexporta describe/it/expect de Vitest y añade toBeTrue/toBeFalse.
 */
import { describe, it, expect as vitestExpect } from 'vitest';

export { describe, it };

export function expect(actual: unknown): any {
  const wrap = (neg: boolean) => {
    const e = neg ? vitestExpect(actual).not : vitestExpect(actual);
    return new Proxy(e as object, {
      get(target, prop, receiver) {
        if (prop === 'toBeTrue') return () => (neg ? vitestExpect(actual).not.toBe(true) : vitestExpect(actual).toBe(true));
        if (prop === 'toBeFalse') return () => (neg ? vitestExpect(actual).not.toBe(false) : vitestExpect(actual).toBe(false));
        if (prop === 'not' && !neg) return wrap(true);
        return Reflect.get(target, prop, receiver);
      },
    });
  };
  return wrap(false);
}
