import { Token, TokenType } from "./Token";

export class LexError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`Lex error at line ${line}, column ${column}: ${message}`);
    this.name = "LexError";
  }
}

const KEYWORDS: Record<string, TokenType> = {
  Write: TokenType.WRITE,
  Set: TokenType.SET,
  Define: TokenType.DEFINE,
  Return: TokenType.RETURN,
  End: TokenType.END,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
  true: TokenType.TRUE,
  false: TokenType.FALSE
};

export class Lexer {
  private input: string;
  private readPosition: number = 0;
  private ch: string = "\0";
  private line: number = 1;
  private column: number = 0;

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = "\0";
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.readPosition++;
    this.column++;
  }

  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "\0";
    }
    return this.input[this.readPosition];
  }

  private skipWhitespace(): void {
    while (this.ch === " " || this.ch === "\t" || this.ch === "\r") {
      this.readChar();
    }
  }

  private isLetter(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  // Helpers exist so TypeScript's property narrowing on `this.ch` doesn't
  // flag the `!==` comparisons below as impossible.
  private isLineEnd(): boolean {
    return this.ch === "\n";
  }

  private isEOF(): boolean {
    return this.ch === "\0";
  }

  private readIdentifier(): Token {
    const startColumn = this.column;
    let identifier = "";
    while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
      identifier += this.ch;
      this.readChar();
    }

    // Built-in targets: in.console, in.newline
    if (identifier === "in" && this.ch === ".") {
      this.readChar(); // consume dot
      let target = "";
      while (this.isLetter(this.ch)) {
        target += this.ch;
        this.readChar();
      }
      if (target === "console") {
        return this.makeToken(TokenType.IN_CONSOLE, "in.console", this.line, startColumn);
      }
      if (target === "newline") {
        return this.makeToken(TokenType.IN_NEWLINE, "in.newline", this.line, startColumn);
      }
      throw new LexError(`Unknown target 'in.${target}'`, this.line, startColumn);
    }

    const type = KEYWORDS[identifier] ?? TokenType.IDENTIFIER;
    return this.makeToken(type, identifier, this.line, startColumn);
  }

  private readNumber(): Token {
    const startColumn = this.column;
    let num = "";
    while (this.isDigit(this.ch)) {
      num += this.ch;
      this.readChar();
    }
    // Fractional part: only if a digit follows the dot.
    if (this.ch === "." && this.isDigit(this.peekChar())) {
      num += this.ch;
      this.readChar();
      while (this.isDigit(this.ch)) {
        num += this.ch;
        this.readChar();
      }
    }
    return this.makeToken(TokenType.NUMBER, num, this.line, startColumn);
  }

  private readString(): Token {
    const startColumn = this.column;
    const startLine = this.line;
    this.readChar(); // consume opening quote
    let str = "";
    while (this.ch !== '"' && !this.isLineEnd() && !this.isEOF()) {
      str += this.ch;
      this.readChar();
    }
    if (this.ch !== '"') {
      throw new LexError("Unterminated string literal", startLine, startColumn);
    }
    this.readChar(); // consume closing quote
    return this.makeToken(TokenType.STRING, str, startLine, startColumn);
  }

  private readComment(): Token {
    const startColumn = this.column;
    this.readChar(); // consume '#'
    if (this.ch === "=") {
      this.readChar(); // consume '='
    }
    let comment = "";
    while (!this.isLineEnd() && !this.isEOF()) {
      comment += this.ch;
      this.readChar();
    }
    return this.makeToken(TokenType.COMMENT, comment, this.line, startColumn);
  }

  private makeToken(type: TokenType, value: string, line: number, column: number): Token {
    return { type, value, line, column };
  }

  nextToken(): Token {
    this.skipWhitespace();

    const line = this.line;
    const column = this.column;
    const ch = this.ch;

    // Newlines are significant: they separate statements.
    if (ch === "\n") {
      this.readChar();
      this.line++;
      this.column = 0;
      return this.makeToken(TokenType.NEWLINE, "\n", line, column);
    }

    if (ch === "\0") {
      return this.makeToken(TokenType.EOF, "", line, column);
    }

    if (ch === '"') {
      return this.readString();
    }

    if (ch === "#") {
      return this.readComment();
    }

    if (this.isDigit(ch)) {
      return this.readNumber();
    }

    if (this.isLetter(ch)) {
      return this.readIdentifier();
    }

    // Symbols and multi-character operators.
    switch (ch) {
      case "=":
        this.readChar();
        if (this.ch === "=") {
          this.readChar();
          return this.makeToken(TokenType.EQEQ, "==", line, column);
        }
        return this.makeToken(TokenType.EQUALS, "=", line, column);
      case "!":
        this.readChar();
        if (this.ch === "=") {
          this.readChar();
          return this.makeToken(TokenType.NEQ, "!=", line, column);
        }
        throw new LexError("Unexpected '!' (did you mean '!='?)", line, column);
      case "<":
        this.readChar();
        if (this.ch === "=") {
          this.readChar();
          return this.makeToken(TokenType.LTE, "<=", line, column);
        }
        return this.makeToken(TokenType.LT, "<", line, column);
      case ">":
        this.readChar();
        if (this.ch === "=") {
          this.readChar();
          return this.makeToken(TokenType.GTE, ">=", line, column);
        }
        return this.makeToken(TokenType.GT, ">", line, column);
      case "+":
        this.readChar();
        return this.makeToken(TokenType.PLUS, "+", line, column);
      case "-":
        this.readChar();
        return this.makeToken(TokenType.MINUS, "-", line, column);
      case "*":
        this.readChar();
        return this.makeToken(TokenType.STAR, "*", line, column);
      case "/":
        this.readChar();
        return this.makeToken(TokenType.SLASH, "/", line, column);
      case "%":
        this.readChar();
        return this.makeToken(TokenType.PERCENT, "%", line, column);
      case "(":
        this.readChar();
        return this.makeToken(TokenType.LPAREN, "(", line, column);
      case ")":
        this.readChar();
        return this.makeToken(TokenType.RPAREN, ")", line, column);
      case ",":
        this.readChar();
        return this.makeToken(TokenType.COMMA, ",", line, column);
      default:
        throw new LexError(`Unexpected character '${ch}'`, line, column);
    }
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.nextToken();
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.nextToken();
    }
    tokens.push(token);
    return tokens;
  }
}
