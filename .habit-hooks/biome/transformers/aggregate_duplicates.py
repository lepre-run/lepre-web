import json
import sys
from typing import Any


DUPLICATED_CODE = "duplicated-code"


def aggregate_duplicates(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    aggregated: dict[str, Any] | None = None
    result: list[dict[str, Any]] = []

    for finding in findings:
        if finding.get("smell") != DUPLICATED_CODE:
            result.append(finding)
            continue

        issues = finding.get("issues")
        if not isinstance(issues, list):
            raise ValueError("Each duplicated-code finding must contain an issues array")

        if aggregated is None:
            aggregated = {
                "smell": DUPLICATED_CODE,
                "details": {"clones": 0},
                "issues": [],
            }
            result.append(aggregated)

        aggregated["details"]["clones"] += 1
        aggregated["issues"].extend(issues)

    return result


def main() -> None:
    try:
        findings = json.load(sys.stdin)
        if not isinstance(findings, list):
            raise ValueError("Habit Hooks findings must be an array")
        json.dump(aggregate_duplicates(findings), sys.stdout)
    except (json.JSONDecodeError, ValueError) as error:
        print(f"Duplicate aggregator: {error}", file=sys.stderr)
        raise SystemExit(2) from error


if __name__ == "__main__":
    main()
