import { lex } from "../lexer/index.js";
import type {
  AdditiveExpression,
  ArrowFunction,
  BooleanLiteral,
  ConditionalExpression,
  ConsoleLog,
  EqualityExpression,
  Expression,
  FunctionCall,
  Identifier,
  Literal,
  LogicalAndExpression,
  LogicalOrExpression,
  MultiplicativeExpression,
  NumberLiteral,
  ParenthesizedExpression,
  PrimaryExpression,
  Program,
  RelationalExpression,
  SideEffect,
  Statement,
  StringLiteral,
  UnaryExpression,
  VariableDeclaration,
} from "../types/ast.js";
import { TokenType, type Token } from "../types/tokens.js";

export function createParser(tokens: Token[]) {
  let current = 0;

  const isEof = () => {
    return current >= tokens.length || peek()?.type === TokenType.Eof;
  };

  const peek = () => {
    return tokens[current]!;
  };

  const consume = () => {
    return tokens[current++]!;
  };

  const match = (...types: TokenType[]) => {
    if (isEof()) return false;
    const token = peek();
    if (types.includes(token.type)) {
      consume();
      return true;
    }
    return false;
  };

  const program = (): Program => {
    const statements = [];
    while (!isEof()) {
      statements.push(statement());
    }
    return {
      type: "program",
      statements,
    } as Program;
  };

  const statement = (): Statement => {
    if (match(TokenType.Let)) {
      return {
        type: "statement",
        body: variableDeclaration(),
      };
    }

    return {
      type: "statement",
      body: sideEffect(),
    };
  };

  const variableDeclaration = (): VariableDeclaration => {
    const identifierToken = consume();
    if (identifierToken?.type !== "identifier") {
      throw new Error("Expected identifier");
    }
    if (!match(TokenType.Assignment)) {
      throw new Error("Expected '='");
    }
    const expressionNode = expression();
    if (!match(TokenType.Semicolon)) {
      throw new Error("Expected ';'");
    }
    return {
      type: "variable-declaration",
      identifier: {
        type: "identifier",
        name: identifierToken.value,
      },
      expression: expressionNode,
    };
  };

  const expression = (): Expression => {
    return {
      type: "expression",
      body: conditionalExpression(),
    };
  };

  const conditionalExpression = (): ConditionalExpression => {
    const expr = logicalOrExpression();

    if (match(TokenType.Question)) {
      const valueIfTrue = expression();
      if (!match(TokenType.Colon)) {
        throw new Error("Expected ':' in conditional expression");
      }
      const valueIfFalse = expression();
      return {
        type: "conditional",
        condition: expr,
        valueIfTrue,
        valueIfFalse,
      };
    }

    return expr;
  };

  const sideEffect = (): SideEffect => {
    const body = consoleLog();
    if (!match(TokenType.Semicolon)) {
      throw new Error("Expected ';'");
    }
    return {
      type: "side-effect",
      body,
    };
  };

  const consoleLog = (): ConsoleLog => {
    if (!match(TokenType.ConsoleLog)) {
      throw new Error("Expected 'console.log'");
    }
    if (!match(TokenType.LeftParen)) {
      throw new Error("Expected '('");
    }
    const argument = expression();
    if (!match(TokenType.RightParen)) {
      throw new Error("Expected ')'");
    }
    return {
      type: "console-log",
      argument,
    };
  };

  const logicalOrExpression = (): LogicalOrExpression => {
    let left: LogicalOrExpression = logicalAndExpression();

    while (peek()?.type === TokenType.Or) {
      consume();
      const right = logicalAndExpression();
      left = {
        type: "logical-or",
        left,
        right,
      };
    }

    return left;
  };

  const logicalAndExpression = (): LogicalAndExpression => {
    let left: LogicalAndExpression = equalityExpression();

    while (peek()?.type === TokenType.And) {
      consume();
      const right = equalityExpression();
      left = {
        type: "logical-and",
        left,
        right,
      };
    }

    return left;
  };

  const equalityExpression = (): EqualityExpression => {
    let left: EqualityExpression = relationalExpression();

    while (
      peek()?.type === TokenType.StrictEqual ||
      peek()?.type === TokenType.StrictNotEqual
    ) {
      const operator = consume().type === TokenType.StrictEqual ? "===" : "!==";
      const right = relationalExpression();
      left = {
        type: "equality",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const relationalExpression = (): RelationalExpression => {
    let left: RelationalExpression = additiveExpression();

    while (
      peek()?.type === TokenType.LessThan ||
      peek()?.type === TokenType.LessThanOrEqual ||
      peek()?.type === TokenType.GreaterThan ||
      peek()?.type === TokenType.GreaterThanOrEqual
    ) {
      const tokenType = consume().type;
      const operator =
        tokenType === TokenType.LessThan
          ? "<"
          : tokenType === TokenType.LessThanOrEqual
            ? "<="
            : tokenType === TokenType.GreaterThan
              ? ">"
              : ">=";
      const right = additiveExpression();
      left = {
        type: "relational",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const additiveExpression = (): AdditiveExpression => {
    let left: AdditiveExpression = multiplicativeExpression();

    while (
      peek()?.type === TokenType.Plus ||
      peek()?.type === TokenType.Minus
    ) {
      const operator = consume().type === TokenType.Plus ? "+" : "-";
      const right = multiplicativeExpression();
      left = {
        type: "additive",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const multiplicativeExpression = (): MultiplicativeExpression => {
    let left: MultiplicativeExpression = unaryExpression();

    while (
      peek()?.type === TokenType.Asterisk ||
      peek()?.type === TokenType.Slash ||
      peek()?.type === TokenType.Percent
    ) {
      const tokenType = consume().type;
      const operator =
        tokenType === TokenType.Asterisk
          ? "*"
          : tokenType === TokenType.Slash
            ? "/"
            : "%";
      const right = unaryExpression();
      left = {
        type: "multiplicative",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const unaryExpression = (): UnaryExpression => {
    if (peek()?.type === TokenType.Not || peek()?.type === TokenType.Minus) {
      const operator = consume().type === TokenType.Not ? "!" : "-";
      const operand = unaryExpression();
      return {
        type: "unary",
        operator,
        operand,
      };
    }

    return primaryExpression();
  };

  const parseNumber = (): NumberLiteral => {
    const token = consume();
    if (token?.type !== TokenType.Number) {
      throw new Error("Expected number");
    }
    return {
      type: "number",
      value: token.value,
    };
  };

  const parseString = (): StringLiteral => {
    const token = consume();
    if (token?.type !== TokenType.String) {
      throw new Error("Expected string");
    }
    return {
      type: "string",
      value: token.value,
    };
  };

  const parseBoolean = (): BooleanLiteral => {
    const token = consume();
    return {
      type: "boolean",
      value: token.type === TokenType.True,
    };
  };

  const parseLiteral = (): Literal => {
    if (peek()?.type === TokenType.Number) {
      return {
        type: "literal",
        body: parseNumber(),
      };
    }

    if (peek()?.type === TokenType.String) {
      return {
        type: "literal",
        body: parseString(),
      };
    }

    if (peek()?.type === TokenType.True || peek()?.type === TokenType.False) {
      return {
        type: "literal",
        body: parseBoolean(),
      };
    }

    throw new Error(`Expected literal, got ${peek()?.type}`);
  };

  const parseArrowFunction = (parameter: Identifier): ArrowFunction => {
    consume(); // consume '=>'
    const body = expression();
    return {
      type: "arrow-function",
      parameter,
      body,
    };
  };

  const parseFunctionCall = (callee: Identifier): FunctionCall => {
    consume(); // consume '('
    const argument = expression();
    if (!match(TokenType.RightParen)) {
      throw new Error("Expected ')' after function call argument");
    }
    return {
      type: "function-call",
      callee: {
        type: "expression",
        body: callee as PrimaryExpression,
      },
      argument,
    };
  };

  const parseIdentifier = (): PrimaryExpression => {
    const identifierToken = consume();
    if (identifierToken?.type !== TokenType.Identifier) {
      throw new Error("Expected identifier");
    }

    const identifier: Identifier = {
      type: "identifier",
      name: identifierToken.value as string,
    };

    if (peek()?.type === TokenType.Arrow) {
      return parseArrowFunction(identifier);
    }

    if (peek()?.type === TokenType.LeftParen) {
      return parseFunctionCall(identifier);
    }

    return identifier;
  };

  const parseParenthesizedExpression = (): ParenthesizedExpression => {
    const expr = expression();
    if (!match(TokenType.RightParen)) {
      throw new Error("Expected ')' after expression");
    }
    return {
      type: "parenthesized-expression",
      expression: expr,
    };
  };

  const primaryExpression = (): PrimaryExpression => {
    const peekType = peek()?.type;

    if (
      peekType === TokenType.Number ||
      peekType === TokenType.String ||
      peekType === TokenType.True ||
      peekType === TokenType.False
    ) {
      return parseLiteral();
    }

    if (peekType === TokenType.Identifier) {
      return parseIdentifier();
    }

    if (match(TokenType.LeftParen)) {
      return parseParenthesizedExpression();
    }

    throw new Error(`Unexpected token: ${peek()?.type}`);
  };

  return program();
}

/**
 * Parses the given list of tokens into an Abstract Syntax Tree (AST).
 * @param tokens The list of tokens to parse.
 * @returns The root node of the AST representing the entire program.
 */
export function parseTokens(tokens: Token[]): Program {
  return createParser(tokens);
}

/**
 * Parses the given program string into an Abstract Syntax Tree (AST).
 * @param program The source code to parse.
 * @returns The root node of the AST representing the entire program.
 */
export function parse(program: string): Program {
  const tokens = lex(program);
  return createParser(tokens);
}
