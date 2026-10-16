import { MaxpinValue, RuntimeError } from "./values";

/**
 * A lexical scope. Each function call gets a fresh Environment whose parent
 * is the environment where the function was defined — which is what gives
 * Maxpin closures their captured variables.
 */
export class Environment {
  private values = new Map<string, MaxpinValue>();

  constructor(private readonly parent: Environment | null = null) {}

  /** Create or update a binding in this scope. */
  set(name: string, value: MaxpinValue): void {
    this.values.set(name, value);
  }

  /**
   * Assign to the nearest existing binding, walking outward.
   *
   * Returns false if the name is not defined anywhere in the chain, in which
   * case the caller creates a new binding in the current scope. This is what
   * makes closures behave (like Lua): a nested function updating `n` mutates
   * the `n` it captured, instead of shadowing it with a fresh local.
   */
  assign(name: string, value: MaxpinValue): boolean {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return true;
    }
    return this.parent ? this.parent.assign(name, value) : false;
  }

  /** Look up a name, walking outward through parent scopes. */
  get(name: string): MaxpinValue {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new RuntimeError(`Undefined variable '${name}'`);
  }

  has(name: string): boolean {
    if (this.values.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }
}
