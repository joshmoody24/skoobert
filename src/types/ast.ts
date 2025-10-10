export enum NodeType {
  Program = "program",
  Statement = "statement",
  VariableDeclaration = "variable-declaration",
  Expression = "expression",
  Conditional = "conditional",
  LogicalOr = "logical-or",
  LogicalAnd = "logical-and",
  Equality = "equality",
  Relational = "relational",
  Additive = "additive",
  Multiplicative = "multiplicative",
  Unary = "unary",
  Literal = "literal",
  Identifier = "identifier",
  ParenthesizedExpression = "parenthesized-expression",
  ArrowFunction = "arrow-function",
  FunctionCall = "function-call",
  SideEffect = "side-effect",
  ConsoleLog = "console-log",
  Number = "number",
  String = "string",
  Boolean = "boolean",
}

export type Program = { type: NodeType.Program; statements: Statement[] };

export type Statement = {
  type: NodeType.Statement;
  body: VariableDeclaration | SideEffect;
};

export type VariableDeclaration = {
  type: NodeType.VariableDeclaration;
  identifier: Identifier;
  expression: Expression;
};

export type Expression = {
  type: NodeType.Expression;
  body: ConditionalExpression;
};

export type ConditionalExpression =
  | LogicalOrExpression
  | {
      type: NodeType.Conditional;
      condition: LogicalOrExpression;
      valueIfTrue: Expression;
      valueIfFalse: Expression;
    };

export type LogicalOrExpression =
  | LogicalAndExpression
  | {
      type: NodeType.LogicalOr;
      left: LogicalOrExpression;
      right: LogicalAndExpression;
    };

export type LogicalAndExpression =
  | EqualityExpression
  | {
      type: NodeType.LogicalAnd;
      left: LogicalAndExpression;
      right: EqualityExpression;
    };

export type EqualityExpression =
  | RelationalExpression
  | {
      type: NodeType.Equality;
      operator: "===" | "!==";
      left: EqualityExpression;
      right: RelationalExpression;
    };

export type RelationalExpression =
  | AdditiveExpression
  | {
      type: NodeType.Relational;
      operator: "<" | "<=" | ">" | ">=";
      left: RelationalExpression;
      right: AdditiveExpression;
    };

export type AdditiveExpression =
  | MultiplicativeExpression
  | {
      type: NodeType.Additive;
      operator: "+" | "-";
      left: AdditiveExpression;
      right: MultiplicativeExpression;
    };

export type MultiplicativeExpression =
  | UnaryExpression
  | {
      type: NodeType.Multiplicative;
      operator: "*" | "/" | "%";
      left: MultiplicativeExpression;
      right: UnaryExpression;
    };

export type UnaryExpression =
  | PrimaryExpression
  | {
      type: NodeType.Unary;
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
  type: NodeType.ParenthesizedExpression;
  expression: Expression;
};

export type ArrowFunction = {
  type: NodeType.ArrowFunction;
  parameter: Identifier;
  body: Expression;
};

export type FunctionCall = {
  type: NodeType.FunctionCall;
  callee: Expression;
  argument: Expression;
};

export type Literal = {
  type: NodeType.Literal;
  body: NumberLiteral | StringLiteral | BooleanLiteral;
};

export type NumberLiteral = { type: NodeType.Number; value: number };

export type StringLiteral = { type: NodeType.String; value: string };

export type BooleanLiteral = { type: NodeType.Boolean; value: boolean };

export type Identifier = {
  type: NodeType.Identifier;
  name: string;
};

export type SideEffect = { type: NodeType.SideEffect; body: ConsoleLog };

export type ConsoleLog = { type: NodeType.ConsoleLog; argument: Expression };
