import { run, runError } from "./helpers";

describe("Standard library", () => {
  test("len returns string length", () => {
    expect(run('Write=str(len("hello"))+in.console')).toBe("5");
  });

  test("upper and lower", () => {
    expect(run('Write=upper("abc")+in.console')).toBe("ABC");
    expect(run('Write=lower("XYZ")+in.console')).toBe("xyz");
  });

  test("str converts to text", () => {
    expect(run("Write=str(12)+in.console")).toBe("12");
    expect(run("Write=str(true)+in.console")).toBe("true");
  });

  test("num converts text to number", () => {
    expect(run('Write=str(num("42") + 1)+in.console')).toBe("43");
  });

  test("type reports the type name", () => {
    expect(run('Write=type("s")+in.console')).toBe("string");
    expect(run("Write=type(1)+in.console")).toBe("number");
    expect(run("Write=type(true)+in.console")).toBe("boolean");
  });

  test("len rejects non-strings", () => {
    expect(runError("Write=str(len(5))+in.console")).toContain("expects a string");
  });

  test("num rejects non-numeric text", () => {
    expect(runError('Write=str(num("abc"))+in.console')).toContain("cannot convert");
  });
});
