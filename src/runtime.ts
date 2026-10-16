import { Lexer } from "./lexer/Lexer";
import { Parser } from "./parser/Parser";
import { Interpreter } from "./interpreter/Interpreter";
import { Environment } from "./interpreter/Environment";
import { MaxpinValue, CallResult } from "./interpreter/values";

/**
 * Public entry point for embedding Maxpin.
 *
 * `run` executes source and returns the program's output as a string. It does
 * not write to stdout; callers decide what to do with the result.
 *
 * The class form is the seed of game embedding: a host can define native
 * functions, then call Maxpin functions back from its own code.
 */
export class Maxpin {
  private interpreter: Interpreter;

  constructor(globals?: Environment) {
    this.interpreter = new Interpreter(globals);
  }

  /** Lex, parse and run a program, returning everything it wrote. */
  execute(code: string): string {
    const program = new Parser(new Lexer(code)).parse();
    return this.interpreter.interpret(program);
  }

  /** Register a native function that .mpin code can call. */
  defineNative(
    name: string,
    arity: number | null,
    call: (args: MaxpinValue[]) => MaxpinValue
  ): void {
    this.interpreter.defineNative(name, arity, call);
  }

  /** Set the maximum depth of nested .mpin function calls. */
  setMaxCallDepth(depth: number): this {
    if (depth <= 0) {
      throw new Error("max call depth must be a positive number");
    }
    this.interpreter.maxCallDepth = depth;
    return this;
  }

  /**
   * Call a top-level .mpin function from host code.
   *
   * Returns both the function's value and everything it wrote, so script
   * output is never silently dropped.
   */
  call(name: string, args: MaxpinValue[] = []): CallResult {
    return this.interpreter.runGlobal(name, args);
  }

  getGlobalEnvironment(): Environment {
    return this.interpreter.getGlobalEnvironment();
  }
}

/** Convenience helper: run Maxpin source and return the output. */
export function run(code: string): string {
  return new Maxpin().execute(code);
}
