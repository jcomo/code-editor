import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isParagraphNode, $setSelection, TextNode } from "lexical";
import { useEffect } from "react";
import { $isCodeBraceNode } from "../nodes/code-brace-node";
import {
  $isInCodeNode,
  $createCodeNode,
  $getParentCodeNode,
} from "../nodes/code-node";
import { $isCodeSourceNode } from "../nodes/code-source-node";
import { mustHaveCodeNodes } from "../nodes/helpers";

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  mustHaveCodeNodes(editor, "CodeHighlightPlugin");

  // Handle creation of code blocks as user is typing
  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
      if (!$isParagraphNode(node.getParent())) {
        return;
      } else if ($isInCodeNode(node)) {
        return;
      }

      editor.update(() => {
        const textContent = node.getTextContent();
        const regex = /\{\{(.*?)\}\}/g;

        let match;
        while ((match = regex.exec(textContent)) !== null) {
          const [fullMatch] = match;

          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          const replaceNode = $splitTextAndGetReplaceNode(
            node,
            startIndex,
            endIndex
          );

          const codeNode = $createCodeNode();
          codeNode.setCodeFromText(replaceNode);
        }
      });
    });
  }, [editor]);

  // Handle collapsing and breaking of code blocks when deleting braces, or typing outside
  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
      const parent = node.getParent();
      if (!$isCodeBraceNode(parent)) {
        return;
      }

      const codeNode = $getParentCodeNode(node);
      if (!codeNode) {
        return;
      }

      editor.update(() => {
        const text = node.__text;
        const braces = parent.getBraces();
        if (text === braces) {
          return;
        }

        if (!text.includes(braces)) {
          codeNode.collapseIntoText(parent);
        } else if (text.startsWith(braces)) {
          // Take the text to the right of the brace, and move it to a new text node
          const [, newTextNode] = node.splitText(braces.length);
          $setSelection(newTextNode.selectEnd());

          const refNode = parent.getNextSibling() ? parent : codeNode;
          refNode.insertAfter(newTextNode);

          const nextSibling = newTextNode.getNextSibling();
          if ($isCodeSourceNode(nextSibling)) {
            // If we have a node next to us, "merge" with that (e.g. left brace); otherwise, it goes next to the code node
            nextSibling.prependText(newTextNode);
          }
        } else {
          // Take the text to the left of the brace, and move it to a new text node
          const [newTextNode] = node.splitText(text.indexOf(braces));
          $setSelection(newTextNode.selectEnd());

          const refNode = parent.getPreviousSibling() ? parent : codeNode;
          refNode.insertBefore(newTextNode);

          const prevSibling = newTextNode.getPreviousSibling();
          if ($isCodeSourceNode(prevSibling)) {
            prevSibling.appendText(newTextNode);
          }
        }
      });
    });
  }, [editor]);

  return null;
}

function $splitTextAndGetReplaceNode(
  node: TextNode,
  startIndex: number,
  endIndex: number
): TextNode {
  const splits = node.splitText(startIndex, endIndex);
  if (splits.length === 3) {
    return splits[1];
  } else if (splits.length === 2) {
    return startIndex === 0 ? splits[0] : splits[1];
  } else {
    return splits[0];
  }
}
