#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { Maxpin } from "../src/runtime";

const MAXPIN_EXTENSION = ".mpin";

/**
 * Find the nearest package.json by walking up from this file.
 *
 * This works whether the CLI runs from source (ts-node, where __dirname is
 * `cli/`) or from compiled output (where __dirname is `dist/cli/`), instead of
 * assuming a fixed number of parent directories.
 */
function findPackageJson(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, "package.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function readVersion(): string {
  const pkgPath = findPackageJson(__dirname);
  if (pkgPath) {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, "utf-8")).version ?? "unknown";
    } catch {
      // fall through
    }
  }
  return "unknown";
}

/**
 * Write to stdout as a single call.
 *
 * Note: we never call `process.exit()` after writing. `process.stdout.write`
 * is asynchronous when stdout is a pipe (npm, CI, editors), and
 * `process.exit()` discards buffered writes. Setting `process.exitCode` and
 * returning lets Node flush stdout and exit on its own.
 */
function writeOut(text: string): void {
  if (text.length === 0) return;
  process.stdout.write(text);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Maxpin Language CLI");
    console.log("Usage: maxpin <file.mpin>");
    console.log("       maxpin --version");
    console.log("       maxpin --help");
    return;
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(readVersion());
    return;
  }

  if (args[0] === "--help" || args[0] === "-h") {
    console.log("Maxpin Language - Step by step, logically structured");
    console.log(`File extension: ${MAXPIN_EXTENSION}`);
    console.log("");
    console.log("Usage:");
    console.log(`  maxpin <file${MAXPIN_EXTENSION}>  Execute a Maxpin program`);
    console.log("  maxpin --version    Show version");
    console.log("  maxpin --help       Show help");
    console.log("");
    console.log("Examples:");
    console.log(`  maxpin examples/hello${MAXPIN_EXTENSION}`);
    return;
  }

  const filename = args[0];

  if (!fs.existsSync(filename)) {
    console.error(`Error: File '${filename}' not found`);
    process.exitCode = 1;
    return;
  }

  if (path.extname(filename) !== MAXPIN_EXTENSION) {
    console.warn(`Warning: file does not have a ${MAXPIN_EXTENSION} extension`);
  }

  let code: string;
  try {
    code = fs.readFileSync(filename, "utf-8");
  } catch (err) {
    console.error(`Error: Could not read '${filename}':`, err);
    process.exitCode = 1;
    return;
  }

  try {
    const output = new Maxpin().execute(code);
    writeOut(output);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
    return;
  }
}

main();
