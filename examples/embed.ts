/**
 * Game embedding demo.
 *
 * Shows how a host program (a game engine, a tool, a bot) can:
 *   1. register native functions that .mpin scripts may call, and
 *   2. load a .mpin script and call its functions back.
 *
 * Run it with:  npx ts-node examples/embed.ts
 */
import * as fs from "fs";
import * as path from "path";
import { Maxpin } from "../src/runtime";

// A fake game world the engine owns.
const world = { entities: [] as string[], score: 0 };

const game = new Maxpin();

// 1. Native functions the script can call.
game.defineNative("spawn", 1, (args) => {
  const name = String(args[0]);
  world.entities.push(name);
  return world.entities.length; // return the new entity count
});

game.defineNative("addScore", 1, (args) => {
  world.score += Number(args[0]);
  return world.score;
});

game.defineNative("entityCount", 0, () => world.entities.length);

// 2. Load the script.
const source = fs.readFileSync(path.join(__dirname, "game.mpin"), "utf-8");
game.execute(source);

/** Call a script function and print whatever it wrote. */
function call(script: string, name: string, args: unknown[] = []): unknown {
  const result = game.call(name, args as never[]);
  if (result.output.length > 0) process.stdout.write(result.output);
  return result.value;
}

// 3. Drive it from host code.
console.log("=== script output ===");
call("game.mpin", "onStart");

let hp = 100;
hp = Number(call("game.mpin", "onDamage", [hp, 30]));
hp = Number(call("game.mpin", "onDamage", [hp, 45]));

process.stdout.write(game.execute('Write="spawning enemies..."+in.newline'));
process.stdout.write(game.execute('Write="count: " + str(spawn("goblin"))+in.console'));
process.stdout.write(game.execute('Write=" score: " + str(addScore(50))+in.console'));
process.stdout.write(game.execute('Write=" entities: " + str(entityCount())+in.console'));

console.log("\n\n=== host result ===");
console.log("final hp:", hp);
console.log("win message:", call("game.mpin", "onWin", [world.score]));
