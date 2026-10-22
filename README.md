# Maxpin Language

Maxpin (pronounced "Max-pin") is a step-by-step, logically structured programming
language. Every statement reads in plain order: **what to do**, then **where to send it**.

- **File extension:** `.mpin`
- **Version:** 0.2.2
- **Nickname origin:** from *Mulpin*

---

## Hello, world

```mpin
Write="hello world!"+in.console
```

This prints `hello world!` to the console. The `+in.console` part means "send this
exact text to the console".

To print with a newline at the end, use `+in.newline` instead:

```mpin
Write="hello world!"+in.newline
```

## Comments

A comment is ignored by the program:

```mpin
#= Oh! is that comment?
```

A plain `#` comment works too.

## Variables

```mpin
Set name = "Mulpin"
Set hp = 100

Write="Hello, " + name+in.newline
Write="hp is " + str(hp)+in.console
```

## Functions

```mpin
Define greet(who)
    Return "Hello, " + who + "!"
End

Write=greet("World")+in.console
```

Functions take parameters, `Return` a value, and can be nested and closed over
(see [docs/language.md](docs/language.md)).

## A larger example

```mpin
#= A tiny health report
Set hero = "Mulpin"
Set hp = 100
Set maxhp = 100

Define report(name, current, maximum)
    Write=name + ": " + str(current) + "/" + str(maximum)+in.newline
    Return current > maximum / 2
End

Set healthy = report(hero, hp, maxhp)
Write="healthy? " + str(healthy)+in.console
```

Output:

```
Mulpin: 100/100
healthy? true
```

See [docs/language.md](docs/language.md) for the full language reference.

---

## What's in 0.2.2

Building on the 0.1.0 output layer, Maxpin now has a real language core:

- **Values** — strings, numbers, booleans
- **Variables** — `Set name = value`, with lexical scoping
- **Expressions** — `+ - * / %`, comparisons, `and`/`or`/`not`, grouping
- **Functions** — `Define` / `End`, parameters, `Return`, closures
- **Standard library** — `len`, `upper`, `lower`, `str`, `num`, `type`
- **Conditionals** — `If` / `Else If` / `Else` / `End`
- **Loops** — `While` / `End`, `Repeat` ... `times` / `End`
- **Embedding** — a host can register native functions and call `.mpin` functions

Console input is next on the roadmap.

---

## How it works

Maxpin is implemented as a classic pipeline, with each stage in its own folder under
`src/`:

```
source .mpin  -->  Lexer  -->  tokens  -->  Parser  -->  AST  -->  Interpreter  -->  output
```

| Stage        | Path                   | Job                                                      |
| ------------ | ---------------------- | -------------------------------------------------------- |
| **Lexer**    | `src/lexer/`           | Splits raw text into tokens (`Write`, `=`, string, `+`, `in.console`, ...) |
| **AST**      | `src/ast/`             | Defines the shape of the parsed tree                     |
| **Parser**   | `src/parser/`          | Turns tokens into an AST, and reports syntax errors      |
| **Interpreter** | `src/interpreter/`  | Walks the AST, evaluates expressions, runs functions     |
| **Runtime**  | `src/runtime.ts`       | Wires the stages together (`Maxpin` / `run`)             |
| **CLI**      | `cli/index.ts`         | Runs `.mpin` files from the command line                 |

Inside `src/interpreter/`:

| File             | Job                                                        |
| ---------------- | ---------------------------------------------------------- |
| `Interpreter.ts` | Walks the AST; the core evaluator                        |
| `Environment.ts` | Lexical scopes (parents chain into closures)             |
| `values.ts`      | Runtime value types, truthiness, `stringify`, errors     |
| `stdlib.ts`      | Built-in native functions                                |

The stages are deliberately separated so you can extend the language one piece at a
time — for example, add a new token type in the Lexer, a new node in the AST, handle
it in the Parser, then give it meaning in the Interpreter.

---

## Getting started

### Requirements

- Node.js (v18 or newer recommended)

### Setup

```bash
npm install
```

### Run a program

```bash
npm run dev examples/functions.mpin
```

Or, after building:

```bash
npm run build
npm start examples/hello.mpin
```

### Run the tests

```bash
npm test
```

### Command-line usage

```
maxpin <file.mpin>   Execute a Maxpin program
maxpin --version     Show version
maxpin --help        Show help
```

---

## Embedding in a host (e.g. a game)

```ts
import { Maxpin } from "maxpin";

const game = new Maxpin();

// Let scripts call into the host engine.
game.defineNative("spawn", 1, (args) => {
  console.log("spawning", args[0]);
  return true;
});

// Run a script from a file or string.
game.execute(`
Define onStart()
    spawn("goblin")
    Return 1
End
`);

// Call a script function from host code.
const result = game.call("onStart");
console.log(result.value);  // 1
console.log(result.output); // whatever the script wrote
```

See `examples/embed.ts` and `examples/game.mpin` for a runnable demo
(`npx ts-node examples/embed.ts`).

---

## Project structure

```
Maxpinlanguage/
├── cli/                  Command-line interface
├── docs/                 Language reference
├── examples/             Example programs and the embedding demo
│   ├── hello.mpin
│   ├── comment.mpin
│   ├── multiple.mpin
│   ├── variables.mpin
│   ├── functions.mpin
│   ├── game.mpin
│   └── embed.ts
├── src/
│   ├── ast/              AST node definitions
│   ├── interpreter/      Executes the AST (values, scopes, stdlib)
│   ├── lexer/            Tokenizer + token types
│   ├── parser/           Parser (tokens -> AST)
│   ├── runtime.ts        Ties the stages together
│   └── index.ts          Public exports
├── tests/                Jest test suites
├── package.json
└── tsconfig.json
```

---

## Roadmap ideas

Maxpin is a template meant to grow. Natural next steps:

- [x] **Variables** — `Set name = value`
- [x] **Functions** — `Define` / `End`, parameters, `Return`, closures
- [x] **Conditionals** — `If` / `Else If` / `Else` / `End`
- [x] **Loops** — `While` / `End`, `Repeat` ... `times` / `End`
- [ ] **Input** — read from the console or keyboard
- [ ] **More targets** — `in.file`, `in.stderr`
- [ ] **Native game API** — a richer host bridge for real games

Because each stage is isolated, these can be added incrementally without rewriting
the whole pipeline.

---

## Current Stage

"Maxpin now has conditionals and loops. You can write real branching logic and
iteration, define your own functions, and embed the language in a host like a game.
Next up: console input." - Mulpin

---

## other sources:
gitlab - https://gitlab.com/MulpinKR/maxpin

---

## License

MIT — © Mulpin
