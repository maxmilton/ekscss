import { expect } from 'bun:test';

/**
 * Get the total number of parameters of a function including optional
 * parameters with default values.
 *
 * @remarks Native functions will only return the number of required parameters;
 * optional parameters cannot be determined.
 *
 * @returns The number of parameters, including optional parameters.
 */
export function parameters(func: unknown): number {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  const str = func.toString();
  const len = str.length;
  const start = str.indexOf('(');
  let index = start;
  let count = 1;
  let nested = 0;
  let char: string;

  // FIXME: Handle nested string template literals.
  const string = (quote: '"' | "'" | '`') => {
    while (index++ < len) {
      char = str[index];

      if (char === quote) {
        break;
      }
      // skip escaped characters
      if (char === '\\') {
        index++;
      }
    }
  };

  while (index++ < len) {
    char = str[index];

    if (!nested) {
      if (char === ')') {
        break;
      }
      if (char === ',') {
        count++;
        continue; // eslint-disable-line no-continue
      }
    }

    switch (char) {
      case '"':
      case "'":
      case '`':
        string(char);
        break;
      case '(':
      case '[':
      case '{':
        nested++;
        break;
      case ')':
      case ']':
      case '}':
        nested--;
        break;
      default:
        break;
    }
  }

  if (index >= len || nested !== 0) {
    throw new Error('Invalid function signature');
  }

  // handle no parameters
  if (str.slice(start + 1, index).trim().length === 0) {
    // eslint-disable-next-line @typescript-eslint/prefer-includes, unicorn/prefer-includes
    if (str.indexOf('[native code]', index) >= 0) {
      count = func.length;
      // eslint-disable-next-line no-console
      console.warn('Optional parameters cannot be determined for native functions');
    } else {
      count = 0;
    }
  }

  return count;
}

declare module 'bun:test' {
  interface Matchers {
    /** Asserts that a value is a plain `object`. */
    toBePlainObject(): void;
    /** Asserts that a value is a `class`. */
    toBeClass(): void;
    /** Asserts that a function has a specific number of parameters. */
    toHaveParameters(required: number, optional: number): void;
  }
}

expect.extend({
  // XXX: Bun's `toBeObject` matcher is the equivalent of `typeof x === 'object'`.
  toBePlainObject(received: unknown) {
    return Object.prototype.toString.call(received) === '[object Object]'
      ? { pass: true }
      : {
          pass: false,
          message: () => `expected ${String(received)} to be a plain object`,
        };
  },

  toBeClass(received: unknown) {
    return typeof received === 'function' &&
      /^class\s/.test(Function.prototype.toString.call(received))
      ? { pass: true }
      : {
          pass: false,
          message: () => `expected ${String(received)} to be a class`,
        };
  },

  toHaveParameters(received: unknown, required: number, optional: number) {
    if (typeof received !== 'function') {
      return {
        pass: false,
        message: () => `expected ${String(received)} to be a function`,
      };
    }

    const actualRequired = received.length;
    const actualOptional = parameters(received) - actualRequired;

    return actualRequired === required && actualOptional === optional
      ? { pass: true }
      : {
          pass: false,
          message: () =>
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `expected ${received.name} to have ${required}/${optional} required/optional parameters, but it has ${actualRequired}/${actualOptional}`,
        };
  },
});
