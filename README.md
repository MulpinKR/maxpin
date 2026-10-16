# Maxpin Language

Maxpin (pronounced "Max-pin") is a step-by-step, logically structured programming
language. Every statement reads in plain order: **what to do**, then **where to send it**.

- **File extension:** `.mpin`
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

## A larger example

```mpin
#= Greeting program
Write="Hello, Maxpin!"+in.newline
Write="This runs step by step."+in.newline
Write="Bye."+in.console
```

Output:

```
Hello, Maxpin!
This runs step by step.
Bye.
```

See [docs/language.md](docs/language.md) for the full language reference.

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
| **Interpreter** | `src/interpreter/`  | Walks the AST and produces output                        |
| **Runtime**  | `src/runtime.ts`       | Wires the stages together (`Maxpin` / `run`)             |
| **CLI**      | `cli/index.ts`         | Runs `.mpin` files from the command line                 |

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
npm run dev examples/hello.mpin
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

## Project structure

```
Maxpinlanguage/
├── cli/                  Command-line interface
├── docs/                 Language reference
├── examples/             Example .mpin programs
│   ├── hello.mpin
│   ├── comment.mpin
│   └── multiple.mpin
├── src/
│   ├── ast/              AST node definitions
│   ├── interpreter/      Executes the AST
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

- **Variables** — `Set=name+"Mulpin"+in.value`, then use `name` in a `Write`
- **Input** — `Read=name+in.keyboard` to read from the console
- **Conditionals** — `If <cond> then ... else ...`
- **Loops** — `Repeat <n> times ...`
- **Functions** — `Define` / `Call` blocks
- **More targets** — `in.file`, `in.stderr`

Because each stage is isolated, these can be added incrementally without rewriting
the whole pipeline.

---

## License

MIT — © Mulpin
