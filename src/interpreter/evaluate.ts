import {
  NodeType,
  type Expression,
  type ConditionalExpression,
  type LogicalOrExpression,
  type LogicalAndExpression,
  type EqualityExpression,
  type RelationalExpression,
  type AdditiveExpression,
  type MultiplicativeExpression,
  type UnaryExpression,
  type PrimaryExpression,
  type Literal,
} from "../types/ast.js";
import {
  ValueType,
  type Value,
  type Environment,
  lookupVariable,
  createThunk,
  createEnvironment,
  bindVariable,
} from "./values.js";
import { force } from "./force.js";

export function evaluate(expr: Expression, env: Environment): Value {
  return evaluateBody(expr.body, env);
}

function evaluateBody(expr: ConditionalExpression, env: Environment): Value {
  if (expr.type === NodeType.Conditional) {
    const condition = force(evaluateBody(expr.condition, env), evaluate);

    if (condition.type !== ValueType.Boolean) {
      throw new Error("Condition must be a boolean");
    }

    return condition.value
      ? createThunk(
          { type: NodeType.Expression, body: expr.valueIfTrue.body },
          env
        )
      : createThunk(
          { type: NodeType.Expression, body: expr.valueIfFalse.body },
          env
        );
  }

  return evaluateLogicalOr(expr, env);
}

function evaluateLogicalOr(expr: LogicalOrExpression, env: Environment): Value {
  if (expr.type === NodeType.LogicalOr) {
    const left = force(evaluateLogicalOr(expr.left, env), evaluate);

    if (left.type === ValueType.Boolean && left.value === true) {
      return left;
    }

    return evaluateLogicalAnd(expr.right, env);
  }

  return evaluateLogicalAnd(expr, env);
}

function evaluateLogicalAnd(
  expr: LogicalAndExpression,
  env: Environment
): Value {
  if (expr.type === NodeType.LogicalAnd) {
    const left = force(evaluateLogicalAnd(expr.left, env), evaluate);

    if (left.type === ValueType.Boolean && left.value === false) {
      return left;
    }

    return evaluateEquality(expr.right, env);
  }

  return evaluateEquality(expr, env);
}

function evaluateEquality(expr: EqualityExpression, env: Environment): Value {
  if (expr.type === NodeType.Equality) {
    const left = force(evaluateEquality(expr.left, env), evaluate);
    const right = force(evaluateRelational(expr.right, env), evaluate);

    const result =
      expr.operator === "==="
        ? valuesEqual(left, right)
        : !valuesEqual(left, right);

    return { type: ValueType.Boolean, value: result };
  }

  return evaluateRelational(expr, env);
}

function evaluateRelational(
  expr: RelationalExpression,
  env: Environment
): Value {
  if (expr.type === NodeType.Relational) {
    const left = force(evaluateRelational(expr.left, env), evaluate);
    const right = force(evaluateAdditive(expr.right, env), evaluate);

    if (left.type !== ValueType.Number || right.type !== ValueType.Number) {
      throw new Error("Relational operators require numbers");
    }

    let result: boolean;
    switch (expr.operator) {
      case "<":
        result = left.value < right.value;
        break;
      case "<=":
        result = left.value <= right.value;
        break;
      case ">":
        result = left.value > right.value;
        break;
      case ">=":
        result = left.value >= right.value;
        break;
      default:
        throw new Error(
          `Unknown relational operator: ${(expr as { operator: unknown }).operator}`
        );
    }

    return { type: ValueType.Boolean, value: result };
  }

  return evaluateAdditive(expr, env);
}

function evaluateAdditive(expr: AdditiveExpression, env: Environment): Value {
  if (expr.type === NodeType.Additive) {
    const left = force(evaluateAdditive(expr.left, env), evaluate);
    const right = force(evaluateMultiplicative(expr.right, env), evaluate);

    if (expr.operator === "+") {
      if (left.type === ValueType.String || right.type === ValueType.String) {
        const leftStr = valueToString(left);
        const rightStr = valueToString(right);
        return { type: ValueType.String, value: leftStr + rightStr };
      }

      if (left.type === ValueType.Number && right.type === ValueType.Number) {
        return { type: ValueType.Number, value: left.value + right.value };
      }

      throw new Error("Invalid types for + operator");
    }

    if (left.type !== ValueType.Number || right.type !== ValueType.Number) {
      throw new Error("- operator requires numbers");
    }

    return { type: ValueType.Number, value: left.value - right.value };
  }

  return evaluateMultiplicative(expr, env);
}

function evaluateMultiplicative(
  expr: MultiplicativeExpression,
  env: Environment
): Value {
  if (expr.type === NodeType.Multiplicative) {
    const left = force(evaluateMultiplicative(expr.left, env), evaluate);
    const right = force(evaluateUnary(expr.right, env), evaluate);

    if (left.type !== ValueType.Number || right.type !== ValueType.Number) {
      throw new Error(`${expr.operator} operator requires numbers`);
    }

    let result: number;
    switch (expr.operator) {
      case "*":
        result = left.value * right.value;
        break;
      case "/":
        if (right.value === 0) throw new Error("Division by zero");
        result = left.value / right.value;
        break;
      case "%":
        if (right.value === 0) throw new Error("Modulo by zero");
        result = left.value % right.value;
        break;
      default:
        throw new Error(
          `Unknown multiplicative operator: ${(expr as { operator: unknown }).operator}`
        );
    }

    return { type: ValueType.Number, value: result };
  }

  return evaluateUnary(expr, env);
}

function evaluateUnary(expr: UnaryExpression, env: Environment): Value {
  if (expr.type === NodeType.Unary) {
    const operand = force(evaluateUnary(expr.operand, env), evaluate);

    switch (expr.operator) {
      case "!":
        if (operand.type !== ValueType.Boolean) {
          throw new Error("! operator requires boolean");
        }
        return { type: ValueType.Boolean, value: !operand.value };
      case "-":
        if (operand.type !== ValueType.Number) {
          throw new Error("- operator requires number");
        }
        return { type: ValueType.Number, value: -operand.value };
      default:
        throw new Error(`Unknown unary operator: ${expr.operator}`);
    }
  }

  return evaluatePrimary(expr, env);
}

function evaluatePrimary(expr: PrimaryExpression, env: Environment): Value {
  switch (expr.type) {
    case NodeType.Literal:
      return evaluateLiteral(expr.body);

    case NodeType.Identifier: {
      const value = lookupVariable(env, expr.name);
      if (!value) {
        throw new Error(`Undefined variable: ${expr.name}`);
      }
      return value;
    }

    case NodeType.ArrowFunction:
      return {
        type: ValueType.Function,
        parameter: expr.parameter.name,
        body: expr.body,
        closure: env,
      };

    case NodeType.FunctionCall: {
      const func = force(evaluate(expr.callee, env), evaluate);
      if (func.type !== ValueType.Function) {
        throw new Error("Cannot call non-function");
      }

      const argThunk = createThunk(expr.argument, env);
      const newEnv = createEnvironment(func.closure);
      bindVariable(newEnv, func.parameter, argThunk);

      return createThunk(func.body, newEnv);
    }

    case NodeType.ParenthesizedExpression:
      return evaluate(expr.expression, env);

    default:
      throw new Error(
        `Unknown primary expression type: ${(expr as { type: unknown }).type}`
      );
  }
}

function evaluateLiteral(literal: Literal["body"]): Value {
  switch (literal.type) {
    case NodeType.Number:
      return { type: ValueType.Number, value: literal.value };
    case NodeType.String:
      return { type: ValueType.String, value: literal.value };
    case NodeType.Boolean:
      return { type: ValueType.Boolean, value: literal.value };
    default:
      throw new Error(
        `Unknown literal type: ${(literal as { type: unknown }).type}`
      );
  }
}

function valuesEqual(a: Value, b: Value): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case ValueType.Number:
    case ValueType.String:
    case ValueType.Boolean:
      return a.value === (b as typeof a).value;
    case ValueType.Function:
      return a === b;
    case ValueType.Thunk:
      return a === b;
    default:
      return false;
  }
}

function valueToString(value: Value): string {
  switch (value.type) {
    case ValueType.Number:
    case ValueType.Boolean:
      return String(value.value);
    case ValueType.String:
      return value.value;
    case ValueType.Function:
      return "[Function]";
    case ValueType.Thunk:
      return "[Thunk]";
    default:
      throw new Error(
        `Unknown value type: ${(value as { type: unknown }).type}`
      );
  }
}
