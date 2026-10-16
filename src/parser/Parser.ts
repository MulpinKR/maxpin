import { Token, TokenType } from "../lexer/Token";
import { Lexer } from "../lexer/Lexer";
import {
  Program,
  Statement,
  WriteStatement,
  Expression,
  StringLiteral,
  BinaryExpression,
  ConsoleTarget,
  Comment
} from "../ast/Node";

export class ParseError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`Parse error at line ${line}, column ${column}: ${message}`);
    this.name = "ParseError";
  }
}

const TARGET_TOKENS: TokenType[] = [TokenType.IN_CONSOLE, TokenType.IN_NEWLINE];
const TARGET_NAMES = new Set(["in.console", "in.newline"]);

export class Parser {
  private tokens: Token[] = [];
  private position: number = 0;

  constructor(lexer: Lexer) {
    this.tokens = lexer.tokenize();
  }

  private currentToken(): Token {
    if (this.position >= this.tokens.length) {
      return { type: TokenType.EOF, value: "", line: 0, column: 0 };
    }
    return this.tokens[this.position];
  }

  private peekToken(): Token {
    if (this.position + 1 >= this.tokens.length) {
      return { type: TokenType.EOF, value: "", line: 0, column: 0 };
    }
    return this.tokens[this.position + 1];
  }

  private nextToken(): void {
    if (this.position < this.tokens.length) {
      this.position++;
    }
  }

  private advancePastNewlines(): void {
    while (this.currentToken().type === TokenType.NEWLINE) {
      this.nextToken();
    }
  }

  parse(): Program {
    const statements: Statement[] = [];

    this.advancePastNewlines();
    while (this.currentToken().type !== TokenType.EOF) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
      this.advancePastNewlines();
    }

    return { type: "Program", statements };
  }

  private parseStatement(): Statement | null {
    const token = this.currentToken();

    switch (token.type) {
      case TokenType.COMMENT:
        return this.parseComment();
      case TokenType.WRITE:
        return this.parseWriteStatement();
      case TokenType.EOF:
        return null;
      default:
        throw new ParseError(
          `Unexpected token "${token.value}" — statements must start with Write or a comment`,
          token.line,
          token.column
        );
    }
  }

  private parseComment(): Comment {
    const token = this.currentToken();
    this.nextToken();
    return { type: "Comment", value: token.value };
  }

  private parseWriteStatement(): WriteStatement {
    const writeToken = this.currentToken();
    this.nextToken(); // consume Write

    if (this.currentToken().type !== TokenType.EQUALS) {
      throw new ParseError(
        'Expected "=" after Write',
        this.currentToken().line,
        this.currentToken().column
      );
    }
    this.nextToken(); // consume "="

    // The value is everything up to the final "+" that separates it from the target.
    const value = this.parseValue();

    if (this.currentToken().type !== TokenType.PLUS) {
      throw new ParseError(
        'Expected "+" before a target such as in.console',
        this.currentToken().line,
        this.currentToken().column
      );
    }
    this.nextToken(); // consume "+"

    const target = this.parseTarget();

    return { type: "WriteStatement", value, target };
  }

  // Parses a value expression: a string literal, optionally followed by
  // "+" (string | number) pairs. Numbers are coerced to strings.
  private parseValue(): Expression {
    let left = this.parseAtom();

    while (this.currentToken().type === TokenType.PLUS &&
           TARGET_TOKENS.indexOf(this.peekToken().type) === -1 &&
           TARGET_NAMES.has(this.peekToken().value) === false) {
      this.nextToken(); // consume "+"
      const right = this.parseAtom();
      const combined: BinaryExpression = {
        type: "BinaryExpression",
        left,
        operator: "+",
        right
      };
      left = combined;
    }

    return left;
  }

  private parseAtom(): Expression {
    const token = this.currentToken();

    if (token.type === TokenType.STRING) {
      const literal: StringLiteral = { type: "StringLiteral", value: token.value };
      this.nextToken();
      return literal;
    }

    if (token.type === TokenType.NUMBER) {
      const literal: StringLiteral = { type: "StringLiteral", value: token.value };
      this.nextToken();
      return literal;
    }

    throw new ParseError(
      `Expected a value, got "${token.value || token.type}"`,
      token.line,
      token.column
    );
  }

  private parseTarget(): ConsoleTarget {
    const token = this.currentToken();

    if (token.type === TokenType.IN_CONSOLE) {
      this.nextToken();
      return { type: "ConsoleTarget", value: "console" };
    }

    if (token.type === TokenType.IN_NEWLINE) {
      this.nextToken();
      return { type: "ConsoleTarget", value: "newline" };
    }

    if (token.type === TokenType.IDENTIFIER && TARGET_NAMES.has(token.value)) {
      this.nextToken();
      return {
        type: "ConsoleTarget",
        value: token.value === "in.newline" ? "newline" : "console"
      };
    }

    throw new ParseError(
      `Expected a target such as in.console, got "${token.value || token.type}"`,
      token.line,
      token.column
    );
  }
}
