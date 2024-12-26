import {
  ElementNode,
  NodeKey,
  EditorConfig,
  TextNode,
  RangeSelection,
  LexicalNode,
} from "lexical";

type CodeBracePosition = "open" | "close";

export class CodeBraceNode extends ElementNode {
  private static OPEN_BRACE_CHAR = "{";
  private static CLOSE_BRACE_CHAR = "}";

  __bracePosition: CodeBracePosition;
  __highlighted: boolean;

  static getType() {
    return "code-brace";
  }

  static clone(node: CodeBraceNode): CodeBraceNode {
    return new CodeBraceNode(
      node.__bracePosition,
      node.__highlighted,
      node.__key
    );
  }

  constructor(
    position: CodeBracePosition,
    highlighted: boolean,
    key?: NodeKey
  ) {
    super(key);
    this.__bracePosition = position;
    this.__highlighted = highlighted;
  }

  createDOM(config: EditorConfig) {
    const element = document.createElement("span");
    this.getClassNames(config).forEach((className) => {
      element.classList.add(className);
    });

    return element;
  }

  updateDOM(prevNode: CodeBraceNode): boolean {
    return prevNode.__highlighted !== this.__highlighted;
  }

  isInline(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  isOpen(): boolean {
    return this.__bracePosition === "open";
  }

  getBraces(): string {
    let braces = "";
    for (let i = 0; i < this.getBracesLength(); i++) {
      braces += this.getBraceChar();
    }

    return braces;
  }

  getBracesLength(): number {
    return 2;
  }

  getBraceChar(): string {
    return this.__bracePosition === "open"
      ? CodeBraceNode.OPEN_BRACE_CHAR
      : CodeBraceNode.CLOSE_BRACE_CHAR;
  }

  getSelectionAfterCollapse(
    newNode: TextNode,
    existingSelection: RangeSelection
  ): RangeSelection {
    const text = newNode.getTextContent();
    const { anchor, focus } = existingSelection;
    if (this.isOpen()) {
      return newNode.select(anchor.offset, focus.offset);
    } else {
      const lengthToLastBrace = text.length - this.getTextContentSize();
      return newNode.select(
        anchor.offset + lengthToLastBrace,
        focus.offset + lengthToLastBrace
      );
    }
  }

  isHighlighted(): boolean {
    return this.__highlighted;
  }

  setHighlighted(highlighted: boolean): this {
    const self = this.getWritable();
    self.__highlighted = highlighted;
    return this;
  }

  private getClassNames(config: EditorConfig): string[] {
    const classNames: string[] = [];
    const theme: Record<string, string> = config.theme.codeEditor || {};

    if (theme.brace) {
      classNames.push(theme.brace);
    }

    if (this.__bracePosition === "open" && theme.braceOpen) {
      classNames.push(theme.braceOpen);
    }

    if (this.__bracePosition === "close" && theme.braceClose) {
      classNames.push(theme.braceClose);
    }

    if (this.__highlighted && theme.braceHighlighted) {
      classNames.push(theme.braceHighlighted);
    }

    return classNames;
  }
}

export function $createCodeBraceNode(
  position: CodeBracePosition
): CodeBraceNode {
  return new CodeBraceNode(position, false);
}

export function $isCodeBraceNode(
  node: LexicalNode | null | undefined
): node is CodeBraceNode {
  return node instanceof CodeBraceNode;
}
