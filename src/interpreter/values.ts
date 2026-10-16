import { Statement } from "../ast/Node";
import { Environment } from "./Environment";

/** Every value a Maxpin program can hold at runtime. */
export type MaxpinValue = string | number | boolean | undefined | MaxpinFunction | NativeFunction;

/** A function defined inside a .mpin script. */
export interface MaxpinFunction {
  kind: "function";
  name: string;
  params: string[];
  body: Statement[];
  closure: Environment;
}

/** A function provided by the host (standard library, or a game engine). */
export interface NativeFunction {
  kind: "native";
  name: string;
  arity: number | null; // null = any
  call: (args: MaxpinValue[]) => MaxpinValue;
}

export function isFunction(value: MaxpinValue): value is MaxpinFunction | NativeFunction {
  if (typeof value !== "object" || value === null) return false;
  const kind = (value as MaxpinFunction | NativeFunction).kind;
  return kind === "function" || kind === "native";
}

export function makeNative(
  name: string,
  arity: number | null,
  call: (args: MaxpinValue[]) => MaxpinValue
): NativeFunction {
  return { kind: "native", name, arity, call };
}

/** Maxpin truthiness: only `false` and "nothing" are falsy (Lua-like). */
export function isTruthy(value: MaxpinValue): boolean {
  return value !== false && value !== undefined;
}

/** Convert a value to its text form, as used by `+` and by Write. */
export function stringify(value: MaxpinValue): string {
  if (value === undefined) return "nothing";
  if (isFunction(value)) return `<function ${value.name}>`;
  if (typeof value === "number") return formatNumber(value);
  return String(value);
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Trim floating-point noise without being too clever.
  return String(Number(n.toFixed(10)));
}

/** Human-readable type name, used by the `type` builtin. */
export function typeName(value: MaxpinValue): string {
  if (value === undefined) return "nothing";
  if (isFunction(value)) return "function";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

/** The result of calling a .mpin function from host code. */
export interface CallResult {
  value: MaxpinValue;
  /** Everything the function wrote, so the host does not lose output. */
  output: string;
}

/** Internal control-flow signal used to unwind a function on `Return`. */
export class ReturnSignal {
  constructor(public value: MaxpinValue) {}
}
