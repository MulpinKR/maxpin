import { Environment } from "./Environment";
import { makeNative, stringify, typeName, RuntimeError } from "./values";

/**
 * The Maxpin standard library. These are native functions, which also serve
 * as the template for host/game embedding later: a host registers native
 * functions the same way.
 */
export function installStdlib(env: Environment): void {
  env.set(
    "len",
    makeNative("len", 1, (args) => {
      const value = args[0];
      if (typeof value === "string") return value.length;
      throw new RuntimeError(`len() expects a string but got ${typeName(value)}`);
    })
  );

  env.set(
    "upper",
    makeNative("upper", 1, (args) => {
      const value = args[0];
      if (typeof value === "string") return value.toUpperCase();
      throw new RuntimeError(`upper() expects a string but got ${typeName(value)}`);
    })
  );

  env.set(
    "lower",
    makeNative("lower", 1, (args) => {
      const value = args[0];
      if (typeof value === "string") return value.toLowerCase();
      throw new RuntimeError(`lower() expects a string but got ${typeName(value)}`);
    })
  );

  env.set(
    "str",
    makeNative("str", 1, (args) => stringify(args[0]))
  );

  env.set(
    "num",
    makeNative("num", 1, (args) => {
      const value = args[0];
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
          throw new RuntimeError(`num() cannot convert "${value}" to a number`);
        }
        return parsed;
      }
      throw new RuntimeError(`num() expects a string or number but got ${typeName(value)}`);
    })
  );

  env.set(
    "type",
    makeNative("type", 1, (args) => typeName(args[0]))
  );
}

/** Names provided out of the box, useful for docs and tooling. */
export const STDLIB_NAMES: string[] = ["len", "upper", "lower", "str", "num", "type"];
