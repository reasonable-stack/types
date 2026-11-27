import { describe, expect, it, mock } from 'bun:test';
import { Result } from './result';

describe('Result.ok(value)', () => {
  it('wraps a successful value', () => {
    const user = { name: 'Ada' };
    const result = Result.ok(user);

    expect(Result.isOk(result)).toBe(true);
    expect(Result.isError(result)).toBe(false);
    expect(result.unwrap()).toBe(user);
  });

  it('wraps nothing when called without a value', () => {
    const result: Result.Ok<void> = Result.ok();

    expect(Result.isOk(result)).toBe(true);
    expect(result.unwrap()).toBeUndefined();
  });
});

describe('Result.error(value)', () => {
  it('wraps an error value', () => {
    const result = Result.error('not found');

    expect(Result.isError(result)).toBe(true);
    expect(Result.isOk(result)).toBe(false);
    expect(result.unwrap()).toBe('not found');
  });

  it('unwraps native errors without throwing them', () => {
    const error = new Error('boom');

    expect(Result.error(error).unwrap()).toBe(error);
  });

  it('accepts any value as the error', () => {
    expect(Result.error(null).unwrap()).toBeNull();
    expect(Result.error({ code: 404 }).unwrap()).toEqual({ code: 404 });
  });

  it('wraps nothing when called without a value', () => {
    const result: Result.Error<void> = Result.error();

    expect(Result.isError(result)).toBe(true);
    expect(result.unwrap()).toBeUndefined();
  });
});

describe('Result.match(result, cases)', () => {
  it('calls `ok` with the value of an Ok', () => {
    const cases = { ok: mock((n: number) => n * 2), error: mock((message: string) => message) };

    expect(Result.match(Result.ok(21), cases)).toBe(42);
    expect(cases.ok).toHaveBeenCalledTimes(1);
    expect(cases.ok).toHaveBeenCalledWith(21);
    expect(cases.error).not.toHaveBeenCalled();
  });

  it('calls `error` with the value of an Error', () => {
    const cases = { ok: mock((n: number) => n * 2), error: mock((message: string) => message) };

    expect(Result.match<number, string, number, string>(Result.error('not a number'), cases)).toBe('not a number');
    expect(cases.error).toHaveBeenCalledTimes(1);
    expect(cases.error).toHaveBeenCalledWith('not a number');
    expect(cases.ok).not.toHaveBeenCalled();
  });

  it('throws for a value that is neither Ok nor Error', () => {
    const notAResult = { unwrap: () => 1 } as unknown as Result<number, string>;

    expect(() => Result.match(notAResult, { ok: () => 'ok', error: () => 'error' })).toThrow('Unreachable');
  });
});

describe('tagging', () => {
  it('recognizes values created by another copy of the package', () => {
    const foreign = { [Symbol.for('kind')]: Symbol.for('result:error'), unwrap: () => 'boom' } as unknown as Result<
      number,
      string
    >;

    expect(Result.isError(foreign)).toBe(true);
  });

  it('is not serialized', () => {
    expect(JSON.stringify(Result.ok(1))).toBe('{}');
  });
});

describe('types', () => {
  it('narrows with type guards and requires exhaustive cases', () => {
    // type-level only, never called
    const typecheck = (result: Result<number, string>) => {
      if (Result.isOk(result)) {
        const value: number = result.unwrap();
      } else {
        const error: string = result.unwrap();
      }

      // @ts-expect-error the result may be an error
      const value: number = result.unwrap();

      // @ts-expect-error missing the `error` case
      Result.match(result, { ok: (n) => n });

      // @ts-expect-error missing the `ok` case
      Result.match(result, { error: (message) => message });

      const matched: number | string = Result.match(result, { ok: (n) => n, error: (message) => message });

      // @ts-expect-error a value is required once the type is not `void`
      Result.ok<number>();

      // strings keep their literal type
      const done = Result.ok('done');
      const literalOk: Result.Ok<'done'> = done;

      // @ts-expect-error a different literal
      const otherOk: Result.Ok<'other'> = done;

      const notFound = Result.error('not found');
      const literal: Result.Error<'not found'> = notFound;

      // @ts-expect-error a different literal
      const other: Result.Error<'other'> = notFound;
    };

    expect(typecheck).toBeFunction();
  });
});
