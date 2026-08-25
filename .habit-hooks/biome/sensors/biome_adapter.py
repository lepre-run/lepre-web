import json
import sys
from typing import Any


SMELL_BY_CODE = {
    "parse": "parse-error",
    "lint/complexity/noExcessiveCognitiveComplexity": "high-complexity",
    "lint/complexity/noExcessiveNestedTestSuites": "deep-nesting",
    "lint/complexity/noExcessiveLinesPerFunction": "oversized-function",
    "lint/complexity/useMaxParams": "too-many-parameters",
    "lint/correctness/noUnusedImports": "unused-import",
    "lint/correctness/noUnusedVariables": "unused-variable",
    "lint/style/noExcessiveLinesPerFile": "oversized-file",
    "lint/style/noInferrableTypes": "redundant-type-annotation",
    "lint/style/noNonNullAssertion": "non-null-assertion",
    "lint/style/useConst": "non-const-binding",
    "lint/suspicious/noDoubleEquals": "loose-equality",
    "lint/suspicious/noExplicitAny": "explicit-any",
    "lint/suspicious/noVar": "var-declaration",
}


def adapt_report(report: dict[str, Any]) -> list[dict[str, Any]]:
    diagnostics = report.get("diagnostics")
    if not isinstance(diagnostics, list):
        raise ValueError("Biome RDJSON must contain a diagnostics array")

    issues_by_smell: dict[str, list[dict[str, Any]]] = {}
    for diagnostic in diagnostics:
        if not isinstance(diagnostic, dict):
            raise ValueError("Each Biome diagnostic must be an object")

        code = diagnostic.get("code")
        code_value = code.get("value") if isinstance(code, dict) else None
        if not isinstance(code_value, str):
            raise ValueError("Each Biome diagnostic must identify its rule")

        smell = SMELL_BY_CODE.get(code_value)
        if smell is None:
            continue

        location = diagnostic.get("location")
        if not isinstance(location, dict) or not isinstance(location.get("path"), str):
            raise ValueError(f"Biome diagnostic {code_value} must identify a file")

        range_details = location.get("range")
        start = range_details.get("start") if isinstance(range_details, dict) else None
        if not isinstance(start, dict):
            raise ValueError(f"Biome diagnostic {code_value} must identify a start position")

        file = location["path"]
        line = start.get("line")
        column = start.get("column")
        if not isinstance(line, int) or not isinstance(column, int):
            raise ValueError(f"Biome diagnostic {code_value} has an invalid start position")

        issues_by_smell.setdefault(smell, []).append(
            {
                "key": file,
                "details": {
                    "file": file,
                    "line": line,
                    "column": column,
                    "message": diagnostic.get("message", ""),
                    "source": f"biome:{code_value}",
                },
            }
        )

    return [
        {"smell": smell, "details": {}, "issues": issues}
        for smell, issues in issues_by_smell.items()
    ]


def main() -> None:
    try:
        report = json.load(sys.stdin)
        json.dump(adapt_report(report), sys.stdout)
    except (json.JSONDecodeError, ValueError) as error:
        print(f"Biome adapter: {error}", file=sys.stderr)
        raise SystemExit(2) from error


if __name__ == "__main__":
    main()
