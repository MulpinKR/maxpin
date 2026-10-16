import { Lexer } from "../src/lexer/Lexer";
import { Parser } from "../src/parser/Parser";
import { Program } from "../src/ast/Node";

function parse(code: string): Program {
  return new Parser(new Lexer(code)).parse();
}

describe("Parser", () => {
  test("parses hello world example", () => {
    const program = parse('Write="hello world!"+in.console');
    expect(program.statements.length).toBe(1);
    const stmt: any = program.statements[0];
    expect(stmt.type).toBe("WriteStatement");
    expect(stmt.target.value).toBe("console");
  });

  test("parses comment", () => {
    expect(parse("#= Oh! is that comment?").statements[0].type).toBe("Comment");
  });

  test("parses Set", () => {
    const stmt: any = parse('Set name = "Mulpin"').statements[0];
    expect(stmt.type).toBe("SetStatement");
    expect(stmt.name).toBe("name");
  });

  test("parses Define with parameters and body", () => {
    const stmt: any = parse("Define add(a, b)\nReturn a + b\nEnd").statements[0];
    expect(stmt.type).toBe("DefineStatement");
    expect(stmt.name).toBe("add");
    expect(stmt.params).toEqual(["a", "b"]);
    expect(stmt.body[0].type).toBe("ReturnStatement");
  });

  test("parses a call statement", () => {
    const stmt: any = parse('greet("hi")').statements[0];
    expect(stmt.type).toBe("ExpressionStatement");
    expect(stmt.expression.type).toBe("CallExpression");
  });

  test("Write target is not swallowed by the expression", () => {
    const stmt: any = parse('Write="a" + "b"+in.console').statements[0];
    expect(stmt.value.type).toBe("BinaryExpression");
    expect(stmt.target.value).toBe("console");
  });

  test("throws on missing '=' after Write", () => {
    expect(() => parse('Write "hello"+in.console')).toThrow(/Expected "="/);
  });

  test("throws on missing target", () => {
    expect(() => parse('Write="hello"')).toThrow(/Expected "\+"/);
  });

  test("throws on unknown target", () => {
    expect(() => parse('Write="hello"+in.nowhere')).toThrow();
  });

  test("throws on a bare expression statement", () => {
    expect(() => parse("1 + 2")).toThrow(/must be Write, Set, Define/);
  });

  test("throws on an unclosed Define", () => {
    expect(() => parse("Define f()\nReturn 1")).toThrow(/Expected "End"/);
  });
});
