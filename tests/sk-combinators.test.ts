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

// Complex recursive function using Y combinator
let ADD_TWO_X = B(S(C(IS_ZERO)(TWO)))(B(B(SUCC))(C(B)(PRED)));
let ADD_TWO = Y(ADD_TWO_X);

console.log("test completed");
`;

    interpret(parse(program), { onOutput: mockOutput });

    // Should have produced outputs without infinite loops
    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.Number,
      value: 42,
    });

    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.String,
      value: "ok",
    });

    expect(mockOutput).toHaveBeenCalledWith({
      type: ValueType.String,
      value: "test completed",
    });

    // Should have called output exactly 3 times
    expect(mockOutput).toHaveBeenCalledTimes(3);
  });
});
