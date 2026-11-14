import type { Expression } from "../types/ast.js";

export enum ValueType {
  Number = "number",
  String = "string",
  Boolean = "boolean",
  Function = "function",
  Thunk = "thunk",
}

export type Value =
  | NumberValue
  | StringValue
  | BooleanValue
  | FunctionValue
  | ThunkValue;

export type NumberValue = {
  type: ValueType.Number;
  value: number;
};

export type StringValue = {
  type: ValueType.String;
  value: string;
};

export type BooleanValue = {
  type: ValueType.Boolean;
  value: boolean;
};

export type FunctionValue = {
  type: ValueType.Function;
  parameter: string;
  body: Expression;
  closure: Environment;
};

export type ThunkValue = {
  type: ValueType.Thunk;
  expression: Expression;
  environment: Environment;
  memoized?: Value;
};

// Function scopes hold exactly one parameter, but the global scope is
// extended in place by later `let`s that earlier closures must still see.
export type Environment = GlobalEnvironment | LocalEnvironment;

export type GlobalEnvironment = {
  bindings: Map<string, Value>;
};

export type LocalEnvironment = {
  name: string;
  value: Value;
  parent: Environment;
};

export function createGlobalEnvironment(): GlobalEnvironment {
  return { bindings: new Map() };
}

export function extendEnvironment(
  parent: Environment,
  name: string,
  value: Value
): LocalEnvironment {
  return { name, value, parent };
}

export function bindGlobal(
  env: GlobalEnvironment,
  name: string,
  value: Value
): void {
  env.bindings.set(name, value);
}

export function lookupVariable(
  env: Environment,
  name: string
): Value | undefined {
  if ("bindings" in env) {
    return env.bindings.get(name);
  }
  return env.name === name ? env.value : lookupVariable(env.parent, name);
}

export function isThunk(value: Value): value is ThunkValue {
  return value.type === ValueType.Thunk;
}

export function createThunk(
  expression: Expression,
  environment: Environment
): ThunkValue {
  return {
    type: ValueType.Thunk,
    expression,
    environment,
  };
}
