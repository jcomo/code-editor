import React from "react";
import { CodeAutocompleteRendererProps } from "./plugins/CodeAutocompletePlugin";

export function AutocompleteMatchesRenderer({
  matches,
  focusIndex,
}: CodeAutocompleteRendererProps) {
  return (
    <div className="rpl-ce-autocomplete">
      <ul role="listbox" aria-expanded>
        {matches.map(({ value, kind }, index) => (
          <li key={value} role="option" aria-selected={focusIndex === index}>
            <span>{value}</span>
            <span className="rpl-ce-autocomplete-kind">{kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
