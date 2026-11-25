# @reasonable-stack/types

A reasonably good collection of utility types for TypeScript.

| type           | represents                                | variants            |
| :------------- | :---------------------------------------- | :------------------ |
| `Maybe<T>`     | a value that may or may not be there      | `Some<T>`, `None`   |
| `Result<T, E>` | the outcome of an operation that may fail | `Ok<T>`, `Error<E>` |

Each type is a plain TypeScript type plus a namespace of the same name holding
its constructors, type guards and a `match` helper. No classes, no
dependencies.

## Installation

```sh
npm install @reasonable-stack/types
```

## Quick start

```ts
import { Maybe, Result } from '@reasonable-stack/types';

const findUser = (id: number): Maybe<{ name: string }> =>
  id === 1 ? Maybe.some({ name: 'Ada' }) : Maybe.none();

Maybe.match(findUser(1), {
  some: (user) => `hello, ${user.name}`,
  none: () => 'who?',
}); // => 'hello, Ada'

const parse = (input: string): Result<number, string> => {
  const n = Number(input);
  return Number.isNaN(n) ? Result.error(`not a number: ${input}`) : Result.ok(n);
};

Result.match(parse('abc'), {
  ok: (n) => n * 2,
  error: (message) => message,
}); // => 'not a number: abc'
```

## Common behavior

Both types follow the same rules:

- **Construction.** Each variant has a lowercase constructor:
  `Maybe.some(value)`, `Maybe.none()`, `Result.ok(value)`,
  `Result.error(value)`.
- **Unwrapping.** Every variant has an `unwrap()` method returning the value
  it holds. It never throws: `None` unwraps to `null`, and `Error` unwraps to
  its error value.
- **Type guards.** `Maybe.isSome` / `Maybe.isNone` and `Result.isOk` /
  `Result.isError` narrow a value to one of its variants, so `unwrap()` is
  typed accordingly.
- **Matching.** `match(value, cases)` calls the case for the value's variant
  and returns its result. Cases must be exhaustive, so a forgotten variant is a
  compile-time error.
- **Tagged by symbol.** Variants are told apart by a `Symbol.for(...)` key, so
  values created by different copies of this package are still recognized.

```ts
const user = findUser(1);

if (Maybe.isSome(user)) {
  user.unwrap().name; // => 'Ada', typed as string
}

const result = parse('7');

if (Result.isOk(result)) {
  result.unwrap() + 1;           // => 8, typed as number
} else {
  result.unwrap().toUpperCase(); // typed as string
}
```

> **Note:** values are plain objects with a symbol key and a function, so
> `JSON.stringify` turns them into `{}`. Unwrap them before serializing.

## `Maybe`

A value that may be absent: either `Some<T>`, holding a value, or `None`.

```ts
Maybe.some(42);    // Some<number>
Maybe.none();      // None
Maybe.from(value); // None if value is null or undefined, Some otherwise
```

| function                       | returns           | description                                                |
| :----------------------------- | :---------------- | :--------------------------------------------------------- |
| `some(value)`                  | `Some<T>`         | wraps a value                                              |
| `none()`                       | `None`            | the absence of a value                                     |
| `from(value)`                  | `Some<T> \| None` | `None` for `null` or `undefined`, `Some` for anything else |
| `isSome(maybe)`                | `boolean`         | narrows to `Some<T>`                                       |
| `isNone(maybe)`                | `boolean`         | narrows to `None`                                          |
| `match(maybe, { some, none })` | `S \| U`          | `some(value)` for `Some`, `none()` for `None`              |

`from` only treats `null` and `undefined` as absent. Other falsy values, such
as `0`, `''` and `false`, are wrapped in `Some`:

```ts
const ages = new Map([['ada', 36]]);

Maybe.isNone(Maybe.from(ages.get('bob'))); // => true
Maybe.isSome(Maybe.from(0));               // => true
Maybe.none().unwrap();                     // => null
```

## `Result`

The outcome of an operation that may fail: either `Ok<T>`, holding a value, or
`Error<E>`, holding an error. The error can be anything, not only an instance
of the native `Error`.

```ts
Result.ok(42);                   // Ok<number>
Result.error('not found');       // Error<string>
Result.error(new Error('boom')); // Error<Error>
```

| function                       | returns    | description                                      |
| :----------------------------- | :--------- | :----------------------------------------------- |
| `ok(value)`                    | `Ok<T>`    | a successful outcome                             |
| `error(value)`                 | `Error<E>` | a failed outcome                                 |
| `isOk(result)`                 | `boolean`  | narrows to `Ok<T>`                               |
| `isError(result)`              | `boolean`  | narrows to `Error<E>`                            |
| `match(result, { ok, error })` | `S \| U`   | `ok(value)` for `Ok`, `error(value)` for `Error` |

```ts
Result.match(parse('42'), {
  ok: (n) => n * 2,
  error: (message) => message,
}); // => 84
```

> **Tip:** inside the `Result` namespace, `Error` is the failed variant, not
> the native `Error`. Refer to it as `Result.Error<E>` to avoid confusion.

## License

[MIT](./LICENSE)
