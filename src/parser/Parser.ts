import { Token, TokenType } from "../lexer/Token";
import { Lexer } from "../lexer/Lexer";
import {
  Program,
  Statement,
  WriteStatement,
  SetStatement,
  DefineStatement,
  ReturnStatement,
  ExpressionStatement,
  Comment,
  Expression,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  Identifier,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  ConsoleTarget
} from "../ast/Node";

export class ParseError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`Parse error at line ${line}, column ${column}: ${message}`);
    this.name = "ParseError";
  }
}

function isTargetToken(type: TokenType): boolean {
  return type === TokenType.IN_CONSOLE || type === TokenType.IN_NEWLINE;
}

export class Parser {
  private tokens: Token[] = [];
  private position: number = 0;

  constructor(lexer: Lexer) {
    this.tokens = lexer.tokenize();
  }

  // --- token helpers -------------------------------------------------------

  private current(): Token {
    return this.peek(0);
  }

  private peek(offset: number): Token {
    const i = this.position + offset;
    if (i >= this.tokens.length) {
      return { type: TokenType.EOF, value: "", line: 0, column: 0 };
    }
    return this.tokens[i];
  }

  private next(): Token {
    const token = this.current();
    if (this.position < this.tokens.length) {
      this.position++;
    }
    return token;
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.next();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.next();
    }
    const t = this.current();
    throw new ParseError(`${message} (got ${describe(t)})`, t.line, t.column);
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.next();
    }
  }

  // --- entry point ---------------------------------------------------------

  parse(): Program {
    const statements: Statement[] = [];
    this.skipNewlines();
    while (!this.check(TokenType.EOF)) {
      statements.push(this.parseStatement());
      this.skipNewlines();
    }
    return { type: "Program", statements };
  }

  // --- statements ----------------------------------------------------------

  private parseStatement(): Statement {
    switch (this.current().type) {
      case TokenType.COMMENT:
        return this.parseComment();
      case TokenType.WRITE:
        return this.parseWrite();
      case TokenType.SET:
        return this.parseSet();
      case TokenType.DEFINE:
        return this.parseDefine();
      case TokenType.RETURN:
        return this.parseReturn();
      case TokenType.IF:
        return this.parseIf();
      case TokenType.WHILE:
        return this.parseWhile();
      case TokenType.REPEAT:
        return this.parseRepeat();
      case TokenType.END: {
        const t = this.current();
        throw new ParseError('Unexpected "End" with no matching block', t.line, t.column);
      }
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseComment(): Comment {
    const token = this.next();
    return { type: "Comment", value: token.value };
  }

  private parseWrite(): WriteStatement {
    this.next(); // Write
    this.expect(TokenType.EQUALS, 'Expected "=" after Write');
    const value = this.parseExpression();
    this.expect(TokenType.PLUS, 'Expected "+" before a target such as in.console');
    const target = this.parseTarget();
    return { type: "WriteStatement", value, target };
  }

  private parseSet(): SetStatement {
    this.next(); // Set
    const name = this.expect(TokenType.IDENTIFIER, "Expected a variable name after Set").value;
    this.expect(TokenType.EQUALS, 'Expected "=" after the variable name');
    const value = this.parseExpression();
    return { type: "SetStatement", name, value };
  }

  private parseDefine(): DefineStatement {
    this.next(); // Define
    const name = this.expect(TokenType.IDENTIFIER, "Expected a function name after Define").value;
    this.expect(TokenType.LPAREN, 'Expected "(" after the function name');

    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.expect(TokenType.IDENTIFIER, "Expected a parameter name").value);
      } while (this.match(TokenType.COMMA));
    }
    this.expect(TokenType.RPAREN, 'Expected ")" after the parameters');

    this.skipNewlines();
    const body = this.parseBlock();
    this.expect(TokenType.END, 'Expected "End" to close Define');
    return { type: "DefineStatement", name, params, body };
  }

  private parseReturn(): ReturnStatement {
    this.next(); // Return
    if (
      this.check(TokenType.NEWLINE) ||
      this.check(TokenType.END) ||
      this.check(TokenType.EOF)
    ) {
      return { type: "ReturnStatement", value: null };
    }
    return { type: "ReturnStatement", value: this.parseExpression() };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const token = this.current();
    const expression = this.parseExpression();
    if (expression.type !== "CallExpression") {
      throw new ParseError(
        "A statement must be Write, Set, Define, Return, End, a call, or a comment",
        token.line,
        token.column
      );
    }
    return { type: "ExpressionStatement", expression };
  }

  private parseBlock(stopAtElse?: boolean): Statement[] {
    const statements: Statement[] = [];
    this.skipNewlines();
    while (
      !this.check(TokenType.END) &&
      !this.check(TokenType.EOF) &&
      !(stopAtElse && this.check(TokenType.ELSE))
    ) {
      statements.push(this.parseStatement());
      this.skipNewlines();
    }
    return statements;
  }

  private parseIf(): import("../ast/Node").IfStatement {
    this.next(); // If
    const condition = this.parseExpression();
    this.skipNewlines();
    const consequent = this.parseBlock(true);

    let alternate: import("../ast/Node").IfStatement["alternate"] = null;
    if (this.check(TokenType.ELSE)) {
      this.next(); // Else
      this.skipNewlines();
      if (this.check(TokenType.IF)) {
        // else-if chain
        alternate = this.parseIfChain();
      } else {
        // else block
        alternate = this.parseBlock();
      }
    }
    // End is consumed by parseIfChain at the appropriate level
    return { type: "IfStatement", condition, consequent, alternate };
  }

  private parseIfChain(): import("../ast/Node").IfStatement {
    const node = this.parseIf();
    // If this If has a final else-block or no else, it owns the End
    // If it has an else-if, that else-if chain owns the End
    if (node.alternate === null || Array.isArray(node.alternate)) {
      this.expect(TokenType.END, 'Expected "End" to close If');
    }
    return node;
  }

  private parseWhile(): import("../ast/Node").WhileStatement {
    this.next(); // While
    const condition = this.parseExpression();
    this.skipNewlines();
    const body = this.parseBlock();
    this.expect(TokenType.END, 'Expected "End" to close While');
    return { type: "WhileStatement", condition, body };
  }

  private parseRepeat(): import("../ast/Node").RepeatStatement {
    this.next(); // Repeat
    const count = this.parseExpression();
    // expect "times"
    this.skipNewlines();
    if (this.check(TokenType.TIMES)) {
      this.next();
    } else if (this.check(TokenType.IDENTIFIER) && this.current().value === "times") {
      this.next();
    } else {
      // sometimes times might be parsed differently? it's a keyword now
      const t = this.current();
      throw new ParseError('Expected "times" after the count', t.line, t.column);
    }
    this.skipNewlines();
    const body = this.parseBlock();
    this.expect(TokenType.END, 'Expected "End" to close Repeat');
    return { type: "RepeatStatement", count, body };
  }

  private parseTarget(): ConsoleTarget {
    if (this.match(TokenType.IN_CONSOLE)) {
      return { type: "ConsoleTarget", value: "console" };
    }
    if (this.match(TokenType.IN_NEWLINE)) {
      return { type: "ConsoleTarget", value: "newline" };
    }
    const t = this.current();
    throw new ParseError(
      `Expected a target such as in.console (got ${describe(t)})`,
      t.line,
      t.column
    );
  }

  // --- expressions (lowest to highest precedence) --------------------------

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    while (this.match(TokenType.OR)) {
      const right = this.parseAnd();
      left = binary("or", left, right);
    }
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseEquality();
    while (this.match(TokenType.AND)) {
      const right = this.parseEquality();
      left = binary("and", left, right);
    }
    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();
    while (this.check(TokenType.EQEQ) || this.check(TokenType.NEQ)) {
      const op = this.next().value;
      const right = this.parseComparison();
      left = binary(op, left, right);
    }
    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseAdditive();
    while (
      this.check(TokenType.LT) ||
      this.check(TokenType.GT) ||
      this.check(TokenType.LTE) ||
      this.check(TokenType.GTE)
    ) {
      const op = this.next().value;
      const right = this.parseAdditive();
      left = binary(op, left, right);
    }
    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      // A "+" immediately followed by a target belongs to Write, not to the
      // expression: `Write="hi"+in.console`.
      if (this.check(TokenType.PLUS) && isTargetToken(this.peek(1).type)) {
        break;
      }
      const op = this.next().value;
      const right = this.parseMultiplicative();
      left = binary(op, left, right);
    }
    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();
    while (
      this.check(TokenType.STAR) ||
      this.check(TokenType.SLASH) ||
      this.check(TokenType.PERCENT)
    ) {
      const op = this.next().value;
      const right = this.parseUnary();
      left = binary(op, left, right);
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.MINUS)) {
      return unary("-", this.parseUnary());
    }
    if (this.match(TokenType.NOT)) {
      return unary("not", this.parseUnary());
    }
    return this.parseCall();
  }

  private parseCall(): Expression {
    let expr = this.parsePrimary();
    while (this.check(TokenType.LPAREN)) {
      this.next(); // (
      const args: Expression[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.expect(TokenType.RPAREN, 'Expected ")" after the arguments');
      expr = { type: "CallExpression", callee: expr, args };
    }
    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.current();

    switch (token.type) {
      case TokenType.STRING:
        this.next();
        return { type: "StringLiteral", value: token.value };
      case TokenType.NUMBER:
        this.next();
        return { type: "NumberLiteral", value: Number(token.value) };
      case TokenType.TRUE:
        this.next();
        return { type: "BooleanLiteral", value: true };
      case TokenType.FALSE:
        this.next();
        return { type: "BooleanLiteral", value: false };
      case TokenType.IDENTIFIER:
        this.next();
        return { type: "Identifier", name: token.value };
      case TokenType.LPAREN: {
        this.next();
        const expr = this.parseExpression();
        this.expect(TokenType.RPAREN, 'Expected ")" to close the group');
        return expr;
      }
      default:
        throw new ParseError(`Expected a value (got ${describe(token)})`, token.line, token.column);
    }
  }
}

function binary(operator: string, left: Expression, right: Expression): BinaryExpression {
  return { type: "BinaryExpression", operator, left, right };
}

function unary(operator: string, operand: Expression): UnaryExpression {
  return { type: "UnaryExpression", operator, operand };
}

function describe(token: Token): string {
  if (token.type === TokenType.EOF) return "end of file";
  if (token.type === TokenType.NEWLINE) return "end of line";
  return `"${token.value}"`;
}
