# Maxpin Language Reference

Maxpin is a step-by-step, logically structured language. Every statement reads like
an instruction in plain order: **what to do**, then **where to send it**.

File extension: `.mpin`

---

## 1. Comments

A comment is ignored by the program. Two forms are supported:

```mpin
#= Oh! is that comment?
# Plain hash comment
```

Comments run to the end of the line.

---

## 2. The `Write` statement

`Write` is the only output statement. It has three parts, always in this order:

| Part      | Meaning                                          | Example            |
| --------- | ------------------------------------------------ | ------------------ |
| `Write=`  | The statement keyword                            | `Write=`           |
| *value*   | What to output (a string, numbers, or `+` joins) | `"hello world!"`   |
| `+target` | Where to output it                               | `+in.console`      |

### Basic output

```mpin
Write="hello world!"+in.console
```

This prints `hello world!` to the console with no trailing newline.

### Output with a newline

```mpin
Write="Line 1"+in.newline
```

This prints `Line 1` followed by a newline.

---

## 3. Targets

A target is the destination of a `Write`, always written after a `+`:

- `in.console` — write exactly, no newline added.
- `in.newline` — write, then move to the next line.

```mpin
Write="no newline"+in.console
Write="with newline"+in.newline
```

---

## 4. Values and concatenation

The value may be several pieces joined with `+`. Numbers are treated as text.

```mpin
Write="hello "+ "world"+in.console
Write="Answer: "+ 42+in.newline
```

Multiple pieces are joined left to right, then sent to the target.

---

## 5. Statement rules

- Each `Write` is one statement. Put each statement on its own line.
- A statement must be `Write=<value>+<target>`; anything else is a parse error.
- `Write` requires the `=` and the `+target` parts.

---

## 6. Error handling

The parser reports the line and column of the first problem it finds:

- `Expected "=" after Write`
- `Expected "+" before a target such as in.console`
- `Expected a target such as in.console, got ...`
- `Unexpected token "..." — statements must start with Write or a comment`

---

## 7. Full example

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
