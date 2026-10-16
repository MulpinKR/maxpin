import { Maxpin } from "../src/runtime";

describe("Host embedding", () => {
  test("host registers a native function that .mpin calls", () => {
    const host = new Maxpin();
    host.defineNative("shout", 1, (args) => String(args[0]).toUpperCase() + "!");
    expect(host.execute('Write=shout("hey")+in.console')).toBe("HEY!");
  });

  test("native functions take multiple arguments", () => {
    const host = new Maxpin();
    host.defineNative("damage", 2, (args) => Number(args[0]) - Number(args[1]));
    expect(host.execute("Write=str(damage(100, 30))+in.console")).toBe("70");
  });

  test("host calls a .mpin function and gets its value", () => {
    const host = new Maxpin();
    host.execute(`
Define onHit(hp, dmg)
    Return hp - dmg
End
`);
    expect(host.call("onHit", [100, 25]).value).toBe(75);
  });

  test("host capture includes output the function wrote", () => {
    const host = new Maxpin();
    host.execute(`
Define announce(name)
    Write="hi " + name+in.newline
    Return len(name)
End
`);
    const result = host.call("announce", ["mulpin"]);
    expect(result.value).toBe(6);
    expect(result.output).toBe("hi mulpin\n");
  });

  test("host can round-trip through a .mpin function", () => {
    const host = new Maxpin();
    host.defineNative("spawn", 1, (args) => `spawned:${args[0]}`);
    host.execute(`
Define wave(enemy)
    Return spawn(enemy)
End
`);
    expect(host.call("wave", ["goblin"]).value).toBe("spawned:goblin");
  });

  test("calling a missing function throws", () => {
    const host = new Maxpin();
    expect(() => host.call("nope")).toThrow(/Undefined variable 'nope'/);
  });
});
