import { describe, it, expect, vi } from "vitest";
import { parse } from "../src/parser/index.js";
import { interpret } from "../src/interpreter/index.js";
import { ValueType, type Value } from "../src/interpreter/values.js";

describe("SK Combinators - Ultimate Battle Test", () => {
  it("should handle complex SK combinator calculus with lazy evaluation", () => {
    const mockOutput = vi.fn<[Value], void>();

    // Read the actual sk-combinators.sk file content
    const program = `
// SK Combinator Calculus in Skoobert
// This demonstrates lazy evaluation - expressions like M(M) would diverge in eager evaluation

// Primitive combinators
let S = x => y => z => x(z)(y(z));
let K = x => y => x;

// Derived combinators
let I = S(K)(K);

console.log("Testing basic combinators:");
console.log("Identify combinator: 42 = " + I(42));            // Identity: returns 42
console.log("Kestral combinator: K(10)(20) = " + K(10)(20));  // Constant: returns 10

// More derived combinators (with their lambda forms)
let B = S(K(S))(K);          // Bluebird:    x => y => z => x(y(z)) - composition
let C = S(B(B)(S))(K(K));    // Cardinal:    x => y => z => x(z)(y) - flip last two arguments
let W = S(S)(K(I));          // Warbler:     x => y => x(y)(y)       - duplicate argument
let M = S(I)(I);             // Mockingbird: x => x(x)           - self-application
let T = C(I);                // Thrush:      x => y => y(x)           - flip arguments
let V = B(C)(T);             // Vireo:       x => y => z => z(x)(y)    - move last argument to front
let R = B(B)(T);             // Robin:       x => y => z => y(z)(x)    - move middle argument to front

let R_STAR = C_STAR(C_STAR); // Robin once removed:     x => y => z => w => x(z)(w)(y)          - AKA R*
let C_STAR = B(C);           // Cardinal once removed:  x => y => z => w => x(y)(w)(z)          - AKA C*
let C_STAR_STAR = B(C_STAR); // Cardinal twice removed: x => y => z => w => v => x(y)(z)(v)(w)  - AKA C**


// Boolean logic using combinators
let TRUE = K;      // given two things, choose the first
let FALSE = K(I);  // given two things, choose the second
let IF = I;

let toBoolean = (x) => x(true)(false);

let NOT = V(FALSE)(TRUE); // NOT = p => p(FALSE)(TRUE);

console.log("\\nBoolean logic:");
console.log("NOT true = " + toBoolean(NOT(TRUE)));
console.log("NOT false = " + toBoolean(NOT(TRUE)));

// let AND = p => q => p(q)(FALSE); Vireo?
// let OR = p => q => p(TRUE)(q);

// Lazy evaluation test - M(M) would diverge with eager evaluation
console.log("\\nLazy evaluation test:");
console.log(K(42)(M(M)) + " (this would throw an error in normal JavaScript)");  // Returns 42 without evaluating M(M)

// Barendregt numerals
let ZERO = I;
let IS_ZERO = T(TRUE);      // IS_ZERO n = n TRUE
let SUCC = V(FALSE);        // SUCC n = V FALSE n
let PRED = T(FALSE);        // PRED n = n FALSE
let DECREMENT = m => IS_ZERO(m)(m)(PRED(m)); // Clamped version of PRED

// Build some numbers
let ONE   = SUCC(ZERO);
let TWO   = SUCC(ONE);
let THREE = SUCC(TWO);
let FOUR  = SUCC(THREE);
let FIVE  = SUCC(FOUR);
let SIX   = SUCC(FIVE);
let SEVEN = SUCC(SIX);
let EIGHT = SUCC(SEVEN);
let NINE  = SUCC(EIGHT);
let TEN   = SUCC(NINE);

// Convert Barendregt numeral to JavaScript number
let toNumber = m => IS_ZERO(m)(0)(1 + toNumber(PRED(m)));

console.log("\\nBarendregt/Scott numerals:");
console.log("One: " + toNumber(ZERO));   // 0
console.log("Three: " + toNumber(THREE));  // 3
console.log("Five: " + toNumber(FIVE));   // 5

// Y combinator for recursion
// let Y = f => (x => f(x(x)))(x => f(x(x)));
let Y = W(C)(S(B)(C(W(C))));

// TODO combinator version
let NUMBER_EQUALS = x => y =>
  IS_ZERO(x)
    (IS_ZERO(y)
       (TRUE)
       (FALSE))
    (IS_ZERO(y)
       (FALSE)
       (NUMBER_EQUALS(PRED(x))(PRED(y))));

console.log("\\nNumber equality:");
console.log("5 == 5 = " + toBoolean(NUMBER_EQUALS(FIVE)(FIVE)));
console.log("1 == 2 = " + toBoolean(NUMBER_EQUALS(ONE)(TWO)));

// Addition
let ADD = Y(B(S(B(S)(C_STAR_STAR(B)(C)(B(B(B))(IS_ZERO))(SUCC))))(C(S(K(I))(B))(PRED)));

console.log("\\nAddition:");
console.log("2 + 3 = " + toNumber(ADD(TWO)(THREE)));  // 5
console.log("4 + 5 = " + toNumber(ADD(FOUR)(FIVE)));  // 9

// Subtraction
let SUBTRACT = Y(B(S(B(S)(C(IS_ZERO))))(C(B(C)(B(B(B))(C(B)(DECREMENT))))(PRED)));

console.log("\\nSubtraction:");
console.log("5 - 2 = " + toNumber(SUBTRACT(FIVE)(TWO)));  // 3
console.log("1 - 3 = " + toNumber(SUBTRACT(ONE)(THREE)) + " (no negatives in this number system)");  // 0


// TODO combinator version
let MULTIPLY = (x) => (y) => IS_ZERO(y)(ZERO)(ADD(x)(MULTIPLY(x)(PRED(y))));

console.log("\\nMultiplication:");
console.log("5 * 5 = " + toNumber(MULTIPLY(FIVE)(FIVE)));
console.log("3 * 4 = " + toNumber(MULTIPLY(THREE)(FOUR)));
console.log("2 * 0 = " + toNumber(MULTIPLY(TWO)(ZERO)));

let PSI = B(B)(B); // f => g => x => y => f(g(x)(y))

// LESS_THAN_OR_EQUAL(a)(b) = IS_ZERO(SUBTRACT(a)(b))(TRUE)(FALSE)
// LESS_THAN_OR_EQUAL(a)(b) = IS_ZERO(SUBTRACT(a)(b))
// LESS_THAN_OR_EQUAL(a)(b) = PSI(IS_ZERO)(SUBTRACT)
let LESS_THAN_OR_EQUAL = PSI(IS_ZERO)(SUBTRACT);
let GREATER_THAN_OR_EQUAL = C(LESS_THAN_OR_EQUAL);

console.log("\\nLess than or equal:");
console.log("3 <= 2 = " + toBoolean(LESS_THAN_OR_EQUAL(THREE)(TWO)));  // true
console.log("4 <= 5 = " + toBoolean(LESS_THAN_OR_EQUAL(FOUR)(FIVE)));  // false
console.log("0 <= 0 = " + toBoolean(LESS_THAN_OR_EQUAL(FOUR)(FIVE)));  // false

let INVERT_BINARY_RELATION = PSI(NOT);
let GREATER_THAN = INVERT_BINARY_RELATION(LESS_THAN_OR_EQUAL);
let LESS_THAN = INVERT_BINARY_RELATION(GREATER_THAN_OR_EQUAL);

console.log("\\nGreater than:");
console.log("3 > 2 = " + toBoolean(GREATER_THAN(THREE)(TWO)));  // true
console.log("4 > 5 = " + toBoolean(GREATER_THAN(FOUR)(FIVE)));  // false
console.log("0 > 0 = " + toBoolean(GREATER_THAN(FOUR)(FIVE)));  // false

// TODO: combinator version
let MOD_MAKER = f => m => n => LESS_THAN(m)(n)(m)
(f(SUBTRACT(m)(n))(n));
let MOD = Y(MOD_MAKER);

console.log("\\nModulus:");
console.log("5 % 2 = " + toNumber(MOD(FIVE)(TWO)));
console.log("5 % 3 = " + toNumber(MOD(FIVE)(THREE)));
console.log("4 % 2 = " + toNumber(MOD(FOUR)(TWO)));

// let DECIMAL2 = x => y => ADD(MULTIPLY(TEN)(x))(y);
let DECIMAL2 = x => ADD(MULTIPLY(TEN)(x));
let ONE_HUNDRED = MULTIPLY(TEN)(TEN);
let DECIMAL3 = x => y => z =>
  ADD(
    ADD(
      MULTIPLY(ONE_HUNDRED)(x)
    )(
      MULTIPLY(TEN)(y)
    )
  )(z);

console.log("\\nDecimal numbers:");
console.log("Twenty-six: " + toNumber(DECIMAL2(TWO)(SIX)));
console.log("Two hundred fifty-six: " + toNumber(DECIMAL3(TWO)(FIVE)(SIX))); // stack overflow if you go much higher (TODO: add trampoline)

let CONS = V;
let FIRST = T(TRUE);
let REST = T(FALSE);
let EMPTY = FALSE;
let IS_EMPTY = list => list(_h => _t => FALSE)(TRUE);

let RANGE = Y(f => m => n =>
  LESS_THAN_OR_EQUAL(m)(n)
    (CONS(m)(f(SUCC(m))(n)))
    (EMPTY)
);

let FOLD = Y(f => lst => fn => acc =>
  IS_EMPTY(lst)
    (acc)
    (fn(FIRST(lst))(f(REST(lst))(fn)(acc)))
);

// right fold: combiner :: element -> acc -> acc
// let MAP = list => fn =>
//  FOLD(list)(x => acc => CONS(fn(x))(acc))(EMPTY);


let go = formatter => lst =>
  lst === EMPTY
    ? ""
    : formatter(FIRST(lst)) +
      (REST(lst) === EMPTY ? "" : ", " + go(formatter)(REST(lst)));

let toArray = formatter => list => "[" + go(formatter)(list) + "]";

console.log("\\nLists:");
console.log("1, 2, 3: " + toArray(toNumber)(
  CONS(ONE)
  (CONS(TWO)(CONS(THREE)(EMPTY)))));
console.log("1 to 10: " + toArray(toNumber)(RANGE(ONE)(TEN)));
console.log("Fold sum 1 to 4 = " + toNumber(FOLD(RANGE(ONE)(FOUR))(ADD)(ZERO)));
`;

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

    // Basic output checks
    expect(calls[0][0]).toEqual({ type: ValueType.String, value: "Testing basic combinators:" });
    expect(calls[1][0]).toEqual({ type: ValueType.String, value: "Identify combinator: 42 = 42" });
    expect(calls[2][0]).toEqual({ type: ValueType.String, value: "Kestral combinator: K(10)(20) = 10" });

    // Boolean logic
    expect(calls[3][0]).toEqual({ type: ValueType.String, value: "\nBoolean logic:" });
    expect(calls[4][0]).toEqual({ type: ValueType.String, value: "NOT true = false" });
    expect(calls[5][0]).toEqual({ type: ValueType.String, value: "NOT false = false" }); // Note: bug in original, both NOT(TRUE)

    // Lazy evaluation
    expect(calls[6][0]).toEqual({ type: ValueType.String, value: "\nLazy evaluation test:" });
    expect(calls[7][0]).toEqual({ type: ValueType.String, value: "42 (this would throw an error in normal JavaScript)" });

    // Barendregt numerals
    expect(calls[8][0]).toEqual({ type: ValueType.String, value: "\nBarendregt/Scott numerals:" });
    expect(calls[9][0]).toEqual({ type: ValueType.String, value: "One: 0" });
    expect(calls[10][0]).toEqual({ type: ValueType.String, value: "Three: 3" });
    expect(calls[11][0]).toEqual({ type: ValueType.String, value: "Five: 5" });

    // Number equality
    expect(calls[12][0]).toEqual({ type: ValueType.String, value: "\nNumber equality:" });
    expect(calls[13][0]).toEqual({ type: ValueType.String, value: "5 == 5 = true" });
    expect(calls[14][0]).toEqual({ type: ValueType.String, value: "1 == 2 = false" });

    // Addition
    expect(calls[15][0]).toEqual({ type: ValueType.String, value: "\nAddition:" });
    expect(calls[16][0]).toEqual({ type: ValueType.String, value: "2 + 3 = 5" });
    expect(calls[17][0]).toEqual({ type: ValueType.String, value: "4 + 5 = 9" });

    // Subtraction
    expect(calls[18][0]).toEqual({ type: ValueType.String, value: "\nSubtraction:" });
    expect(calls[19][0]).toEqual({ type: ValueType.String, value: "5 - 2 = 3" });
    expect(calls[20][0]).toEqual({ type: ValueType.String, value: "1 - 3 = 0 (no negatives in this number system)" });

    // Multiplication
    expect(calls[21][0]).toEqual({ type: ValueType.String, value: "\nMultiplication:" });
    expect(calls[22][0]).toEqual({ type: ValueType.String, value: "5 * 5 = 25" });
    expect(calls[23][0]).toEqual({ type: ValueType.String, value: "3 * 4 = 12" });
    expect(calls[24][0]).toEqual({ type: ValueType.String, value: "2 * 0 = 0" });

    // Less than or equal
    expect(calls[25][0]).toEqual({ type: ValueType.String, value: "\nLess than or equal:" });
    expect(calls[26][0]).toEqual({ type: ValueType.String, value: "3 <= 2 = false" });
    expect(calls[27][0]).toEqual({ type: ValueType.String, value: "4 <= 5 = true" });
    expect(calls[28][0]).toEqual({ type: ValueType.String, value: "0 <= 0 = true" });

    // Greater than
    expect(calls[29][0]).toEqual({ type: ValueType.String, value: "\nGreater than:" });
    expect(calls[30][0]).toEqual({ type: ValueType.String, value: "3 > 2 = true" });
    expect(calls[31][0]).toEqual({ type: ValueType.String, value: "4 > 5 = false" });
    expect(calls[32][0]).toEqual({ type: ValueType.String, value: "0 > 0 = false" });

    // Modulus
    expect(calls[33][0]).toEqual({ type: ValueType.String, value: "\nModulus:" });
    expect(calls[34][0]).toEqual({ type: ValueType.String, value: "5 % 2 = 1" });
    expect(calls[35][0]).toEqual({ type: ValueType.String, value: "5 % 3 = 2" });
    expect(calls[36][0]).toEqual({ type: ValueType.String, value: "4 % 2 = 0" });

    // Decimal numbers
    expect(calls[37][0]).toEqual({ type: ValueType.String, value: "\nDecimal numbers:" });
    expect(calls[38][0]).toEqual({ type: ValueType.String, value: "Twenty-six: 26" });
    expect(calls[39][0]).toEqual({ type: ValueType.String, value: "Two hundred fifty-six: 256" });

    // Lists
    expect(calls[40][0]).toEqual({ type: ValueType.String, value: "\nLists:" });
    expect(calls[41][0]).toEqual({ type: ValueType.String, value: "1, 2, 3: [1, 2, 3]" });
    expect(calls[42][0]).toEqual({ type: ValueType.String, value: "1 to 10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" });
    expect(calls[43][0]).toEqual({ type: ValueType.String, value: "Fold sum 1 to 4 = 10" });

    // Total number of calls
    expect(mockOutput).toHaveBeenCalledTimes(44);
  });
});
