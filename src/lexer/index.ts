import {
  type Token,
  TokenType,
  type DiscriminatedToken,
} from "../types/tokens.js";
import { LexError } from "../utils/error-reporter.js";

interface LexerState {
  input: string;
  current: number;
  line: number;
  column: number;
  tokens: Token[];
}

function createLexer(input: string) {
  const state: LexerState = {
    input,
    current: 0,
    line: 1,
    column: 1,
    tokens: [],
  };

  const peek = (offset = 0): string | undefined => {
    return state.input[state.current + offset];
  };

  const advance = (): void => {
    if (state.input[state.current] === "\n") {
      state.line++;
      state.column = 1;
    } else {
      state.column++;
    }
    state.current++;
  };

  const advanceBy = (count: number): void => {
    for (let i = 0; i < count; i++) {
      advance();
    }
  };

  const pushToken = (token: DiscriminatedToken): void => {
    state.tokens.push({
      ...token,
      line: state.line,
      column: state.column,
    });
  };

  const match = (expected: string): boolean => {
    return (
      state.input.slice(state.current, state.current + expected.length) ===
      expected
    );
  };

  const isAtEnd = (): boolean => {
    return state.current >= state.input.length;
  };

  // Scanner functions
  const scanners = {
    whitespace: () => {
      const char = peek();
      if (char && /\s/.test(char)) {
        advance();
        return true;
      }
      return false;
    },

    multiCharOperator: () => {
      const char = peek();
      if (!char) return false;

      if (char === "=" && peek(1) === "=" && peek(2) === "=") {
        pushToken({ type: TokenType.StrictEqual });
        advanceBy(3);
        return true;
      }

      if (char === "!" && peek(1) === "=" && peek(2) === "=") {
        pushToken({ type: TokenType.StrictNotEqual });
        advanceBy(3);
        return true;
      }

      const twoCharOperators: Record<string, TokenType> = {
        "&&": TokenType.And,
        "||": TokenType.Or,
        "<=": TokenType.LessThanOrEqual,
        ">=": TokenType.GreaterThanOrEqual,
        "=>": TokenType.Arrow,
      };

      const twoChar = char + (peek(1) || "");
      if (twoCharOperators[twoChar]) {
        pushToken({ type: twoCharOperators[twoChar] } as Token);
        advanceBy(2);
        return true;
      }

      return false;
    },

    singleCharOperator: () => {
      const char = peek();
      if (!char) return false;

      const singleCharTokens: Record<string, TokenType> = {
        "=": TokenType.Assignment,
        "(": TokenType.LeftParen,
        ")": TokenType.RightParen,
        "!": TokenType.Not,
        "-": TokenType.Minus,
        "+": TokenType.Plus,
        "*": TokenType.Asterisk,
        "/": TokenType.Slash,
        "%": TokenType.Percent,
        "?": TokenType.Question,
        ":": TokenType.Colon,
        ";": TokenType.Semicolon,
        "<": TokenType.LessThan,
        ">": TokenType.GreaterThan,
      };

      if (singleCharTokens[char]) {
        pushToken({ type: singleCharTokens[char] } as Token);
        advance();
        return true;
      }

      return false;
    },

    keyword: () => {
      // Check for specific keywords
      if (match("console.log")) {
        pushToken({ type: TokenType.ConsoleLog });
        advanceBy(11);
        return true;
      }

      if (match("inspect.expanded")) {
        pushToken({ type: TokenType.InspectExpanded });
        advanceBy(16);
        return true;
      }

      return false;
    },

    number: () => {
      const char = peek();
      if (!char || !/[0-9]/.test(char)) return false;

      let value = "";

      // Collect integer part
      while (peek() && /[0-9]/.test(peek()!)) {
        value += peek();
        advance();
      }

      // Check for decimal point
      if (peek() === "." && peek(1) && /[0-9]/.test(peek(1)!)) {
        value += ".";
        advance();

        // Collect fractional part
        while (peek() && /[0-9]/.test(peek()!)) {
          value += peek();
          advance();
        }
      }

      pushToken({ type: TokenType.Number, value: Number(value) });
      return true;
    },

    identifier: () => {
      const char = peek();
      if (!char || !/[a-zA-Z_]/.test(char)) return false;

      let value = "";
      while (peek() && /[a-zA-Z0-9_]/.test(peek()!)) {
        value += peek();
        advance();
      }

      // Check for keywords and literals
      if (value === "let") {
        pushToken({ type: TokenType.Let });
      } else if (value === "true") {
        pushToken({ type: TokenType.True });
      } else if (value === "false") {
        pushToken({ type: TokenType.False });
      } else {
        pushToken({ type: TokenType.Identifier, value });
      }

      return true;
    },

    string: () => {
      if (peek() !== '"') return false;

      const startLine = state.line;
      const startColumn = state.column;
      let value = "";

      advance(); // skip opening quote

      while (peek() && peek() !== '"') {
        if (peek() === "\n") {
          throw new LexError(
            "Unterminated string literal",
            { line: startLine, column: startColumn },
            input
          );
        }

        if (peek() === "\\") {
          advance(); // skip backslash
          const escapedChar = peek();

          switch (escapedChar) {
            case "n":
              value += "\n";
              break;
            case '"':
            case "\\":
              value += escapedChar;
              break;
            default:
              if (escapedChar) value += escapedChar;
          }

          if (escapedChar) advance();
        } else {
          value += peek();
          advance();
        }
      }

      if (peek() !== '"') {
        throw new LexError(
          "Unterminated string literal",
          { line: startLine, column: startColumn },
          input
        );
      }

      advance(); // skip closing quote
      pushToken({ type: TokenType.String, value });
      return true;
    },

    comment: () => {
      if (peek() !== "/" || peek(1) !== "/") return false;

      // Skip the //
      advance();
      advance();

      // Skip until end of line
      while (peek() && peek() !== "\n") {
        advance();
      }

      return true;
    },
  };

  const tokenize = (): Token[] => {
    while (!isAtEnd()) {
      // Skip whitespace and comments
      if (scanners.whitespace()) continue;
      if (scanners.comment()) continue;

      // Save position for error reporting
      const errorLine = state.line;
      const errorColumn = state.column;

      // Try to match tokens in order of precedence
      if (scanners.multiCharOperator()) continue;
      if (scanners.keyword()) continue;
      if (scanners.string()) continue;
      if (scanners.number()) continue;
      if (scanners.identifier()) continue;
      if (scanners.singleCharOperator()) continue;

      // If nothing matched, we have an unexpected character
      const char = peek();
      throw new LexError(
        `Unexpected character '${char}'`,
        { line: errorLine, column: errorColumn },
        input
      );
    }

    pushToken({ type: TokenType.Eof });
    return state.tokens;
  };

  return {
    tokenize,
    // Expose state for debugging if needed
    getState: () => ({ ...state }),
  };
}

export function lex(input: string): Token[] {
  const lexer = createLexer(input);
  return lexer.tokenize();
}
