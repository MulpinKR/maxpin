export type NodeType = 
  | "Program"
  | "WriteStatement"
  | "StringLiteral"
  | "BinaryExpression"
  | "ConsoleTarget"
  | "Comment";

export interface Node {
  type: NodeType;
}

export interface Program extends Node {
  type: "Program";
  statements: Statement[];
}

export type Statement = WriteStatement | Comment;

export interface WriteStatement extends Node {
  type: "WriteStatement";
  value: Expression;
  target: ConsoleTarget;
}

export type Expression = StringLiteral | BinaryExpression | ConsoleTarget;

export interface StringLiteral extends Node {
  type: "StringLiteral";
  value: string;
}

export interface BinaryExpression extends Node {
  type: "BinaryExpression";
  left: Expression;
  operator: string;
  right: Expression;
}

export interface ConsoleTarget extends Node {
  type: "ConsoleTarget";
  value: "console" | "newline";
}

export interface Comment extends Node {
  type: "Comment";
  value: string;
}