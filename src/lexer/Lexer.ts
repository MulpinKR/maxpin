import { Token, TokenType } from "./Token";

export class Lexer {
  private input: string;
  private position: number = 0;
  private readPosition: number = 0;
  private ch: string = "";
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
    this.position = this.readPosition;
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

  private readIdentifier(): Token {
    const startColumn = this.column;
    let identifier = "";
    while (this.isLetter(this.ch)) {
      identifier += this.ch;
      this.readChar();
    }
    
    // Check for in.<target> — e.g. in.console, in.newline
    if (identifier === "in" && this.ch === ".") {
      this.readChar(); // consume dot
      let target = "";
      while (this.isLetter(this.ch)) {
        target += this.ch;
        this.readChar();
      }
      if (target === "console") {
        return {
          type: TokenType.IN_CONSOLE,
          value: "in.console",
          line: this.line,
          column: startColumn - 1
        };
      }
      if (target === "newline") {
        return {
          type: TokenType.IN_NEWLINE,
          value: "in.newline",
          line: this.line,
          column: startColumn - 1
        };
      }
      // Unknown `in.` target — treat as a plain identifier so the parser can report it
      return {
        type: TokenType.IDENTIFIER,
        value: `in.${target}`,
        line: this.line,
        column: startColumn - 1
      };
    }
    
    const type = this.lookupIdentifier(identifier);
    return {
      type,
      value: identifier,
      line: this.line,
      column: startColumn - 1
    };
  }

  private isLetter(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  private lookupIdentifier(identifier: string): TokenType {
    switch (identifier) {
      case "Write":
        return TokenType.WRITE;
      default:
        return TokenType.IDENTIFIER;
    }
  }

  private readString(): Token {
    const startColumn = this.column;
    let str = "";
    this.readChar(); // consume opening quote
    while (this.ch !== '"' && this.ch !== "\0" && this.ch !== "\n") {
      str += this.ch;
      this.readChar();
    }
    if (this.ch === '"') {
      this.readChar(); // consume closing quote
    }
    return {
      type: TokenType.STRING,
      value: str,
      line: this.line,
      column: startColumn - 1
    };
  }

  private readNumber(): Token {
    const startColumn = this.column;
    let num = "";
    while (this.isDigit(this.ch)) {
      num += this.ch;
      this.readChar();
    }
    return {
      type: TokenType.NUMBER,
      value: num,
      line: this.line,
      column: startColumn - 1
    };
  }

  // Helper methods break TypeScript's property narrowing of `this.ch`,
  // which otherwise makes the `!==` comparisons below look impossible.
  private isLineEnd(): boolean {
    return this.ch === "\n";
  }

  private isEOF(): boolean {
    return this.ch === "\0";
  }

  private readComment(): Token {
    const startColumn = this.column;
    this.readChar(); // consume #
    if (this.ch === "=") {
      this.readChar(); // consume =
    }
    // Read until end of line or end of file (both `#= ...` and `# ...`).
    let comment = "";
    while (!this.isLineEnd() && !this.isEOF()) {
      comment += this.ch;
      this.readChar();
    }
    return {
      type: TokenType.COMMENT,
      value: comment,
      line: this.line,
      column: startColumn - 1
    };
  }

  nextToken(): Token {
    this.skipWhitespace();
    
    let token: Token;
    
    switch (this.ch) {
      case "=":
        token = {
          type: TokenType.EQUALS,
          value: this.ch,
          line: this.line,
          column: this.column
        };
        this.readChar();
        break;
      case "+":
        token = {
          type: TokenType.PLUS,
          value: this.ch,
          line: this.line,
          column: this.column
        };
        this.readChar();
        break;
      case ".":
        // Could be part of in.console - but we handle in readIdentifier
        token = {
          type: TokenType.DOT,
          value: this.ch,
          line: this.line,
          column: this.column
        };
        this.readChar();
        break;
      case '"':
        token = this.readString();
        break;
      case "#":
        token = this.readComment();
        break;
      case "\n":
        token = {
          type: TokenType.NEWLINE,
          value: this.ch,
          line: this.line,
          column: this.column
        };
        this.readChar();
        this.line++;
        this.column = 0;
        break;
      case "\0":
        token = {
          type: TokenType.EOF,
          value: "",
          line: this.line,
          column: this.column
        };
        break;
      default:
        if (this.isLetter(this.ch)) {
          token = this.readIdentifier();
        } else if (this.isDigit(this.ch)) {
          token = this.readNumber();
        } else {
          token = {
            type: TokenType.IDENTIFIER,
            value: this.ch,
            line: this.line,
            column: this.column
          };
          this.readChar();
        }
    }
    
    return token;
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