import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import "./editor.css";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { AutoBracesPlugin } from "./plugins/AutoBracesPlugin";
import { CodeHighlightPlugin } from "./plugins/CodeHighlightPlugin";
import { EditorThemeClasses } from "lexical";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useRef } from "react";
import { BraceHighlightPlugin } from "./plugins/BraceHighlightPlugin";
import { CodeEvaluationPlugin } from "./plugins/CodeEvaluationPlugin";
import { CodeBraceNode } from "./nodes/code-brace-node";
import { CodeNode } from "./nodes/code-node";
import { CodeSourceNode } from "./nodes/code-source-node";
import { CodeEvaluationResult } from "./CodeEvaluationResult";
import { PortalToRef } from "./PortalToRef";
import { ScopeProxy } from "./eval/scope";
import { CodeAutocompletePlugin } from "./plugins/CodeAutocompletePlugin";
import { AutocompleteMatchesRenderer } from "./AutocompleteMatchesRenderer";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";

const theme: EditorThemeClasses = {
  root: "rpl-ce-root",
  paragraph: "rpl-ce-paragraph",
  codeEditor: {
    code: "rpl-ce-code",
    codeValid: "rpl-ce-code-valid",
    codeInvalid: "rpl-ce-code-invalid",
    source: "rpl-ce-source",
    brace: "rpl-ce-code-brace",
    braceOpen: "rpl-ce-code-brace-open",
    braceClose: "rpl-ce-code-brace-close",
    braceHighlighted: "rpl-ce-code-brace-highlighted",
  },
};

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

type Props = {
  scope: ScopeProxy;
  autoFocus?: boolean;
};

export function CodeEditor({ scope, autoFocus }: Props) {
  const evalContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const initialConfig: InitialConfigType = {
    namespace: "MyEditor",
    theme,
    onError,
    nodes: [CodeNode, CodeBraceNode, CodeSourceNode],
  };

  return (
    <div className="rpl-ce-container">
      <LexicalComposer initialConfig={initialConfig}>
        <CodeHighlightPlugin />
        <BraceHighlightPlugin />
        <CodeAutocompletePlugin
          scope={scope}
          matchesRenderer={(props) => (
            <PortalToRef containerRef={autocompleteContainerRef}>
              <AutocompleteMatchesRenderer {...props} />
            </PortalToRef>
          )}
        />
        <CodeEvaluationPlugin
          scope={scope}
          evalRenderer={(props) => (
            <PortalToRef containerRef={evalContainerRef}>
              <CodeEvaluationResult {...props} />
            </PortalToRef>
          )}
        />
        <AutoBracesPlugin />
        <PlainTextPlugin
          contentEditable={<ContentEditable />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        {autoFocus && <AutoFocusPlugin />}
      </LexicalComposer>
      <div className="rpl-ce-eval-container" ref={evalContainerRef} />
      <div
        className="rpl-ce-autocomplete-container"
        ref={autocompleteContainerRef}
      />
    </div>
  );
}
