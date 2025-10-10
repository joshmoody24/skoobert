export type Program = { type: "program"; statements: Statement[] };

export type Statement = {
  type: "statement";
  body: VariableDeclaration | SideEffect;
};

export type VariableDeclaration = {
  type: "variable-declaration";
  identifier: Identifier;
  expression: Expression;
};

export type Expression = {
  type: "expression";
  body: ConditionalExpression;
};

export type ConditionalExpression =
  | LogicalOrExpression
  | {
      type: "conditional";
      condition: LogicalOrExpression;
      valueIfTrue: Expression;
      valueIfFalse: Expression;
    };

export type LogicalOrExpression =
  | LogicalAndExpression
  | {
      type: "logical-or";
      left: LogicalOrExpression;
      right: LogicalAndExpression;
    };

export type LogicalAndExpression =
  | EqualityExpression
  | {
      type: "logical-and";
      left: LogicalAndExpression;
      right: EqualityExpression;
    };

export type EqualityExpression =
  | RelationalExpression
  | {
      type: "equality";
      operator: "===" | "!==";
      left: EqualityExpression;
      right: RelationalExpression;
    };

export type RelationalExpression =
  | AdditiveExpression
  | {
      type: "relational";
      operator: "<" | "<=" | ">" | ">=";
      left: RelationalExpression;
      right: AdditiveExpression;
    };

export type AdditiveExpression =
  | MultiplicativeExpression
  | {
      type: "additive";
      operator: "+" | "-";
      left: AdditiveExpression;
      right: MultiplicativeExpression;
    };

export type MultiplicativeExpression =
  | UnaryExpression
  | {
      type: "multiplicative";
      operator: "*" | "/" | "%";
      left: MultiplicativeExpression;
      right: UnaryExpression;
    };

export type UnaryExpression =
  | PrimaryExpression
  | {
      type: "unary";
      operator: "!" | "-";
      operand: UnaryExpression;
    };

export type PrimaryExpression =
  | Literal
  | Identifier
  | ParenthesizedExpression
  | ArrowFunction
  | FunctionCall;

export type ParenthesizedExpression = {
  type: "parenthesized-expression";
  expression: Expression;
};

export type ArrowFunction = {
  type: "arrow-function";
  parameter: Identifier;
  body: Expression;
};

export type FunctionCall = {
  type: "function-call";
  callee: Expression;
  argument: Expression;
};

export type Literal = {
  type: "literal";
  body: NumberLiteral | StringLiteral | BooleanLiteral;
};

export type NumberLiteral = { type: "number"; value: number };

export type StringLiteral = { type: "string"; value: string };

export type BooleanLiteral = { type: "boolean"; value: boolean };

export type Identifier = {
  type: "identifier";
  name: string;
};

export type SideEffect = { type: "side-effect"; body: ConsoleLog };

export type ConsoleLog = { type: "console-log"; argument: Expression };
