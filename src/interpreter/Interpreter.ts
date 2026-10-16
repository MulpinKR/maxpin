import {
  Program,
  Statement,
  Expression,
  WriteStatement,
  SetStatement,
  DefineStatement,
  ReturnStatement,
  ExpressionStatement,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  ConsoleTarget
} from "../ast/Node";
import { Environment } from "./Environment";
import {
  MaxpinValue,
  MaxpinFunction,
  NativeFunction,
  isFunction,
  isTruthy,
  stringify,
  RuntimeError,
  ReturnSignal,
  CallResult
} from "./values";
import { installStdlib } from "./stdlib";

export { RuntimeError } from "./values";

/**
 * Walks the AST and produces the program's output as a string.
 *
 * The interpreter is free of external side effects: it collects output in a
 * buffer and returns it. Callers (the CLI, tests, an embedder) decide what to
 * do with the result. This keeps output ordering reliable, since writes to a
 * pipe are asynchronous.
 */
export class Interpreter {
  private globals: Environment;
  private env: Environment;
  private output: string[] = [];

  constructor(globals?: Environment) {
    this.globals = globals ?? new Environment();
    installStdlib(this.globals);
    this.env = this.globals;
  }

  /** The global scope, exposed so a host program can inject its own values. */
  getGlobalEnvironment(): Environment {
    return this.globals;
  }

  /** Call a top-level (global) function by name — for host/game embedding. */
  callGlobal(name: string, args: MaxpinValue[] = []): MaxpinValue {
    const fn = this.globals.get(name);
    if (!isFunction(fn)) {
      throw new RuntimeError(`'${name}' is not a function`);
    }
    return this.callFunction(fn, args);
  }

  /**
   * Call a top-level function and capture everything it writes, so host code
   * does not lose the script's output.
   */
  runGlobal(name: string, args: MaxpinValue[] = []): CallResult {
    this.output = [];
    const value = this.callGlobal(name, args);
    return { value, output: this.output.join("") };
  }

  /** Define a native function in the global scope (used for game embedding). */
  defineNative(
    name: string,
    arity: number | null,
    call: (args: MaxpinValue[]) => MaxpinValue
  ): void {
    this.globals.set(name, { kind: "native", name, arity, call });
  }

  interpret(program: Program): string {
    this.output = [];
    this.env = this.globals;
    this.executeBlock(program.statements, this.env);
    return this.output.join("");
  }

  private executeBlock(statements: Statement[], env: Environment): void {
    for (const statement of statements) {
      this.execute(statement, env);
    }
  }

  private execute(statement: Statement, env: Environment): void {
    switch (statement.type) {
      case "Comment":
        return;
      case "WriteStatement":
        this.executeWrite(statement, env);
        return;
      case "SetStatement":
        this.executeSet(statement, env);
        return;
      case "DefineStatement":
        this.executeDefine(statement, env);
        return;
      case "ReturnStatement":
        this.executeReturn(statement, env);
        return;
      case "ExpressionStatement":
        this.evaluate(statement.expression, env);
        return;
    }
  }

  private executeWrite(statement: WriteStatement, env: Environment): void {
    const value = this.evaluate(statement.value, env);
    const text = stringify(value);
    this.output.push(statement.target.value === "newline" ? text + "\n" : text);
  }

  private executeSet(statement: SetStatement, env: Environment): void {
    const value = this.evaluate(statement.value, env);
    // Update the nearest existing variable; otherwise create it here.
    if (!env.assign(statement.name, value)) {
      env.set(statement.name, value);
    }
  }

  private executeDefine(statement: DefineStatement, env: Environment): void {
    const fn: MaxpinFunction = {
      kind: "function",
      name: statement.name,
      params: statement.params,
      body: statement.body,
      closure: env
    };
    env.set(statement.name, fn);
  }

  private executeReturn(statement: ReturnStatement, env: Environment): void {
    const value = statement.value === null ? undefined : this.evaluate(statement.value, env);
    throw new ReturnSignal(value);
  }

  // --- expressions ---------------------------------------------------------

  private evaluate(expr: Expression, env: Environment): MaxpinValue {
    switch (expr.type) {
      case "StringLiteral":
        return expr.value;
      case "NumberLiteral":
        return expr.value;
      case "BooleanLiteral":
        return expr.value;
      case "Identifier":
        return env.get(expr.name);
      case "BinaryExpression":
        return this.evaluateBinary(expr, env);
      case "UnaryExpression":
        return this.evaluateUnary(expr, env);
      case "CallExpression":
        return this.evaluateCall(expr, env);
    }
  }

  private evaluateBinary(expr: BinaryExpression, env: Environment): MaxpinValue {
    // Short-circuit logic returns the operand, like Lua.
    if (expr.operator === "and") {
      const left = this.evaluate(expr.left, env);
      return isTruthy(left) ? this.evaluate(expr.right, env) : left;
    }
    if (expr.operator === "or") {
      const left = this.evaluate(expr.left, env);
      return isTruthy(left) ? left : this.evaluate(expr.right, env);
    }

    const left = this.evaluate(expr.left, env);
    const right = this.evaluate(expr.right, env);

    switch (expr.operator) {
      case "+":
        // Numbers add; anything else concatenates as text.
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        return stringify(left) + stringify(right);
      case "-":
        return this.numeric(left, expr.operator) - this.numeric(right, expr.operator);
      case "*":
        return this.numeric(left, expr.operator) * this.numeric(right, expr.operator);
      case "/":
        return this.numeric(left, expr.operator) / this.numeric(right, expr.operator);
      case "%":
        return this.numeric(left, expr.operator) % this.numeric(right, expr.operator);
      case "==":
        return this.equals(left, right);
      case "!=":
        return !this.equals(left, right);
      case "<":
        return this.compare(left, right, expr.operator) < 0;
      case ">":
        return this.compare(left, right, expr.operator) > 0;
      case "<=":
        return this.compare(left, right, expr.operator) <= 0;
      case ">=":
        return this.compare(left, right, expr.operator) >= 0;
      default:
        throw new RuntimeError(`Unknown operator '${expr.operator}'`);
    }
  }

  private evaluateUnary(expr: UnaryExpression, env: Environment): MaxpinValue {
    const value = this.evaluate(expr.operand, env);
    switch (expr.operator) {
      case "-":
        return -this.numeric(value, "unary -");
      case "not":
        return !isTruthy(value);
      default:
        throw new RuntimeError(`Unknown unary operator '${expr.operator}'`);
    }
  }

  private evaluateCall(expr: CallExpression, env: Environment): MaxpinValue {
    const callee = this.evaluate(expr.callee, env);
    if (!isFunction(callee)) {
      throw new RuntimeError(`'${expressionName(expr.callee)}' is not a function`);
    }
    const args = expr.args.map((arg) => this.evaluate(arg, env));
    return this.callFunction(callee, args);
  }

  private callFunction(fn: MaxpinFunction | NativeFunction, args: MaxpinValue[]): MaxpinValue {
    if (fn.kind === "native") {
      if (fn.arity !== null && args.length !== fn.arity) {
        throw new RuntimeError(
          `${fn.name}() expects ${fn.arity} argument(s) but got ${args.length}`
        );
      }
      return fn.call(args);
    }

    const local = new Environment(fn.closure);
    fn.params.forEach((param, i) => {
      local.set(param, args[i]);
    });

    try {
      this.executeBlock(fn.body, local);
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        return signal.value;
      }
      throw signal;
    }
    return undefined;
  }

  // --- helpers -------------------------------------------------------------

  private numeric(value: MaxpinValue, operator: string): number {
    if (typeof value !== "number") {
      throw new RuntimeError(
        `Operator '${operator}' expects a number but got ${typeOf(value)}`
      );
    }
    return value;
  }

  private equals(left: MaxpinValue, right: MaxpinValue): boolean {
    if (typeof left === "number" && typeof right === "number") {
      return left === right;
    }
    if (typeof left === "string" && typeof right === "string") {
      return left === right;
    }
    if (typeof left === "boolean" && typeof right === "boolean") {
      return left === right;
    }
    return left === right;
  }

  private compare(left: MaxpinValue, right: MaxpinValue, operator: string): number {
    if (typeof left === "number" && typeof right === "number") {
      return left < right ? -1 : left > right ? 1 : 0;
    }
    if (typeof left === "string" && typeof right === "string") {
      return left < right ? -1 : left > right ? 1 : 0;
    }
    throw new RuntimeError(
      `Operator '${operator}' cannot compare ${typeOf(left)} and ${typeOf(right)}`
    );
  }
}

function typeOf(value: MaxpinValue): string {
  if (value === undefined) return "nothing";
  if (isFunction(value)) return "function";
  return typeof value;
}

function expressionName(expr: Expression): string {
  if (expr.type === "Identifier") return expr.name;
  if (expr.type === "CallExpression") return expressionName(expr.callee);
  return expr.type;
}
