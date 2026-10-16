import { execFileSync } from "child_process";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const CLI = path.join(ROOT, "cli", "index.ts");

/**
 * Runs the CLI as a real subprocess. `execFileSync` captures stdout through a
 * pipe — the same situation as `npm run` and CI. This is what caught the bug
 * where `process.stdout.write` output was dropped on exit.
 */
function runCli(file: string): string {
  return execFileSync(
    process.execPath,
    ["-r", "ts-node/register/transpile-only", CLI, path.join(ROOT, "examples", file)],
    { cwd: ROOT, encoding: "utf-8" }
  );
}

function runCliArgs(args: string[]): string {
  return execFileSync(
    process.execPath,
    ["-r", "ts-node/register/transpile-only", CLI, ...args],
    { cwd: ROOT, encoding: "utf-8" }
  );
}

describe("CLI (end to end)", () => {
  test("prints hello world through a pipe", () => {
    expect(runCli("hello.mpin")).toBe("hello world!");
  });

  test("prints every line with in.newline", () => {
    expect(runCli("multiple.mpin")).toBe("Line 1\nLine 2\nLine 3 ");
  });

  test("prints identical output on repeated runs", () => {
    const first = runCli("multiple.mpin");
    for (let i = 0; i < 5; i++) {
      expect(runCli("multiple.mpin")).toBe(first);
    }
  });

  test("reports the version from package.json", () => {
    const pkg = JSON.parse(
      require("fs").readFileSync(require("path").join(ROOT, "package.json"), "utf-8")
    );
    expect(runCliArgs(["--version"]).trim()).toBe(pkg.version);
  });
});
