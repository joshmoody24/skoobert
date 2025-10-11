import { describe, it, expect, vi } from "vitest";
import { parse } from "../src/parser/index.js";
import { interpret } from "../src/interpreter/index.js";
import { ValueType, type Value } from "../src/interpreter/values.js";

describe("SK Combinators - Ultimate Battle Test", () => {
  it("should handle complex SK combinator calculus with lazy evaluation", () => {
    const mockOutput = vi.fn<[Value], void>();

    const program = `
// SK Combinator Calculus Ultimate Test
// Primitives
let S = x => y => z => x(z)(y(z));
let K = x => y => x;

// Derived
let I = S(K)(K);
let M = S(I)(I);

// This contains self-application (M(M)) as the *second* arg
// Should work with lazy evaluation - eager would diverge
console.log(K(42)(M(M)));
console.log(K("ok")(M(M)));

let B = S(K(S))(K);
let C = S(B(B)(S))(K(K));
let T = C(I);
let R = B(B)(T);
let F = B(C)(R);
let V = C(F);
let L = C(B)(M);
let W = S(T);
let C_STAR = B(C);
let C_STAR_STAR = B(C_STAR);
let R_STAR = C_STAR(C_STAR);
let Y = W(C)(S(B)(C(W(C))));

// Boolean logic
let TRUE = K;
let FALSE = K(I);

// Barendregt numerals
let ZERO = I;
let IS_ZERO = T(TRUE);
let SUCC = V(FALSE);
let PRED = T(FALSE);

let ONE = SUCC(ZERO);
let TWO = SUCC(ONE);
let THREE = SUCC(TWO);
let FOUR = SUCC(THREE);
let FIVE = SUCC(FOUR);

let toNumber = n => IS_ZERO(n)(0)(1 + toNumber(PRED(n)));

// Test toNumber with simple cases first
console.log(toNumber(ZERO)); // Should be 0
console.log(toNumber(FIVE)); // Should be 5

// Complex recursive function using Y combinator
// Derivation:
// Z = IS_ZERO
// 1 = TWO // memes
// P = PRED
// N = SUCC
// A = ADD_ONE
// An = Zn1(N(A(Pn)))
// An = CZ1n(N(A(Pn)))
// An = CZ1n(N(BAPn))
// An = CZ1n(BN(BAP)n)
// An = S(CZ1)(BN(BAP))n
// Xyn = S(CZ1)(BN(ByP))n
// Xyn = S(CZ1)(BN(CBPy))n
// Xyn = S(CZ1)(B(BN)(CBP)y)n
// Xyn = B(S(CZ1))(B(BN)(CBP))yn
// Fixed point shenanigans after that
let ADD_TWO_X = B(S(C(IS_ZERO)(TWO)))(B(B(SUCC))(C(B)(PRED)));
let ADD_TWO = Y(ADD_TWO_X);

console.log(toNumber(ADD_TWO(FIVE)));

let ADD = Y(B(S(B(S)(C_STAR_STAR(B)(C)(B(B(B))(IS_ZERO))(SUCC))))(C(S(K(I))(B))(PRED)));

console.log(toNumber(ADD(FIVE)(FOUR)));

console.log("test completed");
`;

    try {
      interpret(parse(program), { onOutput: mockOutput });
    } catch (error) {
      if (error instanceof Error && error.name === "ParseError") {
        console.error(error.toString());
      }
      throw error;
    }

    // Should have called output exactly 6 times
    expect(mockOutput).toHaveBeenCalledTimes(7);

    // Check each call individually for better debugging
    const calls = mockOutput.mock.calls;

    expect(calls[0][0]).toEqual({ type: ValueType.Number, value: 42 });
    expect(calls[1][0]).toEqual({ type: ValueType.String, value: "ok" });
    expect(calls[2][0]).toEqual({ type: ValueType.Number, value: 0 });
    expect(calls[3][0]).toEqual({ type: ValueType.Number, value: 5 });
    expect(calls[4][0]).toEqual({ type: ValueType.Number, value: 7 });
    expect(calls[5][0]).toEqual({ type: ValueType.Number, value: 9 });
    expect(calls[6][0]).toEqual({
      type: ValueType.String,
      value: "test completed",
    });
  });
});
