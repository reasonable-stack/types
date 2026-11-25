import { RuntimeError } from './errors';
import { raise } from './utils';

export type Maybe<T = unknown> = Maybe.Some<T> | Maybe.None;

export namespace Maybe {
  const KIND = Symbol.for('kind');
  const SOME = Symbol.for('maybe:some');
  const NONE = Symbol.for('maybe:none');

  export type Some<T = unknown> = { [KIND]: typeof SOME, unwrap: () => T };
  export type None = { [KIND]: typeof NONE, unwrap: () => null };

  export const some = <T>(value: T): Some<T> => ({ [KIND]: SOME, unwrap: () => value });
  export const none = (): None => ({ [KIND]: NONE, unwrap: () => null });

  export const isSome = <T>(maybe: Some<T> | None): maybe is Some<T> => maybe[KIND] === SOME;
  export const isNone = (maybe: None | Some): maybe is None => maybe[KIND] === NONE;

  export const match = <T, S, U>(m: Maybe<T>, cases: {
    some: (value: T) => S;
    none: () => U;
  }) =>
      isSome(m) ? cases.some(m.unwrap())
    : isNone(m) ? cases.none()
    : raise(new RuntimeError('Unreachable'));
}
