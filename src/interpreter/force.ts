import type { Expression } from "../types/ast.js";
import {
  type Value,
  type ThunkValue,
  type Environment,
  isThunk,
} from "./values.js";

type Evaluator = (expr: Expression, env: Environment) => Value;

export function force(value: Value, evaluate: Evaluator): Value {
  if (!isThunk(value)) {
    return value;
  }

  const thunk = value as ThunkValue;

  if (thunk.memoized) {
    return thunk.memoized;
  }

  const result = evaluate(thunk.expression, thunk.environment);

  thunk.memoized = result;

  return force(result, evaluate);
}
