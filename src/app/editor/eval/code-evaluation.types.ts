type Result<TypeName extends string, ValueType> = {
  type: TypeName;
  value: ValueType;
};

export type ResultType =
  | Result<"string", string>
  | Result<"number", number>
  | Result<"boolean", boolean>
  | Result<"date", Date>
  | Result<"object", unknown>
  | Result<"null", null>
  | Result<"undefined", undefined>;

export type CodeEvaluationValue = ResultType & {
  coercedFrom?: ResultType;
};

export type CodeEvaluationError = {
  kind: string;
  message: string;
};

export type CodeEvaluationResultBranch<T extends string, R = unknown> = R & {
  result: T;
};

export type CodeEvaluationResult =
  | CodeEvaluationResultBranch<"not-run">
  | CodeEvaluationResultBranch<"success", CodeEvaluationValue>
  | CodeEvaluationResultBranch<"error", CodeEvaluationError>;

export type Scope = Record<string, unknown>;
