import {
  Program,
  Statement,
  WriteStatement,
  Expression,
  BinaryExpression,
  ConsoleTarget
} from "../ast/Node";

/**
 * Walks the AST and produces the program's output as a string.
 *
 * The interpreter is deliberately free of side effects: it never writes to
 * stdout directly. Callers (the CLI, tests, an embedder) decide what to do
 * with the returned string. Writing to stdout from here would make output
 * ordering fragile, since writes to a pipe are asynchronous.
 */
export class Interpreter {
  interpret(program: Program): string {
    let output = "";
    for (const stmt of program.statements) {
      output += this.evaluateStatement(stmt);
    }
    return output;
  }

  private evaluateStatement(stmt: Statement): string {
    switch (stmt.type) {
      case "Comment":
        // Comments produce no output.
        return "";
      case "WriteStatement":
        return this.evaluateWriteStatement(stmt);
    }
  }

  private evaluateWriteStatement(stmt: WriteStatement): string {
    const value = this.evaluateExpression(stmt.value);
    return this.renderTarget(stmt.target, value);
  }

  private renderTarget(target: ConsoleTarget, value: string): string {
    switch (target.value) {
      case "console":
        // Write exactly, no trailing newline.
        return value;
      case "newline":
        // Write the value, then move to the next line.
        return value + "\n";
    }
  }

  private evaluateExpression(expr: Expression): string {
    switch (expr.type) {
      case "StringLiteral":
        return expr.value;
      case "BinaryExpression":
        return this.evaluateBinaryExpression(expr);
      case "ConsoleTarget":
        return expr.value;
      default:
        return "";
    }
  }

  private evaluateBinaryExpression(expr: BinaryExpression): string {
    const left = this.evaluateExpression(expr.left);
    const right = this.evaluateExpression(expr.right);
    return left + right;
  }
}
