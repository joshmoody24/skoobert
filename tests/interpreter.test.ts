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
});
