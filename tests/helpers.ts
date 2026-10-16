import { Lexer } from "../src/lexer/Lexer";
import { Parser } from "../src/parser/Parser";
import { Interpreter } from "../src/interpreter/Interpreter";
import { Maxpin } from "../src/runtime";

/** Run Maxpin source and return its output. */
export function run(code: string): string {
  const program = new Parser(new Lexer(code)).parse();
  return new Interpreter().interpret(program);
}

/** Run Maxpin source with a fresh embeddable host. */
export function host(): Maxpin {
  return new Maxpin();
}

/** Expect `code` to fail at runtime, returning the error message. */
export function runError(code: string): string {
  try {
    run(code);
  } catch (err) {
    return (err as Error).message;
  }
  throw new Error(`Expected code to fail, but it succeeded:\n${code}`);
}
