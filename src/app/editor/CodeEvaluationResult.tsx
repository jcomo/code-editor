import { getDisplayValue, getTypeDisplayName } from "./eval/code-evaluation";
import { CaratIcon } from "./icons/CaratIcon";
import { ErrorIcon } from "./icons/ErrorIcon";
import { CodeEvaluationRendererProps } from "./plugins/CodeEvaluationPlugin";

export function CodeEvaluationResult({
  error,
  result,
}: CodeEvaluationRendererProps) {
  if (!result) {
    return null;
  }

  const modifier = error !== undefined ? "error" : "success";

  return (
    <div className={`rpl-ce-eval-root rpl-ce-eval-root--${modifier}`}>
      {error && (
        <div className="rpl-ce-eval-error-box">
          <div className="rpl-ce-eval-error-header rpl-ce-eval-text--error">
            <span className="rpl-ce-eval-icon">
              <ErrorIcon />
            </span>
            <span>Error</span>
          </div>
          <div className="rpl-ce-eval-error-message">
            {error.kind}: {error.message}
          </div>
        </div>
      )}
      <div className="rpl-ce-eval-result-type">
        <span className={`rpl-ce-eval-icon rpl-ce-eval-text--${modifier}`}>
          <CaratIcon />
        </span>
        <span>{getTypeDisplayName(result)}</span>
      </div>
      <div className="rpl-ce-eval-result-display">
        {getDisplayValue(result)}
      </div>
    </div>
  );
}
