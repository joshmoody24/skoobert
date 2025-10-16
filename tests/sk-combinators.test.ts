import { describe, it, expect, vi } from "vitest";
import { parse } from "../src/parser/index.js";
import { interpret } from "../src/interpreter/index.js";
import { ValueType, type Value } from "../src/interpreter/values.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("SK Combinators - Complete Test Suite", () => {
  it(
    "should handle the full SK combinator calculus program with all outputs",
    { timeout: 30000 },
    () => {
      const mockOutput = vi.fn<[Value], void>();

      // Read the actual sk-combinators.sk file content
      const program = readFileSync(
        resolve("docs/examples/sk-combinators.sk"),
        "utf-8"
      );

      try {
        interpret(parse(program), { onOutput: mockOutput });
      } catch (error) {
        if (error instanceof Error && error.name === "ParseError") {
          console.error(error.toString());
        }
        throw error;
      }

      // Check all the console.log outputs
      const calls = mockOutput.mock.calls;
      let i = 0;

      // Basic combinators
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Basic combinators:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Identify combinator: 42 = 42",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Kestral combinator: K(10)(20) = 10",
      });

      // Boolean logic
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nBoolean logic:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "NOT true = false",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "NOT false = true",
      });

      // Lazy evaluation
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nLazy evaluation test:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "42 (this would throw an error in normal JavaScript)",
      });

      // Barendregt numerals
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nBarendregt/Scott numerals:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "One: 0",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Three: 3",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Five: 5",
      });

      // Addition
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nAddition:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "2 + 3 = 5",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "4 + 5 = 9",
      });

      // Subtraction
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nSubtraction:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "5 - 2 = 3",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "1 - 3 = 0 (no negatives in this number system)",
      });

      // Multiplication
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nMultiplication:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "5 * 5 = 25",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "3 * 4 = 12",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "2 * 0 = 0",
      });

      // Less than or equal
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nLess than or equal:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "3 <= 2 = false",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "4 <= 5 = true",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "0 <= 0 = true",
      });

      // Greater than
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nGreater than:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "3 > 2 = true",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "4 > 5 = false",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "0 > 0 = false",
      });

      // Modulus
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nModulus:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "5 % 2 = 1",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "5 % 3 = 2",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "4 % 2 = 0",
      });

      // Division
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nDivision:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "4 / 2 = 2",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "5 / 3 = 1",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "3 / 0 = 0",
      });

      // Decimal numbers
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nDecimal numbers:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Twenty-six: 26",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Two hundred fifty-six: 256",
      });

      // Lists
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nLists:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "[1, 2, 3]: [1, 2, 3]",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "[7, 8, 9] reversed: [9, 8, 7]",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Second element in [1, 2]: 2",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "1..10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Sum 1..4 = 10",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Increment 1..3 = [2, 3, 4]",
      });

      // Strings
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nStrings:",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: 'The string "fizz": fizz',
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: 'The string "buzz": buzz',
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: 'The string "fizz" + "buzz": fizzbuzz',
      });

      // Number to string conversion
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "Seventy-eight as a string: 78",
      });

      // FizzBuzz header
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\n=== THE GRAND FINALE ===",
      });
      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: "\nFizzBuzz:",
      });

      // FizzBuzz output - all 100 lines concatenated
      const expectedFizzBuzz = [
        "1",
        "2",
        "fizz",
        "4",
        "buzz",
        "fizz",
        "7",
        "8",
        "fizz",
        "buzz",
        "11",
        "fizz",
        "13",
        "14",
        "fizzbuzz",
        "16",
        "17",
        "fizz",
        "19",
        "buzz",
        "fizz",
        "22",
        "23",
        "fizz",
        "buzz",
        "26",
        "fizz",
        "28",
        "29",
        "fizzbuzz",
        "31",
        "32",
        "fizz",
        "34",
        "buzz",
        "fizz",
        "37",
        "38",
        "fizz",
        "buzz",
        "41",
        "fizz",
        "43",
        "44",
        "fizzbuzz",
        "46",
        "47",
        "fizz",
        "49",
        "buzz",
        "fizz",
        "52",
        "53",
        "fizz",
        "buzz",
        "56",
        "fizz",
        "58",
        "59",
        "fizzbuzz",
        "61",
        "62",
        "fizz",
        "64",
        "buzz",
        "fizz",
        "67",
        "68",
        "fizz",
        "buzz",
        "71",
        "fizz",
        "73",
        "74",
        "fizzbuzz",
        "76",
        "77",
        "fizz",
        "79",
        "buzz",
        "fizz",
        "82",
        "83",
        "fizz",
        "buzz",
        "86",
        "fizz",
        "88",
        "89",
        "fizzbuzz",
        "91",
        "92",
        "fizz",
        "94",
        "buzz",
        "fizz",
        "97",
        "98",
        "fizz",
        "buzz",
      ].join("\n");

      expect(calls[i++][0]).toEqual({
        type: ValueType.String,
        value: expectedFizzBuzz,
      });

      // Verify total number of calls
      expect(mockOutput).toHaveBeenCalledTimes(i);
    }
  );
});
