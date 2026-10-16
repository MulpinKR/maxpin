export enum TokenType {
  // Statement keywords
  WRITE = "WRITE",
  SET = "SET",
  DEFINE = "DEFINE",
  RETURN = "RETURN",
  END = "END",

  // Operator keywords
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Literals
  TRUE = "TRUE",
  FALSE = "FALSE",
  STRING = "STRING",
  NUMBER = "NUMBER",
  IDENTIFIER = "IDENTIFIER",

  // Symbols
  EQUALS = "EQUALS", // =
  EQEQ = "EQEQ", // ==
  NEQ = "NEQ", // !=
  LT = "LT", // <
  GT = "GT", // >
  LTE = "LTE", // <=
  GTE = "GTE", // >=
  PLUS = "PLUS", // +
  MINUS = "MINUS", // -
  STAR = "STAR", // *
  SLASH = "SLASH", // /
  PERCENT = "PERCENT", // %
  LPAREN = "LPAREN", // (
  RPAREN = "RPAREN", // )
  COMMA = "COMMA", // ,

  // Comments
  COMMENT = "COMMENT",

  // Structure
  NEWLINE = "NEWLINE",
  EOF = "EOF",

  // Built-in targets
  IN_CONSOLE = "IN_CONSOLE",
  IN_NEWLINE = "IN_NEWLINE"
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
