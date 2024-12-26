import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ElementNode,
  $isTextNode,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
  $getNodeByKey,
  NodeKey,
  createCommand,
} from "lexical";
import { useState, useEffect } from "react";
import { debounce } from "../debounce";
import { evalSource } from "../eval/code-evaluation";
import {
  CodeEvaluationError,
  CodeEvaluationValue,
  CodeEvaluationResult,
} from "../eval/code-evaluation.types";
import { walkChildren, WalkCommand } from "../lexical-helpers";
import { useEditorFocusState } from "../hooks/useEditorFocusState";
import { mustHaveCodeNodes } from "../nodes/helpers";
import { $isCodeNode } from "../nodes/code-node";
import { scopeFromScopeProxy, ScopeProxy } from "../eval/scope";

export type CodeEvaluatedCommandProps = {
  nodeKeys: Array<NodeKey>;
};

export const CODE_EVALUATED =
  createCommand<CodeEvaluatedCommandProps>("CODE_EVALUATED");

export type CodeEvaluationRendererProps = {
  error?: CodeEvaluationError;
  result: CodeEvaluationValue;
};

// Calculates the evaluation props given the editor root node.
function getEvaluationRendererProps(
  root: ElementNode
): CodeEvaluationRendererProps | undefined {
  const children = root.getChildren();
  if (!children.length) {
    return undefined;
  } else if (children.length === 1 && $isCodeNode(children[0])) {
    // Special case for single code node: show the eval error in addition to
    // the eval result. This will be the most common case.
    const onlyChild = children[0];
    const evalResult = onlyChild.getEvalResult();

    switch (evalResult.result) {
      case "not-run":
        return undefined;
      case "success":
        return { result: evalResult };
      case "error":
        return {
          error: evalResult,
          result: {
            type: "string",
            value: "",
          },
        };
    }
  } else {
    let result = "";
    children.forEach((child) => {
      if ($isTextNode(child)) {
        result += child.getTextContent();
      } else if ($isCodeNode(child)) {
        result += child.getStringValue();
      }
    });

    return {
      result: {
        type: "string",
        value: result,
      },
    };
  }
}

function onCodeEdited(editor: LexicalEditor, scope: ScopeProxy) {
  // Aggregate the results of all of the code nodes
  const nodeEvalsByKey = editor.read(() => {
    const aggregate: Record<string, CodeEvaluationResult> = {};
    walkChildren($getRoot(), (node) => {
      if ($isCodeNode(node)) {
        const key = node.getKey();
        aggregate[key] = evalSource(
          node.getSource(),
          scopeFromScopeProxy(scope)
        );
        return WalkCommand.STOP;
      }

      return WalkCommand.CONTINUE;
    });

    return aggregate;
  });

  // Bulk update all of the code nodes with the results
  editor.update(() => {
    const nodeKeys = Object.keys(nodeEvalsByKey);
    nodeKeys.forEach((nodeKey) => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodeNode(node)) {
        const evalResult = nodeEvalsByKey[nodeKey];
        node.setEvalResult(evalResult);
      }
    });

    editor.dispatchCommand(CODE_EVALUATED, { nodeKeys });
  });
}

const onCodeEditedDebounced = debounce(onCodeEdited, 800);

type Props = {
  scope: ScopeProxy;
  evalRenderer: React.ComponentType<CodeEvaluationRendererProps>;
  onlyRenderWhenFocused?: boolean;
};

export function CodeEvaluationPlugin({
  scope,
  evalRenderer: EvalRenderer,
  onlyRenderWhenFocused = true,
}: Props) {
  const [editor] = useLexicalComposerContext();
  mustHaveCodeNodes(editor, "CodeEvaluationPlugin");

  const isFocused = useEditorFocusState(editor);
  const [renderProps, setRenderProps] = useState<
    CodeEvaluationRendererProps | undefined
  >();

  useEffect(() => {
    // We use this instead of registerNodeTransform to properly handle the case where
    // the node is deleted. We still need to trigger the code edit handler to clear the eval result.
    return editor.registerUpdateListener(({ dirtyLeaves, editorState }) => {
      const anyRelevantCodeEdits = editorState.read(() => {
        return dirtyLeaves.values().some((key) => {
          const node = $getNodeByKey(key);
          return !node || $isTextNode(node);
        });
      });

      if (anyRelevantCodeEdits) {
        onCodeEditedDebounced(editor, scope);
      }
    });
  }, [editor, scope]);

  useEffect(() => {
    return editor.registerCommand(
      CODE_EVALUATED,
      () => {
        const newProps = editor.read(() => {
          const parent = $getRoot().getFirstChild();
          return $isElementNode(parent)
            ? getEvaluationRendererProps(parent)
            : undefined;
        });

        setRenderProps(newProps);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  if (!renderProps) {
    return null;
  }

  if (onlyRenderWhenFocused && !isFocused) {
    return null;
  }

  return <EvalRenderer {...renderProps} />;
}
