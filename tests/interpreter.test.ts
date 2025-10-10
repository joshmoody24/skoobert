import { describe, it, expect, vi } from "vitest";
import { parse } from "../src/parser/index.js";
import { interpret } from "../src/interpreter/index.js";
import { ValueType, type Value } from "../src/interpreter/values.js";

describe("interpreter - basic evaluation", () => {
  it("should evaluate and print a simple number", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(parse("console.log(42);"), { onOutput: mockOutput });
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });

  it("should evaluate and print a simple string", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(parse('console.log("hello");'), { onOutput: mockOutput });
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.String,
      value: "hello",
    });
  });

  it("should evaluate arithmetic expressions", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(parse("console.log(2 + 3 * 4);"), { onOutput: mockOutput });
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 14,
    });
  });

  it("should handle floating point division correctly", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(parse("console.log(10 / 3);"), { onOutput: mockOutput });
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 10 / 3,  // 3.333...
    });
  });

  it("should evaluate boolean expressions", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(parse("console.log(5 > 3 && 2 < 4);"), { onOutput: mockOutput });
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Boolean,
      value: true,
    });
  });

  it("should handle variable declarations and references", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      let x = 10;
      let y = x + 5;
      console.log(y);
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 15,
    });
  });
});

describe("interpreter - variable assignment rules", () => {
  it("should not allow variable reassignment", () => {
    const program = `
      let x = 5;
      x = 10;
      console.log(x);
    `;

    expect(() => parse(program)).toThrow();
  });

  it("should not allow reassignment even with different value types", () => {
    const program = `
      let x = 5;
      x = "hello";
      console.log(x);
    `;

    expect(() => parse(program)).toThrow();
  });

  it("should not allow redeclaration of the same variable with let", () => {
    const program = `
      let x = 5;
      let x = 10;
      console.log(x);
    `;

    // This should fail - can't redeclare x
    expect(() => interpret(parse(program), {})).toThrow();
  });

  it("should allow multiple lets with different variable names", () => {
    const mockOutput = vi.fn<[Value], void>();
    const program = `
      let x = 5;
      let y = 10;
      console.log(x + y);
    `;

    interpret(parse(program), { onOutput: mockOutput });

    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 15,
    });
  });

  it("should not allow redeclaration even in different positions", () => {
    const program = `
      let x = 5;
      let f = y => x + y;
      let x = 10;
      console.log(f(1));
    `;

    // This should fail - can't redeclare x even after using it in a function
    expect(() => interpret(parse(program), {})).toThrow();
  });
});

describe("interpreter - lazy evaluation", () => {
  it("should not evaluate unused variables", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      let x = 1 / 0;
      let y = 42;
      console.log(y);
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });

  it("should short-circuit logical OR", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      console.log(true || 1 / 0);
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Boolean,
      value: true,
    });
  });

  it("should short-circuit logical AND", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      console.log(false && 1 / 0);
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Boolean,
      value: false,
    });
  });

  it("should only evaluate used branch of ternary", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      console.log(true ? 42 : 1 / 0);
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });

  it("should handle lazy function arguments", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      let f = x => 42;
      console.log(f(1 / 0));
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });

  it("should handle chained function calls", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      let add = x => y => x + y;
      let addFive = add(5);
      console.log(addFive(3));
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 8,
    });
  });

  it("should handle IIFEs (Immediately Invoked Function Expressions)", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      console.log((x => x * 2)(21));
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });

  it("should handle complex nested IIFEs", () => {
    const mockOutput = vi.fn<[Value], void>();
    interpret(
      parse(`
      console.log(((x => y => x + y)(10))(32));
    `),
      { onOutput: mockOutput }
    );
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });
  });
});
