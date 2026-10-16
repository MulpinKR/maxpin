import { Lexer } from "../src/lexer/Lexer";
import { TokenType } from "../src/lexer/Token";

describe("Lexer", () => {
  test("tokenizes comment", () => {
    const lexer = new Lexer("#= Oh! is that comment?");
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.COMMENT);
    expect(tokens[0].value).toBe(" Oh! is that comment?");
  });

  test("tokenizes hello world example", () => {
    const lexer = new Lexer('Write="hello world!"+in.console');
    const tokens = lexer.tokenize();
    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.WRITE);
    expect(types).toContain(TokenType.EQUALS);
    expect(types).toContain(TokenType.STRING);
    expect(types).toContain(TokenType.PLUS);
    expect(types).toContain(TokenType.IN_CONSOLE);
  });

  test("tokenizes in.newline", () => {
    const lexer = new Lexer('Write="test"+in.newline');
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.type === TokenType.IN_NEWLINE)).toBe(true);
  });

  test("tokenizes string", () => {
    const lexer = new Lexer('"hello world!"');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe("hello world!");
  });
});
