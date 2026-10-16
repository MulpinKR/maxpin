import { run, runError } from "./helpers";

describe("Values and expressions", () => {
  test("numbers add", () => {
    expect(run("Write=str(1 + 2)+in.console")).toBe("3");
  });

  test("operator precedence: * before +", () => {
    expect(run("Write=str(1 + 2 * 3)+in.console")).toBe("7");
  });

  test("parentheses group", () => {
    expect(run("Write=str((1 + 2) * 3)+in.console")).toBe("9");
  });

  test("subtraction, division and modulo", () => {
    expect(run("Write=str(10 - 4)+in.console")).toBe("6");
    expect(run("Write=str(10 / 4)+in.console")).toBe("2.5");
    expect(run("Write=str(10 % 3)+in.console")).toBe("1");
  });

  test("unary minus", () => {
    expect(run("Write=str(-5 + 2)+in.console")).toBe("-3");
  });

  test("strings concatenate with +", () => {
    expect(run('Write="a" + "b" + "c"+in.console')).toBe("abc");
  });

  test("mixing string and number concatenates", () => {
    expect(run('Write="hp: " + 100+in.console')).toBe("hp: 100");
  });

  test("comparisons produce booleans", () => {
    expect(run("Write=str(3 > 2)+in.console")).toBe("true");
    expect(run("Write=str(3 < 2)+in.console")).toBe("false");
    expect(run("Write=str(2 <= 2)+in.console")).toBe("true");
    expect(run("Write=str(2 >= 3)+in.console")).toBe("false");
    expect(run('Write=str("a" == "a")+in.console')).toBe("true");
    expect(run('Write=str("a" != "b")+in.console')).toBe("true");
  });

  test("not flips truthiness", () => {
    expect(run("Write=str(not false)+in.console")).toBe("true");
    expect(run("Write=str(not true)+in.console")).toBe("false");
  });

  test("and/or short-circuit and return operands", () => {
    expect(run('Write=false or "default"+in.console')).toBe("default");
    expect(run('Write="kept" and "next"+in.console')).toBe("next");
    expect(run('Write=false and "unreached"+in.console')).toBe("false");
  });

  test("only false and nothing are falsy", () => {
    // 0 is truthy, Lua-style.
    expect(run('Write=0 and "yes"+in.console')).toBe("yes");
  });
});

describe("Runtime errors", () => {
  test("undefined variable", () => {
    expect(runError("Write=nope+in.console")).toContain("Undefined variable 'nope'");
  });

  test("calling a non-function", () => {
    expect(runError("Set x = 1\nWrite=x(1)+in.console")).toContain("'x' is not a function");
  });

  test("arithmetic on a string", () => {
    expect(runError('Write=str(5 - "a")+in.console')).toContain("expects a number");
  });
});
