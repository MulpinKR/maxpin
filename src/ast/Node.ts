export type NodeType =
  | "Program"
  | "WriteStatement"
  | "SetStatement"
  | "DefineStatement"
  | "ReturnStatement"
  | "IfStatement"
  | "WhileStatement"
  | "RepeatStatement"
  | "ExpressionStatement"
  | "Comment"
  | "StringLiteral"
  | "NumberLiteral"
  | "BooleanLiteral"
  | "Identifier"
  | "BinaryExpression"
  | "UnaryExpression"
  | "CallExpression"
  | "ConsoleTarget";

export interface Node {
  type: NodeType;
}

export interface Program extends Node {
  type: "Program";
  statements: Statement[];
}

export type Statement =
  | WriteStatement
  | SetStatement
  | DefineStatement
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | RepeatStatement
  | ExpressionStatement
  | Comment;

/** Write=<value>+in.console (the signature Maxpin I/O statement). */
export interface WriteStatement extends Node {
  type: "WriteStatement";
  value: Expression;
  target: ConsoleTarget;
}

/** Set <name> = <value> */
export interface SetStatement extends Node {
  type: "SetStatement";
  name: string;
  value: Expression;
}

/** Define <name>(<params>) ... End */
export interface DefineStatement extends Node {
  type: "DefineStatement";
  name: string;
  params: string[];
  body: Statement[];
}

/** Return <value> (value may be absent). */
export interface ReturnStatement extends Node {
  type: "ReturnStatement";
  value: Expression | null;
}

/** If <condition> ... [Else If ...] [Else ...] End */
export interface IfStatement extends Node {
  type: "IfStatement";
  condition: Expression;
  consequent: Statement[];
  /** For else-if/else: alternate is either another IfStatement (else-if) or a block wrapped as synthetic? easier: alternate is Statement[] when else has no condition, or IfStatement for else-if */
  alternate: Statement[] | IfStatement | null;
}

/** While <condition> ... End */
export interface WhileStatement extends Node {
  type: "WhileStatement";
  condition: Expression;
  body: Statement[];
}

/** Repeat <count> times ... End */
export interface RepeatStatement extends Node {
  type: "RepeatStatement";
  count: Expression;
  body: Statement[];
}

/** A bare expression used as a statement, e.g. a function call. */
export interface ExpressionStatement extends Node {
  type: "ExpressionStatement";
  expression: Expression;
}

/** #= comment */
export interface Comment extends Node {
  type: "Comment";
  value: string;
}

export type Expression =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | CallExpression;

export interface StringLiteral extends Node {
  type: "StringLiteral";
  value: string;
}

export interface NumberLiteral extends Node {
  type: "NumberLiteral";
  value: number;
}

export interface BooleanLiteral extends Node {
  type: "BooleanLiteral";
  value: boolean;
}

export interface Identifier extends Node {
  type: "Identifier";
  name: string;
}

export interface BinaryExpression extends Node {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends Node {
  type: "UnaryExpression";
  operator: string;
  operand: Expression;
}

export interface CallExpression extends Node {
  type: "CallExpression";
  callee: Expression;
  args: Expression[];
}

export interface ConsoleTarget extends Node {
  type: "ConsoleTarget";
  value: "console" | "newline";
}
