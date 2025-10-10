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

export type Environment = {
  bindings: Map<string, Value>;
  parent?: Environment;
};

export function createEnvironment(parent?: Environment): Environment {
  return {
    bindings: new Map(),
    parent,
  };
}

export function lookupVariable(
  env: Environment,
  name: string
): Value | undefined {
  const value = env.bindings.get(name);
  if (value !== undefined) {
    return value;
  }
  if (env.parent) {
    return lookupVariable(env.parent, name);
  }
  return undefined;
}

export function bindVariable(
  env: Environment,
  name: string,
  value: Value
): void {
  env.bindings.set(name, value);
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
