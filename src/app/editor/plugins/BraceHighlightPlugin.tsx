import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical";
import { useRef, useCallback, useEffect } from "react";
import { mustHaveCodeNodes } from "../nodes/helpers";
import { $isCodeBraceNode } from "../nodes/code-brace-node";
import { $isCodeNode, $getParentCodeNode } from "../nodes/code-node";

export function BraceHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  mustHaveCodeNodes(editor, "BraceHighlightPlugin");

  // Handle selection change to highlight matching braces
  const highlightRef = useRef<string>(null);
  const clearHighlight = useCallback(() => {
    const highlightedNodeKey = highlightRef.current;
    if (highlightedNodeKey) {
      editor.update(() => {
        const node = $getNodeByKey(highlightedNodeKey);
        if ($isCodeNode(node)) {
          node.highlightBraces(false);
          highlightRef.current = null;
        }
      });
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          clearHighlight();
          return;
        }

        if (!selection.isCollapsed()) {
          clearHighlight();
          return;
        }

        const node = selection.anchor.getNode();
        const parent = node.getParent();
        const codeNode = $getParentCodeNode(node);
        if (codeNode && $isCodeBraceNode(parent)) {
          if (!parent.isHighlighted()) {
            highlightRef.current = codeNode.getKey();
            editor.update(() => codeNode.highlightBraces(true));
          }
        } else {
          clearHighlight();
        }
      });
    });
  }, [clearHighlight, editor]);

  return null;
}
