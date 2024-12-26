import {
  ElementNode,
  EditorConfig,
  TextNode,
  $isTextNode,
  LexicalNode,
} from "lexical";

export class CodeSourceNode extends ElementNode {
  static getType(): string {
    return "code-source";
  }

  static clone(node: CodeSourceNode): CodeSourceNode {
    return new CodeSourceNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    this.getClassNames(config).forEach((className) => {
      element.classList.add(className);
    });

    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getSource(): string {
    return this.getTextContent().trim();
  }

  prependText(node: TextNode) {
    const child = this.getFirstChild();
    if (!child) {
      this.append(node);
    } else if ($isTextNode(child)) {
      child.insertBefore(node);
      child.mergeWithSibling(node);
    }
  }

  appendText(node: TextNode) {
    const child = this.getLastChild();
    if (!child) {
      this.append(node);
    } else if ($isTextNode(child)) {
      child.insertAfter(node);
      child.mergeWithSibling(node);
    }
  }

  private getClassNames(config: EditorConfig): string[] {
    const classNames: string[] = [];
    const theme: Record<string, string> = config.theme.codeEditor || {};

    if (theme.source) {
      classNames.push(theme.source);
    }

    return classNames;
  }
}

export function $isCodeSourceNode(
  node: LexicalNode | null | undefined
): node is CodeSourceNode {
  return node instanceof CodeSourceNode;
}

export function $createCodeSourceNode() {
  return new CodeSourceNode();
}
