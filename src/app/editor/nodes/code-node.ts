import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  TextNode,
} from "lexical";
import { CodeEvaluationResult } from "../eval/code-evaluation.types";
import {
  $isCodeBraceNode,
  CodeBraceNode,
  $createCodeBraceNode,
} from "./code-brace-node";
import { $createCodeSourceNode, $isCodeSourceNode } from "./code-source-node";

export class CodeNode extends ElementNode {
  __evalResult: CodeEvaluationResult;

  static getType() {
    return "code";
  }

  static clone(node: CodeNode): CodeNode {
    return new CodeNode(node.__evalResult, node.__key);
  }

  constructor(evalResult: CodeEvaluationResult, key?: NodeKey) {
    super(key);
    this.__evalResult = evalResult;
  }

  createDOM(config: EditorConfig) {
    const element = document.createElement("span");
    this.getClassNames(config).forEach((className) => {
      element.classList.add(className);
    });

    return element;
  }

  updateDOM(prevNode: CodeNode): boolean {
    if (prevNode.__evalResult.result === "not-run") {
      return this.__evalResult.result !== "not-run";
    } else if (prevNode.__evalResult.result === "error") {
      return (
        this.__evalResult.result !== "error" ||
        this.__evalResult.kind !== prevNode.__evalResult.kind ||
        this.__evalResult.message !== prevNode.__evalResult.message
      );
    } else if (prevNode.__evalResult.result === "success") {
      return (
        this.__evalResult.result !== "success" ||
        this.__evalResult.type !== prevNode.__evalResult.type ||
        this.__evalResult.value !== prevNode.__evalResult.value
      );
    }

    return false;
  }

  isInline(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  highlightBraces(highlighted: boolean) {
    this.getChildren()
      .filter($isCodeBraceNode)
      .forEach((node) => {
        node.setHighlighted(highlighted);
      });
  }

  collapseIntoText(fromBrace: CodeBraceNode) {
    const textNode = $createTextNode(this.getTextContent());
    this.replace(textNode, false);

    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setSelection(fromBrace.getSelectionAfterCollapse(textNode, selection));
    }
  }

  setCodeFromText(node: TextNode): string {
    node.insertBefore(this);

    const openNode = $createCodeBraceNode("open");
    const closeNode = $createCodeBraceNode("close");
    const sourceNode = $createCodeSourceNode();

    const text = node.__text;
    const firstBraceIndex = text.indexOf(openNode.getBraces());
    const lastBraceIndex = text.lastIndexOf(closeNode.getBraces());

    const splits = node.splitText(firstBraceIndex + 2, lastBraceIndex);
    const [firstBrace, source, lastBrace] =
      splits.length === 3
        ? splits
        : [splits[0], $createTextNode(""), splits[1]];

    openNode.append(firstBrace);
    closeNode.append(lastBrace);
    sourceNode.append(source);

    this.append(openNode);
    this.append(sourceNode);
    this.append(closeNode);

    return source.getTextContent();
  }

  getIsValid(): boolean {
    return (
      this.__evalResult.result === "not-run" ||
      this.__evalResult.result === "success"
    );
  }

  getStringValue(): string {
    if (this.__evalResult.result === "success") {
      // TODO(jcomo): probably fix this
      return this.__evalResult.value?.toString() ?? "";
    }

    return "";
  }

  getSource(): string {
    const sourceNode = this.getChildren().find((n) => $isCodeSourceNode(n));
    return sourceNode?.getSource() ?? "";
  }

  getEvalResult(): CodeEvaluationResult {
    return this.__evalResult;
  }

  setEvalResult(evalResult: CodeEvaluationResult): this {
    const self = this.getWritable();
    self.__evalResult = evalResult;
    return this;
  }

  private getClassNames(config: EditorConfig): string[] {
    const classNames: string[] = [];
    const theme = config.theme.codeEditor || {};

    if (theme.code) {
      classNames.push(theme.code);
    }

    if (this.getIsValid() && theme.codeValid) {
      classNames.push(theme.codeValid);
    }

    if (!this.getIsValid() && theme.codeInvalid) {
      classNames.push(theme.codeInvalid);
    }

    return classNames;
  }

  // exportJSON(): SerializedCodeNode {
  //   return {
  //     type: this.getType(),
  //     version: 1,
  //   };
  // }

  // static importJSON() {
  //   return new CodeNode({ result: "not-run" });
  // }
}

export function $createCodeNode(): CodeNode {
  return new CodeNode({ result: "not-run" });
}

export function $isCodeNode(
  node: LexicalNode | null | undefined
): node is CodeNode {
  return node instanceof CodeNode;
}

export function $isInCodeNode(node: LexicalNode | null | undefined): boolean {
  return $getParentCodeNode(node) !== null;
}

export function $getParentCodeNode(
  node: LexicalNode | null | undefined
): CodeNode | null {
  return node?.getParents().find((parent) => $isCodeNode(parent)) ?? null;
}
