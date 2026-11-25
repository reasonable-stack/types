export class RuntimeError<T extends Error | undefined = undefined> extends Error {
  constructor(message: string, opts: { cause?: T } = {}) {
    super(message, opts);
    this.name = this.constructor.name;
  }
};
