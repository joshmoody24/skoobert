import {
  NodeType,
  type Program,
  type Statement,
  type ConsoleLog,
  type InspectExpanded,
  type Expression,
  type LogicalOrExpression,
  type ConditionalExpression,
} from "../types/ast.js";
import {
  ValueType,
  type Value,
  type Environment,
  createEnvironment,
  bindVariable,
  lookupVariable,
  createThunk,
} from "./values.js";
import { force } from "./force.js";
import { evaluate } from "./evaluate.js";

declare const console: { log: (message: unknown) => void };

export type OutputHandler = (value: Value) => void;

export interface InterpreterOptions {
  onOutput?: OutputHandler;
}

export function interpret(
  program: Program,
  options: InterpreterOptions = {}
): void {
  const globalEnv = createEnvironment();
  const outputHandler =
    options.onOutput ?? ((value) => console.log(valueToString(value)));
  evaluateProgram(program, globalEnv, outputHandler);
}

function evaluateProgram(
  program: Program,
  env: Environment,
  outputHandler: OutputHandler
): void {
  for (const statement of program.statements) {
    evaluateStatement(statement, env, outputHandler);
  }
}

function evaluateStatement(
  statement: Statement,
  env: Environment,
  outputHandler: OutputHandler
): void {
  switch (statement.body.type) {
    case NodeType.VariableDeclaration: {
      const { identifier, expression } = statement.body;
      // Check if variable already exists in any scope
      if (lookupVariable(env, identifier.name) !== undefined) {
        throw new Error(
          `Cannot use 'let ${identifier.name}' - the name '${identifier.name}' is already taken. Each name can only be defined once.`
        );
      }
      const thunk = createThunk(expression, env);
      bindVariable(env, identifier.name, thunk);
      break;
    }
    case NodeType.SideEffect: {
      evaluateSideEffect(statement.body.body, env, outputHandler);
      break;
    }
    default:
      throw new Error(
        `Unknown statement type: ${(statement.body as { type: unknown }).type}`
      );
  }
}

function evaluateSideEffect(
  sideEffect: ConsoleLog | InspectExpanded,
  env: Environment,
  outputHandler: OutputHandler
): void {
  switch (sideEffect.type) {
    case NodeType.ConsoleLog: {
      const value = evaluate(sideEffect.argument, env);
      const forced = force(value, evaluate);
      outputHandler(forced);
      break;
    }
    case NodeType.InspectExpanded: {
      const expanded = expandExpression(sideEffect.argument, env, new Set());
      // Debug: log the expanded structure
      // console.log("Expanded AST:", JSON.stringify(expanded, null, 2));
      const expandedStr = expressionToString(expanded);
      outputHandler({
        type: ValueType.String,
        value: expandedStr,
      });
      break;
    }
    default:
      throw new Error(
        `Unknown side effect type: ${(sideEffect as { type: unknown }).type}`
      );
  }
}

function hasExternalReferencesInArrowBody(expr: Expression, paramName: string, localEnv: Environment): boolean {
  // Check if expression references any variables from the environment, excluding the parameter
  switch (expr.body.type) {
    case NodeType.Identifier: {
      const name = expr.body.name;
      // If it's the parameter, it's not an external reference
      if (name === paramName) {
        return false;
      }
      // Check if this identifier exists in the environment
      const value = lookupVariable(localEnv, name);
      return value !== undefined;
    }

    case NodeType.ArrowFunction: {
      // Nested arrow function - check its body, excluding both parameters
      return hasExternalReferencesInArrowBody(expr.body.body, expr.body.parameter.name, localEnv) ||
             hasExternalReferencesInArrowBody(expr.body.body, paramName, localEnv);
    }

    case NodeType.FunctionCall: {
      return hasExternalReferencesInArrowBody(expr.body.callee, paramName, localEnv) ||
             hasExternalReferencesInArrowBody(expr.body.argument, paramName, localEnv);
    }

    case NodeType.Conditional: {
      return hasExternalReferencesInArrowBody({type: NodeType.Expression, body: expr.body.condition}, paramName, localEnv) ||
             hasExternalReferencesInArrowBody(expr.body.valueIfTrue, paramName, localEnv) ||
             hasExternalReferencesInArrowBody(expr.body.valueIfFalse, paramName, localEnv);
    }

    case NodeType.Additive:
    case NodeType.Multiplicative:
    case NodeType.Relational:
    case NodeType.Equality:
    case NodeType.LogicalOr:
    case NodeType.LogicalAnd: {
      return hasExternalReferencesInArrowBody({type: NodeType.Expression, body: expr.body.left}, paramName, localEnv) ||
             hasExternalReferencesInArrowBody({type: NodeType.Expression, body: expr.body.right}, paramName, localEnv);
    }

    case NodeType.Unary: {
      return hasExternalReferencesInArrowBody({type: NodeType.Expression, body: expr.body.operand}, paramName, localEnv);
    }

    case NodeType.ParenthesizedExpression: {
      return hasExternalReferencesInArrowBody(expr.body.expression, paramName, localEnv);
    }

    case NodeType.Literal: {
      return false;
    }

    default:
      return false;
  }
}

function hasExternalReferences(expr: Expression, localEnv: Environment): boolean {
  // Check if expression references any variables from the environment
  switch (expr.body.type) {
    case NodeType.Identifier: {
      // Check if this identifier exists in the environment (meaning it's a let-bound variable)
      const value = lookupVariable(localEnv, expr.body.name);
      return value !== undefined;
    }

    case NodeType.ArrowFunction: {
      // Create a new environment that excludes the parameter
      // to check if the body references external variables
      // For now, just check the body - parameters are local
      return hasExternalReferencesInArrowBody(expr.body.body, expr.body.parameter.name, localEnv);
    }

    case NodeType.FunctionCall: {
      return hasExternalReferences(expr.body.callee, localEnv) ||
             hasExternalReferences(expr.body.argument, localEnv);
    }

    case NodeType.Conditional: {
      return hasExternalReferences({type: NodeType.Expression, body: expr.body.condition}, localEnv) ||
             hasExternalReferences(expr.body.valueIfTrue, localEnv) ||
             hasExternalReferences(expr.body.valueIfFalse, localEnv);
    }

    case NodeType.Additive:
    case NodeType.Multiplicative:
    case NodeType.Relational:
    case NodeType.Equality:
    case NodeType.LogicalOr:
    case NodeType.LogicalAnd: {
      return hasExternalReferences({type: NodeType.Expression, body: expr.body.left}, localEnv) ||
             hasExternalReferences({type: NodeType.Expression, body: expr.body.right}, localEnv);
    }

    case NodeType.Unary: {
      return hasExternalReferences({type: NodeType.Expression, body: expr.body.operand}, localEnv);
    }

    case NodeType.ParenthesizedExpression: {
      return hasExternalReferences(expr.body.expression, localEnv);
    }

    case NodeType.Literal: {
      return false;
    }

    default:
      return false;
  }
}

function expandExpression(
  expr: Expression,
  env: Environment,
  visited: Set<string>,
  originalName?: string
): Expression {
  switch (expr.body.type) {
    case NodeType.Identifier: {
      const name = expr.body.name;

      // Check for cycles
      if (visited.has(name)) {
        return {
          type: NodeType.Expression,
          body: {
            type: NodeType.Identifier,
            name: `...${name}...`
          }
        };
      }

      // Look up the variable in the environment
      const value = lookupVariable(env, name);
      if (value && value.type === ValueType.Thunk) {
        // Check if this is a base function (doesn't reference external variables)
        const isBaseFunction = !hasExternalReferences(value.expression, value.environment);

        // If this is a base function, just return its name
        if (isBaseFunction) {
          return expr;  // Keep as S, K, etc.
        }

        // Add to visited set for cycle detection
        const newVisited = new Set(visited);
        newVisited.add(name);

        // Recursively expand the thunk's expression
        return expandExpression(value.expression, value.environment, newVisited, originalName || name);
      }

      // If not found or not a thunk, return as-is
      return expr;
    }

    case NodeType.Literal:
      // Literals don't need expansion
      return expr;

    case NodeType.ArrowFunction: {
      // Don't expand inside arrow functions - keep parameters as-is
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          body: expandExpression(expr.body.body, env, visited, originalName)
        }
      };
    }

    case NodeType.FunctionCall: {
      // Expand both callee and argument
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          callee: expandExpression(expr.body.callee, env, visited, originalName),
          argument: expandExpression(expr.body.argument, env, visited, originalName)
        }
      };
    }

    case NodeType.Conditional: {
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          condition: expandExpression({type: NodeType.Expression, body: expr.body.condition}, env, visited, originalName).body as unknown as LogicalOrExpression,
          valueIfTrue: expandExpression(expr.body.valueIfTrue, env, visited, originalName),
          valueIfFalse: expandExpression(expr.body.valueIfFalse, env, visited, originalName)
        } as unknown as ConditionalExpression
      };
    }

    case NodeType.Additive:
    case NodeType.Multiplicative:
    case NodeType.Relational:
    case NodeType.Equality:
    case NodeType.LogicalOr:
    case NodeType.LogicalAnd: {
      // Recursively expand both sides of binary operations
      const expandedLeft = expandExpression({type: NodeType.Expression, body: expr.body.left}, env, visited, originalName);
      const expandedRight = expandExpression({type: NodeType.Expression, body: expr.body.right}, env, visited, originalName);
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          left: expandedLeft.body,
          right: expandedRight.body
        } as unknown as ConditionalExpression
      };
    }

    case NodeType.Unary: {
      const expandedOperand = expandExpression({type: NodeType.Expression, body: expr.body.operand}, env, visited, originalName);
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          operand: expandedOperand.body
        } as unknown as ConditionalExpression
      };
    }

    case NodeType.ParenthesizedExpression: {
      return {
        type: NodeType.Expression,
        body: {
          ...expr.body,
          expression: expandExpression(expr.body.expression, env, visited, originalName)
        }
      };
    }

    // For other types, just return as-is
    default:
      return expr;
  }
}

function getPrecedence(nodeType: NodeType): number {
  switch (nodeType) {
    case NodeType.LogicalOr: return 1;
    case NodeType.LogicalAnd: return 2;
    case NodeType.Equality: return 3;
    case NodeType.Relational: return 4;
    case NodeType.Additive: return 5;
    case NodeType.Multiplicative: return 6;
    case NodeType.Unary: return 7;
    default: return 10; // Highest precedence for literals, identifiers, etc.
  }
}

function needsParentheses(childNode: { type: unknown }, parentType: NodeType): boolean {
  const childPrecedence = getPrecedence(childNode.type as NodeType);
  const parentPrecedence = getPrecedence(parentType);
  return childPrecedence < parentPrecedence;
}

function expressionToString(expr: Expression): string {
  switch (expr.body.type) {
    case NodeType.Identifier:
      return expr.body.name;

    case NodeType.Literal:
      switch (expr.body.body.type) {
        case NodeType.Number:
          return String(expr.body.body.value);
        case NodeType.String:
          return `"${expr.body.body.value}"`;
        case NodeType.Boolean:
          return String(expr.body.body.value);
        default:
          return "?";
      }

    case NodeType.ArrowFunction:
      return `${expr.body.parameter.name} => ${expressionToString(expr.body.body)}`;

    case NodeType.FunctionCall: {
      const calleeStr = expressionToString(expr.body.callee);
      const argStr = expressionToString(expr.body.argument);

      // The issue: when we have S(K)(K), the structure is:
      // FunctionCall(FunctionCall(S, K), K)
      // We should output: S(K)(K)
      // Just combine without extra parens
      return `${calleeStr}(${argStr})`;
    }

    case NodeType.ParenthesizedExpression:
      // Skip unnecessary parentheses - just return the inner expression
      return expressionToString(expr.body.expression);

    case NodeType.Conditional:
      return `${expressionToString({type: NodeType.Expression, body: expr.body.condition})} ? ${expressionToString(expr.body.valueIfTrue)} : ${expressionToString(expr.body.valueIfFalse)}`;

    case NodeType.LogicalOr:
    case NodeType.LogicalAnd:
    case NodeType.Equality:
    case NodeType.Relational:
    case NodeType.Additive:
    case NodeType.Multiplicative: {
      const op = expr.body.type === NodeType.LogicalOr ? "||" :
                 expr.body.type === NodeType.LogicalAnd ? "&&" :
                 expr.body.operator;

      // Add parentheses to preserve precedence for nested expressions
      const leftStr = expressionToString({type: NodeType.Expression, body: expr.body.left});
      const rightStr = expressionToString({type: NodeType.Expression, body: expr.body.right});

      // Check if we need parentheses based on precedence
      const needsLeftParens = needsParentheses(expr.body.left, expr.body.type);
      const needsRightParens = needsParentheses(expr.body.right, expr.body.type);

      const left = needsLeftParens ? `(${leftStr})` : leftStr;
      const right = needsRightParens ? `(${rightStr})` : rightStr;

      return `${left} ${op} ${right}`;
    }

    case NodeType.Unary:
      return `${expr.body.operator}${expressionToString({type: NodeType.Expression, body: expr.body.operand})}`;

    default:
      return "[unknown]";
  }
}

function valueToString(value: Value): string {
  switch (value.type) {
    case ValueType.Number:
      return String(value.value);
    case ValueType.String:
      return value.value;
    case ValueType.Boolean:
      return String(value.value);
    case ValueType.Function:
      return "[Function]";
    case ValueType.Thunk:
      return "[Unevaluated Thunk]";
    default:
      throw new Error(
        `Unknown value type: ${(value as { type: unknown }).type}`
      );
  }
}
