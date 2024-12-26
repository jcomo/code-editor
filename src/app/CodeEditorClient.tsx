"use client";

import { useMemo } from "react";
import { CodeEditor } from "./editor/CodeEditor";
import { ScopeProxy } from "./editor/eval/scope";

// We can implement the ScopeProxy interface to read from the Canvas editor state.
// This would connect the Canvas components up to the evaluation and autocomplete.
class MockState implements ScopeProxy {
  _components = [
    {
      key: "textInput1",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "textInput2",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "textInput6",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "textInput11",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "textInput15",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "radio4",
      kind: "TextInput",
      value: "some test here",
    },
    {
      key: "text3",
      kind: "TextInput",
      value: "some test here",
    },
  ];

  search(searchText: string): Array<string> {
    const filteredComponents = this._components.filter((c) =>
      this._normalizeForSearch(c.key).startsWith(
        this._normalizeForSearch(searchText)
      )
    );

    return filteredComponents.map((c) => c.key);
  }

  _normalizeForSearch(text: string): string {
    return text.trim().toLowerCase();
  }

  hasValue(key: string): boolean {
    return this._components.some((c) => c.key === key);
  }

  getValue(key: string): unknown | undefined {
    return this._components.find((c) => c.key === key);
  }
}

export function CodeEditorClient() {
  const mockState = useMemo(() => new MockState(), []);
  return <CodeEditor scope={mockState} />;
}
