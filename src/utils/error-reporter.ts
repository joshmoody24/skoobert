export interface ErrorLocation {
  line: number;
  column: number;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public location: ErrorLocation,
    public source: string
  ) {
    super(message);
    this.name = "ParseError";
  }

  override toString(): string {
    const lines = this.source.split("\n");
    const errorLine = lines[this.location.line - 1] || "";

    // Create pointer to error location
    const pointer = " ".repeat(this.location.column - 1) + "^";

    return [
      `${this.name}: ${this.message}`,
      `  at line ${this.location.line}, column ${this.location.column}:`,
      "",
      `  ${this.location.line} | ${errorLine}`,
      `  ${" ".repeat(this.location.line.toString().length)} | ${pointer}`,
      "",
    ].join("\n");
  }
}

export class LexError extends Error {
  constructor(
    message: string,
    public location: ErrorLocation,
    public source: string
  ) {
    super(message);
    this.name = "LexError";
  }

  override toString(): string {
    const lines = this.source.split("\n");
    const errorLine = lines[this.location.line - 1] || "";

    // Create pointer to error location
    const pointer = " ".repeat(this.location.column - 1) + "^";

    return [
      `${this.name}: ${this.message}`,
      `  at line ${this.location.line}, column ${this.location.column}:`,
      "",
      `  ${this.location.line} | ${errorLine}`,
      `  ${" ".repeat(this.location.line.toString().length)} | ${pointer}`,
      "",
    ].join("\n");
  }
}

export class RuntimeError extends Error {
  constructor(
    message: string,
    public location: ErrorLocation,
    public source: string
  ) {
    super(message);
    this.name = "RuntimeError";
  }

  override toString(): string {
    const lines = this.source.split("\n");
    const errorLine = lines[this.location.line - 1] || "";

    // Create pointer to error location
    const pointer = " ".repeat(this.location.column - 1) + "^";

    return [
      `${this.name}: ${this.message}`,
      `  at line ${this.location.line}, column ${this.location.column}:`,
      "",
      `  ${this.location.line} | ${errorLine}`,
      `  ${" ".repeat(this.location.line.toString().length)} | ${pointer}`,
      "",
    ].join("\n");
  }
}
