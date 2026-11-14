import type { Expression } from "../types/ast.js";
import {
  type Value,
  type ThunkValue,
  type Environment,
  isThunk,
} from "./values.js";

type Evaluator = (expr: Expression, env: Environment) => Value;

// A loop rather than recursion because JS engines don't eliminate tail calls,
// so long thunk chains would overflow the stack.
export function force(value: Value, evaluate: Evaluator): Value {
  const chain: ThunkValue[] = [];
  let current = value;

  while (isThunk(current)) {
    chain.push(current);
    current =
      current.memoized ?? evaluate(current.expression, current.environment);
  }

  for (const thunk of chain) {
    thunk.memoized = current;
  }

  return current;
}
