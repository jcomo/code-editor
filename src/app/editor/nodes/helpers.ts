import { LexicalEditor } from "lexical";
import { CodeBraceNode } from "./code-brace-node";
import { CodeNode } from "./code-node";
import { CodeSourceNode } from "./code-source-node";

export function hasCodeNodes(editor: LexicalEditor): boolean {
  return editor.hasNodes([CodeNode, CodeBraceNode, CodeSourceNode]);
}

export function mustHaveCodeNodes(editor: LexicalEditor, pluginName: string) {
  if (!hasCodeNodes(editor)) {
    throw new Error(`${pluginName}: must install CodeNode in editor config`);
  }
}
