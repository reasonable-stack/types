import { describe, expect, it, mock } from 'bun:test';
import { Maybe } from './maybe';

describe('Maybe.some(value)', () => {
  it('wraps a value', () => {
    const user = { name: 'Ada' };
    const maybe = Maybe.some(user);

    expect(Maybe.isSome(maybe)).toBe(true);
    expect(Maybe.isNone(maybe)).toBe(false);
    expect(maybe.unwrap()).toBe(user);
  });

  it('wraps nullish values as is', () => {
    expect(Maybe.isSome(Maybe.some(null))).toBe(true);
    expect(Maybe.isSome(Maybe.some(undefined))).toBe(true);
    expect(Maybe.some(undefined).unwrap()).toBeUndefined();
  });
});

describe('Maybe.none()', () => {
  it('represents the absence of a value', () => {
    const maybe = Maybe.none();

    expect(Maybe.isNone(maybe)).toBe(true);
    expect(Maybe.isSome(maybe)).toBe(false);
  });

  it('unwraps to null', () => {
    expect(Maybe.none().unwrap()).toBeNull();
  });
});

describe('Maybe.from(value)', () => {
  it('returns None for null and undefined', () => {
    expect(Maybe.isNone(Maybe.from(null))).toBe(true);
    expect(Maybe.isNone(Maybe.from(undefined))).toBe(true);
    expect(Maybe.isNone(Maybe.from(new Map<string, number>().get('missing')))).toBe(true);
  });

  it('returns Some for other falsy values', () => {
    for (const value of [0, -0, '', false, Number.NaN, 0n]) {
      const maybe = Maybe.from(value);

      expect(Maybe.isSome(maybe)).toBe(true);
      expect(maybe.unwrap()).toBe(value);
    }
  });

  it('returns Some for any other value', () => {
    const user = { name: 'Ada' };
    const maybe = Maybe.from(user);

    expect(Maybe.isSome(maybe)).toBe(true);
    expect(maybe.unwrap()).toBe(user);
  });
});

describe('Maybe.match(maybe, cases)', () => {
  it('calls `some` with the value of a Some', () => {
    const cases = { some: mock((n: number) => n * 2), none: mock(() => 'none') };

    expect(Maybe.match(Maybe.some(21), cases)).toBe(42);
    expect(cases.some).toHaveBeenCalledTimes(1);
    expect(cases.some).toHaveBeenCalledWith(21);
    expect(cases.none).not.toHaveBeenCalled();
  });

  it('calls `none` for a None', () => {
    const cases = { some: mock((n: number) => n * 2), none: mock(() => 'none') };

    expect(Maybe.match<number, number, string>(Maybe.none(), cases)).toBe('none');
    expect(cases.none).toHaveBeenCalledTimes(1);
    expect(cases.some).not.toHaveBeenCalled();
  });

  it('throws for a value that is neither Some nor None', () => {
    const notAMaybe = { unwrap: () => 1 } as unknown as Maybe<number>;

    expect(() => Maybe.match(notAMaybe, { some: () => 'some', none: () => 'none' })).toThrow('Unreachable');
  });
});

describe('tagging', () => {
  it('recognizes values created by another copy of the package', () => {
    const foreign = { [Symbol.for('kind')]: Symbol.for('maybe:some'), unwrap: () => 1 } as unknown as Maybe<number>;

    expect(Maybe.isSome(foreign)).toBe(true);
  });

  it('is not serialized', () => {
    expect(JSON.stringify(Maybe.some(1))).toBe('{}');
  });
});

describe('types', () => {
  it('narrows with type guards and requires exhaustive cases', () => {
    // type-level only, never called
    const typecheck = (maybe: Maybe<number>) => {
      if (Maybe.isSome(maybe)) {
        const value: number = maybe.unwrap();
      } else {
        const value: null = maybe.unwrap();
      }

      // @ts-expect-error the value may be absent
      const value: number = maybe.unwrap();

      // @ts-expect-error missing the `none` case
      Maybe.match(maybe, { some: (n) => n });

      // @ts-expect-error missing the `some` case
      Maybe.match(maybe, { none: () => 'none' });

      const matched: number | string = Maybe.match(maybe, { some: (n) => n, none: () => 'none' });
    };

    expect(typecheck).toBeFunction();
  });
});
