import { $isElementNode, LexicalNode } from "lexical";

export enum WalkCommand {
  STOP,
  CONTINUE,
}

export function walkChildren(
  node: LexicalNode,
  visit: (node: LexicalNode) => WalkCommand
) {
  if (!$isElementNode(node)) {
    visit(node);
    return;
  }

  const children = node.getChildren();
  children.forEach((child) => {
    const command = visit(child);
    if (command === WalkCommand.CONTINUE) {
      walkChildren(child, visit);
    }
  });
}
