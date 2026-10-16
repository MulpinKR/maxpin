import { Lexer } from "../src/lexer/Lexer";
import { Parser } from "../src/parser/Parser";

function parse(code: string) {
  return new Parser(new Lexer(code)).parse();
}

describe("Parser", () => {
  test("parses hello world example", () => {
    const program = parse('Write="hello world!"+in.console');
    expect(program.type).toBe("Program");
    expect(program.statements.length).toBe(1);
    const stmt: any = program.statements[0];
    expect(stmt.type).toBe("WriteStatement");
    expect(stmt.target.value).toBe("console");
  });

  test("parses comment", () => {
    const program = parse("#= Oh! is that comment?");
    expect(program.statements[0].type).toBe("Comment");
  });

  test("throws on missing target", () => {
    expect(() => parse('Write="hello"')).toThrow();
  });

  test("throws on missing equals", () => {
    expect(() => parse('Write "hello"+in.console')).toThrow();
  });
});
