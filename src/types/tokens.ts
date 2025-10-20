export enum TokenType {
  Assignment = "=",
  LeftParen = "(",
  RightParen = ")",
  Not = "!",
  Minus = "-",
  Plus = "+",
  Asterisk = "*",
  Slash = "/",
  Percent = "%",
  Question = "?",
  Colon = ":",
  Semicolon = ";",
  LessThan = "<",
  GreaterThan = ">",
  LessThanOrEqual = "<=",
  GreaterThanOrEqual = ">=",
  StrictEqual = "===",
  StrictNotEqual = "!==",
  And = "&&",
  Or = "||",
  Identifier = "identifier",
  Number = "number",
  String = "string",
  Arrow = "=>",
  ConsoleLog = "console.log",
  InspectExpanded = "inspect.expanded",
  Let = "let",
  True = "true",
  False = "false",
  Eof = "eof",
}

export type BaseToken = {
  line: number;
  column: number;
};

export type AssignmentToken = { type: TokenType.Assignment };
export type LeftParenToken = { type: TokenType.LeftParen };
export type RightParenToken = { type: TokenType.RightParen };
export type NotToken = { type: TokenType.Not };
export type MinusToken = { type: TokenType.Minus };
export type PlusToken = { type: TokenType.Plus };
export type AsteriskToken = { type: TokenType.Asterisk };
export type SlashToken = { type: TokenType.Slash };
export type PercentToken = { type: TokenType.Percent };
export type LessThanToken = { type: TokenType.LessThan };
export type LessThanOrEqualToken = { type: TokenType.LessThanOrEqual };
export type GreaterThanToken = { type: TokenType.GreaterThan };
export type GreaterThanOrEqualToken = { type: TokenType.GreaterThanOrEqual };
export type StrictEqualToken = { type: TokenType.StrictEqual };
export type StrictNotEqualToken = { type: TokenType.StrictNotEqual };
export type AndToken = { type: TokenType.And };
export type OrToken = { type: TokenType.Or };
export type QuestionToken = { type: TokenType.Question };
export type ColonToken = { type: TokenType.Colon };
export type SemicolonToken = { type: TokenType.Semicolon };
export type IdentifierToken = { type: TokenType.Identifier; value: string };
export type NumberToken = { type: TokenType.Number; value: number };
export type StringToken = { type: TokenType.String; value: string };
export type ArrowToken = { type: TokenType.Arrow };
export type ConsoleLogToken = { type: TokenType.ConsoleLog };
export type InspectExpandedToken = { type: TokenType.InspectExpanded };
export type LetToken = { type: TokenType.Let };
export type TrueToken = { type: TokenType.True };
export type FalseToken = { type: TokenType.False };
export type EofToken = { type: TokenType.Eof };

export type DiscriminatedToken =
  | AssignmentToken
  | LeftParenToken
  | RightParenToken
  | NotToken
  | MinusToken
  | PlusToken
  | AsteriskToken
  | SlashToken
  | PercentToken
  | LessThanToken
  | QuestionToken
  | ColonToken
  | SemicolonToken
  | LessThanOrEqualToken
  | GreaterThanToken
  | GreaterThanOrEqualToken
  | StrictEqualToken
  | StrictNotEqualToken
  | AndToken
  | OrToken
  | IdentifierToken
  | NumberToken
  | StringToken
  | ArrowToken
  | ConsoleLogToken
  | InspectExpandedToken
  | LetToken
  | TrueToken
  | FalseToken
  | EofToken;

export type Token = BaseToken & DiscriminatedToken;
