import { describe, expect, it } from "vitest";
import { parse } from "../src/parser/index.js";

describe("parser - positive tests", () => {
  it("should parse a simple variable declaration", () => {
    const result = parse("let x = 42;");
    expect(result).toEqual({
      type: "program",
      statements: [
        {
          type: "statement",
          body: {
            type: "variable-declaration",
            identifier: { type: "identifier", name: "x" },
            expression: {
              type: "expression",
              body: {
                type: "literal",
                body: { type: "number", value: 42 },
              },
            },
          },
        },
      ],
    });
  });

  it("should parse logical OR expression", () => {
    const result = parse("let result = true || false;");
    expect(result.statements[0]?.body).toMatchObject({
      type: "variable-declaration",
      expression: {
        type: "expression",
        body: {
          type: "logical-or",
          left: {
            type: "literal",
            body: { type: "boolean", value: true },
          },
          right: {
            type: "literal",
            body: { type: "boolean", value: false },
          },
        },
      },
    });
  });

  it("should parse arithmetic expressions with correct precedence", () => {
    const result = parse("let calc = 2 + 3 * 4;");
    expect(result.statements[0]?.body).toMatchObject({
      type: "variable-declaration",
      expression: {
        type: "expression",
        body: {
          type: "additive",
          operator: "+",
          left: {
            type: "literal",
            body: { type: "number", value: 2 },
          },
          right: {
            type: "multiplicative",
            operator: "*",
            left: {
              type: "literal",
              body: { type: "number", value: 3 },
            },
            right: {
              type: "literal",
              body: { type: "number", value: 4 },
            },
          },
        },
      },
    });
  });

  it("should parse arrow function declaration", () => {
    const result = parse("let fn = x => x + 1;");
    expect(result.statements[0]?.body).toMatchObject({
      type: "variable-declaration",
      expression: {
        type: "expression",
        body: {
          type: "arrow-function",
          parameter: { type: "identifier", name: "x" },
          body: {
            type: "expression",
            body: {
              type: "additive",
              operator: "+",
              left: { type: "identifier", name: "x" },
              right: {
                type: "literal",
                body: { type: "number", value: 1 },
              },
            },
          },
        },
      },
    });
  });

  it("should parse console.log statement with complex expression", () => {
    const result = parse("console.log(5 > 3 && 2 < 4);");
    expect(result.statements[0]?.body).toMatchObject({
      type: "side-effect",
      body: {
        type: "console-log",
        argument: {
          type: "expression",
          body: {
            type: "logical-and",
            left: {
              type: "relational",
              operator: ">",
              left: {
                type: "literal",
                body: { type: "number", value: 5 },
              },
              right: {
                type: "literal",
                body: { type: "number", value: 3 },
              },
            },
            right: {
              type: "relational",
              operator: "<",
              left: {
                type: "literal",
                body: { type: "number", value: 2 },
              },
              right: {
                type: "literal",
                body: { type: "number", value: 4 },
              },
            },
          },
        },
      },
    });
  });
});

describe("parser - negative tests", () => {
  it("should throw error for missing semicolon after variable declaration", () => {
    expect(() => parse("let x = 42")).toThrow("Expected ';'");
  });

  it("should throw error for missing assignment in variable declaration", () => {
    expect(() => parse("let x;")).toThrow("Expected '='");
  });

  it("should throw error for missing closing parenthesis in console.log", () => {
    expect(() => parse("console.log(42;")).toThrow("Expected ')'");
  });

  it("should throw error for invalid token at start of statement", () => {
    expect(() => parse("42;")).toThrow("Expected 'console.log'");
  });

  it("should throw error for missing expression after arrow", () => {
    expect(() => parse("let f = x => ;")).toThrow("Unexpected token: ;");
  });
});
