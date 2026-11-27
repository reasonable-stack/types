import { RuntimeError } from './errors';
import { raise } from './utils';

export type Result<T = void, E = void> = Result.Ok<T> | Result.Error<E>;

export namespace Result {
  const KIND = Symbol.for('kind');
  const OK = Symbol.for('result:ok');
  const ERROR = Symbol.for('result:error');

  export type Ok<T = void> = { [KIND]: typeof OK, unwrap: () => T };
  export type Error<T = void> = { [KIND]: typeof ERROR, unwrap: () => T };

  export const ok: { (): Ok<void>; <T extends string>(value: T): Ok<T>; <T>(value: T): Ok<T> } =
    <T>(value?: T): Ok<T> => ({ [KIND]: OK, unwrap: () => value as T });

  export const error: { (): Error<void>; <E extends string>(value: E): Error<E>; <E>(value: E): Error<E> } =
    <E>(value?: E): Error<E> => ({ [KIND]: ERROR, unwrap: () => value as E });

  export const isOk = <T>(result: Ok<T> | Error): result is Ok<T> => result[KIND] === OK;
  export const isError = <E>(result: Error<E> | Ok): result is Error<E> => result[KIND] === ERROR;

  export const match = <T, E, S, U>(result: Result<T, E>, cases: {
    ok: (value: T) => S;
    error: (value: E) => U;
  }) =>
      isOk(result) ? cases.ok(result.unwrap())
    : isError(result) ? cases.error(result.unwrap())
    : raise(new RuntimeError('Unreachable'));
}
