import { run, runError } from "./helpers";

describe("Variables", () => {
  test("Set stores and reading returns the value", () => {
    expect(run('Set name = "Mulpin"\nWrite=name+in.console')).toBe("Mulpin");
  });

  test("Set can reassign an existing variable", () => {
    expect(run("Set n = 1\nSet n = n + 1\nWrite=str(n)+in.console")).toBe("2");
  });

  test("variables hold numbers", () => {
    expect(run("Set hp = 100\nWrite=str(hp - 30)+in.console")).toBe("70");
  });
});

describe("Functions", () => {
  test("define, call and return a value", () => {
    const code = `
Define greet(who)
    Return "Hello, " + who + "!"
End
Write=greet("World")+in.console
`;
    expect(run(code)).toBe("Hello, World!");
  });

  test("functions with multiple parameters", () => {
    const code = `
Define add(a, b)
    Return a + b
End
Write=str(add(3, 4))+in.console
`;
    expect(run(code)).toBe("7");
  });

  test("nested calls", () => {
    const code = `
Define add(a, b)
    Return a + b
End
Write=str(add(add(1, 2), add(3, 4)))+in.console
`;
    expect(run(code)).toBe("10");
  });

  test("a function without Return yields nothing", () => {
    const code = `
Define noop()
End
Write=type(noop())+in.console
`;
    expect(run(code)).toBe("nothing");
  });

  test("functions can Write to the console", () => {
    const code = `
Define banner(text)
    Write="== " + text + " =="+in.newline
    Return len(text)
End
Set n = banner("hi")
Write="len " + n+in.console
`;
    expect(run(code)).toBe("== hi ==\nlen 2");
  });

  test("closures capture and share outer variables", () => {
    const code = `
Define counter()
    Set n = 0
    Define inc()
        Set n = n + 1
        Return n
    End
    Return inc
End
Set c = counter()
Write=str(c()) + str(c()) + str(c())+in.console
`;
    expect(run(code)).toBe("123");
  });

  test("parameters are local to the call", () => {
    const code = `
Define f(x)
    Set x = x + 1
    Return x
End
Set x = 10
Write=str(f(x)) + "," + str(x)+in.console
`;
    // f's parameter shadows the outer x, so the outer x is unchanged.
    expect(run(code)).toBe("11,10");
  });

  test("calling an undefined function fails", () => {
    expect(runError("Write=missing()+in.console")).toContain("Undefined variable 'missing'");
  });
});
