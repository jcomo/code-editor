import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mustHaveCodeNodes } from "../nodes/helpers";
import { ScopeProxy } from "../eval/scope";
import { useCallback, useEffect, useReducer } from "react";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical";
import { $isCodeSourceNode } from "../nodes/code-source-node";

const BACKSPACE_KEY = "Backspace";
const NON_TEXT_KEYS = new Set([
  "Meta",
  "Alt",
  "Control",
  "Shift",
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "Tab",
  "Enter",
]);

function isValidCharForSymbol(char: string): boolean {
  if (typeof char !== "string" || char.length !== 1) {
    throw new Error(`invalid arg: '${char}'`);
  }

  // Check if the character matches the valid JavaScript identifier character rules
  const validCharRegex = /^[a-zA-Z0-9_$]|[\u{10000}-\u{10FFFF}]$/u;
  return validCharRegex.test(char) || /[\u200C\u200D]/.test(char);
}

// TODO: handle numbers
function getStartIndexOfToken(text: string, fromIndex: number): number {
  for (let i = fromIndex; i >= 0; i--) {
    const ch = text.charAt(i - 1);
    if (!ch) {
      return -1;
    }

    if (!isValidCharForSymbol(ch)) {
      return i;
    }
  }

  return -1;
}

function getTokenEndingAtIndex(
  text: string,
  fromIndex: number
): [number, string] | undefined {
  const startIndex = getStartIndexOfToken(text, fromIndex);
  if (startIndex === -1 || startIndex === fromIndex) {
    return undefined;
  }

  return [startIndex, text.substring(startIndex, fromIndex)];
}

type AutocompleteMatch = {
  value: string;
  kind: "alias";
};

export type CodeAutocompleteRendererProps = {
  matches: Array<AutocompleteMatch>;
  focusIndex: number;
};

type Props = {
  scope: ScopeProxy;
  matchesRenderer: React.ComponentType<CodeAutocompleteRendererProps>;
};

type State = {
  matches: AutocompleteMatch[];
  symbolStartIndex: number | undefined;
  focusIndex: number;
};

type Action =
  | { type: "RESET_MATCHES" }
  | {
      type: "SET_MATCHES";
      matches: AutocompleteMatch[];
      symbolStartIndex: number;
    }
  | { type: "MOVE_FOCUS_UP" }
  | { type: "MOVE_FOCUS_DOWN" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET_MATCHES":
      return {
        ...state,
        matches: [],
        symbolStartIndex: undefined,
        focusIndex: 0,
      };
    case "SET_MATCHES":
      return {
        ...state,
        matches: action.matches,
        symbolStartIndex: action.symbolStartIndex,
        focusIndex: 0,
      };
    case "MOVE_FOCUS_UP":
      return {
        ...state,
        focusIndex:
          state.focusIndex === 0 ? state.focusIndex : state.focusIndex - 1,
      };
    case "MOVE_FOCUS_DOWN":
      return {
        ...state,
        focusIndex:
          state.focusIndex === state.matches.length - 1
            ? state.focusIndex
            : state.focusIndex + 1,
      };
  }
}

function getInitialState(): State {
  return {
    matches: [],
    symbolStartIndex: undefined,
    focusIndex: 0,
  };
}

export function CodeAutocompletePlugin({
  scope,
  matchesRenderer: MatchesRenderer,
}: Props) {
  const [editor] = useLexicalComposerContext();
  mustHaveCodeNodes(editor, "CodeAutocompletePlugin");

  const [state, dispatch] = useReducer(reducer, getInitialState());
  const { focusIndex, matches, symbolStartIndex } = state;

  const hasMatches = matches.length > 0;
  const focusedValue = matches[focusIndex]?.value;

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (e) => {
        if (hasMatches) {
          e.preventDefault();
          dispatch({ type: "MOVE_FOCUS_DOWN" });
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, hasMatches, matches.length]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        if (hasMatches) {
          e.preventDefault();
          dispatch({ type: "MOVE_FOCUS_UP" });
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, hasMatches]);

  const $tryReplaceWithFocusedValue = useCallback(
    (e: KeyboardEvent | null) => {
      if (focusedValue === undefined || symbolStartIndex === undefined) {
        return false;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }

      const { anchor } = selection;
      const node = anchor.getNode();
      if (!$isTextNode(node)) {
        return false;
      }

      e?.preventDefault();
      node.spliceText(
        symbolStartIndex,
        anchor.offset - symbolStartIndex,
        focusedValue,
        true
      );

      dispatch({ type: "RESET_MATCHES" });
      return true;
    },
    [focusedValue, symbolStartIndex]
  );

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (e) => $tryReplaceWithFocusedValue(e),
      COMMAND_PRIORITY_HIGH
    );
  }, [$tryReplaceWithFocusedValue, editor]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (e) => $tryReplaceWithFocusedValue(e),
      COMMAND_PRIORITY_HIGH
    );
  }, [$tryReplaceWithFocusedValue, editor]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e) => {
        if (NON_TEXT_KEYS.has(e.key)) {
          return false;
        }

        if (e.key === BACKSPACE_KEY) {
          dispatch({ type: "RESET_MATCHES" });
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          dispatch({ type: "RESET_MATCHES" });
          return false;
        }

        const { anchor } = selection;
        const parent = anchor.getNode().getParent();
        if (!$isCodeSourceNode(parent)) {
          dispatch({ type: "RESET_MATCHES" });
          return false;
        }

        const token = getTokenEndingAtIndex(
          // parent.getSource(),
          anchor.getNode().getTextContent(),
          anchor.offset
        );

        if (!token) {
          dispatch({ type: "RESET_MATCHES" });
        } else {
          const [startIndex, symbolAtCursor] = token;
          const matches = scope.search(symbolAtCursor);
          dispatch({
            type: "SET_MATCHES",
            matches: matches.map((value) => ({ value, kind: "alias" })),
            symbolStartIndex: startIndex,
          });
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, scope]);

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (!hasMatches) {
          return;
        }

        const shouldClearMatches = editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return true;
          }

          const { anchor } = selection;
          const node = anchor.getNode();
          const nodeModified = dirtyLeaves.has(node.getKey());
          const anyParentsModified = node
            .getParentKeys()
            .some((parentKey) => dirtyElements.has(parentKey));

          return !nodeModified && !anyParentsModified;
        });

        if (shouldClearMatches) {
          // Did something other than a text edit (e.g. selection change) while
          // autocomplete match view was open. Close out the match view.
          dispatch({ type: "RESET_MATCHES" });
        }
      }
    );
  }, [editor, hasMatches]);

  if (!hasMatches) {
    return null;
  }

  return <MatchesRenderer matches={matches} focusIndex={focusIndex} />;
}
