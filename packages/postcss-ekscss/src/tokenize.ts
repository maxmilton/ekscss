// Based on https://github.com/postcss/postcss-scss/blob/1c1c2621eff21b0c3d11a70d71beff3f10bd6cfd/lib/scss-tokenize.js

// TODO: Tokenize xcss tagged template literals within XCSS expressions

import type { Input } from 'postcss';

const SINGLE_QUOTE = 39; // '
const DOUBLE_QUOTE = 34; // "
const BACKSLASH = 92; // \
const SLASH = 47; // /
const NEWLINE = 10; // \n
const SPACE = 32; // " " (space)
const FEED = 12; // \f
const TAB = 9; // \t
const CR = 13; // \r
const OPEN_SQUARE = 91; // [
const CLOSE_SQUARE = 93; // ]
const OPEN_PARENTHESES = 40; // (
const CLOSE_PARENTHESES = 41; // )
const OPEN_CURLY = 123; // {
const CLOSE_CURLY = 125; // }
const SEMICOLON = 59; // ;
const ASTERISK = 42; // *
const COLON = 58; // :
const AT = 64; // @
const COMMA = 44; // ,
const DOLLAR_SIGN = 36; // $

const RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
const RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
const RE_BAD_BRACKET = /.[\n"'(/\\]/;
const RE_HEX_ESCAPE = /[\da-f]/i;
const RE_NEW_LINE = /[\n\f\r]/g;

interface TokenizeOptions {
  ignoreErrors?: boolean;
}

export type Token = readonly [
  type: string,
  content: string,
  pos?: number,
  next?: number,
  scope?: string,
];

export interface Tokenizer {
  back: (token: Token) => void;
  nextToken: (opts?: { ignoreUnclosed?: boolean }) => Token | void;
  endOfFile: () => boolean;
  position: () => number;
}

export function tokenize(
  input: Input & { error: (message: string, pos?: number) => void },
  options: TokenizeOptions = {},
): Tokenizer {
  const css = input.css.valueOf();
  const ignore = options.ignoreErrors;
  const len = css.length;
  const buffer: Token[] = [];
  const returned: Token[] = [];
  let pos = 0;
  let code;
  let next: number;
  let quote;
  let content;
  let escape;
  let escaped;
  let prev;
  let n;
  let currentToken: Token;
  let brackets;

  function position() {
    return pos;
  }

  function unclosed(what: string): never {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw input.error(`Unclosed ${what}`, pos);
  }

  function endOfFile() {
    return returned.length === 0 && pos >= len;
  }

  function interpolation() {
    let depth = 1;
    let stringQuote: boolean | number = false;
    let stringEscaped = false;

    while (depth > 0) {
      next += 1;
      if (css.length <= next) unclosed('interpolation');

      code = css.charCodeAt(next);
      n = css.charCodeAt(next + 1);

      if (stringQuote) {
        if (!stringEscaped && code === stringQuote) {
          stringQuote = false;
          stringEscaped = false;
        } else if (code === BACKSLASH) {
          stringEscaped = !stringEscaped;
        } else if (stringEscaped) {
          stringEscaped = false;
        }
      } else if (code === SINGLE_QUOTE || code === DOUBLE_QUOTE) {
        stringQuote = code;
      } else if (code === CLOSE_CURLY) {
        depth -= 1;
      } else if (n === OPEN_CURLY) {
        depth += 1;
      }
    }
  }

  function nextToken(opts?: { ignoreUnclosed?: boolean }): Token | void {
    if (returned.length > 0) return returned.pop();
    // eslint-disable-next-line consistent-return
    if (pos >= len) return;

    const ignoreUnclosed = opts ? opts.ignoreUnclosed : false;

    code = css.charCodeAt(pos);

    switch (code) {
      case NEWLINE:
      case SPACE:
      case TAB:
      case CR:
      case FEED:
        next = pos;
        do {
          next += 1;
          code = css.charCodeAt(next);
        } while (
          code === SPACE
          || code === NEWLINE
          || code === TAB
          || code === CR
          || code === FEED
        );

        currentToken = ['space', css.slice(pos, next)];
        pos = next - 1;
        break;

      case OPEN_SQUARE:
      case CLOSE_SQUARE:
      case OPEN_CURLY:
      case CLOSE_CURLY:
      case COLON:
      case SEMICOLON:
      case CLOSE_PARENTHESES: {
        const controlChar = String.fromCharCode(code);
        currentToken = [controlChar, controlChar, pos];
        break;
      }

      case COMMA:
        currentToken = ['word', ',', pos, pos + 1];
        break;

      case OPEN_PARENTHESES:
        prev = buffer.length > 0 ? buffer.pop()![1] : '';
        n = css.charCodeAt(pos + 1);

        if (prev === 'url' && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE) {
          brackets = 1;
          escaped = false;
          next = pos + 1;
          while (next <= css.length - 1) {
            n = css.charCodeAt(next);
            // eslint-disable-next-line unicorn/prefer-switch
            if (n === BACKSLASH) {
              escaped = !escaped;
            } else if (n === OPEN_PARENTHESES) {
              brackets += 1;
            } else if (n === CLOSE_PARENTHESES) {
              brackets -= 1;
              if (brackets === 0) break;
            }
            next += 1;
          }

          content = css.slice(pos, next + 1);
          currentToken = ['brackets', content, pos, next];
          pos = next;
        } else {
          next = css.indexOf(')', pos + 1);
          content = css.slice(pos, next + 1);

          if (next === -1 || RE_BAD_BRACKET.test(content)) {
            currentToken = ['(', '(', pos];
          } else {
            currentToken = ['brackets', content, pos, next];
            pos = next;
          }
        }
        break;

      case SINGLE_QUOTE:
      case DOUBLE_QUOTE:
        quote = code;
        next = pos;

        escaped = false;
        while (next < len) {
          next++;
          if (next === len) unclosed('string');

          code = css.charCodeAt(next);
          n = css.charCodeAt(next + 1);

          if (!escaped && code === quote) {
            break;
          } else if (code === BACKSLASH) {
            escaped = !escaped;
          } else if (escaped) {
            escaped = false;
          } else if (code === DOLLAR_SIGN && n === OPEN_CURLY) {
            interpolation();
          }
        }

        currentToken = ['string', css.slice(pos, next + 1), pos, next];
        pos = next;
        break;

      case AT:
        RE_AT_END.lastIndex = pos + 1;
        RE_AT_END.test(css);
        next = RE_AT_END.lastIndex === 0 ? css.length - 1 : RE_AT_END.lastIndex - 2;

        currentToken = ['at-word', css.slice(pos, next + 1), pos, next];

        pos = next;
        break;

      case BACKSLASH:
        next = pos;
        escape = true;
        while (css.charCodeAt(next + 1) === BACKSLASH) {
          next += 1;
          escape = !escape;
        }
        code = css.charCodeAt(next + 1);
        if (
          escape
          && code !== SLASH
          && code !== SPACE
          && code !== NEWLINE
          && code !== TAB
          && code !== CR
          && code !== FEED
        ) {
          next += 1;
          if (RE_HEX_ESCAPE.test(css.charAt(next))) {
            while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
              next += 1;
            }
            if (css.charCodeAt(next + 1) === SPACE) {
              next += 1;
            }
          }
        }

        currentToken = ['word', css.slice(pos, next + 1), pos, next];

        pos = next;
        break;

      default:
        n = css.charCodeAt(pos + 1);

        if (code === DOLLAR_SIGN && n === OPEN_CURLY) {
          next = pos;
          interpolation();
          content = css.slice(pos, next + 1);
          currentToken = ['root', content, pos, next];
          pos = next;
        } else if (code === SLASH && n === ASTERISK) {
          next = css.indexOf('*/', pos + 2) + 1;
          if (next === 0) {
            if (ignore || ignoreUnclosed) {
              next = css.length;
            } else {
              unclosed('comment');
            }
          }

          currentToken = ['comment', css.slice(pos, next + 1), pos, next];
          pos = next;
        } else if (code === SLASH && n === SLASH) {
          RE_NEW_LINE.lastIndex = pos + 1;
          RE_NEW_LINE.test(css);
          next = RE_NEW_LINE.lastIndex === 0
            ? css.length - 1
            : RE_NEW_LINE.lastIndex - 2;

          content = css.slice(pos, next + 1);
          currentToken = ['comment', content, pos, next, 'inline'];

          pos = next;
        } else {
          RE_WORD_END.lastIndex = pos + 1;
          RE_WORD_END.test(css);
          next = RE_WORD_END.lastIndex === 0
            ? css.length - 1
            : RE_WORD_END.lastIndex - 2;

          currentToken = ['word', css.slice(pos, next + 1), pos, next];
          buffer.push(currentToken);
          pos = next;
        }
        break;
    }

    pos++;
    return currentToken;
  }

  function back(token: Token) {
    returned.push(token);
  }

  return {
    back,
    nextToken,
    endOfFile,
    position,
  };
}
