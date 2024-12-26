import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  RangeSelection,
} from "lexical";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mustHaveCodeNodes } from "../nodes/helpers";

function isWhitespace(char: string): boolean {
  return char === " " || char === "\t" || char === "\n";
}

function canInsertBrace(
  content: string,
  position: number,
  brace: string = "}"
): boolean {
  const nextChar = content[position];
  const isAtEnd = nextChar === undefined;
  return isAtEnd || isWhitespace(nextChar) || nextChar === brace;
}

function getHighlightSlice(selection: RangeSelection) {
  const highlightedText = selection.getTextContent();
  const startOffset = selection.isBackward()
    ? selection.focus.offset
    : selection.anchor.offset;
  const endOffset = selection.isBackward()
    ? selection.anchor.offset
    : selection.focus.offset;

  return {
    startOffset,
    endOffset,
    highlightedText,
  };
}

export function AutoBracesPlugin() {
  const [editor] = useLexicalComposerContext();
  mustHaveCodeNodes(editor, "AutoBracesPlugin");

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (event.key !== "{") {
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchor = selection.anchor;
        const offset = anchor.offset;
        const currentNode = anchor.getNode();
        const textContent = currentNode.getTextContent();

        const isHighlighted = !selection.isCollapsed();
        if (!isHighlighted && !canInsertBrace(textContent, offset)) {
          return false;
        }

        event.preventDefault();

        editor.update(() => {
          if (!$isTextNode(currentNode)) {
            // e.g. a paragraph node - need to insert the text node
            const textNode = $createTextNode("{}");
            $insertNodes([textNode]);
            selection.setTextNodeRange(textNode, 1, textNode, 1);
          } else if (isHighlighted) {
            // Wrap in brackets. Handle this case first, before trying to insert others
            const { startOffset, endOffset, highlightedText } =
              getHighlightSlice(selection);
            const delCount = endOffset - startOffset;

            currentNode.spliceText(
              startOffset,
              delCount,
              `{${highlightedText}}`
            );
            selection.setTextNodeRange(
              currentNode,
              startOffset,
              currentNode,
              endOffset + 2
            );
          } else if (textContent[offset - 1] === "{") {
            // If the previous char is also a "{" then we want to insert a space for convenience.
            currentNode.spliceText(offset, 0, "{  }");
            selection.setTextNodeRange(
              currentNode,
              // In the middle of the braces
              offset + 2,
              currentNode,
              offset + 2
            );
          } else {
            // Otherwise, we just want to insert the closing "}"
            currentNode.spliceText(offset, 0, "{}");
            selection.setTextNodeRange(
              currentNode,
              offset + 1,
              currentNode,
              offset + 1
            );
          }
        });

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
