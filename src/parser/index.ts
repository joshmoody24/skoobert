import { lex } from "../lexer/index.js";
import { ParseError } from "../utils/error-reporter.js";
import {
  NodeType,
  type AdditiveExpression,
  type ArrowFunction,
  type BooleanLiteral,
  type ConditionalExpression,
  type ConsoleLog,
  type EqualityExpression,
  type Expression,
  type Identifier,
  type Literal,
  type LogicalAndExpression,
  type LogicalOrExpression,
  type MultiplicativeExpression,
  type NumberLiteral,
  type ParenthesizedExpression,
  type PrimaryExpression,
  type Program,
  type RelationalExpression,
  type SideEffect,
  type Statement,
  type StringLiteral,
  type UnaryExpression,
  type VariableDeclaration,
} from "../types/ast.js";
import { TokenType, type Token } from "../types/tokens.js";

export function createParser(tokens: Token[], source: string) {
  let current = 0;

  const createError = (message: string, token?: Token): ParseError => {
    const currentToken = token || tokens[current] || tokens[tokens.length - 1];
    const location = currentToken
      ? { line: currentToken.line, column: currentToken.column }
      : { line: 1, column: 1 };
    return new ParseError(message, location, source);
  };

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
      type: NodeType.Program,
      statements,
    };
  };

  const statement = (): Statement => {
    if (match(TokenType.Let)) {
      return {
        type: NodeType.Statement,
        body: variableDeclaration(),
      };
    }

    return {
      type: NodeType.Statement,
      body: sideEffect(),
    };
  };

  const variableDeclaration = (): VariableDeclaration => {
    const identifierToken = consume();
    if (identifierToken?.type !== "identifier") {
      throw createError("Expected identifier");
    }
    if (!match(TokenType.Assignment)) {
      throw createError("Expected '='");
    }
    const expressionNode = expression();
    if (!match(TokenType.Semicolon)) {
      throw createError("Expected ';'");
    }
    return {
      type: NodeType.VariableDeclaration,
      identifier: {
        type: NodeType.Identifier,
        name: identifierToken.value,
      },
      expression: expressionNode,
    };
  };

  const expression = (): Expression => {
    return {
      type: NodeType.Expression,
      body: conditionalExpression(),
    };
  };

  const conditionalExpression = (): ConditionalExpression => {
    const expr = logicalOrExpression();

    if (match(TokenType.Question)) {
      const valueIfTrue = expression();
      if (!match(TokenType.Colon)) {
        throw createError("Expected ':' in conditional expression");
      }
      const valueIfFalse = expression();
      return {
        type: NodeType.Conditional,
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
      throw createError("Expected ';'");
    }
    return {
      type: NodeType.SideEffect,
      body,
    };
  };

  const consoleLog = (): ConsoleLog => {
    if (!match(TokenType.ConsoleLog)) {
      throw createError("Expected 'console.log'");
    }
    if (!match(TokenType.LeftParen)) {
      throw createError("Expected '('");
    }
    const argument = expression();
    if (!match(TokenType.RightParen)) {
      throw createError("Expected ')'");
    }
    return {
      type: NodeType.ConsoleLog,
      argument,
    };
  };

  const logicalOrExpression = (): LogicalOrExpression => {
    let left: LogicalOrExpression = logicalAndExpression();

    while (peek()?.type === TokenType.Or) {
      consume();
      const right = logicalAndExpression();
      left = {
        type: NodeType.LogicalOr,
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
        type: NodeType.LogicalAnd,
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
        type: NodeType.Equality,
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
        type: NodeType.Relational,
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
        type: NodeType.Additive,
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
        type: NodeType.Multiplicative,
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
        type: NodeType.Unary,
        operator,
        operand,
      };
    }

    return callExpression();
  };

  const callExpression = (): PrimaryExpression => {
    let expr = primaryExpression();

    // Handle chained function calls like f(x)(y)(z)
    while (peek()?.type === TokenType.LeftParen) {
      consume(); // consume '('
      const argument = expression();
      if (!match(TokenType.RightParen)) {
        throw createError("Expected ')' after function call argument");
      }

      expr = {
        type: NodeType.FunctionCall,
        callee: {
          type: NodeType.Expression,
          body: expr,
        },
        argument,
      };
    }

    return expr;
  };

  const parseNumber = (): NumberLiteral => {
    const token = consume();
    if (token?.type !== TokenType.Number) {
      throw createError("Expected number");
    }
    return {
      type: NodeType.Number,
      value: token.value,
    };
  };

  const parseString = (): StringLiteral => {
    const token = consume();
    if (token?.type !== TokenType.String) {
      throw createError("Expected string");
    }
    return {
      type: NodeType.String,
      value: token.value,
    };
  };

  const parseBoolean = (): BooleanLiteral => {
    const token = consume();
    return {
      type: NodeType.Boolean,
      value: token.type === TokenType.True,
    };
  };

  const parseLiteral = (): Literal => {
    if (peek()?.type === TokenType.Number) {
      return {
        type: NodeType.Literal,
        body: parseNumber(),
      };
    }

    if (peek()?.type === TokenType.String) {
      return {
        type: NodeType.Literal,
        body: parseString(),
      };
    }

    if (peek()?.type === TokenType.True || peek()?.type === TokenType.False) {
      return {
        type: NodeType.Literal,
        body: parseBoolean(),
      };
    }

    throw createError(`Expected literal, got ${peek()?.type}`);
  };

  const parseArrowFunction = (parameter: Identifier): ArrowFunction => {
    consume(); // consume '=>'
    const body = expression();
    return {
      type: NodeType.ArrowFunction,
      parameter,
      body,
    };
  };

  const parseIdentifier = (): PrimaryExpression => {
    const identifierToken = consume();
    if (identifierToken?.type !== TokenType.Identifier) {
      throw createError("Expected identifier");
    }

    const identifier: Identifier = {
      type: NodeType.Identifier,
      name: identifierToken.value as string,
    };

    if (peek()?.type === TokenType.Arrow) {
      return parseArrowFunction(identifier);
    }

    return identifier;
  };

  const parseParenthesizedExpression = (): ParenthesizedExpression => {
    const expr = expression();
    if (!match(TokenType.RightParen)) {
      throw createError("Expected ')' after expression");
    }
    return {
      type: NodeType.ParenthesizedExpression,
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

    throw createError(`Unexpected token: ${peek()?.type}`);
  };

  return program();
}

/**
 * Parses the given program string into an Abstract Syntax Tree (AST).
 * @param program The source code to parse.
 * @returns The root node of the AST representing the entire program.
 */
export function parse(program: string): Program {
  const tokens = lex(program);
  return createParser(tokens, program);
}
