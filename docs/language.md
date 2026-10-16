# Maxpin Language Reference

Maxpin is a step-by-step, logically structured language. Every statement reads in
plain order: **what to do**, then **where to send it**.

- **File extension:** `.mpin`
- **Current version:** 0.2.0

---

## 1. Writing to the console

`Write` is Maxpin's signature statement. It reads `Write=<value>+<target>`.

```mpin
Write="hello world!"+in.console
```

| Target        | Effect                                     |
| ------------- | ------------------------------------------ |
| `in.console`  | Write the value exactly, no newline        |
| `in.newline`  | Write the value, then move to the next line |

```mpin
Write="no newline"+in.console
Write="with newline"+in.newline
```

The value can be any expression (see §4).

---

## 2. Comments

```mpin
#= Oh! is that comment?
# a plain comment also works
```

A comment runs to the end of the line.

---

## 3. Values

Maxpin has four kinds of value:

| Type      | Examples            |
| --------- | ------------------- |
| string    | `"Mulpin"`, `"hi"`  |
| number    | `42`, `3.5`, `-7`   |
| boolean   | `true`, `false`     |
| nothing   | the result of a function that does not `Return` |

Use the `type` builtin to inspect a value: `type(3.5)` is `"number"`.

---

## 4. Variables

Declare or update a variable with `Set`:

```mpin
Set name = "Mulpin"
Set hp = 100
Set alive = true
```

Read a variable by using its name as an expression:

```mpin
Set name = "Mulpin"
Write="Hello, " + name+in.console
```

**Scoping rule:** `Set` updates the nearest variable that already exists; if none
exists, it creates a new one in the current scope. This makes closures behave
naturally (see §6).

---

## 5. Expressions

### Arithmetic
```mpin
1 + 2        # 3
10 - 4       # 6
3 * 4        # 12
10 / 4       # 2.5
10 % 3       # 1
```

`+` adds two numbers, and **concatenates** when either side is not a number:
```mpin
"hp: " + 100     # "hp: 100"
```

### Comparison
```mpin
3 > 2            # true
3 < 2            # false
2 <= 2           # true
2 >= 3           # false
"a" == "a"       # true
1 != 2           # true
```

### Logic
`and`, `or` and `not` work like Lua: `and`/`or` return one of their operands,
and only `false` (and nothing) are falsy.

```mpin
false or "default"   # "default"
true and "yes"       # "yes"
not false            # true
```

### Grouping
```mpin
(1 + 2) * 3      # 9
```

### Precedence
From highest to lowest: unary `-`/`not`, `* / %`, `+ -`, comparisons,
`==`/`!=`, `and`, `or`. Parentheses override grouping.

---

## 6. Functions

Define with `Define`, close with `End`, and send a value back with `Return`:

```mpin
Define greet(who)
    Return "Hello, " + who + "!"
End

Write=greet("World")+in.newline
```

- Parameters are written inside `( )`, separated by commas.
- `Return` is optional; without it a function yields nothing.
- Calling a function is an expression, so it can be nested:
  ```mpin
  Write=str(add(add(1, 2), add(3, 4)))+in.console
  ```

Call a function for its side effects by using it as a statement:
```mpin
greet("Mulpin")
```

### Closures
Functions capture the scope they were defined in:

```mpin
Define counter()
    Set n = 0
    Define inc()
        Set n = n + 1
        Return n
    End
    Return inc
End

Set c = counter()
Write=str(c()) + str(c()) + str(c())+in.console   # 123
```

---

## 7. Standard library

| Function      | Description                              | Example            |
| ------------- | ---------------------------------------- | ------------------ |
| `len(s)`      | Length of a string                       | `len("hello") # 5` |
| `upper(s)`    | Uppercase                                | `upper("abc")`     |
| `lower(s)`    | Lowercase                                | `lower("ABC")`     |
| `str(v)`      | Convert to text                          | `str(12) # "12"`   |
| `num(s)`      | Convert text to a number                 | `num("42") + 1`    |
| `type(v)`     | Type name: `"string"`, `"number"`, ...   | `type(1) # "number"` |

---

## 8. Errors

Maxpin reports the line and column for lexical and parse errors:

- `Lex error at line 1, column 3: Unexpected character '@'`
- `Parse error at line 2, column 5: Expected "End" to close Define`

Runtime errors describe what went wrong:

- `Undefined variable 'nope'`
- `'x' is not a function`
- `Operator '-' expects a number but got string`

---

## 9. Full example

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

---

## 10. Embedding Maxpin

A host program (a game engine, a tool, a bot) can run Maxpin scripts, provide
native functions, and call script functions back. See `examples/embed.ts`.

```ts
import { Maxpin } from "maxpin";

const game = new Maxpin();

// Let scripts call into the host.
game.defineNative("spawn", 1, (args) => {
  console.log("spawning", args[0]);
  return true;
});

// Run a script.
game.execute(`
Define onStart()
    spawn("goblin")
    Return 1
End
`);

// Call a script function from host code.
const result = game.call("onStart");
console.log(result.value);   // 1
console.log(result.output);  // anything the script wrote
```

`call` returns `{ value, output }` so a function's `Write`s are never lost.
