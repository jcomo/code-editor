import { Scope } from "./code-evaluation.types";

export interface ScopeProxy {
  search(searchText: string): Array<string>;
  hasValue(key: string): boolean;
  getValue(key: string): unknown | undefined;
}

export function scopeFromScopeProxy(state: ScopeProxy): Scope {
  return new Proxy(
    {},
    {
      get(target, property, receiver) {
        return typeof property === "string"
          ? state.getValue(property)
          : Reflect.get(target, property, receiver);
      },
      has(_target, property) {
        return typeof property === "string" ? state.hasValue(property) : false;
      },
    }
  );
}
