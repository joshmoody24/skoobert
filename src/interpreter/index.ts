import {
  NodeType,
  type Program,
  type Statement,
  type ConsoleLog,
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
  sideEffect: ConsoleLog,
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
    default:
      throw new Error(
        `Unknown side effect type: ${(sideEffect as { type: unknown }).type}`
      );
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
