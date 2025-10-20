import { describe, it, expect } from "vitest";
import { TokenType } from "../src/types/tokens.js";
import { lex } from "../src/lexer/index.js";

describe("lexer - positive tests", () => {
  it("should lex simple variable declaration", () => {
    const tokens = lex("let x = 42;");
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.Let,
      TokenType.Identifier,
      TokenType.Assignment,
      TokenType.Number,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex console.log with string", () => {
    const tokens = lex('console.log("hello world");');
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.ConsoleLog,
      TokenType.LeftParen,
      TokenType.String,
      TokenType.RightParen,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex inspect.expanded", () => {
    const tokens = lex('inspect.expanded(x);');
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.InspectExpanded,
      TokenType.LeftParen,
      TokenType.Identifier,
      TokenType.RightParen,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex arrow function", () => {
    const tokens = lex("let fn = x => x + 1;");
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.Let,
      TokenType.Identifier,
      TokenType.Assignment,
      TokenType.Identifier,
      TokenType.Arrow,
      TokenType.Identifier,
      TokenType.Plus,
      TokenType.Number,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex logical and relational operators", () => {
    const tokens = lex("a > b && c <= d || e === f;");
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.Identifier,
      TokenType.GreaterThan,
      TokenType.Identifier,
      TokenType.And,
      TokenType.Identifier,
      TokenType.LessThanOrEqual,
      TokenType.Identifier,
      TokenType.Or,
      TokenType.Identifier,
      TokenType.StrictEqual,
      TokenType.Identifier,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex ternary operator expression", () => {
    const tokens = lex("let result = true ? 10 : 20;");
    const tokenTypes = tokens.map((token) => token.type);
    expect(tokenTypes).toEqual([
      TokenType.Let,
      TokenType.Identifier,
      TokenType.Assignment,
      TokenType.True,
      TokenType.Question,
      TokenType.Number,
      TokenType.Colon,
      TokenType.Number,
      TokenType.Semicolon,
      TokenType.Eof,
    ]);
  });

  it("should lex floating point number", () => {
    const tokens = lex("3.14");
    expect(tokens[0]?.type).toBe(TokenType.Number);
    const numberToken = tokens[0] as { type: string; value: number };
    expect(numberToken.value).toBe(3.14);
  });
});

describe("lexer - negative tests", () => {
  it("should handle empty input", () => {
    const tokens = lex("");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.Eof);
  });

  it("should handle whitespace-only input", () => {
    const tokens = lex("   \n\t  ");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.Eof);
  });

  it("should not confuse let with letter", () => {
    const tokens = lex("letter");
    expect(tokens[0]?.type).toBe(TokenType.Identifier);
    const identifierToken = tokens[0] as { type: string; value: string };
    expect(identifierToken.value).toBe("letter");
  });

  it("should not confuse console with console.log", () => {
    const tokens = lex("console");
    expect(tokens[0]?.type).toBe(TokenType.Identifier);
    const identifierToken = tokens[0] as { type: string; value: string };
    expect(identifierToken.value).toBe("console");
  });

  it("should throw error on unterminated string", () => {
    expect(() => lex('"hello')).toThrow("Unterminated string");
  });
});
