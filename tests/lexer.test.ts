import { Lexer } from "../src/lexer/Lexer";
import { TokenType } from "../src/lexer/Token";

function types(code: string): TokenType[] {
  return new Lexer(code).tokenize().map((t) => t.type);
}

describe("Lexer", () => {
  test("tokenizes comment", () => {
    const tokens = new Lexer("#= Oh! is that comment?").tokenize();
    expect(tokens[0].type).toBe(TokenType.COMMENT);
    expect(tokens[0].value).toBe(" Oh! is that comment?");
  });

  test("tokenizes hello world example", () => {
    const tokens = new Lexer('Write="hello world!"+in.console').tokenize();
    const t = tokens.map(t => t.type);
    expect(t).toContain(TokenType.WRITE);
    expect(t).toContain(TokenType.EQUALS);
    expect(t).toContain(TokenType.STRING);
    expect(t).toContain(TokenType.PLUS);
    expect(t).toContain(TokenType.IN_CONSOLE);
  });

  test("tokenizes in.newline", () => {
    expect(types('Write="test"+in.newline')).toContain(TokenType.IN_NEWLINE);
  });

  test("tokenizes string", () => {
    const tokens = new Lexer('"hello world!"').tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe("hello world!");
  });

  test("recognises statement keywords", () => {
    expect(types("Set x = 1")[0]).toBe(TokenType.SET);
    expect(types("Define f()")[0]).toBe(TokenType.DEFINE);
    expect(types("Return 1")[0]).toBe(TokenType.RETURN);
    expect(types("End")[0]).toBe(TokenType.END);
  });

  test("recognises operator keywords and booleans", () => {
    expect(types("a and b or not c")[0]).toBe(TokenType.IDENTIFIER);
    expect(types("and")[0]).toBe(TokenType.AND);
    expect(types("or")[0]).toBe(TokenType.OR);
    expect(types("not")[0]).toBe(TokenType.NOT);
    expect(types("true")[0]).toBe(TokenType.TRUE);
    expect(types("false")[0]).toBe(TokenType.FALSE);
  });

  test("distinguishes = from ==", () => {
    expect(types("x = 1")[1]).toBe(TokenType.EQUALS);
    expect(types("x == 1")[1]).toBe(TokenType.EQEQ);
  });

  test("lexes two-character operators", () => {
    expect(types("a != b")[1]).toBe(TokenType.NEQ);
    expect(types("a <= b")[1]).toBe(TokenType.LTE);
    expect(types("a >= b")[1]).toBe(TokenType.GTE);
  });

  test("lexes arithmetic symbols", () => {
    expect(types("1 - 2")[1]).toBe(TokenType.MINUS);
    expect(types("1 * 2")[1]).toBe(TokenType.STAR);
    expect(types("1 / 2")[1]).toBe(TokenType.SLASH);
    expect(types("1 % 2")[1]).toBe(TokenType.PERCENT);
  });

  test("lexes numbers with fractions", () => {
    const tokens = new Lexer("3.5").tokenize();
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe("3.5");
  });

  test("rejects an unterminated string", () => {
    expect(() => new Lexer('"oops').tokenize()).toThrow(/Unterminated/);
  });

  test("rejects an unknown character", () => {
    expect(() => new Lexer("a @ b").tokenize()).toThrow(/Unexpected character/);
  });
});
