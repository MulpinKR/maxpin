import { Lexer } from "../src/lexer/Lexer";
import { Parser } from "../src/parser/Parser";
import { Interpreter } from "../src/interpreter/Interpreter";

function run(code: string): string {
  const lexer = new Lexer(code);
  const parser = new Parser(lexer);
  const program = parser.parse();
  const interpreter = new Interpreter();
  return interpreter.interpret(program);
}

describe("Interpreter", () => {
  // The interpreter must be side-effect free: it returns output instead of
  // writing to stdout. This suite would print garbage if it wrote directly.
  test("does not write to stdout", () => {
    const spy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    run('Write="quiet"+in.console');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("interprets hello world example", () => {
    expect(run('Write="hello world!"+in.console')).toBe("hello world!");
  });

  test("writes a newline with in.newline", () => {
    expect(run('Write="Line 1"+in.newline')).toBe("Line 1\n");
  });

  test("interprets multiple writes", () => {
    const code = 'Write="Line 1"+in.newline\nWrite="Line 2"+in.newline\nWrite="Line 3 "+in.console';
    expect(run(code)).toBe("Line 1\nLine 2\nLine 3 ");
  });

  test("concatenates multiple values", () => {
    expect(run('Write="hello "+ "world"+in.console')).toBe("hello world");
  });

  test("ignores comments", () => {
    expect(run('#= Oh! is that comment?\nWrite="test"+in.console')).toBe("test");
  });

  test("handles an empty program", () => {
    expect(run("")).toBe("");
  });
});
