export enum TokenType {
  // Keywords
  WRITE = "WRITE",
  
  // Literals
  STRING = "STRING",
  NUMBER = "NUMBER",
  IDENTIFIER = "IDENTIFIER",
  
  // Operators/Symbols
  EQUALS = "EQUALS",
  PLUS = "PLUS",
  DOT = "DOT",
  
  // Comments
  COMMENT = "COMMENT",
  
  // Structure
  NEWLINE = "NEWLINE",
  EOF = "EOF",
  
  // Special
  IN_CONSOLE = "IN_CONSOLE",
  IN_NEWLINE = "IN_NEWLINE"
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}