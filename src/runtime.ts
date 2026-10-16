import { Lexer } from "./lexer/Lexer";
import { Parser } from "./parser/Parser";
import { Interpreter } from "./interpreter/Interpreter";

/**
 * Public entry point for embedding Maxpin.
 *
 * `execute` runs the whole pipeline (lex -> parse -> interpret) and returns
 * the program's output as a string. It does not write to stdout; callers
 * decide what to do with the result.
 */
export class Maxpin {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter();
  }

  execute(code: string): string {
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const program = parser.parse();
    return this.interpreter.interpret(program);
  }

  executeFile(content: string): string {
    return this.execute(content);
  }
}

/** Convenience helper: run Maxpin source and return the output. */
export function run(code: string): string {
  return new Maxpin().execute(code);
}
