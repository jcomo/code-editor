import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  FOCUS_COMMAND,
  LexicalEditor,
} from "lexical";
import { useEffect, useState } from "react";

export function useEditorFocusState(editor: LexicalEditor) {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        setIsFocused(true);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setIsFocused(false);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return isFocused;
}
