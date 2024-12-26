import {
  CodeEvaluationResult,
  ResultType,
  Scope,
} from "./code-evaluation.types";

export function evalSource(source: string, scope: Scope): CodeEvaluationResult {
  console.log("evaluating source => ", source);
  // TODO(jcomo): is there a better / safer way to handle implicit return?

  if (!source.trim()) {
    return blankResult();
  }

  try {
    const definedFunc = new Function(
      "scope",
      // Use `with` so that the scope is implicitly available as globals to the function body
      `with (scope || {}) { return ${source}; }`
    );
    const returnValue = definedFunc.call({}, scope);
    return {
      result: "success",
      ...getResultType(returnValue),
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return {
        result: "error",
        kind: e.name,
        message: e.message,
      };
    } else {
      console.error("Uncaught exception in evalSource", e);
      return {
        result: "error",
        kind: "UncaughtException",
        message: "something went wrong",
      };
    }
  }
}

function getResultType(value: unknown): ResultType {
  if (value === null) {
    return { type: "null", value: null };
  } else if (typeof value === "undefined") {
    return { type: "undefined", value: undefined };
  } else if (typeof value === "number") {
    return { type: "number", value };
  } else if (typeof value === "string") {
    return { type: "string", value };
  } else if (typeof value === "boolean") {
    return { type: "boolean", value };
  } else if (value instanceof Date) {
    return { type: "date", value };
  }

  return { type: "object", value };
}

// Quick and dirty for now. Can get more granular later.
export function getTypeDisplayName({ type }: ResultType): string {
  return type.charAt(0).toUpperCase().concat(type.substring(1));
}

export function getDisplayValue(result: ResultType): string {
  // TODO(jcomo): fix me
  switch (result.type) {
    case "undefined":
      return "undefined";
    case "null":
      return "null";
    case "boolean":
      return result.value ? "true" : "false";
    case "number":
      return result.value.toString();
    case "string":
      return inQuotes(result.value);
    case "date":
      return inQuotes(result.value.toISOString());
    case "object":
      return inQuotes(result.value?.toString() ?? "");
  }
}

function inQuotes(value: string): string {
  return `"${value}"`;
}

function blankResult(): CodeEvaluationResult {
  return { result: "success", type: "string", value: "" };
}
